using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Adaptive AI Training Mode that learns from player behavior
/// </summary>
public partial class AdaptiveAI : Node
{
    public static AdaptiveAI Instance { get; private set; }
    
    private Dictionary<string, PlayerPattern> _playerPatterns = new();
    private AIBehaviorData _currentBehavior;
    private float _adaptationRate = 0.1f;
    
    private const int PATTERN_MEMORY_SIZE = 100; // Remember last 100 interactions
    private const float COUNTER_THRESHOLD = 0.6f; // When to start countering patterns
    
    [Signal]
    public delegate void AIAdaptedEventHandler(string patternDetected, string counterStrategy);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeAI();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize AI behavior data
    /// </summary>
    private void InitializeAI()
    {
        _currentBehavior = new AIBehaviorData
        {
            AggressionLevel = 0.5f,
            DefensiveLevel = 0.5f,
            TechnicalLevel = 0.5f,
            AdaptationLevel = 0.5f
        };
        
        GD.Print("Adaptive AI initialized");
    }
    
    /// <summary>
    /// Record player action for pattern analysis
    /// </summary>
    public void RecordPlayerAction(string playerId, PlayerAction action)
    {
        if (!_playerPatterns.ContainsKey(playerId))
        {
            _playerPatterns[playerId] = new PlayerPattern();
        }
        
        var pattern = _playerPatterns[playerId];
        pattern.RecordAction(action);
        
        // Analyze patterns when we have enough data
        if (pattern.ActionHistory.Count >= 10)
        {
            AnalyzeAndAdapt(playerId, pattern);
        }
    }
    
    /// <summary>
    /// Analyze player patterns and adapt AI behavior
    /// </summary>
    private void AnalyzeAndAdapt(string playerId, PlayerPattern pattern)
    {
        // Detect common patterns
        var detectedPatterns = DetectPatterns(pattern);
        
        foreach (var detectedPattern in detectedPatterns)
        {
            if (detectedPattern.Frequency > COUNTER_THRESHOLD)
            {
                string counterStrategy = DevelopCounterStrategy(detectedPattern);
                AdaptBehavior(detectedPattern, counterStrategy);
                
                EmitSignal(SignalName.AIAdapted, detectedPattern.Type, counterStrategy);
                
                GD.Print($"AI adapted to counter {detectedPattern.Type} with {counterStrategy}");
            }
        }
    }
    
    /// <summary>
    /// Detect patterns in player behavior
    /// </summary>
    private List<BehaviorPattern> DetectPatterns(PlayerPattern pattern)
    {
        var patterns = new List<BehaviorPattern>();
        
        // Check for wake-up patterns
        var wakeupPattern = AnalyzeWakeupBehavior(pattern);
        if (wakeupPattern != null) patterns.Add(wakeupPattern);
        
        // Check for neutral game patterns
        var neutralPattern = AnalyzeNeutralBehavior(pattern);
        if (neutralPattern != null) patterns.Add(neutralPattern);
        
        // Check for defensive patterns
        var defensivePattern = AnalyzeDefensiveBehavior(pattern);
        if (defensivePattern != null) patterns.Add(defensivePattern);
        
        // Check for offense patterns
        var offensivePattern = AnalyzeOffensiveBehavior(pattern);
        if (offensivePattern != null) patterns.Add(offensivePattern);
        
        return patterns;
    }
    
    /// <summary>
    /// Analyze wake-up behavior patterns
    /// </summary>
    private BehaviorPattern AnalyzeWakeupBehavior(PlayerPattern pattern)
    {
        var wakeupActions = pattern.ActionHistory
            .Where(a => a.Context == ActionContext.WakeUp)
            .ToList();
        
        if (wakeupActions.Count < 5) return null;
        
        // Find most common wake-up option
        var mostCommon = wakeupActions
            .GroupBy(a => a.Type)
            .OrderByDescending(g => g.Count())
            .First();
        
        float frequency = (float)mostCommon.Count() / wakeupActions.Count;
        
        return new BehaviorPattern
        {
            Type = $"WakeUp_{mostCommon.Key}",
            Frequency = frequency,
            Context = ActionContext.WakeUp,
            ActionType = mostCommon.Key
        };
    }
    
