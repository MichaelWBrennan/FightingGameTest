using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Oki/Wake-up System inspired by 3rd Strike and Accent Core
/// Handles knockdown timing, safe jump setups, and wake-up pressure
/// </summary>
public partial class OkiWakeupSystem : Node
{
    public static OkiWakeupSystem Instance { get; private set; }
    
    public enum WakeupOption
    {
        Normal,           // Standard wake-up (most common)
        QuickRise,        // Faster wake-up with vulnerability
        DelayedWakeup,    // Slower wake-up to disrupt timing
        WakeupAttack,     // Invincible wake-up attack
        WakeupThrow,      // Wake-up command grab
        TechRoll          // Roll on knockdown to change position
    }
    
    public enum OkiSetup
    {
        SafeJump,         // Timed jump attack that's safe on reversal
        ThrowSetup,       // Meaty throw timing
        MixupSetup,       // High/low mix-up on wake-up
        FrameTrap,        // Bait wake-up attacks for counter hit
        CrossupSetup      // Ambiguous side mixup
    }
    
    private Dictionary<int, PlayerOkiState> _playerOkiStates = new();
    
    // Timing constants (in frames)
    private const int NORMAL_WAKEUP_FRAMES = 25;
    private const int QUICK_RISE_FRAMES = 18;
    private const int DELAYED_WAKEUP_FRAMES = 35;
    private const int TECH_ROLL_FRAMES = 20;
    
    // Wake-up invincibility
    private const int WAKEUP_INVUL_FRAMES = 4;
    private const int WAKEUP_ATTACK_INVUL_FRAMES = 8;
    
    // Meter costs
    private const int WAKEUP_ATTACK_COST = 25;
    private const int TECH_ROLL_COST = 15;
    
    [Signal]
    public delegate void KnockdownOccurredEventHandler(int playerId, Vector2 position, string knockdownType);
    
    [Signal]
    public delegate void WakeupAttemptedEventHandler(int playerId, WakeupOption option);
    
    [Signal]
    public delegate void OkiSetupDetectedEventHandler(int attackerPlayerId, OkiSetup setup, int advantage);
    
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
    
    public override void _Process(double delta)
    {
        UpdateOkiStates();
    }
    
    /// <summary>
    /// Initialize oki states for players
    /// </summary>
    private void InitializePlayers()
    {
        for (int i = 0; i < 2; i++)
        {
            _playerOkiStates[i] = new PlayerOkiState
            {
                PlayerId = i,
                IsKnockedDown = false,
                WakeupTimer = 0,
                WakeupOption = WakeupOption.Normal,
                KnockdownPosition = Vector2.Zero
            };
        }
    }
    
    /// <summary>
    /// Update oki states and wake-up timers
    /// </summary>
    private void UpdateOkiStates()
    {
        foreach (var state in _playerOkiStates.Values)
        {
            if (state.IsKnockedDown && state.WakeupTimer > 0)
            {
                state.WakeupTimer--;
                
                if (state.WakeupTimer <= 0)
                {
                    ProcessWakeup(state);
                }
            }
        }
    }
    
    /// <summary>
    /// Initiate knockdown for player
    /// </summary>
    public void InitiateKnockdown(Character character, string knockdownType, Vector2 knockdownForce)
    {
        var state = _playerOkiStates[character.PlayerId];
        
        character.ChangeState(CharacterState.Knocked);
        
        state.IsKnockedDown = true;
        state.KnockdownPosition = character.GlobalPosition;
        state.WakeupTimer = NORMAL_WAKEUP_FRAMES; // Default timing
        state.WakeupOption = WakeupOption.Normal;
        
        // Apply knockdown force/movement
        ApplyKnockdownMovement(character, knockdownForce);
        
        EmitSignal(SignalName.KnockdownOccurred, character.PlayerId, character.GlobalPosition, knockdownType);
        
        GD.Print($"{character.CharacterId} knocked down with {knockdownType}");
    }
    
    /// <summary>
    /// Attempt wake-up option
    /// </summary>
    public bool TryWakeupOption(Character character, WakeupOption option)
    {
        var state = _playerOkiStates[character.PlayerId];
        
        if (!state.IsKnockedDown) return false;
        if (!CanPerformWakeupOption(character, option)) return false;
        
        // Set wake-up option and adjust timing
        state.WakeupOption = option;
        AdjustWakeupTiming(state, option);
        
        // Consume meter if required
        int meterCost = GetWakeupCost(option);
        if (meterCost > 0)
        {
            character.ConsumeMeter(meterCost);
        }
        
        EmitSignal(SignalName.WakeupAttempted, character.PlayerId, (int)option);
        
        GD.Print($"{character.CharacterId} selected wake-up option: {option}");
        return true;
    }
    
