using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Manages player-specific randomized weekly free fighter rotation system
/// Each player gets one free fighter per week, individually randomized with cooldown prevention
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
    /// </summary>
    private void InitializeCharacterData()
    {
        // Load character data to get archetype information
        var characterFiles = new[] { "ryu", "chun_li", "ken", "zangief" }; // Add more as they're added
        
        foreach (var characterId in characterFiles)
        {
            var filePath = $"res://data/characters/{characterId}.json";
            if (FileAccess.FileExists(filePath))
            {
                try
                {
                    using var file = FileAccess.Open(filePath, FileAccess.ModeFlags.Read);
                    var jsonText = file.GetAsText();
                    var characterData = JsonSerializer.Deserialize<CharacterData>(jsonText);
                    
                    _allCharacterIds.Add(characterData.CharacterId);
                    _characterArchetypes[characterData.CharacterId] = characterData.Archetype;
                }
                catch (Exception e)
                {
                    GD.PrintErr($"Failed to load character data for {characterId}: {e.Message}");
                }
            }
        }
        
        GD.Print($"Loaded {_allCharacterIds.Count} characters for rotation system");
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
        
        // Ensure positive seed value
        return Math.Abs(hash);
    }
    
    /// <summary>
    /// Get characters available for rotation (excluding cooldown)
    /// </summary>
    private List<string> GetAvailableCharacters(string playerId)
    {
        var available = new List<string>(_allCharacterIds);
        
        if (_playerRotations.ContainsKey(playerId))
        {
            var playerData = _playerRotations[playerId];
            var currentWeek = GetCurrentWeekNumber();
            
            // Remove characters used within cooldown period
            var recentCharacters = playerData.FighterHistory
                .Where(h => (currentWeek - h.Week) < COOLDOWN_WEEKS)
                .Select(h => h.CharacterId)
                .ToHashSet();
            
            available.RemoveAll(recentCharacters.Contains);
        }
        
        // Ensure at least one character is always available
        if (available.Count == 0)
        {
            available.Add(_allCharacterIds[0]); // Fallback to first character
            GD.PrintErr($"No characters available for {playerId}, using fallback");
        }
        
        return available;
    }
    
    /// <summary>
    /// Balance archetype exposure to ensure variety
    /// </summary>
    private List<string> BalanceArchetypeExposure(string playerId, List<string> availableCharacters)
    {
        if (!_playerRotations.ContainsKey(playerId))
            return availableCharacters;
        
        var playerData = _playerRotations[playerId];
        var recentArchetypes = new Dictionary<string, int>();
        
        // Count recent archetype usage
        var currentWeek = GetCurrentWeekNumber();
        foreach (var entry in playerData.FighterHistory)
        {
            if ((currentWeek - entry.Week) < COOLDOWN_WEEKS)
            {
                var archetype = _characterArchetypes.GetValueOrDefault(entry.CharacterId, "unknown");
                recentArchetypes[archetype] = recentArchetypes.GetValueOrDefault(archetype, 0) + 1;
            }
        }
        
        // Prefer archetypes that haven't been used recently
        var balancedCharacters = new List<string>();
        var minUsage = recentArchetypes.Values.DefaultIfEmpty(0).Min();
        
        foreach (var character in availableCharacters)
        {
            var archetype = _characterArchetypes.GetValueOrDefault(character, "unknown");
            var usage = recentArchetypes.GetValueOrDefault(archetype, 0);
            
            // Include characters from least-used archetypes
            if (usage <= minUsage)
            {
                balancedCharacters.Add(character);
            }
        }
        
        // If no balanced characters, fall back to all available
        return balancedCharacters.Count > 0 ? balancedCharacters : availableCharacters;
    }
    
    /// <summary>
    /// Clean up old history entries beyond cooldown period
    /// </summary>
    private void CleanupHistory(PlayerRotationData playerData)
    {
        var currentWeek = GetCurrentWeekNumber();
        var cutoffWeek = currentWeek - COOLDOWN_WEEKS;
        
        playerData.FighterHistory.RemoveAll(h => h.Week < cutoffWeek);
    }
    
    /// <summary>
    /// Get current week number (weeks since Unix epoch)
    /// </summary>
    private int GetCurrentWeekNumber()
    {
        var unixEpoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var daysSinceEpoch = (DateTime.UtcNow - unixEpoch).TotalDays;
        return (int)(daysSinceEpoch / 7);
    }
    
    /// <summary>
    /// Check if weekly reset is needed
    /// </summary>
    private void CheckWeeklyReset()
    {
        var currentWeek = GetCurrentWeekNumber();
        var lastCheckWeek = GetInt("last_check_week", -1);
        
        if (lastCheckWeek != currentWeek)
        {
            GD.Print($"Weekly reset detected. Current week: {currentWeek}");
            SetInt("last_check_week", currentWeek);
            EmitSignal(SignalName.WeeklyReset);
        }
    }
    
    /// <summary>
    /// Check if player can access a character (owned or weekly rotation)
    /// </summary>
    public bool CanPlayerAccessCharacter(string playerId, string characterId)
    {
        // Check if player owns the character
        if (DLCManager.Instance != null && DLCManager.Instance.IsCharacterOwned(characterId))
        {
            return true;
        }
        
        // Check if it's their weekly free fighter
        var weeklyFighter = GetPlayerWeeklyFighter(playerId);
        return weeklyFighter == characterId;
    }
    
    /// <summary>
    /// Get player rotation analytics data
    /// </summary>
    public PlayerRotationAnalytics GetPlayerAnalytics(string playerId)
    {
        if (!_playerRotations.ContainsKey(playerId))
        {
            return new PlayerRotationAnalytics { PlayerId = playerId };
        }
        
        var playerData = _playerRotations[playerId];
        var analytics = new PlayerRotationAnalytics
        {
            PlayerId = playerId,
            TotalWeeksActive = playerData.FighterHistory.Count,
            UniqueCharactersPlayed = playerData.FighterHistory.Select(h => h.CharacterId).Distinct().Count(),
            LastActiveWeek = playerData.CurrentWeek,
            CurrentFighter = playerData.CurrentFighter
        };
        
        // Calculate archetype distribution
        foreach (var entry in playerData.FighterHistory)
        {
            var archetype = _characterArchetypes.GetValueOrDefault(entry.CharacterId, "unknown");
            analytics.ArchetypeDistribution[archetype] = analytics.ArchetypeDistribution.GetValueOrDefault(archetype, 0) + 1;
        }
        
        return analytics;
    }
    
    /// <summary>
    /// Force regenerate rotation for testing/admin purposes
    /// </summary>
    public void ForceRegenerateRotation(string playerId)
    {
        var currentWeek = GetCurrentWeekNumber();
        GenerateWeeklyFighter(playerId, currentWeek);
        SaveRotationData();
        GD.Print($"Force regenerated rotation for {playerId}");
    }
    
    /// <summary>
    /// Save rotation data to file
    /// </summary>
    private void SaveRotationData()
    {
        try
        {
            var data = new RotationSaveData
            {
                PlayerRotations = _playerRotations,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(ROTATION_DATA_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
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

public class CharacterData
{
    public string CharacterId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Archetype { get; set; } = "";
    public string Complexity { get; set; } = "";
    public bool DlcCharacter { get; set; }
}