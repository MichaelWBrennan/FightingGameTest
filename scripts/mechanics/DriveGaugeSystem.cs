using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Modular Drive Gauge & Resource Engine inspired by Street Fighter 6
/// </summary>
public partial class DriveGaugeSystem : Node
{
    public static DriveGaugeSystem Instance { get; private set; }
    
    public enum DriveAction
    {
        DriveRush,      // Enhanced forward movement
        DriveParry,     // Enhanced parry with longer window
        DriveImpact,    // Armored attack that wall bounces
        DriveReversal,  // Invincible wake-up option
        OverdriveArt    // Enhanced super move
    }
    
    private Dictionary<int, PlayerDriveState> _playerDriveStates = new();
    
    private const int MAX_DRIVE_GAUGE = 6; // 6 drive stocks
    private const int DRIVE_RUSH_COST = 3;
    private const int DRIVE_PARRY_COST = 1;
    private const int DRIVE_IMPACT_COST = 1;
    private const int DRIVE_REVERSAL_COST = 2;
    private const int OVERDRIVE_ART_COST = 3;
    
    private const float DRIVE_REGENERATION_RATE = 0.5f; // Stocks per second when not in burnout
    private const float BURNOUT_DURATION = 10.0f; // Seconds of burnout state
    
    [Signal]
    public delegate void DriveActionPerformedEventHandler(int playerId, DriveAction action, int costPaid);
    
    [Signal]
    public delegate void BurnoutStateChangedEventHandler(int playerId, bool inBurnout);
    
