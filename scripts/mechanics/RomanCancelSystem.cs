using Godot;
using System;

/// <summary>
/// Roman Cancel system inspired by Guilty Gear with multi-tier cancel logic
/// </summary>
public partial class RomanCancelSystem : Node
{
    public static RomanCancelSystem Instance { get; private set; }
    
    // Roman Cancel types
    public enum RCType
    {
        Red,    // Cancel on hit/block
        Blue,   // Cancel on whiff
        Yellow, // Cancel during recovery
        Purple  // Cancel after projectile
    }
    
    private const int DEFAULT_RC_METER_COST = 50;
    private const int FREEZE_DURATION_FRAMES = 12; // Screen freeze duration
    private const int ADVANTAGE_FRAMES = 10; // Frame advantage after RC
    
    [Signal]
    public delegate void RomanCancelPerformedEventHandler(RCType type, int meterUsed);
    
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
    /// Attempt to perform a Roman Cancel
    /// </summary>
    public bool TryRomanCancel(Character character, RCType rcType = RCType.Red)
    {
        if (!CanPerformRC(character, rcType)) return false;
        
        int meterCost = GetRCMeterCost(rcType);
        character.ConsumeMeter(meterCost);
        
        // Apply RC effects
        ApplyRCEffects(character, rcType);
        
        // Visual effects
        CreateRCVisualEffects(character.GlobalPosition, rcType);
        
        // Screen freeze
        PerformScreenFreeze();
        
        EmitSignal(SignalName.RomanCancelPerformed, (int)rcType, meterCost);
        
        GD.Print($"{character.CharacterId} performed {rcType} Roman Cancel!");
        return true;
    }
    
    /// <summary>
    /// Check if character can perform RC
    /// </summary>
    private bool CanPerformRC(Character character, RCType rcType)
    {
        // Check meter requirement
        int requiredMeter = GetRCMeterCost(rcType);
        if (character.Meter < requiredMeter) return false;
        
        // Check character state
        switch (rcType)
        {
            case RCType.Red:
                return character.CurrentState == CharacterState.Attacking;
            case RCType.Blue:
                return character.CurrentState == CharacterState.Attacking;
            case RCType.Yellow:
                return character.CurrentState == CharacterState.Attacking;
            case RCType.Purple:
                return true; // Can be used anytime after projectile
            default:
                return false;
        }
    }
    
    /// <summary>
    /// Get meter cost for RC type
    /// </summary>
    private int GetRCMeterCost(RCType rcType)
    {
        var balanceConfig = BalanceManager.Instance?.GetCurrentConfig();
        int baseCost = balanceConfig?.SystemAdjustments?.RomanCancel?.MeterCost ?? DEFAULT_RC_METER_COST;
        
        return rcType switch
        {
            RCType.Red => baseCost,
            RCType.Blue => (int)(baseCost * 0.75f), // Cheaper whiff cancel
            RCType.Yellow => (int)(baseCost * 1.25f), // More expensive recovery cancel
            RCType.Purple => (int)(baseCost * 0.5f), // Cheapest projectile cancel
            _ => baseCost
        };
    }
    
    /// <summary>
    /// Apply RC mechanical effects
    /// </summary>
    private void ApplyRCEffects(Character character, RCType rcType)
    {
        var balanceConfig = BalanceManager.Instance?.GetCurrentConfig();
        int frameAdvantage = balanceConfig?.SystemAdjustments?.RomanCancel?.FrameAdvantage ?? ADVANTAGE_FRAMES;
        
        // Reset character to neutral with advantage
        character.ChangeState(CharacterState.Idle);
        
        // Apply specific RC effects
        switch (rcType)
        {
            case RCType.Red:
                // Can continue pressure, slight forward movement
                ApplyMovementBonus(character, Vector2.Right * 50);
                break;
                
            case RCType.Blue:
                // Can escape whiff punishment, slight backward movement
                ApplyMovementBonus(character, Vector2.Left * 30);
                break;
                
            case RCType.Yellow:
                // Escape recovery frames, neutral position
                break;
                
            case RCType.Purple:
                // Enhanced movement options
                ApplyMovementBonus(character, Vector2.Right * 75);
                break;
        }
        
        // Apply temporary invincibility frames
        ApplyInvincibilityFrames(character, 8);
    }
    
    /// <summary>
    /// Apply movement bonus from RC
    /// </summary>
    private void ApplyMovementBonus(Character character, Vector2 movement)
    {
        // Apply directional movement based on facing
        if (!character.FacingRight)
        {
            movement.X *= -1;
        }
        
        character.Position += movement;
    }
    
    /// <summary>
    /// Apply temporary invincibility
    /// </summary>
    private void ApplyInvincibilityFrames(Character character, int frames)
    {
        // In a real implementation, this would set invincibility state
        GD.Print($"{character.CharacterId} has {frames} invincibility frames");
    }
    
    /// <summary>
    /// Create visual effects for RC
    /// </summary>
    private void CreateRCVisualEffects(Vector2 position, RCType rcType)
    {
        Color rcColor = rcType switch
        {
            RCType.Red => Colors.Red,
            RCType.Blue => Colors.Blue,
            RCType.Yellow => Colors.Yellow,
            RCType.Purple => Colors.Purple,
            _ => Colors.White
        };
        
        // Create visual effect (placeholder)
        GD.Print($"RC Visual Effect: {rcType} at {position}");
        
        // In a real implementation, this would spawn particle effects, screen flash, etc.
    }
    
    /// <summary>
    /// Perform screen freeze effect
    /// </summary>
    private void PerformScreenFreeze()
    {
        // Temporarily slow down time for dramatic effect
        Engine.TimeScale = 0.1f;
        
        // Create timer to restore normal time
        var timer = new Timer();
        timer.WaitTime = FREEZE_DURATION_FRAMES / 60.0; // Convert frames to seconds
        timer.OneShot = true;
        timer.Timeout += () => {
            Engine.TimeScale = 1.0f;
            timer.QueueFree();
        };
        AddChild(timer);
        timer.Start();
        
        GD.Print("Screen freeze effect applied");
    }
    
    /// <summary>
    /// Get recommended RC type based on situation
    /// </summary>
    public RCType GetRecommendedRCType(Character character, bool hitConfirm, bool inRecovery)
    {
        if (inRecovery) return RCType.Yellow;
        if (hitConfirm) return RCType.Red;
        return RCType.Blue; // Default to blue for whiff situations
    }
    
    /// <summary>
    /// Check if RC is enabled by balance system
    /// </summary>
    public bool IsRCEnabled()
    {
        return BalanceManager.Instance?.GetCurrentConfig()?.SystemAdjustments?.RomanCancel?.Enabled ?? true;
    }
}