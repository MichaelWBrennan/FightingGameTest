using Godot;
using System;

/// <summary>
/// Parry and Just Defend system inspired by Third Strike and Garou
/// </summary>
public partial class ParryDefendSystem : Node
{
    public static ParryDefendSystem Instance { get; private set; }
    
    public enum DefenseType
    {
        Block,      // Normal block
        JustDefend, // Just frame defense (Garou style)
        Parry,      // Third Strike style parry
        PerfectParry // Frame 1 parry with additional benefits
    }
    
    private const int PARRY_WINDOW_FRAMES = 6; // Standard parry window
    private const int JUST_DEFEND_WINDOW_FRAMES = 3; // Tighter just defend window
    private const int PERFECT_PARRY_WINDOW_FRAMES = 1; // Single frame perfect parry
    
    private const int PARRY_FRAME_ADVANTAGE = 8;
    private const int JUST_DEFEND_METER_GAIN = 15;
    private const int PERFECT_PARRY_METER_GAIN = 25;
    
    [Signal]
    public delegate void DefensePerformedEventHandler(DefenseType type, int meterGained);
    
    [Signal]
    public delegate void ParrySuccessEventHandler(Character defender, Character attacker);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Attempt defensive action
    /// </summary>
    public DefenseType AttemptDefense(Character defender, Character attacker, bool inputJustPressed, int frameWindow)
    {
        if (!CanAttemptDefense(defender)) return DefenseType.Block;
        
        // Check for perfect parry (frame 1)
        if (frameWindow <= PERFECT_PARRY_WINDOW_FRAMES && inputJustPressed)
        {
            return PerformPerfectParry(defender, attacker);
        }
        
        // Check for regular parry
        if (frameWindow <= PARRY_WINDOW_FRAMES && inputJustPressed)
        {
            return PerformParry(defender, attacker);
        }
        
        // Check for just defend
        if (frameWindow <= JUST_DEFEND_WINDOW_FRAMES && inputJustPressed)
        {
            return PerformJustDefend(defender, attacker);
        }
        
        // Default to normal block
        return PerformBlock(defender, attacker);
    }
    
    /// <summary>
    /// Check if character can attempt defense
    /// </summary>
    private bool CanAttemptDefense(Character character)
    {
        return character.CurrentState == CharacterState.Idle || 
               character.CurrentState == CharacterState.Walking ||
               character.CurrentState == CharacterState.Crouching ||
               character.CurrentState == CharacterState.Blocking;
    }
    
    /// <summary>
    /// Perform perfect parry (frame 1)
    /// </summary>
    private DefenseType PerformPerfectParry(Character defender, Character attacker)
    {
        defender.ChangeState(CharacterState.Blocking);
        defender.GainMeter(PERFECT_PARRY_METER_GAIN);
        
        // Perfect parry gives maximum advantage
        ApplyFrameAdvantage(defender, PARRY_FRAME_ADVANTAGE + 4);
        
        // Visual and audio feedback
        CreateParryEffects(defender.GlobalPosition, DefenseType.PerfectParry);
        
        // Track for telemetry
        var stats = defender.GetMatchStats();
        stats.ParriesPerformed++;
        
        EmitSignal(SignalName.DefensePerformed, (int)DefenseType.PerfectParry, PERFECT_PARRY_METER_GAIN);
        EmitSignal(SignalName.ParrySuccess, defender, attacker);
        
        GD.Print($"{defender.CharacterId} performed PERFECT PARRY!");
        return DefenseType.PerfectParry;
    }
    
    /// <summary>
    /// Perform regular parry
    /// </summary>
    private DefenseType PerformParry(Character defender, Character attacker)
    {
        defender.ChangeState(CharacterState.Blocking);
        defender.GainMeter(JUST_DEFEND_METER_GAIN);
        
        // Standard parry advantage
        ApplyFrameAdvantage(defender, PARRY_FRAME_ADVANTAGE);
        
        // Visual and audio feedback
        CreateParryEffects(defender.GlobalPosition, DefenseType.Parry);
        
        // Track for telemetry
        var stats = defender.GetMatchStats();
        stats.ParriesPerformed++;
        
        EmitSignal(SignalName.DefensePerformed, (int)DefenseType.Parry, JUST_DEFEND_METER_GAIN);
        EmitSignal(SignalName.ParrySuccess, defender, attacker);
        
        GD.Print($"{defender.CharacterId} performed parry!");
        return DefenseType.Parry;
    }
    
