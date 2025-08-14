using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Unified Meter System that coordinates all meter-based mechanics without overlap
/// Manages resource allocation between parries, Roman Cancels, supers, bursts, and other systems
/// </summary>
public partial class UnifiedMeterSystem : Node
{
    public static UnifiedMeterSystem Instance { get; private set; }
    
    public enum MeterType
    {
        Super,          // Traditional super meter (0-100)
        Drive,          // Drive gauge stocks (0-6) 
        Burst,          // Burst meter (0-100, builds separately)
        Tension         // Guilty Gear style tension meter
    }
    
    private Dictionary<int, PlayerMeterState> _playerMeterStates = new();
    
    // Meter building rates
    private const float OFFENSIVE_METER_RATE = 0.8f;
    private const float DEFENSIVE_METER_RATE = 1.2f;
    private const float DAMAGE_METER_RATE = 0.5f;
    private const float BURST_METER_RATE = 0.3f;
    
    // Maximum values
    private const int MAX_SUPER_METER = 100;
    private const int MAX_BURST_METER = 100;
    private const int MAX_TENSION_METER = 100;
    
    [Signal]
    public delegate void MeterChangedEventHandler(int playerId, int type, float currentValue, float maxValue);
    
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
    /// Initialize meter states for players
    /// </summary>
    private void InitializePlayers()
    {
        for (int i = 0; i < 2; i++)
        {
            _playerMeterStates[i] = new PlayerMeterState
            {
                PlayerId = i,
                SuperMeter = 0f,
                BurstMeter = 0f,
                TensionMeter = 0f,
                BurstAvailable = false
            };
        }
    }
    
    /// <summary>
    /// Get meter value for player and type
    /// </summary>
    public float GetMeter(int playerId, MeterType type)
    {
        var state = _playerMeterStates.GetValueOrDefault(playerId);
        if (state == null) return 0f;
        
        return type switch
        {
            MeterType.Super => state.SuperMeter,
            MeterType.Burst => state.BurstMeter,
            MeterType.Tension => state.TensionMeter,
            MeterType.Drive => DriveGaugeSystem.Instance?.GetPlayerDriveState(playerId)?.DriveGauge ?? 0f,
            _ => 0f
        };
    }
    
    /// <summary>
    /// Add meter for player
    /// </summary>
    public void AddMeter(int playerId, MeterType type, float amount)
    {
        var state = _playerMeterStates.GetValueOrDefault(playerId);
        if (state == null) return;
        
        switch (type)
        {
            case MeterType.Super:
                state.SuperMeter = Math.Min(MAX_SUPER_METER, state.SuperMeter + amount);
                break;
            case MeterType.Burst:
                state.BurstMeter = Math.Min(MAX_BURST_METER, state.BurstMeter + amount);
                break;
            case MeterType.Tension:
                state.TensionMeter = Math.Min(MAX_TENSION_METER, state.TensionMeter + amount);
                break;
        }
        
        EmitSignal(SignalName.MeterChanged, playerId, (int)type, GetMeter(playerId, type), GetMaxMeter(type));
    }
    
    /// <summary>
    /// Check if player has enough meter for usage
    /// </summary>
    public bool HasMeterFor(int playerId, string usage)
    {
        var state = _playerMeterStates.GetValueOrDefault(playerId);
        if (state == null) return false;
        
        return usage switch
        {
            "SuperMove" => state.SuperMeter >= 100f,
            "EXSpecial" => state.SuperMeter >= 25f,
            "RomanCancel" => state.SuperMeter >= 50f,
            "DashCancel" => state.SuperMeter >= 25f,
            "InstantAirDash" => state.SuperMeter >= 10f,
            "FaultlessDefense" => state.SuperMeter >= 2f,
            "BurstMovement" => state.BurstMeter >= 50f,
            "DefensiveBurst" => state.BurstAvailable,
            _ => false
        };
    }
    
    /// <summary>
    /// Get maximum value for meter type
    /// </summary>
    private float GetMaxMeter(MeterType type)
    {
        return type switch
        {
            MeterType.Super => MAX_SUPER_METER,
            MeterType.Burst => MAX_BURST_METER,
            MeterType.Tension => MAX_TENSION_METER,
            MeterType.Drive => 6f,
            _ => 100f
        };
    }
}

/// <summary>
/// Unified meter state for a player
/// </summary>
public class PlayerMeterState
{
    public int PlayerId { get; set; }
    public float SuperMeter { get; set; } = 0f;
    public float BurstMeter { get; set; } = 0f;
    public float TensionMeter { get; set; } = 0f;
    public bool BurstAvailable { get; set; } = false;
}