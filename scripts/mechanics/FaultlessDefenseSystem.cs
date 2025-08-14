using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Faultless Defense System inspired by Guilty Gear Accent Core
/// Complements the existing parry system with enhanced blocking mechanics
/// </summary>
public partial class FaultlessDefenseSystem : Node
{
    public static FaultlessDefenseSystem Instance { get; private set; }
    
    public enum FaultlessDefenseType
    {
        Normal,           // Regular blocking (existing system)
        Faultless,        // Enhanced blocking with meter cost
        InstantBlock,     // Frame-perfect block with benefits
        PushBlockExtend   // Extended pushback for spacing control
    }
    
    private Dictionary<int, PlayerFDState> _playerFDStates = new();
    
    // Constants
    private const int FD_METER_COST_PER_FRAME = 2; // Meter cost per frame of FD
    private const int INSTANT_BLOCK_WINDOW = 2; // Frame window for instant block
    private const int INSTANT_BLOCK_METER_GAIN = 8; // Meter reward for instant block
    private const float FD_PUSHBACK_MULTIPLIER = 2.5f; // Increased pushback
    private const float FD_CHIP_REDUCTION = 0.8f; // 80% chip damage reduction
    
    [Signal]
    public delegate void FaultlessDefenseActivatedEventHandler(int playerId, FaultlessDefenseType type);
    
    [Signal]
    public delegate void InstantBlockPerformedEventHandler(int playerId, int meterGained);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializePlayers();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize FD states for players
    /// </summary>
    private void InitializePlayers()
    {
        for (int i = 0; i < 2; i++)
        {
            _playerFDStates[i] = new PlayerFDState
            {
                PlayerId = i,
                IsFDActive = false,
                FDDuration = 0,
                LastBlockFrame = -1
            };
        }
    }
    
    /// <summary>
    /// Process Faultless Defense attempt
    /// </summary>
    public FaultlessDefenseType ProcessFDAttempt(Character defender, Character attacker, bool holdingFD, int framesSinceAttackStart)
    {
        var state = _playerFDStates[defender.PlayerId];
        
        // Check for instant block first (frame-perfect timing)
        if (framesSinceAttackStart <= INSTANT_BLOCK_WINDOW && holdingFD)
        {
            return PerformInstantBlock(defender, attacker, state);
        }
        
        // Check for faultless defense
        if (holdingFD && defender.Meter >= FD_METER_COST_PER_FRAME)
        {
            return PerformFaultlessDefense(defender, attacker, state);
        }
        
        // Check for push block extend (when releasing FD after holding)
        if (!holdingFD && state.IsFDActive)
        {
            return PerformPushBlockExtend(defender, attacker, state);
        }
        
        // Default to normal defense (handled by ParryDefendSystem)
        state.IsFDActive = false;
        return FaultlessDefenseType.Normal;
    }
    
    /// <summary>
    /// Perform instant block (frame-perfect FD activation)
    /// </summary>
    private FaultlessDefenseType PerformInstantBlock(Character defender, Character attacker, PlayerFDState state)
    {
        defender.ChangeState(CharacterState.Blocking);
        
        // Instant block benefits:
        // - No chip damage
        // - Meter gain instead of loss
        // - Increased pushback
        // - Frame advantage
        
        defender.GainMeter(INSTANT_BLOCK_METER_GAIN);
        
        // Enhanced pushback
        ApplyEnhancedPushback(defender, attacker, FD_PUSHBACK_MULTIPLIER * 1.5f);
        
        // Frame advantage (integrate with existing parry system for consistency)
        if (ParryDefendSystem.Instance != null)
        {
            // Trigger parry system for frame advantage calculation
            ParryDefendSystem.Instance.AttemptDefense(defender, attacker, true, INSTANT_BLOCK_WINDOW);
        }
        
        // Visual effect
        CreateFDEffect(defender.GlobalPosition, FaultlessDefenseType.InstantBlock);
        
        state.LastBlockFrame = defender.CurrentFrame;
        
        EmitSignal(SignalName.InstantBlockPerformed, defender.PlayerId, INSTANT_BLOCK_METER_GAIN);
        EmitSignal(SignalName.FaultlessDefenseActivated, defender.PlayerId, (int)FaultlessDefenseType.InstantBlock);
        
        GD.Print($"{defender.CharacterId} performed INSTANT BLOCK!");
        return FaultlessDefenseType.InstantBlock;
    }
    
    /// <summary>
    /// Perform faultless defense (ongoing meter consumption)
    /// </summary>
    private FaultlessDefenseType PerformFaultlessDefense(Character defender, Character attacker, PlayerFDState state)
    {
        // Consume meter per frame
        defender.ConsumeMeter(FD_METER_COST_PER_FRAME);
        
        defender.ChangeState(CharacterState.Blocking);
        
        // Faultless Defense benefits:
        // - Greatly reduced chip damage
        // - Increased pushback for spacing control
        // - No frame disadvantage
        
        // Apply enhanced pushback
        ApplyEnhancedPushback(defender, attacker, FD_PUSHBACK_MULTIPLIER);
        
        // Reduce chip damage significantly
        // (This would integrate with the existing parry system's chip calculation)
        
        state.IsFDActive = true;
        state.FDDuration++;
        
        // Visual effect
        if (state.FDDuration == 1) // First frame only
        {
            CreateFDEffect(defender.GlobalPosition, FaultlessDefenseType.Faultless);
            EmitSignal(SignalName.FaultlessDefenseActivated, defender.PlayerId, (int)FaultlessDefenseType.Faultless);
        }
        
        return FaultlessDefenseType.Faultless;
    }
    
