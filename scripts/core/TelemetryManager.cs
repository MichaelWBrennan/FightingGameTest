using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;

/// <summary>
/// Collects and analyzes match telemetry for balance insights
/// </summary>
public partial class TelemetryManager : Node
{
    public static TelemetryManager Instance { get; private set; }
    
    private List<MatchData> _matchHistory = new();
    private Dictionary<string, CharacterStats> _characterStats = new();
    private const string TELEMETRY_PATH = "user://match_telemetry.json";
    private const int MAX_STORED_MATCHES = 1000;
    
    [Signal]
    public delegate void TelemetryUpdatedEventHandler();
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadTelemetryData();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Record a complete match for telemetry analysis
    /// </summary>
    public void RecordMatch(MatchData matchData)
    {
        matchData.Timestamp = DateTime.UtcNow;
        _matchHistory.Add(matchData);
        
        // Update character statistics
        UpdateCharacterStats(matchData);
        
        // Clean old matches if we exceed limit
        while (_matchHistory.Count > MAX_STORED_MATCHES)
        {
            _matchHistory.RemoveAt(0);
        }
        
        SaveTelemetryData();
        EmitSignal(SignalName.TelemetryUpdated);
        
        GD.Print($"Match recorded: {matchData.Player1Character} vs {matchData.Player2Character}, Winner: P{matchData.WinnerIndex + 1}");
    }
    
    /// <summary>
    /// Update character statistics based on match data
    /// </summary>
    private void UpdateCharacterStats(MatchData match)
    {
        // Update stats for both characters
        UpdateCharacterMatchStats(match.Player1Character, match.WinnerIndex == 0, match.Player1Stats);
        UpdateCharacterMatchStats(match.Player2Character, match.WinnerIndex == 1, match.Player2Stats);
    }
    
    private void UpdateCharacterMatchStats(string characterId, bool won, PlayerMatchStats stats)
    {
        if (!_characterStats.ContainsKey(characterId))
        {
            _characterStats[characterId] = new CharacterStats { CharacterId = characterId };
        }
        
        var charStats = _characterStats[characterId];
        charStats.TotalMatches++;
        
        if (won)
            charStats.Wins++;
        else
            charStats.Losses++;
        
        charStats.TotalDamageDealt += stats.DamageDealt;
        charStats.TotalCombos += stats.CombosPerformed;
        charStats.TotalMeterUsed += stats.MeterUsed;
        charStats.TotalParries += stats.ParriesPerformed;
        charStats.TotalBursts += stats.BurstsPerformed;
        
        // Track move usage
        foreach (var moveUsage in stats.MoveUsage)
        {
            if (!charStats.MoveUsageStats.ContainsKey(moveUsage.Key))
            {
                charStats.MoveUsageStats[moveUsage.Key] = new MoveUsageStats();
            }
            
            charStats.MoveUsageStats[moveUsage.Key].TimesUsed += moveUsage.Value.TimesUsed;
            charStats.MoveUsageStats[moveUsage.Key].TotalDamage += moveUsage.Value.TotalDamage;
            charStats.MoveUsageStats[moveUsage.Key].Hits += moveUsage.Value.Hits;
            charStats.MoveUsageStats[moveUsage.Key].Whiffs += moveUsage.Value.Whiffs;
        }
    }
    
    /// <summary>
    /// Generate tier suggestions based on win rates and usage statistics
    /// </summary>
    public TierAnalysis GenerateTierSuggestions()
    {
        var analysis = new TierAnalysis();
        
        foreach (var charStats in _characterStats.Values)
        {
            if (charStats.TotalMatches < 10) continue; // Need sufficient data
            
            float winRate = (float)charStats.Wins / charStats.TotalMatches;
            float avgDamagePerMatch = charStats.TotalDamageDealt / charStats.TotalMatches;
            
            var suggestion = new TierSuggestion
            {
                CharacterId = charStats.CharacterId,
                WinRate = winRate,
                TotalMatches = charStats.TotalMatches,
                AverageDamagePerMatch = avgDamagePerMatch,
                SuggestedTier = CalculateTier(winRate, avgDamagePerMatch)
            };
            
            // Flag outliers for review
            if (winRate > 0.65f || winRate < 0.35f)
            {
                suggestion.RequiresReview = true;
                suggestion.ReviewReason = winRate > 0.65f ? "Win rate too high" : "Win rate too low";
            }
            
            analysis.CharacterTiers.Add(suggestion);
        }
        
        // Sort by win rate descending
        analysis.CharacterTiers = analysis.CharacterTiers.OrderByDescending(x => x.WinRate).ToList();
        analysis.GeneratedAt = DateTime.UtcNow;
        
        return analysis;
    }
    
    private string CalculateTier(float winRate, float avgDamage)
    {
        if (winRate >= 0.60f) return "S";
        if (winRate >= 0.55f) return "A+";
        if (winRate >= 0.50f) return "A";
        if (winRate >= 0.45f) return "B+";
        if (winRate >= 0.40f) return "B";
        return "C";
    }
    
    /// <summary>
    /// Get character usage distribution
    /// </summary>
    public Dictionary<string, float> GetCharacterUsageDistribution()
    {
        var distribution = new Dictionary<string, float>();
        int totalMatches = _matchHistory.Count * 2; // Each match has 2 characters
        
        foreach (var charStats in _characterStats.Values)
        {
            distribution[charStats.CharacterId] = (float)charStats.TotalMatches / totalMatches;
        }
        
        return distribution;
    }
    
