using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// On-Board Fighter Affinity System
/// Helps players discover their main organically and tracks growth across archetypes
/// Provides fighter recommendations and mastery progression without gameplay impact
/// </summary>
public partial class FighterAffinitySystem : Node
{
    public static FighterAffinitySystem Instance { get; private set; }
    
    // Player affinity data
    private Dictionary<int, Dictionary<string, FighterAffinity>> _playerAffinities = new();
    private Dictionary<int, FighterRecommendation> _currentRecommendations = new();
    private Dictionary<string, FighterArchetype> _fighterArchetypes = new();
    
    // Seasonal tracking
    private DateTime _seasonStartDate = DateTime.UtcNow;
    private const int SEASON_LENGTH_DAYS = 90;
    private const int MATCHES_FOR_AFFINITY = 5;
    private const int MATCHES_FOR_MASTERY = 25;
    
    [Signal]
    public delegate void AffinityUpdatedEventHandler(int playerId, string fighterId, float newAffinity);
    
    [Signal]
    public delegate void MasteryLevelUpEventHandler(int playerId, string fighterId, int newLevel);
    
    [Signal]
    public delegate void FighterRecommendedEventHandler(int playerId, string recommendedFighterId, string reason);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeSystem();
            LoadAffinityData();
            LoadFighterArchetypes();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("FighterAffinitySystem initialized");
    }
    
    private void InitializeSystem()
    {
        // Initialize for 2 players
        for (int i = 0; i < 2; i++)
        {
            _playerAffinities[i] = new Dictionary<string, FighterAffinity>();
            _currentRecommendations[i] = new FighterRecommendation();
        }
    }
    
    private void LoadFighterArchetypes()
    {
        // Define fighter archetypes - in a full implementation, this would be loaded from data files
        _fighterArchetypes = new Dictionary<string, FighterArchetype>
        {
            ["ryu"] = new FighterArchetype 
            { 
                Name = "Ryu",
                Type = ArchetypeType.Shoto,
                PlayStyle = PlayStyle.Balanced,
                Difficulty = DifficultyLevel.Easy,
                Range = RangeType.Mid,
                Mobility = MobilityType.Standard,
                Tags = new[] { "Fundamentals", "Projectile", "AllAround" }
            },
            ["chun_li"] = new FighterArchetype
            {
                Name = "Chun-Li",
                Type = ArchetypeType.Rushdown,
                PlayStyle = PlayStyle.Aggressive,
                Difficulty = DifficultyLevel.Medium,
                Range = RangeType.Close,
                Mobility = MobilityType.High,
                Tags = new[] { "Speed", "Pressure", "Mixups" }
            },
            ["zangief"] = new FighterArchetype
            {
                Name = "Zangief",
                Type = ArchetypeType.Grappler,
                PlayStyle = PlayStyle.Patient,
                Difficulty = DifficultyLevel.Hard,
                Range = RangeType.Close,
                Mobility = MobilityType.Low,
                Tags = new[] { "Power", "Command_Grabs", "Armor" }
            },
            ["dhalsim"] = new FighterArchetype
            {
                Name = "Dhalsim",
                Type = ArchetypeType.Zoner,
                PlayStyle = PlayStyle.Defensive,
                Difficulty = DifficultyLevel.Hard,
                Range = RangeType.Long,
                Mobility = MobilityType.Low,
                Tags = new[] { "Keepaway", "Spacing", "Zoning" }
            }
        };
    }
    
    public void RecordMatchPerformance(int playerId, string fighterId, MatchPerformance performance)
    {
        if (!_playerAffinities.ContainsKey(playerId))
            return;
            
        var playerAffinities = _playerAffinities[playerId];
        
        // Get or create affinity record
        if (!playerAffinities.ContainsKey(fighterId))
        {
            playerAffinities[fighterId] = new FighterAffinity(fighterId);
        }
        
        var affinity = playerAffinities[fighterId];
        
        // Record the match
        affinity.TotalMatches++;
        affinity.TotalWins += performance.Won ? 1 : 0;
        affinity.TotalDamage += performance.DamageDealt;
        affinity.TotalCombos += performance.CombosPerformed;
        affinity.LastPlayed = DateTime.UtcNow;
        
        // Track performance metrics
        affinity.PerformanceHistory.Add(new PerformanceEntry
        {
            Date = DateTime.UtcNow,
            Won = performance.Won,
            DamageDealt = performance.DamageDealt,
            CombosPerformed = performance.CombosPerformed,
            DefensiveActions = performance.DefensiveActions,
            SpecialMovesUsed = performance.SpecialMovesUsed,
            PlayTime = performance.MatchDuration
        });
        
        // Keep history manageable
        if (affinity.PerformanceHistory.Count > 50)
        {
            affinity.PerformanceHistory.RemoveAt(0);
        }
        
        // Calculate new affinity score
        UpdateAffinityScore(playerId, fighterId);
        
        // Check for mastery level up
        CheckMasteryLevelUp(playerId, fighterId);
        
        // Update recommendations
        UpdateRecommendations(playerId);
        
        // Save data
        SaveAffinityData(playerId);
        
        GD.Print($"Recorded match for Player {playerId} with {fighterId}: {(performance.Won ? "Win" : "Loss")}");
    }
    
    private void UpdateAffinityScore(int playerId, string fighterId)
    {
        var affinity = _playerAffinities[playerId][fighterId];
        
        // Base affinity on match count and performance
        float baseAffinity = Math.Min(1.0f, affinity.TotalMatches / 20.0f);
        
        // Performance modifiers
        float winRate = affinity.TotalMatches > 0 ? (float)affinity.TotalWins / affinity.TotalMatches : 0;
        float performanceMultiplier = 0.5f + (winRate * 0.5f); // 0.5-1.0 based on win rate
        
        // Recent activity bonus
        var daysSinceLastPlayed = (DateTime.UtcNow - affinity.LastPlayed).TotalDays;
        float recencyMultiplier = daysSinceLastPlayed < 7 ? 1.2f : 1.0f;
        
        // Calculate new affinity
        float oldAffinity = affinity.AffinityScore;
        affinity.AffinityScore = baseAffinity * performanceMultiplier * recencyMultiplier;
        affinity.AffinityScore = Math.Min(1.0f, affinity.AffinityScore);
        
        if (Math.Abs(affinity.AffinityScore - oldAffinity) > 0.05f)
        {
            EmitSignal(SignalName.AffinityUpdated, playerId, fighterId, affinity.AffinityScore);
        }
    }
    
    private void CheckMasteryLevelUp(int playerId, string fighterId)
    {
        var affinity = _playerAffinities[playerId][fighterId];
        
        // Calculate mastery level based on matches and performance
        int newMasteryLevel = CalculateMasteryLevel(affinity);
        
        if (newMasteryLevel > affinity.MasteryLevel)
        {
            affinity.MasteryLevel = newMasteryLevel;
            EmitSignal(SignalName.MasteryLevelUp, playerId, fighterId, newMasteryLevel);
            
            // Unlock cosmetics or titles based on mastery level
            UnlockMasteryRewards(playerId, fighterId, newMasteryLevel);
            
            GD.Print($"Player {playerId} mastery level up with {fighterId}: Level {newMasteryLevel}");
        }
    }
    
    private int CalculateMasteryLevel(FighterAffinity affinity)
    {
        // Base level on match count
        int baseLevel = affinity.TotalMatches / MATCHES_FOR_MASTERY;
        
        // Bonus levels for good performance
        float winRate = affinity.TotalMatches > 0 ? (float)affinity.TotalWins / affinity.TotalMatches : 0;
        int performanceBonus = winRate > 0.6f ? 1 : 0;
        
        // Recent activity bonus
        var daysSinceLastPlayed = (DateTime.UtcNow - affinity.LastPlayed).TotalDays;
        int activityBonus = daysSinceLastPlayed < 30 ? 1 : 0;
        
        return Math.Min(10, baseLevel + performanceBonus + activityBonus); // Cap at level 10
    }
    
    private void UpdateRecommendations(int playerId)
    {
        var playerAffinities = _playerAffinities[playerId];
        var recommendation = _currentRecommendations[playerId];
        
        // Get player's style preferences from their current fighters
        var playedFighters = playerAffinities.Where(kvp => kvp.Value.TotalMatches >= MATCHES_FOR_AFFINITY).ToList();
        
        if (playedFighters.Count == 0)
        {
            // New player - recommend easy fighters
            RecommendBeginnerFighter(playerId);
            return;
        }
        
        // Analyze playing patterns
        var preferredArchetypes = AnalyzePreferredArchetypes(playedFighters);
        var playStyle = AnalyzePlayStyle(playedFighters);
        
        // Find similar fighters they haven't tried
        string recommendedFighter = FindRecommendedFighter(playerId, preferredArchetypes, playStyle);
        
        if (!string.IsNullOrEmpty(recommendedFighter) && recommendedFighter != recommendation.FighterId)
        {
            var archetype = _fighterArchetypes[recommendedFighter];
            recommendation.FighterId = recommendedFighter;
            recommendation.Reason = GenerateRecommendationReason(archetype, preferredArchetypes, playStyle);
            recommendation.Confidence = CalculateRecommendationConfidence(playedFighters);
            recommendation.ExpiresAt = DateTime.UtcNow.AddDays(7); // Recommendation valid for a week
            
            EmitSignal(SignalName.FighterRecommended, playerId, recommendedFighter, recommendation.Reason);
            
            GD.Print($"Recommended {recommendedFighter} to Player {playerId}: {recommendation.Reason}");
        }
    }
    
    private List<ArchetypeType> AnalyzePreferredArchetypes(List<KeyValuePair<string, FighterAffinity>> playedFighters)
    {
        var archetypeCounts = new Dictionary<ArchetypeType, float>();
        
        foreach (var kvp in playedFighters)
        {
            if (_fighterArchetypes.ContainsKey(kvp.Key))
            {
                var archetype = _fighterArchetypes[kvp.Key].Type;
                var affinity = kvp.Value.AffinityScore;
                
                if (!archetypeCounts.ContainsKey(archetype))
                    archetypeCounts[archetype] = 0;
                    
                archetypeCounts[archetype] += affinity;
            }
        }
        
        return archetypeCounts.OrderByDescending(kvp => kvp.Value).Select(kvp => kvp.Key).ToList();
    }
    
    private PlayStyle AnalyzePlayStyle(List<KeyValuePair<string, FighterAffinity>> playedFighters)
    {
        var styleScores = new Dictionary<PlayStyle, float>();
        
        foreach (var kvp in playedFighters)
        {
            if (_fighterArchetypes.ContainsKey(kvp.Key))
            {
                var style = _fighterArchetypes[kvp.Key].PlayStyle;
                var affinity = kvp.Value.AffinityScore;
                
                if (!styleScores.ContainsKey(style))
                    styleScores[style] = 0;
                    
                styleScores[style] += affinity;
            }
        }
        
        return styleScores.Count > 0 ? styleScores.OrderByDescending(kvp => kvp.Value).First().Key : PlayStyle.Balanced;
    }
    
    private string FindRecommendedFighter(int playerId, List<ArchetypeType> preferredArchetypes, PlayStyle playStyle)
    {
        var playerAffinities = _playerAffinities[playerId];
        var candidates = new List<(string fighterId, float score)>();
        
        foreach (var kvp in _fighterArchetypes)
        {
            string fighterId = kvp.Key;
            var archetype = kvp.Value;
            
            // Skip if already played significantly
            if (playerAffinities.ContainsKey(fighterId) && playerAffinities[fighterId].TotalMatches >= MATCHES_FOR_AFFINITY)
                continue;
                
            float score = 0;
            
            // Score based on archetype preference
            for (int i = 0; i < preferredArchetypes.Count; i++)
            {
                if (archetype.Type == preferredArchetypes[i])
                {
                    score += (preferredArchetypes.Count - i) * 0.3f;
                    break;
                }
            }
            
            // Score based on play style match
            if (archetype.PlayStyle == playStyle)
                score += 0.4f;
                
            // Slight preference for easier characters for newer players
            var totalMatches = playerAffinities.Values.Sum(a => a.TotalMatches);
            if (totalMatches < 20)
            {
                score += archetype.Difficulty == DifficultyLevel.Easy ? 0.2f : 
                        archetype.Difficulty == DifficultyLevel.Medium ? 0.1f : 0;
            }
            
            candidates.Add((fighterId, score));
        }
        
        return candidates.OrderByDescending(c => c.score).FirstOrDefault().fighterId;
    }
    
    private void RecommendBeginnerFighter(int playerId)
    {
        var beginnerFighters = _fighterArchetypes.Where(kvp => kvp.Value.Difficulty == DifficultyLevel.Easy).ToList();
        
        if (beginnerFighters.Count > 0)
        {
            var recommended = beginnerFighters.First();
            var recommendation = _currentRecommendations[playerId];
            
            recommendation.FighterId = recommended.Key;
            recommendation.Reason = $"Perfect for learning fundamentals - {recommended.Value.Name} is beginner-friendly with solid basics";
            recommendation.Confidence = 0.8f;
            recommendation.ExpiresAt = DateTime.UtcNow.AddDays(14); // Longer for new players
            
            EmitSignal(SignalName.FighterRecommended, playerId, recommended.Key, recommendation.Reason);
        }
    }
    
    private string GenerateRecommendationReason(FighterArchetype archetype, List<ArchetypeType> preferredArchetypes, PlayStyle playStyle)
    {
        var reasons = new List<string>();
        
        if (preferredArchetypes.Contains(archetype.Type))
            reasons.Add($"matches your {archetype.Type} preference");
            
        if (archetype.PlayStyle == playStyle)
            reasons.Add($"fits your {playStyle} style");
            
        if (archetype.Tags.Contains("Fundamentals"))
            reasons.Add("great for improving fundamentals");
            
        return reasons.Count > 0 ? 
            $"Try {archetype.Name} - {string.Join(" and ", reasons)}" :
            $"Expand your skills with {archetype.Name}";
    }
    
    private float CalculateRecommendationConfidence(List<KeyValuePair<string, FighterAffinity>> playedFighters)
    {
        float totalMatches = playedFighters.Sum(kvp => kvp.Value.TotalMatches);
        return Math.Min(1.0f, totalMatches / 50.0f); // More matches = higher confidence
    }
    
    private void UnlockMasteryRewards(int playerId, string fighterId, int masteryLevel)
    {
        // In a full implementation, this would unlock cosmetics, titles, etc.
        var rewards = new List<string>();
        
        switch (masteryLevel)
        {
            case 1:
                rewards.Add($"{fighterId}_title_apprentice");
                break;
            case 3:
                rewards.Add($"{fighterId}_color_alt1");
                break;
            case 5:
                rewards.Add($"{fighterId}_title_expert");
                rewards.Add($"{fighterId}_intro_alt1");
                break;
            case 7:
                rewards.Add($"{fighterId}_color_alt2");
                break;
            case 10:
                rewards.Add($"{fighterId}_title_master");
                rewards.Add($"{fighterId}_victory_alt1");
                break;
        }
        
        foreach (var reward in rewards)
        {
            GD.Print($"Unlocked: {reward} for Player {playerId}");
        }
    }
    
    public FighterAffinity GetFighterAffinity(int playerId, string fighterId)
    {
        return _playerAffinities.GetValueOrDefault(playerId)?.GetValueOrDefault(fighterId);
    }
    
    public List<FighterAffinity> GetTopAffinities(int playerId, int count = 5)
    {
        if (!_playerAffinities.ContainsKey(playerId))
            return new List<FighterAffinity>();
            
        return _playerAffinities[playerId].Values
            .OrderByDescending(a => a.AffinityScore)
            .Take(count)
            .ToList();
    }
    
    public FighterRecommendation GetCurrentRecommendation(int playerId)
    {
        var recommendation = _currentRecommendations.GetValueOrDefault(playerId);
        
        // Check if recommendation has expired
        if (recommendation != null && recommendation.ExpiresAt < DateTime.UtcNow)
        {
            UpdateRecommendations(playerId);
            recommendation = _currentRecommendations.GetValueOrDefault(playerId);
        }
        
        return recommendation;
    }
    
    public void ResetSeasonalData(int playerId)
    {
        if (_playerAffinities.ContainsKey(playerId))
        {
            foreach (var affinity in _playerAffinities[playerId].Values)
            {
                affinity.SeasonalMatches = 0;
                affinity.SeasonalWins = 0;
            }
            
            SaveAffinityData(playerId);
            GD.Print($"Reset seasonal data for Player {playerId}");
        }
    }
    
    private void SaveAffinityData(int playerId)
    {
        var configFile = new ConfigFile();
        configFile.Load("user://fighter_affinities.cfg");
        
        var playerAffinities = _playerAffinities[playerId];
        
        foreach (var kvp in playerAffinities)
        {
            var fighterId = kvp.Key;
            var affinity = kvp.Value;
            var section = $"player_{playerId}_{fighterId}";
            
            configFile.SetValue(section, "total_matches", affinity.TotalMatches);
            configFile.SetValue(section, "total_wins", affinity.TotalWins);
            configFile.SetValue(section, "affinity_score", affinity.AffinityScore);
            configFile.SetValue(section, "mastery_level", affinity.MasteryLevel);
            configFile.SetValue(section, "last_played", affinity.LastPlayed.ToString("yyyy-MM-dd HH:mm:ss"));
        }
        
        configFile.Save("user://fighter_affinities.cfg");
    }
    
    private void LoadAffinityData()
    {
        var configFile = new ConfigFile();
        var err = configFile.Load("user://fighter_affinities.cfg");
        
        if (err != Error.Ok)
            return;
            
        var sections = configFile.GetSections();
        
        foreach (string section in sections)
        {
            var parts = section.Split('_');
            if (parts.Length >= 3 && parts[0] == "player" && int.TryParse(parts[1], out int playerId))
            {
                var fighterId = string.Join("_", parts.Skip(2));
                
                if (!_playerAffinities.ContainsKey(playerId))
                    _playerAffinities[playerId] = new Dictionary<string, FighterAffinity>();
                    
                var affinity = new FighterAffinity(fighterId);
                affinity.TotalMatches = configFile.GetValue(section, "total_matches", 0).AsInt32();
                affinity.TotalWins = configFile.GetValue(section, "total_wins", 0).AsInt32();
                affinity.AffinityScore = configFile.GetValue(section, "affinity_score", 0.0f).AsSingle();
                affinity.MasteryLevel = configFile.GetValue(section, "mastery_level", 0).AsInt32();
                
                var lastPlayedStr = configFile.GetValue(section, "last_played", "").AsString();
                if (DateTime.TryParse(lastPlayedStr, out DateTime lastPlayed))
                    affinity.LastPlayed = lastPlayed;
                    
                _playerAffinities[playerId][fighterId] = affinity;
            }
        }
        
        GD.Print("Loaded fighter affinity data");
    }
}

