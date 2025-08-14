using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Precise Hitbox System for frame-accurate collision detection and visualization
/// Handles hitbox/hurtbox interactions with precise spacing and whiff punishment tracking
/// </summary>
public partial class PreciseHitboxSystem : Node
{
    public static PreciseHitboxSystem Instance { get; private set; }
    
    public enum HitboxType
    {
        Attack,     // Offensive hitbox
        Hurt,       // Vulnerable hurtbox
        Grab,       // Throw/grab hitbox
        Projectile  // Projectile hitbox
    }
    
    public enum HitResult
    {
        Hit,        // Clean hit
        Block,      // Blocked attack
        Whiff,      // Attack missed
        Clash,      // Attacks collided
        Counter     // Counter hit (hit during startup/recovery)
    }
    
    private Dictionary<int, List<ActiveHitbox>> _activeHitboxes = new();
    private Dictionary<int, List<ActiveHurtbox>> _activeHurtboxes = new();
    private Dictionary<int, HitboxVisualizationData> _visualizationData = new();
    
    // Timing constants
    private const int COUNTER_HIT_WINDOW = 3; // Frames for counter hit detection
    private const float WHIFF_PUNISHMENT_RANGE = 120f; // Range for whiff punishment tracking
    
    [Signal]
    public delegate void HitDetectedEventHandler(int attackerPlayerId, int defenderPlayerId, HitResult result, Vector2 position);
    
    [Signal]
    public delegate void WhiffPunishmentOpportunityEventHandler(int punisherPlayerId, int whifferPlayerId, float advantage);
    