    /// <summary>
    /// Check if wake-up option is available
    /// </summary>
    private bool CanPerformWakeupOption(Character character, WakeupOption option)
    {
        int meterCost = GetWakeupCost(option);
        if (character.Meter < meterCost) return false;
        
        return option switch
        {
            WakeupOption.Normal => true,
            WakeupOption.QuickRise => true,
            WakeupOption.DelayedWakeup => true,
            WakeupOption.WakeupAttack => character.Data?.Moves?.Specials?.ContainsKey("wakeupAttack") ?? false,
            WakeupOption.WakeupThrow => character.Data?.Moves?.Specials?.ContainsKey("commandGrab") ?? false,
            WakeupOption.TechRoll => true,
            _ => false
        };
    }
    
    /// <summary>
    /// Get meter cost for wake-up option
    /// </summary>
    private int GetWakeupCost(WakeupOption option)
    {
        return option switch
        {
            WakeupOption.Normal => 0,
            WakeupOption.QuickRise => 0,
            WakeupOption.DelayedWakeup => 0,
            WakeupOption.WakeupAttack => WAKEUP_ATTACK_COST,
            WakeupOption.WakeupThrow => WAKEUP_ATTACK_COST,
            WakeupOption.TechRoll => TECH_ROLL_COST,
            _ => 0
        };
    }
    
    /// <summary>
    /// Adjust wake-up timing based on option
    /// </summary>
    private void AdjustWakeupTiming(PlayerOkiState state, WakeupOption option)
    {
        state.WakeupTimer = option switch
        {
            WakeupOption.Normal => NORMAL_WAKEUP_FRAMES,
            WakeupOption.QuickRise => QUICK_RISE_FRAMES,
            WakeupOption.DelayedWakeup => DELAYED_WAKEUP_FRAMES,
            WakeupOption.WakeupAttack => NORMAL_WAKEUP_FRAMES, // Same timing but invincible
            WakeupOption.WakeupThrow => NORMAL_WAKEUP_FRAMES,
            WakeupOption.TechRoll => TECH_ROLL_FRAMES,
            _ => NORMAL_WAKEUP_FRAMES
        };
    }
    
    /// <summary>
    /// Process wake-up when timer expires
    /// </summary>
    private void ProcessWakeup(PlayerOkiState state)
    {
        var character = GetCharacterByPlayerId(state.PlayerId);
        if (character == null) return;
        
        switch (state.WakeupOption)
        {
            case WakeupOption.Normal:
                PerformNormalWakeup(character, state);
                break;
                
            case WakeupOption.QuickRise:
                PerformQuickRise(character, state);
                break;
                
            case WakeupOption.DelayedWakeup:
                PerformDelayedWakeup(character, state);
                break;
                
            case WakeupOption.WakeupAttack:
                PerformWakeupAttack(character, state);
                break;
                
            case WakeupOption.WakeupThrow:
                PerformWakeupThrow(character, state);
                break;
                
            case WakeupOption.TechRoll:
                PerformTechRoll(character, state);
                break;
        }
        
        // Reset knockdown state
        state.IsKnockedDown = false;
        state.WakeupTimer = 0;
    }
    
    /// <summary>
    /// Perform normal wake-up
    /// </summary>
    private void PerformNormalWakeup(Character character, PlayerOkiState state)
    {
        character.ChangeState(CharacterState.Idle);
        ApplyWakeupInvincibility(character, WAKEUP_INVUL_FRAMES);
        
        CreateWakeupEffect(character.GlobalPosition, WakeupOption.Normal);
    }
    
    /// <summary>
    /// Perform quick rise
    /// </summary>
    private void PerformQuickRise(Character character, PlayerOkiState state)
    {
        character.ChangeState(CharacterState.Idle);
        ApplyWakeupInvincibility(character, WAKEUP_INVUL_FRAMES / 2); // Less invincibility
        
        CreateWakeupEffect(character.GlobalPosition, WakeupOption.QuickRise);
    }
    
