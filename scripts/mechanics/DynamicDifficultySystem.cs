using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Dynamic Difficulty Calibration (DDC) System
/// Smooths difficulty spikes and learning curves across casual, mid-core, and expert segments
/// Uses background telemetry to track player skill and adjust challenge dynamically
/// </summary>
public partial class DynamicDifficultySystem : Node
{
    public static DynamicDifficultySystem Instance { get; private set; }
    
    // Player skill tracking
    private Dictionary<int, PlayerSkillProfile> _playerProfiles = new();
    private Dictionary<int, List<PerformanceMetric>> _recentPerformance = new();
    
    // Difficulty adjustment parameters
    private const float SKILL_ADJUSTMENT_RATE = 0.05f;
    private const int PERFORMANCE_HISTORY_SIZE = 10;
    private const float WIN_RATE_TARGET = 0.55f; // Slightly favoring player for engagement
    private const float DIFFICULTY_SMOOTHING = 0.1f;
    
    // AI adaptation parameters
    private Dictionary<int, AIAdaptationSettings> _aiSettings = new();
    
    [Signal]
    public delegate void DifficultyAdjustedEventHandler(int playerId, float newDifficulty);
    
    [Signal]
    public delegate void SkillLevelChangedEventHandler(int playerId, SkillLevel newLevel);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializePlayerProfiles();
            LoadSkillProfiles();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("DynamicDifficultySystem initialized");
    }
    
    private void InitializePlayerProfiles()
    {
        // Initialize profiles for up to 2 players
        for (int i = 0; i < 2; i++)
        {
            _playerProfiles[i] = new PlayerSkillProfile(i);
            _recentPerformance[i] = new List<PerformanceMetric>();
            _aiSettings[i] = new AIAdaptationSettings();
        }
    }
    
    public void RecordMatchResult(int playerId, MatchResult result)
    {
        if (!_playerProfiles.ContainsKey(playerId))
            return;
            
        var profile = _playerProfiles[playerId];
        var performance = _recentPerformance[playerId];
        
        // Create performance metric
        var metric = new PerformanceMetric
        {
            Timestamp = DateTime.UtcNow,
            Won = result.Won,
            Damage = result.Damage,
            Hits = result.Hits,
            Blocks = result.Blocks,
            Parries = result.Parries,
            ComboCount = result.ComboCount,
            MaxComboLength = result.MaxComboLength,
            InputComplexity = result.InputComplexity,
            ReactionTime = result.AverageReactionTime,
            ConsistencyScore = result.ConsistencyScore
        };
        
        // Add to recent performance
        performance.Add(metric);
        if (performance.Count > PERFORMANCE_HISTORY_SIZE)
        {
            performance.RemoveAt(0);
        }
        
        // Update skill profile
        UpdateSkillProfile(playerId);
        
        GD.Print($"Recorded match result for Player {playerId}: {(result.Won ? "Win" : "Loss")}");
    }
    
    private void UpdateSkillProfile(int playerId)
    {
        var profile = _playerProfiles[playerId];
        var performance = _recentPerformance[playerId];
        
        if (performance.Count < 3)
            return; // Need more data
            
        // Calculate metrics
        float winRate = performance.Average(p => p.Won ? 1.0f : 0.0f);
        float avgInputComplexity = performance.Average(p => p.InputComplexity);
        float avgReactionTime = performance.Average(p => p.ReactionTime);
        float avgConsistency = performance.Average(p => p.ConsistencyScore);
        float avgComboLength = (float)performance.Average(p => p.MaxComboLength);
        
        // Update skill metrics with smoothing
        profile.WinRate = Mathf.Lerp(profile.WinRate, winRate, SKILL_ADJUSTMENT_RATE);
        profile.InputComplexity = Mathf.Lerp(profile.InputComplexity, avgInputComplexity, SKILL_ADJUSTMENT_RATE);
        profile.ReactionTime = Mathf.Lerp(profile.ReactionTime, avgReactionTime, SKILL_ADJUSTMENT_RATE);
        profile.Consistency = Mathf.Lerp(profile.Consistency, avgConsistency, SKILL_ADJUSTMENT_RATE);
        profile.ComboSkill = Mathf.Lerp(profile.ComboSkill, avgComboLength / 10.0f, SKILL_ADJUSTMENT_RATE);
        
        // Calculate overall skill level
        float oldSkillLevel = profile.OverallSkillLevel;
        CalculateOverallSkillLevel(profile);
        
        // Check for skill level changes
        var newSkillTier = DetermineSkillTier(profile.OverallSkillLevel);
        if (newSkillTier != profile.SkillTier)
        {
            profile.SkillTier = newSkillTier;
            EmitSignal(SignalName.SkillLevelChanged, playerId, (int)newSkillTier);
            GD.Print($"Player {playerId} skill tier changed to: {newSkillTier}");
        }
        
        // Adjust difficulty based on performance
        AdjustDifficulty(playerId);
        
        // Save updated profile
        SaveSkillProfile(playerId);
    }
    
    private void CalculateOverallSkillLevel(PlayerSkillProfile profile)
    {
        // Weighted combination of skill metrics
        float skillLevel = 0.0f;
        
        // Win rate contributes 30% (target is 55%, so scale around that)
        skillLevel += (profile.WinRate - 0.5f) * 2.0f * 0.3f;
        
        // Input complexity contributes 25%
        skillLevel += profile.InputComplexity * 0.25f;
        
        // Reaction speed contributes 20% (lower is better, so invert)
        float reactionScore = Math.Max(0, (300 - profile.ReactionTime) / 300);
        skillLevel += reactionScore * 0.2f;
        
        // Consistency contributes 15%
        skillLevel += profile.Consistency * 0.15f;
        
        // Combo skill contributes 10%
        skillLevel += profile.ComboSkill * 0.1f;
        
        // Clamp to 0-1 range
        profile.OverallSkillLevel = Mathf.Clamp(skillLevel, 0.0f, 1.0f);
    }
    
    private SkillLevel DetermineSkillTier(float skillLevel)
    {
        if (skillLevel < 0.2f) return SkillLevel.Beginner;
        if (skillLevel < 0.4f) return SkillLevel.Novice;
        if (skillLevel < 0.6f) return SkillLevel.Intermediate;
        if (skillLevel < 0.8f) return SkillLevel.Advanced;
        return SkillLevel.Expert;
    }
    
    private void AdjustDifficulty(int playerId)
    {
        var profile = _playerProfiles[playerId];
        var aiSettings = _aiSettings[playerId];
        
        // Calculate target difficulty based on skill level and recent performance
        float targetDifficulty = profile.OverallSkillLevel;
        
        // Adjust based on win rate to maintain target engagement
        float winRateDelta = profile.WinRate - WIN_RATE_TARGET;
        targetDifficulty += winRateDelta * 0.5f; // Moderate adjustment
        
        // Smooth the difficulty change
        float newDifficulty = Mathf.Lerp(aiSettings.CurrentDifficulty, targetDifficulty, DIFFICULTY_SMOOTHING);
        newDifficulty = Mathf.Clamp(newDifficulty, 0.1f, 1.0f);
        
        if (Math.Abs(newDifficulty - aiSettings.CurrentDifficulty) > 0.05f)
        {
            aiSettings.CurrentDifficulty = newDifficulty;
            UpdateAIBehavior(playerId, aiSettings);
            EmitSignal(SignalName.DifficultyAdjusted, playerId, newDifficulty);
            
            GD.Print($"Difficulty adjusted for Player {playerId}: {newDifficulty:F2} (Skill: {profile.OverallSkillLevel:F2}, WinRate: {profile.WinRate:F2})");
        }
    }
    
    private void UpdateAIBehavior(int playerId, AIAdaptationSettings settings)
    {
        // Adjust AI parameters based on difficulty level
        var difficulty = settings.CurrentDifficulty;
        
        // Input speed and accuracy
        settings.InputSpeed = 0.5f + (difficulty * 0.5f);
        settings.InputAccuracy = 0.7f + (difficulty * 0.3f);
        
        // Reaction times
        settings.ReactionTimeMin = Mathf.Lerp(300, 100, difficulty); // ms
        settings.ReactionTimeMax = Mathf.Lerp(500, 200, difficulty);
        
        // Strategic behavior
        settings.AggressionLevel = Mathf.Lerp(0.3f, 0.8f, difficulty);
        settings.DefensiveSkill = Mathf.Lerp(0.2f, 0.9f, difficulty);
        settings.ComboComplexity = Mathf.Lerp(0.1f, 1.0f, difficulty);
        
        // Adaptive mistakes - higher skill players get fewer AI errors
        settings.MistakeFrequency = Mathf.Lerp(0.2f, 0.05f, difficulty);
        
        // Special adaptations based on player tendencies
        var profile = _playerProfiles[playerId];
        
        // If player struggles with defense, reduce AI aggression
        if (profile.Consistency < 0.3f)
        {
            settings.AggressionLevel *= 0.7f;
            settings.MistakeFrequency *= 1.3f; // Give AI more openings
        }
        
        // If player is very aggressive, make AI more defensive
        if (profile.InputComplexity > 0.7f)
        {
            settings.DefensiveSkill *= 1.2f;
            settings.CounterAttackChance = 0.3f + (difficulty * 0.4f);
        }
        
        // Apply settings to AdaptiveAI if available
        if (AdaptiveAI.Instance != null)
        {
            AdaptiveAI.Instance.UpdateDifficultySettings(playerId, settings);
        }
    }
    
    public PlayerSkillProfile GetSkillProfile(int playerId)
    {
        return _playerProfiles.GetValueOrDefault(playerId);
    }
    
    public AIAdaptationSettings GetAISettings(int playerId)
    {
        return _aiSettings.GetValueOrDefault(playerId);
    }
    
    public void ResetPlayerProfile(int playerId)
    {
        if (_playerProfiles.ContainsKey(playerId))
        {
            _playerProfiles[playerId] = new PlayerSkillProfile(playerId);
            _recentPerformance[playerId].Clear();
            _aiSettings[playerId] = new AIAdaptationSettings();
            
            GD.Print($"Reset skill profile for Player {playerId}");
        }
    }
    
    private void SaveSkillProfile(int playerId)
    {
        var profile = _playerProfiles[playerId];
        var configFile = new ConfigFile();
        
        // Try to load existing config first
        configFile.Load("user://skill_profiles.cfg");
        
        var section = $"player_{playerId}";
        configFile.SetValue(section, "overall_skill", profile.OverallSkillLevel);
        configFile.SetValue(section, "win_rate", profile.WinRate);
        configFile.SetValue(section, "input_complexity", profile.InputComplexity);
        configFile.SetValue(section, "reaction_time", profile.ReactionTime);
        configFile.SetValue(section, "consistency", profile.Consistency);
        configFile.SetValue(section, "combo_skill", profile.ComboSkill);
        configFile.SetValue(section, "skill_tier", (int)profile.SkillTier);
        configFile.SetValue(section, "last_updated", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
        
        configFile.Save("user://skill_profiles.cfg");
    }
    
    private void LoadSkillProfiles()
    {
        var configFile = new ConfigFile();
        var err = configFile.Load("user://skill_profiles.cfg");
        
        if (err != Error.Ok)
            return;
            
        for (int playerId = 0; playerId < 2; playerId++)
        {
            var section = $"player_{playerId}";
            if (configFile.HasSection(section))
            {
                var profile = _playerProfiles[playerId];
                
                profile.OverallSkillLevel = configFile.GetValue(section, "overall_skill", 0.3f).AsSingle();
                profile.WinRate = configFile.GetValue(section, "win_rate", 0.5f).AsSingle();
                profile.InputComplexity = configFile.GetValue(section, "input_complexity", 0.2f).AsSingle();
                profile.ReactionTime = configFile.GetValue(section, "reaction_time", 250.0f).AsSingle();
                profile.Consistency = configFile.GetValue(section, "consistency", 0.3f).AsSingle();
                profile.ComboSkill = configFile.GetValue(section, "combo_skill", 0.1f).AsSingle();
                profile.SkillTier = (SkillLevel)configFile.GetValue(section, "skill_tier", 0).AsInt32();
                
                // Initialize AI settings based on loaded profile
                _aiSettings[playerId].CurrentDifficulty = profile.OverallSkillLevel;
                UpdateAIBehavior(playerId, _aiSettings[playerId]);
                
                GD.Print($"Loaded skill profile for Player {playerId}: {profile.SkillTier} ({profile.OverallSkillLevel:F2})");
            }
        }
    }
}

