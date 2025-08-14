using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;

/// <summary>
/// Enhanced character class with archetype system and balance integration
/// </summary>
public partial class Character : CharacterBody2D
{
    [Export] public string CharacterId { get; set; } = "";
    [Export] public int PlayerId { get; set; } = 0;
    [Export] public bool FacingRight { get; set; } = true;
    [Export] public string SelectedSubArchetype { get; set; } = ""; // Empty means default
    
    // Real-time sprite generation settings
    [Export] public bool UseRealtimeSprites { get; set; } = true;
    [Export] public bool UseEnhancedQuality { get; set; } = true;
    [Export] public string SpritePalette { get; set; } = "default";
    
    // Character data
    public CharacterData Data { get; private set; }
    
    // Components
    public AnimationPlayer AnimationPlayer { get; private set; }
    public AnimationTree AnimationTree { get; private set; }
    public Area2D HitboxArea { get; private set; }
    public Area2D HurtboxArea { get; private set; }
    public Sprite2D CharacterSprite { get; private set; }
    public AnimatedSprite2D AnimatedSprite { get; private set; }
    
    // Real-time sprite generation component
    private Node RealtimeAnimatedComponent { get; set; }
    
    // State
    public CharacterState CurrentState { get; private set; } = CharacterState.Idle;
    public int Health { get; private set; }
    public int Meter { get; private set; }
    public int CurrentFrame { get; private set; }
    public int StateFrame { get; private set; }
    
    // Combat tracking for telemetry
    private PlayerMatchStats _matchStats = new();
    private int _comboCounter = 0;
    private bool _inCombo = false;
    
    // Movement
    private Vector2 _velocity = Vector2.Zero;
    private bool _isGrounded = true;
    
    // Combat
    private List<Hitbox> _activeHitboxes = new();
    private Dictionary<string, int> _inputBuffer = new();
    private const int INPUT_BUFFER_SIZE = 15; // frames
    
    [Signal]
    public delegate void HealthChangedEventHandler(int newHealth, int maxHealth);
    
    [Signal]
    public delegate void MeterChangedEventHandler(int newMeter, int maxMeter);
    
    [Signal]
    public delegate void StateChangedEventHandler(CharacterState newState);
    
    [Signal]
    public delegate void ComboPerformedEventHandler(int damage, int hits);
    
    public override void _Ready()
    {
        LoadCharacterData();
        SetupComponents();
        InitializeCharacter();
    }
    