    /// <summary>
    /// Perform delayed wake-up
    /// </summary>
    private void PerformDelayedWakeup(Character character, PlayerOkiState state)
    {
        character.ChangeState(CharacterState.Idle);
        ApplyWakeupInvincibility(character, WAKEUP_INVUL_FRAMES + 2); // Extra invincibility
        
        CreateWakeupEffect(character.GlobalPosition, WakeupOption.DelayedWakeup);
    }
    
    /// <summary>
    /// Perform wake-up attack
    /// </summary>
    private void PerformWakeupAttack(Character character, PlayerOkiState state)
    {
        character.ChangeState(CharacterState.Attacking);
        ApplyWakeupInvincibility(character, WAKEUP_ATTACK_INVUL_FRAMES);
        
        // Execute wake-up attack move
        // In real implementation, this would trigger the specific wake-up move
        
        CreateWakeupEffect(character.GlobalPosition, WakeupOption.WakeupAttack);
    }
    
    /// <summary>
    /// Perform wake-up throw
    /// </summary>
    private void PerformWakeupThrow(Character character, PlayerOkiState state)
    {
        character.ChangeState(CharacterState.Attacking);
        ApplyWakeupInvincibility(character, WAKEUP_ATTACK_INVUL_FRAMES);
        
        // Execute command grab
        // In real implementation, this would trigger the command grab move
        
        CreateWakeupEffect(character.GlobalPosition, WakeupOption.WakeupThrow);
    }
    
    /// <summary>
    /// Perform tech roll
    /// </summary>
    private void PerformTechRoll(Character character, PlayerOkiState state)
    {
        // Move character to different position
        Vector2 rollDirection = character.FacingRight ? Vector2.Left : Vector2.Right;
        character.Position += rollDirection * 60f;
        
        character.ChangeState(CharacterState.Idle);
        ApplyWakeupInvincibility(character, WAKEUP_INVUL_FRAMES);
        
        CreateWakeupEffect(character.GlobalPosition, WakeupOption.TechRoll);
    }
    
    /// <summary>
    /// Apply wake-up invincibility
    /// </summary>
    private void ApplyWakeupInvincibility(Character character, int frames)
    {
        // In real implementation, this would set invincibility state
        GD.Print($"{character.CharacterId} has {frames} wake-up invincibility frames");
    }
    
    /// <summary>
    /// Apply knockdown movement/physics
    /// </summary>
    private void ApplyKnockdownMovement(Character character, Vector2 force)
    {
        // Apply knockdown force
        character.Position += force;
        
        // In real implementation, this would:
        // - Apply physics-based knockdown animation
        // - Handle bounce/slide mechanics
        // - Check for corner/wall interactions
    }
    
    /// <summary>
    /// Create wake-up visual effects
    /// </summary>
    private void CreateWakeupEffect(Vector2 position, WakeupOption option)
    {
        Color effectColor = option switch
        {
            WakeupOption.Normal => Colors.White,
            WakeupOption.QuickRise => Colors.Yellow,
            WakeupOption.DelayedWakeup => Colors.Blue,
            WakeupOption.WakeupAttack => Colors.Red,
            WakeupOption.WakeupThrow => Colors.Purple,
            WakeupOption.TechRoll => Colors.Green,
            _ => Colors.Gray
        };
        
        string effectName = option switch
        {
            WakeupOption.Normal => "WAKE UP",
            WakeupOption.QuickRise => "QUICK RISE",
            WakeupOption.DelayedWakeup => "DELAYED WAKEUP",
            WakeupOption.WakeupAttack => "REVERSAL!",
            WakeupOption.WakeupThrow => "WAKE-UP GRAB!",
            WakeupOption.TechRoll => "TECH ROLL",
            _ => ""
        };
        
        GD.Print($"Wake-up Effect: {effectName} at {position}");
        
        // In real implementation, this would create:
        // - Dust effects for rolling
        // - Flash effects for reversals
        // - Screen shake for dramatic wake-ups
        // - Sound effects
    }
    
    /// <summary>
    /// Analyze oki setup being performed by attacker
    /// </summary>
    public OkiSetup AnalyzeOkiSetup(Character attacker, Character defender, string setupMove)
    {
        var defenderState = _playerOkiStates[defender.PlayerId];
        
        if (!defenderState.IsKnockedDown) return OkiSetup.SafeJump; // Default
        
        // Analyze timing and positioning to determine setup type
        float distanceToDefender = attacker.GlobalPosition.DistanceTo(defender.GlobalPosition);
        int framesToWakeup = defenderState.WakeupTimer;
        
        // Determine setup based on timing and position
        OkiSetup detectedSetup = AnalyzeSetupTiming(attacker, defender, framesToWakeup, distanceToDefender);
        
        // Calculate advantage for the setup
        int advantage = CalculateOkiAdvantage(detectedSetup, framesToWakeup);
        
        EmitSignal(SignalName.OkiSetupDetected, attacker.PlayerId, (int)detectedSetup, advantage);
        
        return detectedSetup;
    }
    
