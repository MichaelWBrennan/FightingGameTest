using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Combo Scaling System for damage reduction and juggle mechanics
/// Ensures combos remain balanced while maintaining high-skill expression
/// </summary>
public partial class ComboScalingSystem : Node
{
    public static ComboScalingSystem Instance { get; private set; }
    
    public enum ComboState
    {
        NoCombo,        // No active combo
        GroundCombo,    // Ground-based combo
        AirCombo,       // Air juggle combo
        WallCombo,      // Wall bounce combo
        CounterCombo    // Counter hit combo (enhanced properties)
    }
    
    private Dictionary<int, PlayerComboState> _playerComboStates = new();
    
    // Scaling constants
    private const float BASE_DAMAGE_SCALING = 0.85f;  // 15% reduction per hit after 3rd
    private const float COUNTER_HIT_SCALING = 0.90f;  // Reduced scaling for counter hits
    private const float AIR_COMBO_SCALING = 0.80f;    // More aggressive scaling for air combos
    private const float WALL_COMBO_SCALING = 0.75f;   // Strongest scaling for wall combos
    
    // Limits
    private const int MAX_GROUND_COMBO_HITS = 15;
    private const int MAX_AIR_COMBO_HITS = 12;
    private const int MAX_WALL_COMBO_HITS = 8;
    private const int SCALING_START_HIT = 3; // Scaling starts after 3rd hit
    
    // Gravity and juggle constants
    private const float JUGGLE_GRAVITY_INCREASE = 1.2f; // Gravity increases per air hit
    private const float MAX_JUGGLE_GRAVITY = 3.0f;
    
    [Signal]
    public delegate void ComboStartedEventHandler(int playerId, ComboState type);
    
    [Signal]
    public delegate void ComboScalingAppliedEventHandler(int playerId, float scalingFactor, int comboLength);
    
    [Signal]
    public delegate void ComboEndedEventHandler(int playerId, int totalDamage, int hits, ComboState type);
    
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
    /// Initialize combo states for players
    /// </summary>
    private void InitializePlayers()
    {
        for (int i = 0; i < 2; i++)
        {
            _playerComboStates[i] = new PlayerComboState
            {
                PlayerId = i,
                ComboCount = 0,
                TotalDamage = 0,
                CurrentState = ComboState.NoCombo,
                ScalingFactor = 1.0f,
                LastHitFrame = -1,
                JuggleGravity = 1.0f
            };
        }
    }
    
    /// <summary>
    /// Start a new combo
    /// </summary>
    public void StartCombo(int playerId, ComboState comboType, bool isCounterHit = false)
    {
        var state = _playerComboStates[playerId];
        
        state.ComboCount = 1; // First hit
        state.TotalDamage = 0;
        state.CurrentState = comboType;
        state.ScalingFactor = 1.0f; // No scaling on first hit
        state.LastHitFrame = 0; // Current frame
        state.JuggleGravity = 1.0f;
        state.IsCounterCombo = isCounterHit;
        
        EmitSignal(SignalName.ComboStarted, playerId, (int)comboType);
        
        GD.Print($"Player {playerId} started {comboType} combo{(isCounterHit ? " (COUNTER HIT)" : "")}");
    }
    
    /// <summary>
    /// Add hit to existing combo
    /// </summary>
    public bool AddComboHit(int playerId, int damage, string moveType = "normal")
    {
        var state = _playerComboStates[playerId];
        
        if (state.CurrentState == ComboState.NoCombo) return false;
        
        // Check combo limits
        if (!IsWithinComboLimits(state)) 
        {
            EndCombo(playerId, "limit_reached");
            return false;
        }
        
        // Increment combo count
        state.ComboCount++;
        
        // Calculate scaling
        float currentScaling = CalculateScaling(state, moveType);
        int scaledDamage = (int)(damage * currentScaling);
        
        state.TotalDamage += scaledDamage;
        state.ScalingFactor = currentScaling;
        state.LastHitFrame = 0; // Reset for next hit
        
        // Update juggle gravity for air combos
        if (state.CurrentState == ComboState.AirCombo)
        {
            UpdateJuggleGravity(state);
        }
        
        EmitSignal(SignalName.ComboScalingApplied, playerId, currentScaling, state.ComboCount);
        
        GD.Print($"Combo hit #{state.ComboCount}: {damage} → {scaledDamage} (scaling: {currentScaling:F2})");
        return true;
    }
    
    /// <summary>
    /// End current combo
    /// </summary>
    public void EndCombo(int playerId, string reason = "natural")
    {
        var state = _playerComboStates[playerId];
        
        if (state.CurrentState == ComboState.NoCombo) return;
        
        var endedState = state.CurrentState;
        int totalHits = state.ComboCount;
        int totalDamage = state.TotalDamage;
        
        // Reset state
        state.ComboCount = 0;
        state.TotalDamage = 0;
        state.CurrentState = ComboState.NoCombo;
        state.ScalingFactor = 1.0f;
        state.JuggleGravity = 1.0f;
        state.IsCounterCombo = false;
        
        EmitSignal(SignalName.ComboEnded, playerId, totalDamage, totalHits, (int)endedState);
        
        GD.Print($"Player {playerId} combo ended: {totalHits} hits, {totalDamage} damage ({reason})");
    }
    
