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
    
    // Character data
    public CharacterData Data { get; private set; }
    
    // Components
    public AnimationPlayer AnimationPlayer { get; private set; }
    public AnimationTree AnimationTree { get; private set; }
    public Area2D HitboxArea { get; private set; }
    public Area2D HurtboxArea { get; private set; }
    public Sprite2D CharacterSprite { get; private set; }
    
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
        AnimationTree = GetNode<AnimationTree>("AnimationTree");
        HitboxArea = GetNode<Area2D>("HitboxArea");
        HurtboxArea = GetNode<Area2D>("HurtboxArea");
        CharacterSprite = GetNode<Sprite2D>("CharacterSprite");
        
        // Connect hurtbox to take damage
        HurtboxArea.AreaEntered += OnHurtboxEntered;
        
        // Setup 2D-HD rendering system
        SetupAdvancedSprites();
        
        // Load character sprite (fallback method)
        LoadCharacterSprite();
    }
    
    private void SetupAdvancedSprites()
    {
        // Try to create DynamicSpriteController for enhanced rendering
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
                GD.Print($"Character {CharacterId}: Advanced sprite system enabled");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to setup advanced sprites for {CharacterId}: {e.Message}");
            _useAdvancedSprites = false;
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
        
        // Load appropriate sprite based on current state
        LoadSpriteForState(CurrentState);
        
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
    
    // === 2D-HD Sprite System API ===
    
    /// <summary>
    /// Set sprite rendering quality (LOW, MED, HIGH, ULTRA)
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
    /// Set color palette for sprite swapping
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
    /// Get performance statistics from sprite system
    /// </summary>
    public Godot.Collections.Dictionary GetSpritePerformanceStats()
    {
        if (_useAdvancedSprites && DynamicSpriteController != null)
        {
            try
            {
                var result = DynamicSpriteController.Call("get_performance_stats");
                if (result.VariantType == Variant.Type.Dictionary)
                {
                    return result.AsGodotDictionary();
                }
                return new Godot.Collections.Dictionary();
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to get sprite performance stats: {e.Message}");
            }
        }
        
        return new Godot.Collections.Dictionary();
    }
    
    /// <summary>
    /// Force sprite cache cleanup
    /// </summary>
    public void ClearSpriteCache()
    {
        if (_useAdvancedSprites && DynamicSpriteController != null)
        {
            try
            {
                DynamicSpriteController.Call("force_cache_cleanup");
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to clear sprite cache: {e.Message}");
            }
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