    /// <summary>
    /// Perform just defend
    /// </summary>
    private DefenseType PerformJustDefend(Character defender, Character attacker)
    {
        defender.ChangeState(CharacterState.Blocking);
        defender.GainMeter(JUST_DEFEND_METER_GAIN);
        
        // Just defend gives moderate advantage and reduced chip damage
        ApplyFrameAdvantage(defender, PARRY_FRAME_ADVANTAGE / 2);
        
        // Reduce chip damage to minimal
        ReduceChipDamage(defender, 0.1f);
        
        // Visual feedback
        CreateParryEffects(defender.GlobalPosition, DefenseType.JustDefend);
        
        EmitSignal(SignalName.DefensePerformed, (int)DefenseType.JustDefend, JUST_DEFEND_METER_GAIN);
        
        GD.Print($"{defender.CharacterId} performed just defend!");
        return DefenseType.JustDefend;
    }
    
    /// <summary>
    /// Perform normal block
    /// </summary>
    private DefenseType PerformBlock(Character defender, Character attacker)
    {
        defender.ChangeState(CharacterState.Blocking);
        
        // Normal block - no special advantages
        ApplyChipDamage(defender, 0.25f); // 25% of damage as chip
        
        EmitSignal(SignalName.DefensePerformed, (int)DefenseType.Block, 0);
        
        return DefenseType.Block;
    }
    
    /// <summary>
    /// Apply frame advantage to defender
    /// </summary>
    private void ApplyFrameAdvantage(Character character, int frames)
    {
        // In a real implementation, this would modify the character's state timing
        GD.Print($"{character.CharacterId} gains {frames} frame advantage");
    }
    
    /// <summary>
    /// Apply chip damage
    /// </summary>
    private void ApplyChipDamage(Character character, float chipPercent)
    {
        // Calculate chip damage based on incoming attack
        int chipDamage = (int)(50 * chipPercent); // Placeholder calculation
        
        if (chipDamage > 0)
        {
            character.TakeDamage(chipDamage);
            GD.Print($"{character.CharacterId} takes {chipDamage} chip damage");
        }
    }
    
    /// <summary>
    /// Reduce chip damage
    /// </summary>
    private void ReduceChipDamage(Character character, float reductionPercent)
    {
        int reducedChip = (int)(50 * reductionPercent);
        
        if (reducedChip > 0)
        {
            character.TakeDamage(reducedChip);
            GD.Print($"{character.CharacterId} takes reduced chip: {reducedChip}");
        }
    }
    
    /// <summary>
    /// Create visual effects for defensive actions
    /// </summary>
    private void CreateParryEffects(Vector2 position, DefenseType type)
    {
        Color effectColor = type switch
        {
            DefenseType.PerfectParry => Colors.Gold,
            DefenseType.Parry => Colors.Blue,
            DefenseType.JustDefend => Colors.Green,
            DefenseType.Block => Colors.Gray,
            _ => Colors.White
        };
        
        string effectName = type switch
        {
            DefenseType.PerfectParry => "PERFECT!",
            DefenseType.Parry => "PARRY!",
            DefenseType.JustDefend => "JUST DEFEND!",
            DefenseType.Block => "BLOCK",
            _ => ""
        };
        
        GD.Print($"Defense Effect: {effectName} at {position}");
        
        // In a real implementation, this would create visual and audio effects
        // - Screen flash for perfect parry
        // - Particle effects
        // - Sound effects
        // - Slow motion for dramatic parries
    }
    
    /// <summary>
    /// Get defense window for character based on their archetype
    /// </summary>
    public int GetDefenseWindow(Character character, DefenseType type)
    {
        // Some archetypes might have better defensive options
        float multiplier = character.Data?.Archetype switch
        {
            "technical" => 1.2f, // Technical characters get slightly larger windows
            "grappler" => 0.8f,  // Grapplers have tighter windows
            _ => 1.0f
        };
        
        int baseWindow = type switch
        {
            DefenseType.PerfectParry => PERFECT_PARRY_WINDOW_FRAMES,
            DefenseType.Parry => PARRY_WINDOW_FRAMES,
            DefenseType.JustDefend => JUST_DEFEND_WINDOW_FRAMES,
            _ => 0
        };
        
        return (int)(baseWindow * multiplier);
    }
    
    /// <summary>
    /// Check if parry/defend systems are enabled
    /// </summary>
    public bool IsParryEnabled()
    {
        // Could be disabled by balance config for certain game modes
        return true;
    }
    
    /// <summary>
    /// Calculate parry success rate for balancing
    /// </summary>
    public float CalculateParrySuccessRate(Character character)
    {
        var stats = character.GetMatchStats();
        int totalAttempts = stats.ParriesPerformed + 50; // Estimate total defensive attempts
        
        return totalAttempts > 0 ? (float)stats.ParriesPerformed / totalAttempts : 0f;
    }
}