    [Signal]
    public delegate void DriveGaugeChangedEventHandler(int playerId, float currentGauge, bool inBurnout);
    
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
        UpdateDriveGauges(delta);
    }
    
    /// <summary>
    /// Initialize drive states for players
    /// </summary>
    private void InitializePlayers()
    {
        for (int i = 0; i < 2; i++)
        {
            _playerDriveStates[i] = new PlayerDriveState
            {
                PlayerId = i,
                DriveGauge = MAX_DRIVE_GAUGE,
                InBurnout = false,
                BurnoutTimer = 0f,
                LastUsedTime = 0f
            };
        }
    }
    
    /// <summary>
    /// Update drive gauge regeneration and burnout timers
    /// </summary>
    private void UpdateDriveGauges(double delta)
    {
        foreach (var state in _playerDriveStates.Values)
        {
            if (state.InBurnout)
            {
                state.BurnoutTimer -= (float)delta;
                if (state.BurnoutTimer <= 0f)
                {
                    ExitBurnout(state);
                }
            }
            else
            {
                // Regenerate drive gauge over time
                float timeSinceLastUse = Time.GetUnixTimeFromSystem() - state.LastUsedTime;
                if (timeSinceLastUse > 2.0f) // 2 second delay before regeneration
                {
                    state.DriveGauge = Mathf.Min(MAX_DRIVE_GAUGE, 
                        state.DriveGauge + DRIVE_REGENERATION_RATE * (float)delta);
                }
            }
            
            EmitSignal(SignalName.DriveGaugeChanged, state.PlayerId, state.DriveGauge, state.InBurnout);
        }
    }
    
    /// <summary>
    /// Attempt to perform a drive action
    /// </summary>
    public bool TryPerformDriveAction(int playerId, DriveAction action, Character character)
    {
        if (!_playerDriveStates.ContainsKey(playerId)) return false;
        
        var state = _playerDriveStates[playerId];
        if (state.InBurnout) return false;
        
        int cost = GetDriveActionCost(action);
        if (state.DriveGauge < cost) return false;
        
        // Check if action is available based on character state
        if (!CanPerformAction(action, character)) return false;
        
        // Consume drive gauge
        state.DriveGauge -= cost;
        state.LastUsedTime = Time.GetUnixTimeFromSystem();
        
        // Check for burnout
        if (state.DriveGauge <= 0)
        {
            EnterBurnout(state);
        }
        
        // Execute the drive action
        ExecuteDriveAction(action, character, playerId);
        
        EmitSignal(SignalName.DriveActionPerformed, playerId, (int)action, cost);
        
        return true;
    }
    
    /// <summary>
    /// Get cost for drive action
    /// </summary>
    private int GetDriveActionCost(DriveAction action)
    {
        var config = BalanceManager.Instance?.GetCurrentConfig();
        float multiplier = config?.SystemAdjustments?.MeterSystem?.SuperCostMultiplier ?? 1.0f;
        
        int baseCost = action switch
        {
            DriveAction.DriveRush => DRIVE_RUSH_COST,
            DriveAction.DriveParry => DRIVE_PARRY_COST,
            DriveAction.DriveImpact => DRIVE_IMPACT_COST,
            DriveAction.DriveReversal => DRIVE_REVERSAL_COST,
            DriveAction.OverdriveArt => OVERDRIVE_ART_COST,
            _ => 1
        };
        
        return Mathf.Max(1, (int)(baseCost * multiplier));
    }
    
    /// <summary>
    /// Check if action can be performed based on character state
    /// </summary>
    private bool CanPerformAction(DriveAction action, Character character)
    {
        return action switch
        {
            DriveAction.DriveRush => character.CurrentState == CharacterState.Idle || 
                                    character.CurrentState == CharacterState.Walking,
            DriveAction.DriveParry => character.CurrentState == CharacterState.Idle ||
                                     character.CurrentState == CharacterState.Blocking,
            DriveAction.DriveImpact => character.CurrentState == CharacterState.Idle ||
                                      character.CurrentState == CharacterState.Walking,
            DriveAction.DriveReversal => character.CurrentState == CharacterState.Knocked ||
                                        character.CurrentState == CharacterState.Hit,
            DriveAction.OverdriveArt => character.Meter >= 100, // Requires full super meter too
            _ => false
        };
    }
    
    /// <summary>
    /// Execute the drive action effect
    /// </summary>
    private void ExecuteDriveAction(DriveAction action, Character character, int playerId)
    {
        switch (action)
        {
            case DriveAction.DriveRush:
                PerformDriveRush(character);
                break;
                
            case DriveAction.DriveParry:
                PerformDriveParry(character);
                break;
                
            case DriveAction.DriveImpact:
                PerformDriveImpact(character);
                break;
                
            case DriveAction.DriveReversal:
                PerformDriveReversal(character);
                break;
                
            case DriveAction.OverdriveArt:
                PerformOverdriveArt(character);
                break;
        }
        
        GD.Print($"Player {playerId} performed {action}!");
    }
    
    /// <summary>
    /// Enhanced forward movement with increased speed and frame advantage
    /// </summary>
    private void PerformDriveRush(Character character)
    {
        // Boost forward movement speed
        Vector2 rushDirection = character.FacingRight ? Vector2.Right : Vector2.Left;
        character.Position += rushDirection * 100f; // Quick forward dash
        
        // Enhanced frame advantage on next attack
        // In real implementation, this would set a flag for enhanced properties
        
        CreateDriveEffect(character.GlobalPosition, Colors.Green);
    }
    
    /// <summary>
    /// Enhanced parry with longer window and greater reward
    /// </summary>
    private void PerformDriveParry(Character character)
    {
        // Extended parry window (would integrate with ParryDefendSystem)
        character.ChangeState(CharacterState.Blocking);
        
        // In real implementation, this would:
        // - Extend parry window by 50%
        // - Increase frame advantage on successful parry
        // - Add visual effect
        
        CreateDriveEffect(character.GlobalPosition, Colors.Blue);
    }
    
    /// <summary>
    /// Armored attack that wall bounces on hit
    /// </summary>
    private void PerformDriveImpact(Character character)
    {
        character.ChangeState(CharacterState.Attacking);
        
        // In real implementation, this would:
        // - Add armor frames to character
        // - Create powerful attack with wall bounce property
        // - Apply enhanced damage
        
        CreateDriveEffect(character.GlobalPosition, Colors.Red);
    }
    
    /// <summary>
    /// Invincible wake-up option
    /// </summary>
    private void PerformDriveReversal(Character character)
    {
        character.ChangeState(CharacterState.Attacking);
        
        // In real implementation, this would:
        // - Grant full invincibility frames
        // - Quick startup attack
        // - Good for escaping pressure
        
        CreateDriveEffect(character.GlobalPosition, Colors.Yellow);
    }
    
    /// <summary>
    /// Enhanced super move with additional properties
    /// </summary>
    private void PerformOverdriveArt(Character character)
    {
        // Consume super meter as well
        character.ConsumeMeter(100);
        
        // In real implementation, this would:
        // - Enhanced super move damage
        // - Additional hits or effects
        // - Extended invincibility
        
        CreateDriveEffect(character.GlobalPosition, Colors.Purple);
    }
    
    /// <summary>
    /// Enter burnout state
    /// </summary>
    private void EnterBurnout(PlayerDriveState state)
    {
        state.InBurnout = true;
        state.BurnoutTimer = BURNOUT_DURATION;
        state.DriveGauge = 0;
        
        EmitSignal(SignalName.BurnoutStateChanged, state.PlayerId, true);
        
        GD.Print($"Player {state.PlayerId} enters BURNOUT!");
    }
    
    /// <summary>
    /// Exit burnout state
    /// </summary>
    private void ExitBurnout(PlayerDriveState state)
    {
        state.InBurnout = false;
        state.DriveGauge = MAX_DRIVE_GAUGE; // Full gauge on recovery
        
        EmitSignal(SignalName.BurnoutStateChanged, state.PlayerId, false);
        
        GD.Print($"Player {state.PlayerId} recovers from burnout!");
    }
    
    /// <summary>
    /// Create visual effect for drive actions
    /// </summary>
    private void CreateDriveEffect(Vector2 position, Color color)
    {
        // In real implementation, this would create particle effects
        GD.Print($"Drive effect at {position} with color {color}");
    }
    
    /// <summary>
    /// Get current drive state for player
    /// </summary>
    public PlayerDriveState GetPlayerDriveState(int playerId)
    {
        return _playerDriveStates.GetValueOrDefault(playerId, new PlayerDriveState());
    }
    
    /// <summary>
    /// Force set drive gauge (for testing/dev console)
    /// </summary>
    public void SetDriveGauge(int playerId, float amount)
    {
        if (_playerDriveStates.ContainsKey(playerId))
        {
            _playerDriveStates[playerId].DriveGauge = Mathf.Clamp(amount, 0, MAX_DRIVE_GAUGE);
        }
    }
    
    /// <summary>
    /// Check if drive system is enabled
    /// </summary>
    public bool IsDriveSystemEnabled()
    {
        return BalanceManager.Instance?.GetCurrentConfig()?.SystemAdjustments?.MeterSystem?.Enabled ?? true;
    }
}

/// <summary>
/// Drive state for a player
/// </summary>
public class PlayerDriveState
{
    public int PlayerId { get; set; }
    public float DriveGauge { get; set; } = 6f;
    public bool InBurnout { get; set; } = false;
    public float BurnoutTimer { get; set; } = 0f;
    public float LastUsedTime { get; set; } = 0f;
}