    private void LoadCharacterData()
    {
        if (string.IsNullOrEmpty(CharacterId))
        {
            GD.PrintErr("Character ID not set!");
            return;
        }
        
        string dataPath = $"res://data/characters/{CharacterId}.json";
        if (!FileAccess.FileExists(dataPath))
        {
            GD.PrintErr($"Character data file not found: {dataPath}");
            return;
        }
        
        using var file = FileAccess.Open(dataPath, FileAccess.ModeFlags.Read);
        string jsonText = file.GetAsText();
        
        try
        {
            var baseData = JsonSerializer.Deserialize<CharacterData>(jsonText);
            
            // Apply sub-archetype if specified
            if (!string.IsNullOrEmpty(SelectedSubArchetype) && SubArchetypeManager.Instance != null)
            {
                Data = SubArchetypeManager.Instance.ApplySubArchetype(baseData, SelectedSubArchetype);
                GD.Print($"Loaded character data for {Data.Name} (Archetype: {Data.Archetype}, Sub-archetype: {SelectedSubArchetype})");
            }
            else
            {
                // Use default sub-archetype
                if (SubArchetypeManager.Instance != null && baseData.SubArchetypes.Count > 0)
                {
                    var defaultSubArchetype = SubArchetypeManager.Instance.GetDefaultSubArchetype(baseData);
                    if (defaultSubArchetype != null)
                    {
                        Data = SubArchetypeManager.Instance.ApplySubArchetype(baseData, defaultSubArchetype.SubArchetypeId);
                        GD.Print($"Loaded character data for {Data.Name} (Archetype: {Data.Archetype}, Default Sub-archetype: {defaultSubArchetype.Name})");
                    }
                    else
                    {
                        Data = baseData;
                        GD.Print($"Loaded character data for {Data.Name} (Archetype: {Data.Archetype}, No sub-archetype)");
                    }
                }
                else
                {
                    Data = baseData;
                    GD.Print($"Loaded character data for {Data.Name} (Archetype: {Data.Archetype})");
                }
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to parse character data: {e.Message}");
        }
    }
    
    private void SetupComponents()
    {
        AnimationPlayer = GetNode<AnimationPlayer>("AnimationPlayer");
        AnimationTree = GetNodeOrNull<AnimationTree>("AnimationTree");
        HitboxArea = GetNode<Area2D>("HitboxArea");
        HurtboxArea = GetNode<Area2D>("HurtboxArea");
        CharacterSprite = GetNodeOrNull<Sprite2D>("CharacterSprite");
        AnimatedSprite = GetNodeOrNull<AnimatedSprite2D>("AnimatedSprite2D");
        
        // Connect hurtbox to take damage
        HurtboxArea.AreaEntered += OnHurtboxEntered;
        
        // Setup sprite system based on configuration
        if (UseRealtimeSprites)
        {
            SetupRealtimeSprites();
        }
        else
        {
            // Use traditional sprite loading
            LoadCharacterSprite();
        }
    }
    
    private void LoadCharacterSprite()
    {
        if (string.IsNullOrEmpty(CharacterId))
        {
            GD.PrintErr("Cannot load sprite: Character ID not set!");
            return;
        }
        
        // Try to load the enhanced idle sprite first, fallback to original if not found
        string enhancedSpritePath = $"res://assets/sprites/street_fighter_6/{CharacterId}/sprites/{CharacterId}_idle_enhanced.png";
        string originalSpritePath = $"res://assets/sprites/street_fighter_6/{CharacterId}/sprites/{CharacterId}_idle.png";
        
        string spritePath = ResourceLoader.Exists(enhancedSpritePath) ? enhancedSpritePath : originalSpritePath;
        
        if (ResourceLoader.Exists(spritePath))
        {
            var texture = GD.Load<Texture2D>(spritePath);
            if (texture != null && CharacterSprite != null)
            {
                CharacterSprite.Texture = texture;
                GD.Print($"Loaded sprite for {CharacterId}: {spritePath}");
            }
            else
            {
                GD.PrintErr($"Failed to load sprite texture: {spritePath}");
            }
        }
        else
        {
            GD.PrintErr($"Sprite file not found: {spritePath}");
        }
    }
    
    /// <summary>
    /// Setup real-time sprite generation system
    /// </summary>
    private void SetupRealtimeSprites()
    {
        // Ensure we have an AnimatedSprite2D node
        if (AnimatedSprite == null)
        {
            AnimatedSprite = new AnimatedSprite2D
            {
                Name = "AnimatedSprite2D"
            };
            AddChild(AnimatedSprite);
            
            // Hide the static sprite if we're using real-time generation
            if (CharacterSprite != null)
            {
                CharacterSprite.Visible = false;
            }
        }
        
        // Create and setup the real-time animated sprite component
        var script = GD.Load<Script>("res://scripts/graphics/RealtimeAnimatedSpriteComponent.gd");
        if (script != null)
        {
            var componentObject = script.Call("new");
            var realtimeComponent = componentObject.AsGodotObject() as Node;
            if (realtimeComponent != null)
            {
                RealtimeAnimatedComponent = realtimeComponent;
                RealtimeAnimatedComponent.Name = "RealtimeAnimatedSpriteComponent";
                AddChild(RealtimeAnimatedComponent);
                
                // Configure the component
                RealtimeAnimatedComponent.Set("character_id", CharacterId);
                RealtimeAnimatedComponent.Set("use_enhanced_quality", UseEnhancedQuality);
                RealtimeAnimatedComponent.Set("palette_name", SpritePalette);
                RealtimeAnimatedComponent.Set("auto_generate_frames", true);
                RealtimeAnimatedComponent.Set("enable_interpolation", true);
                
                // Setup the component with our character and sprite references
                RealtimeAnimatedComponent.Call("setup_for_character", this, AnimatedSprite);
                
                // Connect to character state changes
                RealtimeAnimatedComponent.Call("connect_to_character_signals", this);
                
                GD.Print($"Real-time sprite generation enabled for {CharacterId}");
            }
            else
            {
                GD.PrintErr("Failed to create RealtimeAnimatedSpriteComponent instance");
                // Fallback to traditional sprites
                UseRealtimeSprites = false;
                LoadCharacterSprite();
            }
        }
        else
        {
            GD.PrintErr("RealtimeAnimatedSpriteComponent script not found, falling back to traditional sprites");
            UseRealtimeSprites = false;
            LoadCharacterSprite();
        }
    }
    
    private void InitializeCharacter()
    {
        if (Data != null)
        {
            // Apply balance adjustments to base stats
            Health = (int)(Data.Health * GetBalanceMultiplier("health"));
            Meter = 0;
            EmitSignal(SignalName.HealthChanged, Health, Data.Health);
            EmitSignal(SignalName.MeterChanged, Meter, Data.Meter);
        }
    }
    
    private float GetBalanceMultiplier(string statType)
    {
        if (BalanceManager.Instance?.GetCurrentConfig() is var config && config != null)
        {
            if (config.CharacterAdjustments.ContainsKey(CharacterId))
            {
                var adjustment = config.CharacterAdjustments[CharacterId];
                return statType switch
                {
                    "health" => adjustment.HealthMultiplier,
                    "damage" => adjustment.DamageMultiplier,
                    "speed" => adjustment.SpeedMultiplier,
                    _ => 1.0f
                };
            }
        }
        return 1.0f;
    }
    
    public override void _PhysicsProcess(double delta)
    {
        CurrentFrame++;
        StateFrame++;
        
        UpdatePhysics(delta);
        ProcessInput();
        UpdateState();
        UpdateHitboxes();
        
        MoveAndSlide();
    }
    
    private void UpdatePhysics(double delta)
    {
        // Apply gravity
        if (!_isGrounded)
        {
            _velocity.Y += (float)((double)ProjectSettings.GetSetting("physics/2d/default_gravity", 980.0) * delta);
        }
        
        // Apply speed multiplier from balance system
        var speedMultiplier = GetBalanceMultiplier("speed");
        
        // Update velocity
        Velocity = _velocity * speedMultiplier;
        
        // Check if grounded
        _isGrounded = IsOnFloor();
        if (_isGrounded && _velocity.Y > 0)
        {
            _velocity.Y = 0;
        }
    }
    
    private void ProcessInput()
    {
        if (InputManager.Instance == null) return;
        
        var input = InputManager.Instance.GetPlayerInput(PlayerId);
        
        // Buffer inputs for special moves
        BufferInput(input);
        
        // Process movement
        ProcessMovementInput(input);
        
        // Process attacks
        ProcessAttackInput(input);
    }
    
    private void BufferInput(PlayerInputState input)
    {
        // Enhanced input buffering with motion detection
        if (input.AnyButton)
        {
            string inputString = "";
            if (input.LightPunch) inputString += "LP";
            if (input.MediumPunch) inputString += "MP";
            if (input.HeavyPunch) inputString += "HP";
            if (input.LightKick) inputString += "LK";
            if (input.MediumKick) inputString += "MK";
            if (input.HeavyKick) inputString += "HK";
            
            // Add motion inputs
            string motionInput = GetMotionInput(input);
            if (!string.IsNullOrEmpty(motionInput))
            {
                inputString = motionInput + inputString;
            }
            
            _inputBuffer[inputString] = CurrentFrame;
        }
        
        // Clean old inputs
        var keysToRemove = new List<string>();
        foreach (var kvp in _inputBuffer)
        {
            if (CurrentFrame - kvp.Value > INPUT_BUFFER_SIZE)
            {
                keysToRemove.Add(kvp.Key);
            }
        }
        foreach (var key in keysToRemove)
        {
            _inputBuffer.Remove(key);
        }
    }
    
    private string GetMotionInput(PlayerInputState input)
    {
        // Simplified motion detection - in production this would be more sophisticated
        if (input.Down && input.Right) return "236"; // Quarter-circle forward
        if (input.Down && input.Left) return "214"; // Quarter-circle back
        if (input.Right && input.Down && input.Right) return "623"; // Dragon punch
        if (input.Down) return "2"; // Down
        return "";
    }
    
    private void ProcessMovementInput(PlayerInputState input)
    {
        if (CurrentState != CharacterState.Idle && CurrentState != CharacterState.Walking) return;
        
        float moveDirection = 0;
        if (input.Left) moveDirection -= 1;
        if (input.Right) moveDirection += 1;
        
        // Flip facing direction
        if (moveDirection != 0)
        {
            FacingRight = moveDirection > 0;
            Scale = new Vector2(FacingRight ? 1 : -1, 1);
        }
        
        // Apply movement
        if (Data != null)
        {
            _velocity.X = moveDirection * Data.WalkSpeed;
            
            if (moveDirection != 0 && CurrentState == CharacterState.Idle)
            {
                ChangeState(CharacterState.Walking);
            }
            else if (moveDirection == 0 && CurrentState == CharacterState.Walking)
            {
                ChangeState(CharacterState.Idle);
            }
        }
        
        // Jump
        if (input.Up && _isGrounded)
        {
            _velocity.Y = -Data?.JumpHeight ?? -300;
            ChangeState(CharacterState.Jumping);
        }
        
        // Crouch
        if (input.Down && _isGrounded && CurrentState == CharacterState.Idle)
        {
            ChangeState(CharacterState.Crouching);
        }
        else if (!input.Down && CurrentState == CharacterState.Crouching)
        {
            ChangeState(CharacterState.Idle);
        }
    }
    
    private void ProcessAttackInput(PlayerInputState input)
    {
        if (CurrentState != CharacterState.Idle && CurrentState != CharacterState.Walking) return;
        
        // Check for special move inputs first
        if (CheckSpecialMoves()) return;
        
        // Check for normal attacks
        if (InputManager.Instance.IsInputJustPressed(PlayerId, "light_punch"))
        {
            PerformMove("lightPunch");
        }
        else if (InputManager.Instance.IsInputJustPressed(PlayerId, "medium_punch"))
        {
            PerformMove("mediumPunch");
        }
        else if (InputManager.Instance.IsInputJustPressed(PlayerId, "heavy_punch"))
        {
            PerformMove("heavyPunch");
        }
        else if (InputManager.Instance.IsInputJustPressed(PlayerId, "light_kick"))
        {
            PerformMove("lightKick");
        }
        else if (InputManager.Instance.IsInputJustPressed(PlayerId, "medium_kick"))
        {
            PerformMove("mediumKick");
        }
        else if (InputManager.Instance.IsInputJustPressed(PlayerId, "heavy_kick"))
        {
            PerformMove("heavyKick");
        }
    }
    
    private bool CheckSpecialMoves()
    {
        if (Data?.Moves?.Specials == null) return false;
        
        foreach (var special in Data.Moves.Specials)
        {
            if (IsInputInBuffer(special.Value.Input))
            {
                if (!BalanceManager.Instance?.IsMoveDisabled(CharacterId, special.Key) == true)
                {
                    PerformSpecialMove(special.Key, special.Value);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    private bool IsInputInBuffer(string input)
    {
        // Simplified input checking - would be more sophisticated in production
        return _inputBuffer.ContainsKey(input);
    }
    
    private void PerformMove(string moveName)
    {
        if (Data?.Moves?.Normals?.ContainsKey(moveName) == true)
        {
            var moveData = Data.Moves.Normals[moveName];
            
            // Check if move is disabled by balance system
            if (BalanceManager.Instance?.IsMoveDisabled(CharacterId, moveName) == true)
            {
                return;
            }
            
            ChangeState(CharacterState.Attacking);
            
            // Track move usage for telemetry
            TrackMoveUsage(moveName, moveData);
            
            GD.Print($"Performing {moveData.Name}");
        }
    }
    
    private void PerformSpecialMove(string moveName, MoveData moveData)
    {
        // Check meter cost
        if (moveData.MeterCost > Meter) return;
        
        ChangeState(CharacterState.Attacking);
        
        // Consume meter
        if (moveData.MeterCost > 0)
        {
            ConsumeMeter(moveData.MeterCost);
        }
        
        // Track move usage
        TrackMoveUsage(moveName, moveData);
        
        GD.Print($"Performing special move: {moveData.Name}");
    }
    
    private void TrackMoveUsage(string moveName, MoveData moveData)
    {
        if (!_matchStats.MoveUsage.ContainsKey(moveName))
        {
            _matchStats.MoveUsage[moveName] = new MoveUsageStats();
        }
        
        _matchStats.MoveUsage[moveName].TimesUsed++;
    }
    
    private void UpdateState()
    {
        switch (CurrentState)
        {
            case CharacterState.Jumping:
                if (_isGrounded)
                {
                    ChangeState(CharacterState.Idle);
                }
                break;
                
            case CharacterState.Attacking:
                // This would check animation completion in a real implementation
                if (StateFrame > 30) // Placeholder
                {
                    ChangeState(CharacterState.Idle);
                }
                break;
                
            case CharacterState.Hit:
                if (StateFrame > 20) // Hitstun duration
                {
                    ChangeState(CharacterState.Idle);
                    EndCombo();
                }
                break;
        }
    }
    
    private void UpdateHitboxes()
    {
        // Update active hitboxes based on current animation frame
        _activeHitboxes.Clear();
        
        // This would be populated based on move data and current frame
    }
    
    public void ChangeState(CharacterState newState)
    {
        if (CurrentState == newState) return;
        
        CurrentState = newState;
        StateFrame = 0;
        EmitSignal(SignalName.StateChanged, (int)newState);
        
        // Update animation
        UpdateAnimation();
    }
    
    private void UpdateAnimation()
    {
        if (AnimationPlayer == null || Data?.Animations == null) return;
        
        // For real-time sprites, the RealtimeAnimatedSpriteComponent handles animation updates automatically
        // For traditional sprites, load the appropriate sprite based on current state
        if (!UseRealtimeSprites)
        {
            LoadSpriteForState(CurrentState);
        }
        
        string animationName = CurrentState switch
        {
            CharacterState.Idle => Data.Animations.Idle,
            CharacterState.Walking => FacingRight ? Data.Animations.WalkForward : Data.Animations.WalkBackward,
            CharacterState.Jumping => Data.Animations.Jump,
            CharacterState.Crouching => Data.Animations.Crouch,
            CharacterState.Attacking => Data.Animations.Idle, // Would be specific to move
            CharacterState.Hit => Data.Animations.Hit,
            CharacterState.Blocking => Data.Animations.Block,
            _ => Data.Animations.Idle
        };
        
        if (AnimationPlayer.HasAnimation(animationName))
        {
            AnimationPlayer.Play(animationName);
        }
    }
    
    private void LoadSpriteForState(CharacterState state)
    {
        if (string.IsNullOrEmpty(CharacterId) || CharacterSprite == null) return;
        
        string spriteFileName = state switch
        {
            CharacterState.Idle => $"{CharacterId}_idle.png",
            CharacterState.Walking => $"{CharacterId}_walk.png",
            CharacterState.Jumping => $"{CharacterId}_jump.png",
            CharacterState.Attacking => $"{CharacterId}_attack.png",
            _ => $"{CharacterId}_idle.png"
        };
        
        // Try enhanced version first, fallback to original
        string enhancedSpritePath = $"res://assets/sprites/street_fighter_6/{CharacterId}/sprites/{spriteFileName.Replace(".png", "_enhanced.png")}";
        string originalSpritePath = $"res://assets/sprites/street_fighter_6/{CharacterId}/sprites/{spriteFileName}";
        
        string spritePath = ResourceLoader.Exists(enhancedSpritePath) ? enhancedSpritePath : originalSpritePath;
        
        if (ResourceLoader.Exists(spritePath))
        {
            var texture = GD.Load<Texture2D>(spritePath);
            if (texture != null)
            {
                CharacterSprite.Texture = texture;
            }
        }
    }
    
    private void OnHurtboxEntered(Area2D area)
    {
        // Handle taking damage
        if (area.GetParent() is Character attacker && attacker != this)
        {
            float damage = BalanceManager.Instance?.GetAdjustedDamage(attacker.CharacterId, "default", 50) ?? 50;
            TakeDamage((int)damage);
            
            // Track combo
            if (!_inCombo)
            {
                StartCombo();
            }
            _comboCounter++;
        }
    }
    
    public void TakeDamage(int damage)
    {
        Health = Mathf.Max(0, Health - damage);
        EmitSignal(SignalName.HealthChanged, Health, Data?.Health ?? 1000);
        
        // Track damage for telemetry
        _matchStats.DamageDealt += damage;
        
        if (Health <= 0)
        {
            ChangeState(CharacterState.Knocked);
        }
        else
        {
            ChangeState(CharacterState.Hit);
        }
    }
    
    public void GainMeter(int amount)
    {
        var adjustedAmount = (int)(amount * BalanceManager.Instance?.GetCurrentConfig()?.GlobalMultipliers?.MeterGainScale ?? 1.0f);
        Meter = Mathf.Min(Data?.Meter ?? 100, Meter + adjustedAmount);
        EmitSignal(SignalName.MeterChanged, Meter, Data?.Meter ?? 100);
    }
    
    public void ConsumeMeter(int amount)
    {
        Meter = Mathf.Max(0, Meter - amount);
        _matchStats.MeterUsed += amount;
        EmitSignal(SignalName.MeterChanged, Meter, Data?.Meter ?? 100);
    }
    
    private void StartCombo()
    {
        _inCombo = true;
        _comboCounter = 0;
    }
    
    private void EndCombo()
    {
        if (_inCombo && _comboCounter > 1)
        {
            _matchStats.CombosPerformed++;
            EmitSignal(SignalName.ComboPerformed, _comboCounter * 50, _comboCounter); // Estimated damage
        }
        
        _inCombo = false;
        _comboCounter = 0;
    }
    
    public PlayerMatchStats GetMatchStats() => _matchStats;
    
    public void ResetMatchStats()
    {
        _matchStats = new PlayerMatchStats();
    }
    
    /// <summary>
    /// Get available sub-archetypes for this character
    /// </summary>
    public static List<SubArchetypeData> GetAvailableSubArchetypes(string characterId)
    {
        string dataPath = $"res://data/characters/{characterId}.json";
        if (!FileAccess.FileExists(dataPath))
        {
            return new List<SubArchetypeData>();
        }
        
        using var file = FileAccess.Open(dataPath, FileAccess.ModeFlags.Read);
        string jsonText = file.GetAsText();
        
        try
        {
            var characterData = JsonSerializer.Deserialize<CharacterData>(jsonText);
            return characterData?.SubArchetypes ?? new List<SubArchetypeData>();
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to parse character data for sub-archetypes: {e.Message}");
            return new List<SubArchetypeData>();
        }
    }
    
    /// <summary>
    /// Set the selected sub-archetype and reload character data
    /// </summary>
    public void SetSubArchetype(string subArchetypeId)
    {
        SelectedSubArchetype = subArchetypeId;
        LoadCharacterData();
        InitializeCharacter();
    }
    
    /// <summary>
    /// Real-time sprite generation methods
    /// </summary>
    
    /// <summary>
    /// Change character color palette instantly (real-time sprites only)
    /// </summary>
    public void SetSpritePalette(string newPalette)
    {
        if (!UseRealtimeSprites || RealtimeAnimatedComponent == null)
        {
            GD.PrintErr("Real-time sprites not enabled, cannot change palette");
            return;
        }
        
        SpritePalette = newPalette;
        RealtimeAnimatedComponent.Call("set_character_palette", newPalette);
        GD.Print($"Changed {CharacterId} palette to {newPalette}");
    }
    
    /// <summary>
    /// Adjust character proportions in real-time
    /// </summary>
    public void SetCharacterProportions(float limbLength = 1.0f, float headSize = 1.0f, float bodyWidth = 1.0f)
    {
        if (!UseRealtimeSprites || RealtimeAnimatedComponent == null)
        {
            GD.PrintErr("Real-time sprites not enabled, cannot change proportions");
            return;
        }
        
        RealtimeAnimatedComponent.Call("set_limb_length", limbLength);
        RealtimeAnimatedComponent.Call("set_head_size", headSize);
        RealtimeAnimatedComponent.Call("set_body_width", bodyWidth);
        GD.Print($"Changed {CharacterId} proportions - Limb: {limbLength}, Head: {headSize}, Body: {bodyWidth}");
    }
    
    /// <summary>
    /// Toggle between real-time and traditional sprite systems
    /// </summary>
    public void ToggleRealtimeSprites(bool enabled)
    {
        if (UseRealtimeSprites == enabled)
            return;
        
        UseRealtimeSprites = enabled;
        
        if (UseRealtimeSprites)
        {
            SetupRealtimeSprites();
        }
        else
        {
            // Disable real-time system and switch back to traditional
            if (RealtimeAnimatedComponent != null)
            {
                RealtimeAnimatedComponent.QueueFree();
                RealtimeAnimatedComponent = null;
            }
            
            if (AnimatedSprite != null)
            {
                AnimatedSprite.Visible = false;
            }
            
            if (CharacterSprite != null)
            {
                CharacterSprite.Visible = true;
                LoadCharacterSprite();
            }
        }
        
        GD.Print($"Real-time sprites {(enabled ? "enabled" : "disabled")} for {CharacterId}");
    }
    
    /// <summary>
    /// Get performance statistics from real-time sprite generation
    /// </summary>
    public Godot.Collections.Dictionary GetSpriteGenerationStats()
    {
        if (!UseRealtimeSprites || RealtimeAnimatedComponent == null)
        {
            return new Godot.Collections.Dictionary();
        }
        
        var stats = RealtimeAnimatedComponent.Call("get_performance_stats");
        return stats.AsGodotDictionary();
    }
    
    /// <summary>
    /// Clear sprite generation cache to free memory
    /// </summary>
    public void ClearSpriteCache()
    {
        if (UseRealtimeSprites && RealtimeAnimatedComponent != null)
        {
            RealtimeAnimatedComponent.Call("clear_cache");
            GD.Print($"Cleared sprite cache for {CharacterId}");
        }
    }
}

public enum CharacterState
{
    Idle,
    Walking,
    Crouching,
    Jumping,
    Attacking,
    Hit,
    Blocking,
    Knocked,
    Stunned
}

public class Hitbox
{
    public Vector2 Position { get; set; }
    public Vector2 Size { get; set; }
    public int Damage { get; set; }
    public int Hitstun { get; set; }
    public int Blockstun { get; set; }
    public bool Knockdown { get; set; }
}