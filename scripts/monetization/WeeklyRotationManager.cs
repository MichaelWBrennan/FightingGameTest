using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Manages player-specific randomized weekly free fighter rotation system
/// Each player gets ALL fighters available through rotation - no character purchases
/// Implements League-style individual randomized weekly rotations with analytics
/// </summary>
public partial class WeeklyRotationManager : Node
{
    public static WeeklyRotationManager Instance { get; private set; }
    
    private Dictionary<string, PlayerRotationData> _playerRotations = new();
    private List<string> _allCharacterIds = new();
    private Dictionary<string, string> _characterArchetypes = new();
    private const string ROTATION_DATA_FILE = "user://player_rotations.json";
    private const int COOLDOWN_WEEKS = 5; // Prevent repeats within 5 weeks
    
    [Signal]
    public delegate void RotationUpdatedEventHandler();
    
    [Signal]
    public delegate void WeeklyResetEventHandler();
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeCharacterData();
            LoadRotationData();
            CheckWeeklyReset();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize character data from JSON files
    /// All fighters are available through rotation - no purchases required
    /// </summary>
    private void InitializeCharacterData()
    {
        // Load all available characters
        var characterFiles = new[] { "ryu", "chun_li", "ken", "zangief", "blanka", "dhalsim", "guile", "sagat" };
        
        foreach (var characterId in characterFiles)
        {
            _allCharacterIds.Add(characterId);
            
            // Load character archetype from data (or set defaults)
            _characterArchetypes[characterId] = characterId switch
            {
                "ryu" or "ken" => "Shoto",
                "chun_li" => "Rushdown", 
                "zangief" => "Grappler",
                "dhalsim" => "Zoner",
                "blanka" => "Mixup",
                "guile" => "Charge",
                "sagat" => "Zoner",
                _ => "Balanced"
            };
        }
        
        GD.Print($"Initialized {_allCharacterIds.Count} fighters for weekly rotation system");
    }
    
    /// <summary>
    /// Get the free fighter for a specific player this week
    /// </summary>
    public string GetPlayerWeeklyFighter(string playerId)
    {
        var currentWeek = GetCurrentWeekNumber();
        
        if (!_playerRotations.ContainsKey(playerId))
        {
            _playerRotations[playerId] = new PlayerRotationData
            {
                PlayerId = playerId,
                LastUpdated = DateTime.UtcNow
            };
        }
        
        var playerData = _playerRotations[playerId];
        
        // Check if we need to generate a new rotation for this week
        if (playerData.CurrentWeek != currentWeek || string.IsNullOrEmpty(playerData.CurrentFighter))
        {
            GenerateWeeklyFighter(playerId, currentWeek);
            SaveRotationData();
        }
        
        return playerData.CurrentFighter;
    }
    
    /// <summary>
    /// Generate a new weekly fighter for a player using deterministic randomization
    /// </summary>
    private void GenerateWeeklyFighter(string playerId, int weekNumber)
    {
        var playerData = _playerRotations[playerId];
        
        // Create deterministic seed based on player ID and week number
        var seed = GenerateSeed(playerId, weekNumber);
        var random = new Random(seed);
        
        // Get available characters (excluding recently used ones)
        var availableCharacters = GetAvailableCharacters(playerId);
        
        // Balance archetype exposure if needed
        var balancedCharacters = BalanceArchetypeExposure(playerId, availableCharacters);
        
        // Select random character from balanced list
        var selectedCharacter = balancedCharacters[random.Next(balancedCharacters.Count)];
        
        // Update player rotation data
        playerData.CurrentFighter = selectedCharacter;
        playerData.CurrentWeek = weekNumber;
        playerData.LastUpdated = DateTime.UtcNow;
        
        // Add to history
        playerData.FighterHistory.Add(new FighterHistoryEntry
        {
            CharacterId = selectedCharacter,
            Week = weekNumber,
            Timestamp = DateTime.UtcNow
        });
        
        // Clean up old history (keep only cooldown period)
        CleanupHistory(playerData);
        
        GD.Print($"Generated weekly fighter for {playerId} (Week {weekNumber}): {selectedCharacter}");
        EmitSignal(SignalName.RotationUpdated);
    }
    
    /// <summary>
    /// Generate deterministic seed for player rotation
    /// </summary>
    private int GenerateSeed(string playerId, int weekNumber)
    {
        // Create consistent hash based on player ID + week number
        var combined = $"{playerId}_{weekNumber}";
        var hash = combined.GetHashCode();
        return Math.Abs(hash);
    }
    
    /// <summary>
    /// Get available characters for a player (excluding cooldown period)
    /// </summary>
    private List<string> GetAvailableCharacters(string playerId)
    {
        var playerData = _playerRotations[playerId];
        var availableCharacters = new List<string>(_allCharacterIds);
        
        // Remove characters from recent history (cooldown prevention)
        var recentWeeks = GetCurrentWeekNumber() - COOLDOWN_WEEKS;
        var recentCharacters = playerData.FighterHistory
            .Where(h => h.Week > recentWeeks)
            .Select(h => h.CharacterId)
            .ToHashSet();
            
        availableCharacters.RemoveAll(c => recentCharacters.Contains(c));
        
        // If all characters are in cooldown, allow all (edge case)
        if (availableCharacters.Count == 0)
        {
            availableCharacters.AddRange(_allCharacterIds);
        }
        
        return availableCharacters;
    }
    
