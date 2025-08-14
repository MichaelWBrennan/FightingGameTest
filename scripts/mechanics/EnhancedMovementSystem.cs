using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Enhanced Movement System inspired by Guilty Gear Accent Core
/// Provides air dashes, dash cancels, and burst movement while maintaining neutral clarity
/// </summary>
public partial class EnhancedMovementSystem : Node
{
    public static EnhancedMovementSystem Instance { get; private set; }
    
    public enum MovementType
    {
        GroundDash,         // Forward/backward ground dash
        AirDash,           // Air dash in any direction
        DashCancel,        // Cancel normal/special into dash
        BurstMovement,     // Quick escape/approach tool
        InstantAirDash     // Instant air dash from ground
    }
    
    private Dictionary<int, PlayerMovementState> _playerMovementStates = new();
    
    // Frame data constants
    private const int GROUND_DASH_DURATION = 20;
    private const int AIR_DASH_DURATION = 15;
    private const int DASH_CANCEL_COST = 25; // Meter cost
    private const int BURST_MOVEMENT_COST = 50; // Meter cost
    private const int IAD_COST = 10; // Meter cost for instant air dash
    
    // Movement distances
    private const float GROUND_DASH_DISTANCE = 120f;
    private const float AIR_DASH_DISTANCE = 100f;
    private const float BURST_DISTANCE = 80f;
    
    // Cooldowns to prevent spam
    private const int DASH_COOLDOWN_FRAMES = 30;
    private const int AIR_DASH_COOLDOWN_FRAMES = 45;
    private const int BURST_COOLDOWN_FRAMES = 120; // 2 seconds
    
    [Signal]
    public delegate void MovementPerformedEventHandler(int playerId, MovementType type, Vector2 direction);
    
