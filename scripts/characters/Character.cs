using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;

/// <summary>
/// Base character class with state machine and data-driven moveset
/// </summary>
public partial class Character : CharacterBody2D
{
    [Export] public string CharacterId { get; set; } = "";
    [Export] public int PlayerId { get; set; } = 0;
    [Export] public bool FacingRight { get; set; } = true;
    
    // Character data
    public CharacterData Data { get; private set; }
    
    // Components
    public AnimationPlayer AnimationPlayer { get; private set; }
    public AnimationTree AnimationTree { get; private set; }
    public Area2D HitboxArea { get; private set; }
    public Area2D HurtboxArea { get; private set; }
    
    // State
    public CharacterState CurrentState { get; private set; } = CharacterState.Idle;
    public int Health { get; private set; }
    public int Meter { get; private set; }
    public int CurrentFrame { get; private set; }
    public int StateFrame { get; private set; }
    
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
            Data = JsonSerializer.Deserialize<CharacterData>(jsonText);
            GD.Print($"Loaded character data for {Data.Name}");
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
        
        // Connect hurtbox to take damage
        HurtboxArea.AreaEntered += OnHurtboxEntered;
    }
    
    private void InitializeCharacter()
    {
        if (Data != null)
        {
            Health = Data.Health;
            Meter = 0;
            EmitSignal(SignalName.HealthChanged, Health, Data.Health);
            EmitSignal(SignalName.MeterChanged, Meter, Data.Meter);
        }
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
            _velocity.Y += (float)(ProjectSettings.GetSetting("physics/2d/default_gravity", 980.0) * delta);
        }
        
        // Update velocity
        Velocity = _velocity;
        
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
        // Simple input buffering - in a real implementation this would be more sophisticated
        if (input.AnyButton)
        {
            string inputString = "";
            if (input.LightPunch) inputString += "LP";
            if (input.MediumPunch) inputString += "MP";
            if (input.HeavyPunch) inputString += "HP";
            if (input.LightKick) inputString += "LK";
            if (input.MediumKick) inputString += "MK";
            if (input.HeavyKick) inputString += "HK";
            
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
        
        // Check for attack inputs
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
    
    private void PerformMove(string moveName)
    {
        if (Data?.Moves?.Normals?.ContainsKey(moveName) == true)
        {
            var moveData = Data.Moves.Normals[moveName];
            ChangeState(CharacterState.Attacking);
            // Animation and hitbox logic would go here
            GD.Print($"Performing {moveData.Name}");
        }
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
        }
    }
    
    private void UpdateHitboxes()
    {
        // Update active hitboxes based on current animation frame
        _activeHitboxes.Clear();
        
        // This would be populated based on move data and current frame
    }
    
    private void ChangeState(CharacterState newState)
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
        
        string animationName = CurrentState switch
        {
            CharacterState.Idle => Data.Animations.Idle,
            CharacterState.Walking => FacingRight ? Data.Animations.WalkForward : Data.Animations.WalkBackward,
            CharacterState.Jumping => Data.Animations.Jump,
            CharacterState.Crouching => Data.Animations.Crouch,
            CharacterState.Attacking => Data.Animations.Idle, // Would be specific to move
            _ => Data.Animations.Idle
        };
        
        if (AnimationPlayer.HasAnimation(animationName))
        {
            AnimationPlayer.Play(animationName);
        }
    }
    
    private void OnHurtboxEntered(Area2D area)
    {
        // Handle taking damage
        if (area.GetParent() is Character attacker && attacker != this)
        {
            TakeDamage(50); // Placeholder damage
        }
    }
    
    public void TakeDamage(int damage)
    {
        Health = Mathf.Max(0, Health - damage);
        EmitSignal(SignalName.HealthChanged, Health, Data?.Health ?? 1000);
        
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
        Meter = Mathf.Min(Data?.Meter ?? 100, Meter + amount);
        EmitSignal(SignalName.MeterChanged, Meter, Data?.Meter ?? 100);
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