    /// <summary>
    /// Analyze setup timing to determine oki type
    /// </summary>
    private OkiSetup AnalyzeSetupTiming(Character attacker, Character defender, int framesToWakeup, float distance)
    {
        // This is a simplified analysis - real implementation would be more sophisticated
        
        if (attacker.CurrentState == CharacterState.Jumping && framesToWakeup <= 10)
        {
            return distance > 80f ? OkiSetup.CrossupSetup : OkiSetup.SafeJump;
        }
        
        if (distance <= 60f && framesToWakeup <= 5)
        {
            return OkiSetup.ThrowSetup;
        }
        
        if (attacker.CurrentState == CharacterState.Attacking && framesToWakeup > 5)
        {
            return OkiSetup.FrameTrap;
        }
        
        if (attacker.CurrentState == CharacterState.Crouching && framesToWakeup <= 8)
        {
            return OkiSetup.MixupSetup;
        }
        
        return OkiSetup.SafeJump; // Default safe approach
    }
    
    /// <summary>
    /// Calculate advantage for oki setup
    /// </summary>
    private int CalculateOkiAdvantage(OkiSetup setup, int framesToWakeup)
    {
        return setup switch
        {
            OkiSetup.SafeJump => Math.Max(0, framesToWakeup - 8),
            OkiSetup.ThrowSetup => Math.Max(0, framesToWakeup - 3),
            OkiSetup.MixupSetup => Math.Max(0, framesToWakeup - 5),
            OkiSetup.FrameTrap => Math.Max(0, framesToWakeup - 10),
            OkiSetup.CrossupSetup => Math.Max(0, framesToWakeup - 6),
            _ => 0
        };
    }
    
    /// <summary>
    /// Get character by player ID
    /// </summary>
    private Character GetCharacterByPlayerId(int playerId)
    {
        // In real implementation, this would reference the game scene
        // For now, return null and handle gracefully
        return null;
    }
    
    /// <summary>
    /// Get oki state for player
    /// </summary>
    public PlayerOkiState GetOkiState(int playerId)
    {
        return _playerOkiStates.GetValueOrDefault(playerId, new PlayerOkiState());
    }
    
    /// <summary>
    /// Check if player is in valid oki situation
    /// </summary>
    public bool IsInOkiSituation(int attackerPlayerId, int defenderPlayerId)
    {
        var defenderState = _playerOkiStates.GetValueOrDefault(defenderPlayerId);
        return defenderState?.IsKnockedDown ?? false;
    }
    
    /// <summary>
    /// Get remaining wake-up frames for player
    /// </summary>
    public int GetWakeupFrames(int playerId)
    {
        var state = _playerOkiStates.GetValueOrDefault(playerId);
        return state?.WakeupTimer ?? 0;
    }
    
    /// <summary>
    /// Reset oki state (round end or match reset)
    /// </summary>
    public void ResetOkiState(int playerId)
    {
        if (_playerOkiStates.ContainsKey(playerId))
        {
            var state = _playerOkiStates[playerId];
            state.IsKnockedDown = false;
            state.WakeupTimer = 0;
            state.WakeupOption = WakeupOption.Normal;
            state.KnockdownPosition = Vector2.Zero;
        }
    }
    
    /// <summary>
    /// Check if oki system is enabled
    /// </summary>
    public bool IsOkiSystemEnabled()
    {
        return BalanceManager.Instance?.GetCurrentConfig()?.SystemAdjustments?.ComboScaling?.Enabled ?? true;
    }
}

/// <summary>
/// Oki state tracking for a player
/// </summary>
public class PlayerOkiState
{
    public int PlayerId { get; set; }
    public bool IsKnockedDown { get; set; } = false;
    public int WakeupTimer { get; set; } = 0;
    public OkiWakeupSystem.WakeupOption WakeupOption { get; set; } = OkiWakeupSystem.WakeupOption.Normal;
    public Vector2 KnockdownPosition { get; set; } = Vector2.Zero;
}