    /// <summary>
    /// Get most problematic moves that may need balancing
    /// </summary>
    public List<ProblematicMove> GetProblematicMoves()
    {
        var problematicMoves = new List<ProblematicMove>();
        
        foreach (var charStats in _characterStats.Values)
        {
            foreach (var moveStats in charStats.MoveUsageStats)
            {
                if (moveStats.Value.TimesUsed < 50) continue; // Need sufficient usage data
                
                float hitRate = (float)moveStats.Value.Hits / (moveStats.Value.Hits + moveStats.Value.Whiffs);
                float avgDamagePerUse = moveStats.Value.TotalDamage / moveStats.Value.TimesUsed;
                
                // Flag moves with concerning statistics
                if (hitRate > 0.8f && avgDamagePerUse > 100f) // Too reliable and high damage
                {
                    problematicMoves.Add(new ProblematicMove
                    {
                        CharacterId = charStats.CharacterId,
                        MoveName = moveStats.Key,
                        HitRate = hitRate,
                        AverageDamage = avgDamagePerUse,
                        UsageCount = moveStats.Value.TimesUsed,
                        Issue = "High hit rate with high damage"
                    });
                }
                else if (moveStats.Value.TimesUsed > charStats.TotalMatches * 10) // Overused move
                {
                    problematicMoves.Add(new ProblematicMove
                    {
                        CharacterId = charStats.CharacterId,
                        MoveName = moveStats.Key,
                        HitRate = hitRate,
                        AverageDamage = avgDamagePerUse,
                        UsageCount = moveStats.Value.TimesUsed,
                        Issue = "Overused move (potential flowchart play)"
                    });
                }
            }
        }
        
        return problematicMoves.OrderByDescending(x => x.UsageCount).ToList();
    }
    
    /// <summary>
    /// Export telemetry data to JSON file
    /// </summary>
    public void ExportTelemetryData(string filePath)
    {
        var exportData = new
        {
            MatchHistory = _matchHistory.TakeLast(100).ToList(), // Last 100 matches
            CharacterStats = _characterStats,
            TierAnalysis = GenerateTierSuggestions(),
            ProblematicMoves = GetProblematicMoves(),
            ExportedAt = DateTime.UtcNow
        };
        
        try
        {
            using var file = FileAccess.Open(filePath, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(exportData, new JsonSerializerOptions 
            { 
                WriteIndented = true 
            });
            file.StoreString(jsonText);
            GD.Print($"Telemetry data exported to {filePath}");
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to export telemetry data: {e.Message}");
        }
    }
    
    private void LoadTelemetryData()
    {
        try
        {
            if (FileAccess.FileExists(TELEMETRY_PATH))
            {
                using var file = FileAccess.Open(TELEMETRY_PATH, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<TelemetryData>(jsonText);
                
                _matchHistory = data.MatchHistory ?? new();
                _characterStats = data.CharacterStats ?? new();
                
                GD.Print($"Loaded telemetry data: {_matchHistory.Count} matches, {_characterStats.Count} characters");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load telemetry data: {e.Message}");
        }
    }
    
    private void SaveTelemetryData()
    {
        try
        {
            var data = new TelemetryData
            {
                MatchHistory = _matchHistory,
                CharacterStats = _characterStats
            };
            
            using var file = FileAccess.Open(TELEMETRY_PATH, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions 
            { 
                WriteIndented = true 
            });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save telemetry data: {e.Message}");
        }
    }
    
    public List<MatchData> GetRecentMatches(int count = 50) => _matchHistory.TakeLast(count).ToList();
    public Dictionary<string, CharacterStats> GetCharacterStats() => _characterStats;
}

// Data structures for telemetry
public class TelemetryData
{
    public List<MatchData> MatchHistory { get; set; } = new();
    public Dictionary<string, CharacterStats> CharacterStats { get; set; } = new();
}

public class MatchData
{
    public DateTime Timestamp { get; set; }
    public string Player1Character { get; set; } = "";
    public string Player2Character { get; set; } = "";
    public int WinnerIndex { get; set; } // 0 for P1, 1 for P2
    public float MatchDuration { get; set; } // in seconds
    public PlayerMatchStats Player1Stats { get; set; } = new();
    public PlayerMatchStats Player2Stats { get; set; } = new();
    public string MatchType { get; set; } = ""; // casual, ranked, tournament
}

public class PlayerMatchStats
{
    public int DamageDealt { get; set; }
    public int CombosPerformed { get; set; }
    public int MeterUsed { get; set; }
    public int ParriesPerformed { get; set; }
    public int BurstsPerformed { get; set; }
    public Dictionary<string, MoveUsageStats> MoveUsage { get; set; } = new();
}

public class CharacterStats
{
    public string CharacterId { get; set; } = "";
    public int TotalMatches { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int TotalDamageDealt { get; set; }
    public int TotalCombos { get; set; }
    public int TotalMeterUsed { get; set; }
    public int TotalParries { get; set; }
    public int TotalBursts { get; set; }
    public Dictionary<string, MoveUsageStats> MoveUsageStats { get; set; } = new();
}

public class MoveUsageStats
{
    public int TimesUsed { get; set; }
    public int Hits { get; set; }
    public int Whiffs { get; set; }
    public int TotalDamage { get; set; }
}

public class TierAnalysis
{
    public DateTime GeneratedAt { get; set; }
    public List<TierSuggestion> CharacterTiers { get; set; } = new();
}

public class TierSuggestion
{
    public string CharacterId { get; set; } = "";
    public float WinRate { get; set; }
    public int TotalMatches { get; set; }
    public float AverageDamagePerMatch { get; set; }
    public string SuggestedTier { get; set; } = "";
    public bool RequiresReview { get; set; }
    public string ReviewReason { get; set; } = "";
}

public class ProblematicMove
{
    public string CharacterId { get; set; } = "";
    public string MoveName { get; set; } = "";
    public float HitRate { get; set; }
    public float AverageDamage { get; set; }
    public int UsageCount { get; set; }
    public string Issue { get; set; } = "";
}