// Data classes for the affinity system
public class FighterAffinity
{
    public string FighterId { get; private set; }
    public int TotalMatches { get; set; }
    public int TotalWins { get; set; }
    public int SeasonalMatches { get; set; }
    public int SeasonalWins { get; set; }
    public float AffinityScore { get; set; }
    public int MasteryLevel { get; set; }
    public DateTime LastPlayed { get; set; } = DateTime.UtcNow;
    public int TotalDamage { get; set; }
    public int TotalCombos { get; set; }
    public List<PerformanceEntry> PerformanceHistory { get; set; } = new();
    
    public FighterAffinity(string fighterId)
    {
        FighterId = fighterId;
    }
}

public class FighterRecommendation
{
    public string FighterId { get; set; }
    public string Reason { get; set; }
    public float Confidence { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class FighterArchetype
{
    public string Name { get; set; }
    public ArchetypeType Type { get; set; }
    public PlayStyle PlayStyle { get; set; }
    public DifficultyLevel Difficulty { get; set; }
    public RangeType Range { get; set; }
    public MobilityType Mobility { get; set; }
    public string[] Tags { get; set; }
}

public struct MatchPerformance
{
    public bool Won;
    public int DamageDealt;
    public int CombosPerformed;
    public int DefensiveActions;
    public int SpecialMovesUsed;
    public float MatchDuration;
}

public struct PerformanceEntry
{
    public DateTime Date;
    public bool Won;
    public int DamageDealt;
    public int CombosPerformed;
    public int DefensiveActions;
    public int SpecialMovesUsed;
    public float PlayTime;
}

public enum ArchetypeType
{
    Shoto,
    Rushdown,
    Grappler,
    Zoner,
    Technical,
    AllRounder
}

public enum PlayStyle
{
    Aggressive,
    Defensive,
    Balanced,
    Patient,
    Explosive
}

public enum DifficultyLevel
{
    Easy,
    Medium,
    Hard,
    Expert
}

public enum RangeType
{
    Close,
    Mid,
    Long
}

public enum MobilityType
{
    Low,
    Standard,
    High
}