    /// <summary>
    /// Calculate scaling factor for current hit
    /// </summary>
    private float CalculateScaling(PlayerComboState state, string moveType)
    {
        // No scaling for first few hits
        if (state.ComboCount <= SCALING_START_HIT) return 1.0f;
        
        // Get base scaling rate
        float baseScaling = GetBaseScaling(state.CurrentState, state.IsCounterCombo);
        
        // Calculate scaling based on combo length
        int scalingHits = state.ComboCount - SCALING_START_HIT;
        float scaling = Mathf.Pow(baseScaling, scalingHits);
        
        // Move type modifiers
        float moveModifier = moveType switch
        {
            "heavy" => 0.95f,      // Heavy attacks scale more
            "special" => 0.90f,    // Specials scale more
            "super" => 0.85f,      // Supers scale most
            "ender" => 0.80f,      // Combo enders scale heavily
            _ => 1.0f              // Normal scaling
        };
        
        // Apply balance system modifications
        var config = BalanceManager.Instance?.GetCurrentConfig();
        float systemScaling = config?.SystemAdjustments?.ComboScaling?.DamageReduction ?? BASE_DAMAGE_SCALING;
        
        return Math.Max(0.1f, scaling * moveModifier * systemScaling); // Minimum 10% damage
    }
    
    /// <summary>
    /// Get base scaling rate for combo type
    /// </summary>
    private float GetBaseScaling(ComboState comboType, bool isCounterCombo)
    {
        float baseRate = comboType switch
        {
            ComboState.GroundCombo => BASE_DAMAGE_SCALING,
            ComboState.AirCombo => AIR_COMBO_SCALING,
            ComboState.WallCombo => WALL_COMBO_SCALING,
            ComboState.CounterCombo => COUNTER_HIT_SCALING,
            _ => BASE_DAMAGE_SCALING
        };
        
        // Counter hit combos get reduced scaling
        if (isCounterCombo && comboType != ComboState.CounterCombo)
        {
            baseRate = Math.Max(baseRate, COUNTER_HIT_SCALING);
        }
        
        return baseRate;
    }
    
    /// <summary>
    /// Check if combo is within limits
    /// </summary>
    private bool IsWithinComboLimits(PlayerComboState state)
    {
        int limit = state.CurrentState switch
        {
            ComboState.GroundCombo => MAX_GROUND_COMBO_HITS,
            ComboState.AirCombo => MAX_AIR_COMBO_HITS,
            ComboState.WallCombo => MAX_WALL_COMBO_HITS,
            ComboState.CounterCombo => MAX_GROUND_COMBO_HITS + 3, // Bonus hits for counter
            _ => MAX_GROUND_COMBO_HITS
        };
        
        // Apply balance system limits
        var config = BalanceManager.Instance?.GetCurrentConfig();
        int systemLimit = config?.SystemAdjustments?.ComboScaling?.MaxComboLength ?? limit;
        
        return state.ComboCount < Math.Min(limit, systemLimit);
    }
    
    /// <summary>
    /// Update juggle gravity for air combos
    /// </summary>
    private void UpdateJuggleGravity(PlayerComboState state)
    {
        // Increase gravity with each air hit to prevent infinite juggling
        state.JuggleGravity = Math.Min(MAX_JUGGLE_GRAVITY, 
                                      state.JuggleGravity + (JUGGLE_GRAVITY_INCREASE * 0.1f));
    }
    
    /// <summary>
    /// Transition combo to different state
    /// </summary>
    public void TransitionComboState(int playerId, ComboState newState)
    {
        var state = _playerComboStates[playerId];
        
        if (state.CurrentState == ComboState.NoCombo) return;
        
        var oldState = state.CurrentState;
        state.CurrentState = newState;
        
        // Adjust scaling when transitioning
        if (newState == ComboState.AirCombo && oldState == ComboState.GroundCombo)
        {
            // Ground to air transition - apply launcher scaling
            state.ScalingFactor *= 0.95f;
        }
        else if (newState == ComboState.WallCombo)
        {
            // Wall combos have enhanced scaling
            state.ScalingFactor *= 0.90f;
        }
        
        GD.Print($"Player {playerId} combo transitioned: {oldState} → {newState}");
    }
    
    /// <summary>
    /// Get current scaling factor for player
    /// </summary>
    public float GetCurrentScaling(int playerId)
    {
        var state = _playerComboStates.GetValueOrDefault(playerId);
        return state?.ScalingFactor ?? 1.0f;
    }
    
    /// <summary>
    /// Check if player is currently in combo
    /// </summary>
    public bool IsInCombo(int playerId)
    {
        var state = _playerComboStates.GetValueOrDefault(playerId);
        return state?.CurrentState != ComboState.NoCombo;
    }
    
    /// <summary>
    /// Get current combo state for player
    /// </summary>
    public PlayerComboState GetComboState(int playerId)
    {
        return _playerComboStates.GetValueOrDefault(playerId, new PlayerComboState());
    }
    
    /// <summary>
    /// Force end all combos (round reset)
    /// </summary>
    public void ResetAllCombos()
    {
        for (int i = 0; i < 2; i++)
        {
            if (IsInCombo(i))
            {
                EndCombo(i, "round_reset");
            }
        }
    }
    
    /// <summary>
    /// Check if combo scaling is enabled
    /// </summary>
    public bool IsComboScalingEnabled()
    {
        return BalanceManager.Instance?.GetCurrentConfig()?.SystemAdjustments?.ComboScaling?.Enabled ?? true;
    }
}

/// <summary>
/// Combo state tracking for a player
/// </summary>
public class PlayerComboState
{
    public int PlayerId { get; set; }
    public int ComboCount { get; set; } = 0;
    public int TotalDamage { get; set; } = 0;
    public ComboScalingSystem.ComboState CurrentState { get; set; } = ComboScalingSystem.ComboState.NoCombo;
    public float ScalingFactor { get; set; } = 1.0f;
    public int LastHitFrame { get; set; } = -1;
    public float JuggleGravity { get; set; } = 1.0f;
    public bool IsCounterCombo { get; set; } = false;
}