/// <summary>
/// Player skill profile tracking multiple metrics
/// </summary>
public class PlayerSkillProfile
{
    public int PlayerId { get; private set; }
    public float OverallSkillLevel { get; set; } = 0.3f; // 0-1 scale
    public float WinRate { get; set; } = 0.5f;
    public float InputComplexity { get; set; } = 0.2f; // Complexity of inputs used
    public float ReactionTime { get; set; } = 250.0f; // Average in milliseconds
    public float Consistency { get; set; } = 0.3f; // How consistent performance is
    public float ComboSkill { get; set; } = 0.1f; // Combo execution ability
    public SkillLevel SkillTier { get; set; } = SkillLevel.Beginner;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    
    public PlayerSkillProfile(int playerId)
    {
        PlayerId = playerId;
    }
}

/// <summary>
/// AI adaptation settings for dynamic difficulty
/// </summary>
public class AIAdaptationSettings
{
    public float CurrentDifficulty { get; set; } = 0.3f;
    public float InputSpeed { get; set; } = 0.7f;
    public float InputAccuracy { get; set; } = 0.8f;
    public float ReactionTimeMin { get; set; } = 200;
    public float ReactionTimeMax { get; set; } = 400;
    public float AggressionLevel { get; set; } = 0.5f;
    public float DefensiveSkill { get; set; } = 0.5f;
    public float ComboComplexity { get; set; } = 0.3f;
    public float MistakeFrequency { get; set; } = 0.15f;
    public float CounterAttackChance { get; set; } = 0.4f;
}

/// <summary>
/// Performance metrics for a single match
/// </summary>
public struct MatchResult
{
    public bool Won;
    public int Damage;
    public int Hits;
    public int Blocks;
    public int Parries;
    public int ComboCount;
    public int MaxComboLength;
    public float InputComplexity; // 0-1 scale
    public float AverageReactionTime; // milliseconds
    public float ConsistencyScore; // 0-1 scale
}

/// <summary>
/// Performance metric for tracking player improvement
/// </summary>
public struct PerformanceMetric
{
    public DateTime Timestamp;
    public bool Won;
    public int Damage;
    public int Hits;
    public int Blocks;
    public int Parries;
    public int ComboCount;
    public int MaxComboLength;
    public float InputComplexity;
    public float ReactionTime;
    public float ConsistencyScore;
}

/// <summary>
/// Skill level tiers for matchmaking and progression
/// </summary>
public enum SkillLevel
{
    Beginner,
    Novice,
    Intermediate,
    Advanced,
    Expert
}