    /// <summary>
    /// Analyze neutral game patterns
    /// </summary>
    private BehaviorPattern AnalyzeNeutralBehavior(PlayerPattern pattern)
    {
        var neutralActions = pattern.ActionHistory
            .Where(a => a.Context == ActionContext.Neutral)
            .ToList();
        
        if (neutralActions.Count < 10) return null;
        
        // Check for approach patterns
        var approaches = neutralActions.Where(a => a.Type.Contains("forward")).Count();
        var total = neutralActions.Count;
        
        if (approaches > total * 0.7f) // Very aggressive approach
        {
            return new BehaviorPattern
            {
                Type = "Neutral_Aggressive",
                Frequency = (float)approaches / total,
                Context = ActionContext.Neutral,
                ActionType = "approach"
            };
        }
        
        return null;
    }
    
    /// <summary>
    /// Analyze defensive behavior patterns
    /// </summary>
    private BehaviorPattern AnalyzeDefensiveBehavior(PlayerPattern pattern)
    {
        var defensiveActions = pattern.ActionHistory
            .Where(a => a.Context == ActionContext.Defense)
            .ToList();
        
        if (defensiveActions.Count < 5) return null;
        
        var blockCount = defensiveActions.Count(a => a.Type == "block");
        var parryCount = defensiveActions.Count(a => a.Type == "parry");
        
        if (blockCount > parryCount * 2) // Prefers blocking
        {
            return new BehaviorPattern
            {
                Type = "Defense_Block_Heavy",
                Frequency = (float)blockCount / defensiveActions.Count,
                Context = ActionContext.Defense,
                ActionType = "block"
            };
        }
        
        return null;
    }
    
    /// <summary>
    /// Analyze offensive behavior patterns
    /// </summary>
    private BehaviorPattern AnalyzeOffensiveBehavior(PlayerPattern pattern)
    {
        var offensiveActions = pattern.ActionHistory
            .Where(a => a.Context == ActionContext.Offense)
            .ToList();
        
        if (offensiveActions.Count < 5) return null;
        
        var grabCount = offensiveActions.Count(a => a.Type.Contains("grab"));
        var strikeCount = offensiveActions.Count(a => !a.Type.Contains("grab"));
        
        if (grabCount > strikeCount * 0.3f) // Uses grabs frequently
        {
            return new BehaviorPattern
            {
                Type = "Offense_Grab_Heavy",
                Frequency = (float)grabCount / offensiveActions.Count,
                Context = ActionContext.Offense,
                ActionType = "grab"
            };
        }
        
        return null;
    }
    
    /// <summary>
    /// Develop counter strategy for detected pattern
    /// </summary>
    private string DevelopCounterStrategy(BehaviorPattern pattern)
    {
        return pattern.Type switch
        {
            "WakeUp_Block" => "MeteringPressure", // Apply safe pressure
            "WakeUp_Reversal" => "BaitAndPunish", // Bait reversals
            "Neutral_Aggressive" => "SpaceControl", // Control space, anti-air
            "Defense_Block_Heavy" => "ThrowMixup", // Mix in throws
            "Offense_Grab_Heavy" => "BackDash", // Create distance, use pokes
            _ => "Balanced" // Default balanced approach
        };
    }
    
    /// <summary>
    /// Adapt AI behavior based on detected patterns
    /// </summary>
    private void AdaptBehavior(BehaviorPattern pattern, string counterStrategy)
    {
        switch (counterStrategy)
        {
            case "MeteringPressure":
                _currentBehavior.AggressionLevel = Mathf.Min(1.0f, _currentBehavior.AggressionLevel + _adaptationRate);
                _currentBehavior.DefensiveLevel = Mathf.Max(0.0f, _currentBehavior.DefensiveLevel - _adaptationRate);
                break;
                
            case "BaitAndPunish":
                _currentBehavior.TechnicalLevel = Mathf.Min(1.0f, _currentBehavior.TechnicalLevel + _adaptationRate);
                _currentBehavior.AggressionLevel = Mathf.Max(0.0f, _currentBehavior.AggressionLevel - _adaptationRate);
                break;
                
            case "SpaceControl":
                _currentBehavior.DefensiveLevel = Mathf.Min(1.0f, _currentBehavior.DefensiveLevel + _adaptationRate);
                break;
                
            case "ThrowMixup":
                _currentBehavior.TechnicalLevel = Mathf.Min(1.0f, _currentBehavior.TechnicalLevel + _adaptationRate);
                break;
                
            case "BackDash":
                _currentBehavior.DefensiveLevel = Mathf.Min(1.0f, _currentBehavior.DefensiveLevel + _adaptationRate);
                _currentBehavior.AggressionLevel = Mathf.Max(0.0f, _currentBehavior.AggressionLevel - _adaptationRate);
                break;
        }
        
        _currentBehavior.AdaptationLevel = Mathf.Min(1.0f, _currentBehavior.AdaptationLevel + 0.05f);
    }
    