    /// <summary>
    /// Balance archetype exposure to ensure variety
    /// </summary>
    private List<string> BalanceArchetypeExposure(string playerId, List<string> availableCharacters)
    {
        var playerData = _playerRotations[playerId];
        
        // Get archetype distribution from recent history
        var recentArchetypes = playerData.FighterHistory
            .TakeLast(4) // Last 4 weeks
            .Select(h => _characterArchetypes.GetValueOrDefault(h.CharacterId, "Balanced"))
            .GroupBy(a => a)
            .ToDictionary(g => g.Key, g => g.Count());
            
        // Group available characters by archetype
        var charactersByArchetype = availableCharacters
            .GroupBy(c => _characterArchetypes.GetValueOrDefault(c, "Balanced"))
            .ToDictionary(g => g.Key, g => g.ToList());
            
        // Find least used archetype
        var leastUsedArchetype = charactersByArchetype.Keys
            .OrderBy(a => recentArchetypes.GetValueOrDefault(a, 0))
            .First();
            
        // Return characters from least used archetype, or all if none in that archetype
        return charactersByArchetype.GetValueOrDefault(leastUsedArchetype, availableCharacters);
    }
    
    /// <summary>
    /// Clean up old history entries beyond cooldown period
    /// </summary>
    private void CleanupHistory(PlayerRotationData playerData)
    {
        var cutoffWeek = GetCurrentWeekNumber() - (COOLDOWN_WEEKS * 2); // Keep extra for analytics
        playerData.FighterHistory.RemoveAll(h => h.Week < cutoffWeek);
    }
    
    /// <summary>
    /// Check if player can access a specific character
    /// </summary>
    public bool CanPlayerAccessCharacter(string playerId, string characterId)
    {
        // In this system, all characters are available through rotation
        // Players can access any character that's either their weekly fighter
        // or through other means (training mode, etc.)
        
        var weeklyFighter = GetPlayerWeeklyFighter(playerId);
        return weeklyFighter == characterId || _allCharacterIds.Contains(characterId);
    }
    
    /// <summary>
    /// Get current week number since epoch for consistent rotation timing
    /// </summary>
    private int GetCurrentWeekNumber()
    {
        var epoch = new DateTime(2024, 1, 1); // Game launch reference date
        var daysSinceEpoch = (DateTime.UtcNow - epoch).Days;
        return daysSinceEpoch / 7; // Week number
    }
    
    /// <summary>
    /// Check if weekly reset is needed
    /// </summary>
    private void CheckWeeklyReset()
    {
        // This would typically be called on game start or periodically
        // For demo purposes, just ensure current rotations are valid
        var currentWeek = GetCurrentWeekNumber();
        
        foreach (var playerId in _playerRotations.Keys.ToList())
        {
            var playerData = _playerRotations[playerId];
            if (playerData.CurrentWeek != currentWeek)
            {
                // Auto-generate if needed
                GetPlayerWeeklyFighter(playerId);
            }
        }
    }
    
    /// <summary>
    /// Save rotation data to file
    /// </summary>
    private void SaveRotationData()
    {
        try
        {
            var saveData = new RotationSaveData
            {
                PlayerRotations = _playerRotations,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(ROTATION_DATA_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(saveData, new JsonSerializerOptions 
            { 
                WriteIndented = true 
            });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save rotation data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load rotation data from file
    /// </summary>
    private void LoadRotationData()
    {
        try
        {
            if (FileAccess.FileExists(ROTATION_DATA_FILE))
            {
                using var file = FileAccess.Open(ROTATION_DATA_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<RotationSaveData>(jsonText);
                
                _playerRotations = data.PlayerRotations ?? new();
                GD.Print($"Loaded rotation data for {_playerRotations.Count} players");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load rotation data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Get list of all available character IDs
    /// </summary>
    public List<string> GetAllCharacterIds() => new(_allCharacterIds);
    
    /// <summary>
    /// Check if rotation system has any characters configured
    /// </summary>
    public bool HasCharacters() => _allCharacterIds.Count > 0;
}

// Data classes
public class PlayerRotationData
{
    public string PlayerId { get; set; } = "";
    public string CurrentFighter { get; set; } = "";
    public int CurrentWeek { get; set; }
    public DateTime LastUpdated { get; set; }
    public List<FighterHistoryEntry> FighterHistory { get; set; } = new();
}

public class FighterHistoryEntry
{
    public string CharacterId { get; set; } = "";
    public int Week { get; set; }
    public DateTime Timestamp { get; set; }
}

public class RotationSaveData
{
    public Dictionary<string, PlayerRotationData> PlayerRotations { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class PlayerRotationAnalytics
{
    public string PlayerId { get; set; } = "";
    public int TotalWeeksActive { get; set; }
    public int UniqueCharactersPlayed { get; set; }
    public int LastActiveWeek { get; set; }
    public string CurrentFighter { get; set; } = "";
    public Dictionary<string, int> ArchetypeDistribution { get; set; } = new();
}

public class RotationCharacterData
{
    public string CharacterId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Archetype { get; set; } = "";
    public string Complexity { get; set; } = "";
    public bool DlcCharacter { get; set; }
}