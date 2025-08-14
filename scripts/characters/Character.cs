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
    
    // 2D-HD Rendering System
    private Node DynamicSpriteController { get; set; }
    private bool _useAdvancedSprites = true;
    
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
        
        // Setup sprite systems with fallback hierarchy
        SetupSpriteSystem();
    }
    
    /// <summary>
    /// Setup sprite system with fallback hierarchy: 2D-HD -> Real-time -> Traditional
    /// </summary>
    private void SetupSpriteSystem()
    {
        // Priority 1: Try 2D-HD advanced sprite system
        if (SetupAdvancedSprites())
        {
            GD.Print($"Character {CharacterId}: Using 2D-HD advanced sprite system");
            return;
        }
        
        // Priority 2: Try real-time sprite system if enabled
        if (UseRealtimeSprites && SetupRealtimeSprites())
        {
            GD.Print($"Character {CharacterId}: Using real-time sprite system");
            return;
        }
        
        // Priority 3: Fallback to traditional sprite loading
        GD.Print($"Character {CharacterId}: Using traditional sprite system");
        LoadCharacterSprite();
    }
    
    /// <summary>
    /// Setup 2D-HD advanced sprite system
    /// </summary>
    private bool SetupAdvancedSprites()
    {
        try
        {
            var controllerScript = GD.Load<GDScript>("res://engine/actors/DynamicSpriteController.gd");
            if (controllerScript != null)
            {
                DynamicSpriteController = (Node)controllerScript.New();
                DynamicSpriteController.Name = "DynamicSpriteController";
                AddChild(DynamicSpriteController);
                
                // Configure for this character
                var context = new Godot.Collections.Dictionary
                {
                    {"character_id", CharacterId}
                };
                
                DynamicSpriteController.Call("set_action", "idle", context);
                DynamicSpriteController.Call("set_quality", "MED");
                
                // Register hitbox areas for auto-scaling
                DynamicSpriteController.Call("register_hitbox_area", HitboxArea, Vector2.One);
                DynamicSpriteController.Call("register_hitbox_area", HurtboxArea, Vector2.One);
                
                _useAdvancedSprites = true;
                return true;
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to setup 2D-HD sprites for {CharacterId}: {e.Message}");
        }
        
        _useAdvancedSprites = false;
        return false;
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
    private bool SetupRealtimeSprites()
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
                
                return true;
            }
            else
            {
                GD.PrintErr("Failed to create RealtimeAnimatedSpriteComponent instance");
                return false;
            }
        }
        else
        {
            GD.PrintErr("RealtimeAnimatedSpriteComponent script not found");
            return false;
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
        
        // Check for enhanced movement inputs first (high priority)
        if (ProcessEnhancedMovementInput(input)) return;
        
        // Check for defensive actions
        if (ProcessDefensiveInput(input)) return;
        
        // Check for cancel opportunities
        if (ProcessCancelInput(input)) return;
        
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
    
    /// <summary>
    /// Process enhanced movement inputs
    /// </summary>
    private bool ProcessEnhancedMovementInput(PlayerInputState input)
    {
        if (EnhancedMovementSystem.Instance == null) return false;
        
        // Check for dash inputs (double tap)
        if (InputManager.Instance.IsInputJustPressed(PlayerId, "right") && input.Right)
        {
            if (EnhancedMovementSystem.Instance.TryGroundDash(this, true))
                return true;
        }
        else if (InputManager.Instance.IsInputJustPressed(PlayerId, "left") && input.Left)
        {
            if (EnhancedMovementSystem.Instance.TryGroundDash(this, false))
                return true;
        }
        
        // Air dash inputs (in air + direction)
        if (CurrentState == CharacterState.Jumping)
        {
            Vector2 airDashDirection = Vector2.Zero;
            if (input.Right) airDashDirection.X = 1;
            if (input.Left) airDashDirection.X = -1;
            if (input.Up) airDashDirection.Y = -1;
            if (input.Down) airDashDirection.Y = 1;
            
            if (airDashDirection != Vector2.Zero && input.AnyButton)
            {
                if (EnhancedMovementSystem.Instance.TryAirDash(this, airDashDirection))
                    return true;
            }
        }
        
        // Instant Air Dash (IAD) - up + direction + button
        if (input.Up && (input.Left || input.Right) && input.AnyButton)
        {
            Vector2 iadDirection = new Vector2(input.Right ? 1 : -1, -0.5f);
            if (EnhancedMovementSystem.Instance.TryInstantAirDash(this, iadDirection))
                return true;
        }
        
        // Burst movement - multiple buttons pressed
        if (input.LightPunch && input.HeavyKick) // LP + HK for burst
        {
            Vector2 burstDirection = input.Right ? Vector2.Right : input.Left ? Vector2.Left : Vector2.Zero;
            if (burstDirection != Vector2.Zero)
            {
                if (EnhancedMovementSystem.Instance.TryBurstMovement(this, burstDirection))
                    return true;
            }
        }
        
        return false;
    }
    
    /// <summary>
    /// Process defensive inputs (parry, faultless defense)
    /// </summary>
    private bool ProcessDefensiveInput(PlayerInputState input)
    {
        // Check for Faultless Defense (hold back + any button while blocking)
        if ((input.Left && FacingRight) || (input.Right && !FacingRight))
        {
            if (input.AnyButton && FaultlessDefenseSystem.Instance != null)
            {
                var opponent = GetOpponent();
                if (opponent?.CurrentState == CharacterState.Attacking)
                {
                    FaultlessDefenseSystem.Instance.ProcessFDAttempt(this, opponent, true, opponent.StateFrame);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /// <summary>
    /// Process cancel inputs
    /// </summary>
    private bool ProcessCancelInput(PlayerInputState input)
    {
        if (CurrentState != CharacterState.Attacking) return false;
        
        // Roman Cancel - multiple buttons
        if (input.LightPunch && input.MediumPunch && input.HeavyPunch)
        {
            if (RomanCancelSystem.Instance?.TryRomanCancel(this) == true)
                return true;
        }
        
        // Special cancels - check for normal to special cancels
        if (SpecialCancelSystem.Instance != null && input.AnyButton)
        {
            // Try to cancel current move into special
            string targetSpecial = GetSpecialFromInput(input);
            if (!string.IsNullOrEmpty(targetSpecial))
            {
                if (SpecialCancelSystem.Instance.TryCancel(this, GetCurrentMove(), targetSpecial, SpecialCancelSystem.CancelWindow.Active))
                    return true;
            }
        }
        
        // Dash cancels
        if ((input.Right && FacingRight) || (input.Left && !FacingRight))
        {
            if (EnhancedMovementSystem.Instance?.TryDashCancel(this, GetCurrentMove(), true) == true)
                return true;
        }
        
        return false;
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
        if (string.IsNullOrEmpty(CharacterId)) return;
        
        // Use advanced sprite system if available
        if (_useAdvancedSprites && DynamicSpriteController != null)
        {
            string actionName = state switch
            {
                CharacterState.Idle => "idle",
                CharacterState.Walking => "walk", 
                CharacterState.Jumping => "jump",
                CharacterState.Attacking => "attack",
                _ => "idle"
            };
            
            var context = new Godot.Collections.Dictionary
            {
                {"character_id", CharacterId},
                {"state", (int)state},
                {"frame", StateFrame}
            };
            
            try
            {
                DynamicSpriteController.Call("set_action", actionName, context);
                return; // Success, no need for fallback
            }
            catch (Exception e)
            {
                GD.PrintErr($"Advanced sprite system failed for {CharacterId}: {e.Message}");
                _useAdvancedSprites = false; // Disable and fallback
            }
        }
        
        // Fallback to original sprite loading system
        if (CharacterSprite == null) return;
        
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
    
    // === Unified Sprite System API ===
    
    /// <summary>
    /// Set sprite rendering quality for 2D-HD system (LOW, MED, HIGH, ULTRA)
    /// </summary>
    public void SetSpriteQuality(string quality)
    {
        if (_useAdvancedSprites && DynamicSpriteController != null)
        {
            try
            {
                DynamicSpriteController.Call("set_quality", quality);
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to set sprite quality: {e.Message}");
            }
        }
    }
    
    /// <summary>
    /// Set color palette - works with both 2D-HD and real-time systems
    /// </summary>
    public void SetSpritePalette(string newPalette)
    {
        SpritePalette = newPalette;
        
        // Try 2D-HD system first
        if (_useAdvancedSprites && DynamicSpriteController != null)
        {
            try
            {
                // Convert string palette name to texture if needed
                var paletteTexture = LoadPaletteTexture(newPalette);
                if (paletteTexture != null)
                {
                    DynamicSpriteController.Call("set_palette", paletteTexture);
                    GD.Print($"Changed {CharacterId} 2D-HD palette to {newPalette}");
                    return;
                }
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to set 2D-HD palette: {e.Message}");
            }
        }
        
        // Try real-time system
        if (UseRealtimeSprites && RealtimeAnimatedComponent != null)
        {
            try
            {
                RealtimeAnimatedComponent.Call("set_character_palette", newPalette);
                GD.Print($"Changed {CharacterId} real-time palette to {newPalette}");
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to set real-time palette: {e.Message}");
            }
        }
    }
    
    /// <summary>
    /// Set color palette using texture (2D-HD system only)
    /// </summary>
    public void SetSpritePalette(Texture2D paletteTexture)
    {
        if (_useAdvancedSprites && DynamicSpriteController != null)
        {
            try
            {
                DynamicSpriteController.Call("set_palette", paletteTexture);
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to set sprite palette: {e.Message}");
            }
        }
    }
    
    /// <summary>
    /// Adjust character proportions in real-time (real-time system only)
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
        
        // Re-setup the sprite system with new preference
        SetupSpriteSystem();
        
        GD.Print($"Real-time sprites {(enabled ? "enabled" : "disabled")} for {CharacterId}");
    }
    
    /// <summary>
    /// Get performance statistics from active sprite system
    /// </summary>
    public Godot.Collections.Dictionary GetSpritePerformanceStats()
    {
        // Try 2D-HD system first
        if (_useAdvancedSprites && DynamicSpriteController != null)
        {
            try
            {
                var result = DynamicSpriteController.Call("get_performance_stats");
                if (result.VariantType == Variant.Type.Dictionary)
                {
                    return result.AsGodotDictionary();
                }
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to get 2D-HD performance stats: {e.Message}");
            }
        }
        
        // Try real-time system
        if (UseRealtimeSprites && RealtimeAnimatedComponent != null)
        {
            try
            {
                var stats = RealtimeAnimatedComponent.Call("get_performance_stats");
                return stats.AsGodotDictionary();
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to get real-time performance stats: {e.Message}");
            }
        }
        
        return new Godot.Collections.Dictionary();
    }
    
    /// <summary>
    /// Clear sprite cache from active system
    /// </summary>
    public void ClearSpriteCache()
    {
        // Clear 2D-HD cache
        if (_useAdvancedSprites && DynamicSpriteController != null)
        {
            try
            {
                DynamicSpriteController.Call("force_cache_cleanup");
                GD.Print($"Cleared 2D-HD sprite cache for {CharacterId}");
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to clear 2D-HD cache: {e.Message}");
            }
        }
        
        // Clear real-time cache
        if (UseRealtimeSprites && RealtimeAnimatedComponent != null)
        {
            try
            {
                RealtimeAnimatedComponent.Call("clear_cache");
                GD.Print($"Cleared real-time sprite cache for {CharacterId}");
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to clear real-time cache: {e.Message}");
            }
        }
    }
    
    /// <summary>
    /// Load palette texture from palette name
    /// </summary>
    private Texture2D LoadPaletteTexture(string paletteName)
    {
        string palettePath = $"res://assets/sprites/street_fighter_6/{CharacterId}/palettes/{paletteName}.png";
        if (ResourceLoader.Exists(palettePath))
        {
            return GD.Load<Texture2D>(palettePath);
        }
        
        // Try generic palette
        string genericPath = $"res://assets/palettes/{paletteName}.png";
        if (ResourceLoader.Exists(genericPath))
        {
            return GD.Load<Texture2D>(genericPath);
        }
        
        return null;
    }
    
    /// <summary>
    /// Get special move from current input
    /// </summary>
    private string GetSpecialFromInput(PlayerInputState input)
    {
        // Simplified special move detection - real implementation would be more sophisticated
        if (Data?.Moves?.Specials == null) return "";
        
        foreach (var special in Data.Moves.Specials)
        {
            if (IsInputInBuffer(special.Value.Input))
            {
                return special.Key;
            }
        }
        
        return "";
    }
    
    /// <summary>
    /// Get current move being performed
    /// </summary>
    private string GetCurrentMove()
    {
        // In real implementation, this would track the current move
        return ""; // Placeholder
    }
    
    /// <summary>
    /// Get opponent character
    /// </summary>
    private Character GetOpponent()
    {
        // In real implementation, this would reference the other player
        return null; // Placeholder
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
    Stunned,
    Dashing,        // Ground dash state
    AirDashing,     // Air dash state
    TechRoll,       // Tech roll state
    WakeUp          // Wake-up state
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