    /// <summary>
    /// Get AI decision based on current behavior
    /// </summary>
    public string GetAIDecision(ActionContext context)
    {
        var random = new Random();
        
        return context switch
        {
            ActionContext.Neutral => GetNeutralDecision(random),
            ActionContext.Offense => GetOffensiveDecision(random),
            ActionContext.Defense => GetDefensiveDecision(random),
            ActionContext.WakeUp => GetWakeUpDecision(random),
            _ => "idle"
        };
    }
    
    private string GetNeutralDecision(Random random)
    {
        if (random.NextSingle() < _currentBehavior.AggressionLevel)
            return "approach";
        else if (random.NextSingle() < _currentBehavior.DefensiveLevel)
            return "maintain_distance";
        else
            return "neutral_poke";
    }
    
    private string GetOffensiveDecision(Random random)
    {
        if (random.NextSingle() < _currentBehavior.TechnicalLevel)
            return "complex_mixup";
        else if (random.NextSingle() < _currentBehavior.AggressionLevel)
            return "pressure_continue";
        else
            return "safe_pressure";
    }
    
    private string GetDefensiveDecision(Random random)
    {
        if (random.NextSingle() < _currentBehavior.TechnicalLevel)
            return "parry_attempt";
        else if (random.NextSingle() < _currentBehavior.DefensiveLevel)
            return "block";
        else
            return "escape_attempt";
    }
    
    private string GetWakeUpDecision(Random random)
    {
        if (random.NextSingle() < _currentBehavior.AggressionLevel)
            return "reversal";
        else if (random.NextSingle() < _currentBehavior.DefensiveLevel)
            return "block";
        else
            return "backdash";
    }
    
    /// <summary>
    /// Reset AI learning for new session
    /// </summary>
    public void ResetLearning()
    {
        _playerPatterns.Clear();
        InitializeAI();
        GD.Print("AI learning reset");
    }
    
    /// <summary>
    /// Update AI difficulty settings from Dynamic Difficulty System
    /// </summary>
    public void UpdateDifficultySettings(int playerId, object settings)
    {
        // For now, just log the difficulty update
        // In a full implementation, this would adjust AI behavior parameters
        GD.Print($"AI difficulty updated for player {playerId}");
    }
    
    /// <summary>
    /// Get current AI behavior for display
    /// </summary>
    public AIBehaviorData GetCurrentBehavior() => _currentBehavior;
}

// Data structures for AI system
public class PlayerPattern
{
    public List<PlayerAction> ActionHistory { get; set; } = new();
    
    public void RecordAction(PlayerAction action)
    {
        ActionHistory.Add(action);
        
        // Keep only recent history
        if (ActionHistory.Count > 100)
        {
            ActionHistory.RemoveAt(0);
        }
    }
}

public class PlayerAction
{
    public string Type { get; set; } = "";
    public ActionContext Context { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public bool WasSuccessful { get; set; }
}

public class BehaviorPattern
{
    public string Type { get; set; } = "";
    public float Frequency { get; set; }
    public ActionContext Context { get; set; }
    public string ActionType { get; set; } = "";
}

public class AIBehaviorData
{
    public float AggressionLevel { get; set; } = 0.5f;
    public float DefensiveLevel { get; set; } = 0.5f;
    public float TechnicalLevel { get; set; } = 0.5f;
    public float AdaptationLevel { get; set; } = 0.5f;
}

public enum ActionContext
{
    Neutral,
    Offense,
    Defense,
    WakeUp,
    Combo
}