    /// <summary>
    /// Perform push block extend (spacing control tool)
    /// </summary>
    private FaultlessDefenseType PerformPushBlockExtend(Character defender, Character attacker, PlayerFDState state)
    {
        // Extended pushback when releasing FD
        ApplyEnhancedPushback(defender, attacker, FD_PUSHBACK_MULTIPLIER * 2.0f);
        
        // Reset FD state
        state.IsFDActive = false;
        state.FDDuration = 0;
        
        // Visual effect
        CreateFDEffect(defender.GlobalPosition, FaultlessDefenseType.PushBlockExtend);
        
        EmitSignal(SignalName.FaultlessDefenseActivated, defender.PlayerId, (int)FaultlessDefenseType.PushBlockExtend);
        
        GD.Print($"{defender.CharacterId} performed push block extend!");
        return FaultlessDefenseType.PushBlockExtend;
    }
    
    /// <summary>
    /// Apply enhanced pushback for spacing control
    /// </summary>
    private void ApplyEnhancedPushback(Character defender, Character attacker, float multiplier)
    {
        Vector2 pushDirection = (defender.GlobalPosition - attacker.GlobalPosition).Normalized();
        float pushDistance = 40f * multiplier;
        
        // Push both characters apart (defender gets more distance)
        defender.Position += pushDirection * pushDistance;
        attacker.Position -= pushDirection * (pushDistance * 0.5f);
        
        GD.Print($"Enhanced pushback applied: {pushDistance} units");
    }
    
    /// <summary>
    /// Create visual effects for FD actions
    /// </summary>
    private void CreateFDEffect(Vector2 position, FaultlessDefenseType type)
    {
        Color effectColor = type switch
        {
            FaultlessDefenseType.InstantBlock => Colors.Gold,
            FaultlessDefenseType.Faultless => Colors.LightBlue,
            FaultlessDefenseType.PushBlockExtend => Colors.Green,
            _ => Colors.White
        };
        
        string effectName = type switch
        {
            FaultlessDefenseType.InstantBlock => "INSTANT BLOCK!",
            FaultlessDefenseType.Faultless => "FAULTLESS DEFENSE",
            FaultlessDefenseType.PushBlockExtend => "PUSH BLOCK",
            _ => ""
        };
        
        GD.Print($"FD Effect: {effectName} at {position}");
        
        // In real implementation, this would create:
        // - Barrier/shield visual effects
        // - Pushback motion lines
        // - Screen flash for instant block
        // - Sound effects
    }
    
    /// <summary>
    /// Calculate chip damage reduction for FD
    /// </summary>
    public float GetChipDamageReduction(int playerId)
    {
        var state = _playerFDStates.GetValueOrDefault(playerId);
        
        if (state?.IsFDActive == true)
        {
            return FD_CHIP_REDUCTION; // 80% reduction
        }
        
        return 0f; // No reduction for normal blocking
    }
    
    /// <summary>
    /// Check if player can use Faultless Defense
    /// </summary>
    public bool CanUseFaultlessDefense(Character character)
    {
        var state = _playerFDStates.GetValueOrDefault(character.PlayerId);
        
        return character.Meter >= FD_METER_COST_PER_FRAME && 
               (character.CurrentState == CharacterState.Idle ||
                character.CurrentState == CharacterState.Walking ||
                character.CurrentState == CharacterState.Crouching ||
                character.CurrentState == CharacterState.Blocking);
    }
    
    /// <summary>
    /// Get FD state for player
    /// </summary>
    public PlayerFDState GetFDState(int playerId)
    {
        return _playerFDStates.GetValueOrDefault(playerId, new PlayerFDState());
    }
    
    /// <summary>
    /// Reset FD state (called when character is hit or round ends)
    /// </summary>
    public void ResetFDState(int playerId)
    {
        if (_playerFDStates.ContainsKey(playerId))
        {
            var state = _playerFDStates[playerId];
            state.IsFDActive = false;
            state.FDDuration = 0;
            state.LastBlockFrame = -1;
        }
    }
    
    /// <summary>
    /// Check if FD system is enabled
    /// </summary>
    public bool IsFDEnabled()
    {
        return BalanceManager.Instance?.GetCurrentConfig()?.SystemAdjustments?.MeterSystem?.Enabled ?? true;
    }
}

/// <summary>
/// Faultless Defense state for a player
/// </summary>
public class PlayerFDState
{
    public int PlayerId { get; set; }
    public bool IsFDActive { get; set; } = false;
    public int FDDuration { get; set; } = 0; // Frames of continuous FD
    public int LastBlockFrame { get; set; } = -1; // Frame of last block attempt
}