    [Signal]
    public delegate void SpacingAnalyzedEventHandler(int playerId, float optimalRange, float currentRange);
    
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
        UpdateHitboxes();
        CheckCollisions();
        AnalyzeSpacing();
        UpdateVisualizations();
    }
    
    /// <summary>
    /// Initialize hitbox tracking for players
    /// </summary>
    private void InitializePlayers()
    {
        for (int i = 0; i < 2; i++)
        {
            _activeHitboxes[i] = new List<ActiveHitbox>();
            _activeHurtboxes[i] = new List<ActiveHurtbox>();
            _visualizationData[i] = new HitboxVisualizationData();
        }
    }
    
    /// <summary>
    /// Activate hitbox for character move
    /// </summary>
    public void ActivateHitbox(Character character, string moveName, HitboxData hitboxData, int currentMoveFrame)
    {
        if (!_activeHitboxes.ContainsKey(character.PlayerId)) return;
        
        // Check if hitbox should be active this frame
        if (currentMoveFrame >= hitboxData.StartFrame && currentMoveFrame <= hitboxData.EndFrame)
        {
            var activeHitbox = new ActiveHitbox
            {
                PlayerId = character.PlayerId,
                MoveName = moveName,
                Data = hitboxData,
                Position = character.GlobalPosition + new Vector2(hitboxData.Position[0], hitboxData.Position[1]),
                Size = new Vector2(hitboxData.Size[0], hitboxData.Size[1]),
                FrameActive = currentMoveFrame - hitboxData.StartFrame,
                IsActive = true
            };
            
            // Adjust position based on character facing
            if (!character.FacingRight)
            {
                activeHitbox.Position = new Vector2(character.GlobalPosition.X - hitboxData.Position[0], 
                                                    character.GlobalPosition.Y + hitboxData.Position[1]);
            }
            
            _activeHitboxes[character.PlayerId].Add(activeHitbox);
            
            // Update visualization
            _visualizationData[character.PlayerId].Hitboxes.Add(activeHitbox);
        }
    }
    
    /// <summary>
    /// Activate hurtbox for character
    /// </summary>
    public void ActivateHurtbox(Character character, Vector2 position, Vector2 size)
    {
        if (!_activeHurtboxes.ContainsKey(character.PlayerId)) return;
        
        var activeHurtbox = new ActiveHurtbox
        {
            PlayerId = character.PlayerId,
            Position = character.GlobalPosition + position,
            Size = size,
            IsVulnerable = character.CurrentState != CharacterState.Hit // No hurtbox during hitstun
        };
        
        _activeHurtboxes[character.PlayerId].Add(activeHurtbox);
        
        // Update visualization
        _visualizationData[character.PlayerId].Hurtboxes.Add(activeHurtbox);
    }
    
    /// <summary>
    /// Update active hitboxes and hurtboxes
    /// </summary>
    private void UpdateHitboxes()
    {
        // Clear previous frame data
        foreach (var hitboxList in _activeHitboxes.Values)
        {
            hitboxList.Clear();
        }
        
        foreach (var hurtboxList in _activeHurtboxes.Values)
        {
            hurtboxList.Clear();
        }
        
        // Clear visualization data
        foreach (var vizData in _visualizationData.Values)
        {
            vizData.Hitboxes.Clear();
            vizData.Hurtboxes.Clear();
        }
        
        // Update based on current character states
        // This would be called by characters during their attacks
    }
    
    /// <summary>
    /// Check for hitbox/hurtbox collisions
    /// </summary>
    private void CheckCollisions()
    {
        for (int attackerId = 0; attackerId < 2; attackerId++)
        {
            int defenderId = 1 - attackerId; // Opponent
            
            if (!_activeHitboxes.ContainsKey(attackerId) || !_activeHurtboxes.ContainsKey(defenderId))
                continue;
            
            var attackerHitboxes = _activeHitboxes[attackerId];
            var defenderHurtboxes = _activeHurtboxes[defenderId];
            
            foreach (var hitbox in attackerHitboxes)
            {
                foreach (var hurtbox in defenderHurtboxes)
                {
                    if (CheckHitboxCollision(hitbox, hurtbox))
                    {
                        ProcessHit(attackerId, defenderId, hitbox, hurtbox);
                    }
                }
            }
        }
    }
    
    /// <summary>
    /// Check if hitbox and hurtbox collide
    /// </summary>
    private bool CheckHitboxCollision(ActiveHitbox hitbox, ActiveHurtbox hurtbox)
    {
        if (!hitbox.IsActive || !hurtbox.IsVulnerable) return false;
        
        // Precise rectangle collision detection
        var hitboxRect = new Rect2(hitbox.Position - hitbox.Size / 2, hitbox.Size);
        var hurtboxRect = new Rect2(hurtbox.Position - hurtbox.Size / 2, hurtbox.Size);
        
        return hitboxRect.Intersects(hurtboxRect);
    }
    
    /// <summary>
    /// Process hit between hitbox and hurtbox
    /// </summary>
    private void ProcessHit(int attackerId, int defenderId, ActiveHitbox hitbox, ActiveHurtbox hurtbox)
    {
        var attacker = GetCharacterByPlayerId(attackerId);
        var defender = GetCharacterByPlayerId(defenderId);
        
        if (attacker == null || defender == null) return;
        
        // Determine hit result
        HitResult result = DetermineHitResult(attacker, defender, hitbox);
        
        // Calculate hit position
        Vector2 hitPosition = (hitbox.Position + hurtbox.Position) / 2;
        
        // Process based on result
        switch (result)
        {
            case HitResult.Hit:
                ProcessCleanHit(attacker, defender, hitbox, hitPosition);
                break;
                
            case HitResult.Block:
                ProcessBlockedHit(attacker, defender, hitbox, hitPosition);
                break;
                
            case HitResult.Counter:
                ProcessCounterHit(attacker, defender, hitbox, hitPosition);
                break;
        }
        
        EmitSignal(SignalName.HitDetected, attackerId, defenderId, (int)result, hitPosition);
    }
    
    /// <summary>
    /// Determine the result of hit collision
    /// </summary>
    private HitResult DetermineHitResult(Character attacker, Character defender, ActiveHitbox hitbox)
    {
        // Check if defender is blocking
        if (defender.CurrentState == CharacterState.Blocking)
        {
            return HitResult.Block;
        }
        
        // Check for counter hit (hitting during startup or recovery)
        if (defender.CurrentState == CharacterState.Attacking && defender.StateFrame <= COUNTER_HIT_WINDOW)
        {
            return HitResult.Counter;
        }
        
        return HitResult.Hit;
    }
    
    /// <summary>
    /// Process clean hit
    /// </summary>
    private void ProcessCleanHit(Character attacker, Character defender, ActiveHitbox hitbox, Vector2 position)
    {
        // Apply damage
        int damage = CalculateDamage(attacker, defender, hitbox.Data);
        defender.TakeDamage(damage);
        
        // Apply hitstun
        ApplyHitstun(defender, hitbox.Data.Hitstun);
        
        // Check for knockdown
        if (hitbox.Data.Knockdown)
        {
            Vector2 knockdownForce = CalculateKnockdownForce(attacker, defender, hitbox);
            OkiWakeupSystem.Instance?.InitiateKnockdown(defender, hitbox.MoveName, knockdownForce);
        }
        
        // Apply pushback
        ApplyHitPushback(attacker, defender, hitbox);
        
        CreateHitEffect(position, HitResult.Hit);
    }
    
    /// <summary>
    /// Process blocked hit
    /// </summary>
    private void ProcessBlockedHit(Character attacker, Character defender, ActiveHitbox hitbox, Vector2 position)
    {
        // Apply blockstun
        ApplyBlockstun(defender, hitbox.Data.Blockstun);
        
        // Apply frame advantage/disadvantage
        ApplyFrameAdvantage(attacker, defender, hitbox.Data);
        
        // Handle chip damage (integrate with FaultlessDefenseSystem)
        float chipReduction = FaultlessDefenseSystem.Instance?.GetChipDamageReduction(defender.PlayerId) ?? 0f;
        int chipDamage = CalculateChipDamage(hitbox.Data.Damage, chipReduction);
        
        if (chipDamage > 0)
        {
            defender.TakeDamage(chipDamage);
        }
        
        // Apply pushback
        ApplyBlockPushback(attacker, defender, hitbox);
        
        CreateHitEffect(position, HitResult.Block);
    }
    
    /// <summary>
    /// Process counter hit
    /// </summary>
    private void ProcessCounterHit(Character attacker, Character defender, ActiveHitbox hitbox, Vector2 position)
    {
        // Enhanced damage and hitstun for counter hits
        int damage = CalculateDamage(attacker, defender, hitbox.Data);
        int counterDamage = (int)(damage * 1.2f); // 20% damage bonus
        
        defender.TakeDamage(counterDamage);
        
        // Extended hitstun for counter hits
        int counterHistun = (int)(hitbox.Data.Hitstun * 1.5f);
        ApplyHitstun(defender, counterHistun);
        
        // Counter hits often lead to knockdown
        if (hitbox.Data.Damage >= 80) // Heavy attacks
        {
            Vector2 knockdownForce = CalculateKnockdownForce(attacker, defender, hitbox) * 1.3f;
            OkiWakeupSystem.Instance?.InitiateKnockdown(defender, "counter_" + hitbox.MoveName, knockdownForce);
        }
        
        CreateHitEffect(position, HitResult.Counter);
        
        GD.Print($"COUNTER HIT! {attacker.CharacterId} → {defender.CharacterId}");
    }
    
    /// <summary>
    /// Analyze spacing between characters
    /// </summary>
    private void AnalyzeSpacing()
    {
        // Get both characters (simplified for now)
        // In real implementation, this would reference active characters
        
        for (int playerId = 0; playerId < 2; playerId++)
        {
            var character = GetCharacterByPlayerId(playerId);
            if (character == null) continue;
            
            var opponent = GetCharacterByPlayerId(1 - playerId);
            if (opponent == null) continue;
            
            float currentRange = character.GlobalPosition.DistanceTo(opponent.GlobalPosition);
            float optimalRange = CalculateOptimalRange(character, opponent);
            
            // Check for whiff punishment opportunities
            if (opponent.CurrentState == CharacterState.Attacking)
            {
                CheckWhiffPunishmentOpportunity(character, opponent, currentRange);
            }
            
            EmitSignal(SignalName.SpacingAnalyzed, playerId, optimalRange, currentRange);
        }
    }
    
    /// <summary>
    /// Check for whiff punishment opportunity
    /// </summary>
    private void CheckWhiffPunishmentOpportunity(Character punisher, Character whiffer, float distance)
    {
        // Check if attack whiffed and punisher is in range
        if (distance <= WHIFF_PUNISHMENT_RANGE)
        {
            // Calculate advantage frames (recovery - travel time)
            float travelTime = distance / 200f; // Approximate movement speed
            float advantage = CalculateWhiffAdvantage(whiffer, travelTime);
            
            if (advantage > 0)
            {
                EmitSignal(SignalName.WhiffPunishmentOpportunity, punisher.PlayerId, whiffer.PlayerId, advantage);
            }
        }
    }
    
    /// <summary>
    /// Calculate optimal spacing for character
    /// </summary>
    private float CalculateOptimalRange(Character character, Character opponent)
    {
        // Base optimal range on character archetype
        return character.Data?.Archetype switch
        {
            "zoner" => 200f,      // Zoners want long range
            "grappler" => 80f,    // Grapplers want close range
            "rushdown" => 100f,   // Rushdown wants medium-close range
            "shoto" => 140f,      // Shotos want mid range
            "technical" => 120f,  // Technical wants controllable range
            _ => 120f
        };
    }
    
    /// <summary>
    /// Calculate whiff punishment advantage
    /// </summary>
    private float CalculateWhiffAdvantage(Character whiffer, float travelTime)
    {
        // Simplified calculation based on recovery frames
        // In real implementation, this would use actual move data
        return Math.Max(0, 20 - (travelTime * 60)); // Approximate recovery frames minus travel
    }
    
    /// <summary>
    /// Calculate damage with balance adjustments
    /// </summary>
    private int CalculateDamage(Character attacker, Character defender, HitboxData hitboxData)
    {
        float baseDamage = hitboxData.Damage;
        
        // Apply attacker damage multiplier
        float attackerMultiplier = BalanceManager.Instance?.GetAdjustedDamage(attacker.CharacterId, "default", 1.0f) ?? 1.0f;
        
        // Apply combo scaling if in combo
        float scalingMultiplier = ComboScalingSystem.Instance?.GetCurrentScaling(defender.PlayerId) ?? 1.0f;
        
        return (int)(baseDamage * attackerMultiplier * scalingMultiplier);
    }
    
    /// <summary>
    /// Calculate chip damage with reduction
    /// </summary>
    private int CalculateChipDamage(int baseDamage, float reduction)
    {
        float chipPercent = 0.125f; // 12.5% of damage as chip
        int chipDamage = (int)(baseDamage * chipPercent);
        
        // Apply Faultless Defense reduction
        chipDamage = (int)(chipDamage * (1.0f - reduction));
        
        return Math.Max(1, chipDamage); // Minimum 1 chip damage
    }
    
    /// <summary>
    /// Apply hitstun to character
    /// </summary>
    private void ApplyHitstun(Character character, int frames)
    {
        character.ChangeState(CharacterState.Hit);
        // In real implementation, this would set specific hitstun duration
        GD.Print($"{character.CharacterId} in hitstun for {frames} frames");
    }
    
    /// <summary>
    /// Apply blockstun to character
    /// </summary>
    private void ApplyBlockstun(Character character, int frames)
    {
        // In real implementation, this would set specific blockstun duration
        GD.Print($"{character.CharacterId} in blockstun for {frames} frames");
    }
    
    /// <summary>
    /// Apply frame advantage/disadvantage
    /// </summary>
    private void ApplyFrameAdvantage(Character attacker, Character defender, HitboxData hitboxData)
    {
        // Frame advantage calculation: defender blockstun vs attacker recovery
        // Since HitboxData doesn't have RecoveryFrames, we'll estimate from active frames
        int estimatedRecovery = 15; // Default recovery frames
        int advantage = hitboxData.Blockstun - estimatedRecovery;
        
        GD.Print($"Frame advantage: {advantage} frames (positive = attacker advantage)");
        
        // In real implementation, this would modify character timing states
    }
    
    /// <summary>
    /// Apply pushback on hit
    /// </summary>
    private void ApplyHitPushback(Character attacker, Character defender, ActiveHitbox hitbox)
    {
        Vector2 pushDirection = (defender.GlobalPosition - attacker.GlobalPosition).Normalized();
        float pushDistance = 30f; // Base pushback
        
        // Adjust pushback based on move properties
        // Since HitboxData doesn't have Properties, we'll use damage as indicator
        if (hitbox.Data.Damage >= 100) // Heavy attacks
        {
            pushDistance *= 1.5f;
        }
        
        defender.Position += pushDirection * pushDistance;
        attacker.Position -= pushDirection * (pushDistance * 0.3f); // Slight recoil
    }
    
    /// <summary>
    /// Apply pushback on block
    /// </summary>
    private void ApplyBlockPushback(Character attacker, Character defender, ActiveHitbox hitbox)
    {
        Vector2 pushDirection = (defender.GlobalPosition - attacker.GlobalPosition).Normalized();
        float pushDistance = 20f; // Reduced pushback on block
        
        // Faultless Defense increases pushback
        var fdState = FaultlessDefenseSystem.Instance?.GetFDState(defender.PlayerId);
        if (fdState?.IsFDActive == true)
        {
            pushDistance *= 2.5f; // Enhanced pushback
        }
        
        defender.Position += pushDirection * pushDistance;
        attacker.Position -= pushDirection * (pushDistance * 0.2f);
    }
    
    /// <summary>
    /// Calculate knockdown force
    /// </summary>
    private Vector2 CalculateKnockdownForce(Character attacker, Character defender, ActiveHitbox hitbox)
    {
        Vector2 baseForce = (defender.GlobalPosition - attacker.GlobalPosition).Normalized() * 80f;
        
        // Add upward component for air knockdowns based on damage level
        if (hitbox.Data.Damage >= 120) // High damage attacks act as launchers
        {
            baseForce.Y -= 60f;
        }
        
        return baseForce;
    }
    
    /// <summary>
    /// Create hit visual effects
    /// </summary>
    private void CreateHitEffect(Vector2 position, HitResult result)
    {
        Color effectColor = result switch
        {
            HitResult.Hit => Colors.White,
            HitResult.Block => Colors.Gray,
            HitResult.Counter => Colors.Red,
            HitResult.Clash => Colors.Yellow,
            _ => Colors.White
        };
        
        string effectName = result switch
        {
            HitResult.Hit => "HIT",
            HitResult.Block => "BLOCK",
            HitResult.Counter => "COUNTER!",
            HitResult.Clash => "CLASH",
            _ => ""
        };
        
        GD.Print($"Hit Effect: {effectName} at {position}");
        
        // In real implementation, this would create:
        // - Impact particles
        // - Screen shake for heavy hits
        // - Hit sparks
        // - Sound effects
    }
    
    /// <summary>
    /// Update hitbox visualizations for debug mode
    /// </summary>
    private void UpdateVisualizations()
    {
        // This would update debug visualization overlays
        // In real implementation, this would draw rectangles for hitboxes/hurtboxes
    }
    
    /// <summary>
    /// Get character by player ID (placeholder)
    /// </summary>
    private Character GetCharacterByPlayerId(int playerId)
    {
        // In real implementation, this would reference the game scene
        return null;
    }
    
    /// <summary>
    /// Get hitbox visualization data for player
    /// </summary>
    public HitboxVisualizationData GetVisualizationData(int playerId)
    {
        return _visualizationData.GetValueOrDefault(playerId, new HitboxVisualizationData());
    }
    
    /// <summary>
    /// Toggle hitbox visualization
    /// </summary>
    public void ToggleVisualization(bool enabled)
    {
        foreach (var vizData in _visualizationData.Values)
        {
            vizData.ShowHitboxes = enabled;
        }
    }
    
    /// <summary>
    /// Check if precise hitbox system is enabled
    /// </summary>
    public bool IsPreciseHitboxEnabled()
    {
        return true; // Always enabled for competitive integrity
    }
}

/// <summary>
/// Active hitbox data
/// </summary>
public class ActiveHitbox
{
    public int PlayerId { get; set; }
    public string MoveName { get; set; } = "";
    public HitboxData Data { get; set; }
    public Vector2 Position { get; set; }
    public Vector2 Size { get; set; }
    public int FrameActive { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Active hurtbox data
/// </summary>
public class ActiveHurtbox
{
    public int PlayerId { get; set; }
    public Vector2 Position { get; set; }
    public Vector2 Size { get; set; }
    public bool IsVulnerable { get; set; } = true;
}

/// <summary>
/// Visualization data for debugging
/// </summary>
public class HitboxVisualizationData
{
    public List<ActiveHitbox> Hitboxes { get; set; } = new();
    public List<ActiveHurtbox> Hurtboxes { get; set; } = new();
    public bool ShowHitboxes { get; set; } = false;
}