    [Signal]
    public delegate void DashCancelExecutedEventHandler(int playerId, string canceledMove);
    
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
        UpdateMovementStates(delta);
    }
    
    /// <summary>
    /// Initialize movement states for players
    /// </summary>
    private void InitializePlayers()
    {
        for (int i = 0; i < 2; i++)
        {
            _playerMovementStates[i] = new PlayerMovementState
            {
                PlayerId = i,
                CanDash = true,
                CanAirDash = true,
                DashCooldown = 0,
                AirDashCooldown = 0,
                BurstCooldown = 0,
                InMovement = false
            };
        }
    }
    
    /// <summary>
    /// Update movement states and cooldowns
    /// </summary>
    private void UpdateMovementStates(double delta)
    {
        foreach (var state in _playerMovementStates.Values)
        {
            if (state.DashCooldown > 0)
                state.DashCooldown--;
            if (state.AirDashCooldown > 0)
                state.AirDashCooldown--;
            if (state.BurstCooldown > 0)
                state.BurstCooldown--;
            
            // Update availability
            state.CanDash = state.DashCooldown <= 0;
            state.CanAirDash = state.AirDashCooldown <= 0;
            state.CanBurst = state.BurstCooldown <= 0;
        }
    }
    
    /// <summary>
    /// Attempt ground dash
    /// </summary>
    public bool TryGroundDash(Character character, bool forward)
    {
        if (!CanPerformMovement(character, MovementType.GroundDash)) return false;
        
        var state = _playerMovementStates[character.PlayerId];
        
        // Execute dash
        Vector2 dashDirection = GetDashDirection(character, forward);
        ExecuteGroundDash(character, dashDirection);
        
        // Set cooldown
        state.DashCooldown = DASH_COOLDOWN_FRAMES;
        state.InMovement = true;
        
        EmitSignal(SignalName.MovementPerformed, character.PlayerId, (int)MovementType.GroundDash, dashDirection);
        
        GD.Print($"{character.CharacterId} performed ground dash {(forward ? "forward" : "backward")}");
        return true;
    }
    
    /// <summary>
    /// Attempt air dash
    /// </summary>
    public bool TryAirDash(Character character, Vector2 direction)
    {
        if (!CanPerformMovement(character, MovementType.AirDash)) return false;
        
        var state = _playerMovementStates[character.PlayerId];
        
        // Normalize direction for consistent distance
        direction = direction.Normalized();
        
        // Execute air dash
        ExecuteAirDash(character, direction);
        
        // Set cooldown and limit air dashes
        state.AirDashCooldown = AIR_DASH_COOLDOWN_FRAMES;
        state.AirDashesUsed++;
        state.InMovement = true;
        
        EmitSignal(SignalName.MovementPerformed, character.PlayerId, (int)MovementType.AirDash, direction);
        
        GD.Print($"{character.CharacterId} performed air dash in direction {direction}");
        return true;
    }
    
    /// <summary>
    /// Attempt dash cancel (cancel current move into dash)
    /// </summary>
    public bool TryDashCancel(Character character, string currentMove, bool forward)
    {
        if (!CanPerformMovement(character, MovementType.DashCancel)) return false;
        if (character.Meter < DASH_CANCEL_COST) return false;
        
        // Check if current move is cancelable
        if (!IsMovesCancelable(character, currentMove)) return false;
        
        // Consume meter
        character.ConsumeMeter(DASH_CANCEL_COST);
        
        // Execute dash cancel
        Vector2 dashDirection = GetDashDirection(character, forward);
        ExecuteDashCancel(character, dashDirection, currentMove);
        
        var state = _playerMovementStates[character.PlayerId];
        state.DashCooldown = DASH_COOLDOWN_FRAMES / 2; // Reduced cooldown for cancels
        
        EmitSignal(SignalName.DashCancelExecuted, character.PlayerId, currentMove);
        EmitSignal(SignalName.MovementPerformed, character.PlayerId, (int)MovementType.DashCancel, dashDirection);
        
        GD.Print($"{character.CharacterId} dash canceled {currentMove}");
        return true;
    }
    
    /// <summary>
    /// Attempt burst movement (emergency escape/approach)
    /// </summary>
    public bool TryBurstMovement(Character character, Vector2 direction)
    {
        if (!CanPerformMovement(character, MovementType.BurstMovement)) return false;
        if (character.Meter < BURST_MOVEMENT_COST) return false;
        
        var state = _playerMovementStates[character.PlayerId];
        if (!state.CanBurst) return false;
        
        // Consume meter
        character.ConsumeMeter(BURST_MOVEMENT_COST);
        
        // Execute burst movement
        direction = direction.Normalized();
        ExecuteBurstMovement(character, direction);
        
        // Set long cooldown
        state.BurstCooldown = BURST_COOLDOWN_FRAMES;
        
        EmitSignal(SignalName.MovementPerformed, character.PlayerId, (int)MovementType.BurstMovement, direction);
        
        GD.Print($"{character.CharacterId} performed burst movement");
        return true;
    }
    
    /// <summary>
    /// Attempt instant air dash from ground
    /// </summary>
    public bool TryInstantAirDash(Character character, Vector2 direction)
    {
        if (!CanPerformMovement(character, MovementType.InstantAirDash)) return false;
        if (character.Meter < IAD_COST) return false;
        
        // Must be grounded
        if (character.CurrentState == CharacterState.Jumping) return false;
        
        // Consume meter
        character.ConsumeMeter(IAD_COST);
        
        // Execute instant air dash
        ExecuteInstantAirDash(character, direction.Normalized());
        
        var state = _playerMovementStates[character.PlayerId];
        state.AirDashCooldown = AIR_DASH_COOLDOWN_FRAMES;
        state.AirDashesUsed++;
        
        EmitSignal(SignalName.MovementPerformed, character.PlayerId, (int)MovementType.InstantAirDash, direction);
        
        GD.Print($"{character.CharacterId} performed instant air dash");
        return true;
    }
    
    /// <summary>
    /// Check if character can perform movement type
    /// </summary>
    private bool CanPerformMovement(Character character, MovementType type)
    {
        var state = _playerMovementStates[character.PlayerId];
        
        return type switch
        {
            MovementType.GroundDash => state.CanDash && 
                                     (character.CurrentState == CharacterState.Idle || 
                                      character.CurrentState == CharacterState.Walking),
            MovementType.AirDash => state.CanAirDash && 
                                   character.CurrentState == CharacterState.Jumping &&
                                   state.AirDashesUsed < GetMaxAirDashes(character),
            MovementType.DashCancel => state.CanDash && 
                                      character.CurrentState == CharacterState.Attacking,
            MovementType.BurstMovement => state.CanBurst,
            MovementType.InstantAirDash => state.CanAirDash && 
                                          character.CurrentState != CharacterState.Jumping,
            _ => false
        };
    }
    
    /// <summary>
    /// Get maximum air dashes for character archetype
    /// </summary>
    private int GetMaxAirDashes(Character character)
    {
        return character.Data?.Archetype switch
        {
            "rushdown" => 2,    // Rushdown gets double air dash
            "technical" => 1,   // Technical gets single precise air dash
            "zoner" => 1,       // Zoner gets single air dash
            "grappler" => 0,    // Grapplers can't air dash
            _ => 1              // Default single air dash
        };
    }
    
    /// <summary>
    /// Get dash direction based on character facing and input
    /// </summary>
    private Vector2 GetDashDirection(Character character, bool forward)
    {
        bool moveRight = character.FacingRight ? forward : !forward;
        return moveRight ? Vector2.Right : Vector2.Left;
    }
    
    /// <summary>
    /// Check if current move can be canceled into dash
    /// </summary>
    private bool IsMovesCancelable(Character character, string moveName)
    {
        if (character.Data?.Moves == null) return false;
        
        // Check normals
        if (character.Data.Moves.Normals.ContainsKey(moveName))
        {
            var move = character.Data.Moves.Normals[moveName];
            return move.Properties.Contains("cancelable") || move.Properties.Contains("dash_cancelable");
        }
        
        // Check specials
        if (character.Data.Moves.Specials.ContainsKey(moveName))
        {
            var move = character.Data.Moves.Specials[moveName];
            return move.Properties.Contains("dash_cancelable");
        }
        
        return false;
    }
    
    /// <summary>
    /// Execute ground dash
    /// </summary>
    private void ExecuteGroundDash(Character character, Vector2 direction)
    {
        // Change character state
        character.ChangeState(CharacterState.Walking); // Use walking state for dash
        
        // Apply dash movement
        character.Position += direction * GROUND_DASH_DISTANCE;
        
        // Create dash effect
        CreateMovementEffect(character.GlobalPosition, MovementType.GroundDash, direction);
        
        // Schedule return to neutral state
        ScheduleStateReturn(character, GROUND_DASH_DURATION);
    }
    
    /// <summary>
    /// Execute air dash
    /// </summary>
    private void ExecuteAirDash(Character character, Vector2 direction)
    {
        // Maintain air state but change movement
        character.Position += direction * AIR_DASH_DISTANCE;
        
        // Reset vertical velocity for horizontal air dashes
        if (Mathf.Abs(direction.X) > Mathf.Abs(direction.Y))
        {
            // Zero vertical momentum for more controlled air movement
        }
        
        // Create air dash effect
        CreateMovementEffect(character.GlobalPosition, MovementType.AirDash, direction);
    }
    
    /// <summary>
    /// Execute dash cancel
    /// </summary>
    private void ExecuteDashCancel(Character character, Vector2 direction, string canceledMove)
    {
        // Interrupt current move
        character.ChangeState(CharacterState.Idle);
        
        // Apply dash movement with reduced distance (since it's a cancel)
        character.Position += direction * (GROUND_DASH_DISTANCE * 0.7f);
        
        // Create special cancel effect
        CreateMovementEffect(character.GlobalPosition, MovementType.DashCancel, direction);
        
        // Brief invincibility frames during cancel
        ApplyInvincibilityFrames(character, 4);
    }
    
    /// <summary>
    /// Execute burst movement
    /// </summary>
    private void ExecuteBurstMovement(Character character, Vector2 direction)
    {
        // Quick movement in any direction
        character.Position += direction * BURST_DISTANCE;
        
        // Brief invincibility during burst
        ApplyInvincibilityFrames(character, 8);
        
        // Create burst effect
        CreateMovementEffect(character.GlobalPosition, MovementType.BurstMovement, direction);
        
        GD.Print($"{character.CharacterId} burst movement - emergency mobility!");
    }
    
    /// <summary>
    /// Execute instant air dash
    /// </summary>
    private void ExecuteInstantAirDash(Character character, Vector2 direction)
    {
        // Launch character into air for IAD
        character.ChangeState(CharacterState.Jumping);
        character.Position += Vector2.Up * 30; // Small hop
        
        // Apply air dash movement
        character.Position += direction * AIR_DASH_DISTANCE;
        
        // Create IAD effect
        CreateMovementEffect(character.GlobalPosition, MovementType.InstantAirDash, direction);
    }
    
    /// <summary>
    /// Apply temporary invincibility frames
    /// </summary>
    private void ApplyInvincibilityFrames(Character character, int frames)
    {
        // In real implementation, this would set invincibility state
        GD.Print($"{character.CharacterId} gains {frames} invincibility frames from movement");
    }
    
    /// <summary>
    /// Create visual effects for movement
    /// </summary>
    private void CreateMovementEffect(Vector2 position, MovementType type, Vector2 direction)
    {
        Color effectColor = type switch
        {
            MovementType.GroundDash => Colors.Yellow,
            MovementType.AirDash => Colors.Cyan,
            MovementType.DashCancel => Colors.Orange,
            MovementType.BurstMovement => Colors.Purple,
            MovementType.InstantAirDash => Colors.LightBlue,
            _ => Colors.White
        };
        
        string effectName = type switch
        {
            MovementType.GroundDash => "DASH",
            MovementType.AirDash => "AIR DASH",
            MovementType.DashCancel => "DASH CANCEL",
            MovementType.BurstMovement => "BURST",
            MovementType.InstantAirDash => "IAD",
            _ => ""
        };
        
        GD.Print($"Movement Effect: {effectName} at {position} toward {direction}");
        
        // In real implementation, this would create:
        // - Motion blur trails
        // - Particle effects
        // - Screen effects for burst movement
        // - Sound effects
    }
    
    /// <summary>
    /// Schedule character to return to neutral state after movement
    /// </summary>
    private void ScheduleStateReturn(Character character, int frames)
    {
        var timer = new Timer();
        timer.WaitTime = frames / 60.0; // Convert frames to seconds
        timer.OneShot = true;
        timer.Timeout += () => {
            if (character.CurrentState == CharacterState.Walking)
            {
                character.ChangeState(CharacterState.Idle);
            }
            var state = _playerMovementStates[character.PlayerId];
            state.InMovement = false;
            timer.QueueFree();
        };
        AddChild(timer);
        timer.Start();
    }
    
    /// <summary>
    /// Reset air dash count when character lands
    /// </summary>
    public void OnCharacterLanded(Character character)
    {
        if (_playerMovementStates.ContainsKey(character.PlayerId))
        {
            _playerMovementStates[character.PlayerId].AirDashesUsed = 0;
        }
    }
    
    /// <summary>
    /// Get movement state for player
    /// </summary>
    public PlayerMovementState GetMovementState(int playerId)
    {
        return _playerMovementStates.GetValueOrDefault(playerId, new PlayerMovementState());
    }
    
    /// <summary>
    /// Check if enhanced movement is enabled
    /// </summary>
    public bool IsEnhancedMovementEnabled()
    {
        return BalanceManager.Instance?.GetCurrentConfig()?.SystemAdjustments?.MeterSystem?.Enabled ?? true;
    }
}

/// <summary>
/// Movement state for a player
/// </summary>
public class PlayerMovementState
{
    public int PlayerId { get; set; }
    public bool CanDash { get; set; } = true;
    public bool CanAirDash { get; set; } = true;
    public bool CanBurst { get; set; } = true;
    public int DashCooldown { get; set; } = 0;
    public int AirDashCooldown { get; set; } = 0;
    public int BurstCooldown { get; set; } = 0;
    public int AirDashesUsed { get; set; } = 0;
    public bool InMovement { get; set; } = false;
}