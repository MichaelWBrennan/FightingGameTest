using Godot;

/// <summary>
/// Main gameplay scene controller with cutting-edge graphics integration
/// </summary>
public partial class GameplayScene : Node2D
{
    // Scene references
    private Character _player1;
    private Character _player2;
    private Camera2D _camera;
    private CanvasLayer _ui;
    
    // Stage management
    private StageManager _stageManager;
    
    // Graphics system references
    private CuttingEdgeGraphicsManager _graphicsManager;
    private DynamicLightingSystem _lightingSystem;
    private AdvancedParticleSystem _particleSystem;
    
    // UI elements
    private ProgressBar _player1HealthBar;
    private ProgressBar _player1MeterBar;
    private ProgressBar _player2HealthBar;
    private ProgressBar _player2MeterBar;
    private Label _timerLabel;
    private Label _roundLabel;
    
    // Game state
    private float _roundTime = 90.0f; // 90 seconds per round
    private int _currentRound = 1;
    private int _player1Wins = 0;
    private int _player2Wins = 0;
    private bool _roundActive = true;
    
    public override void _Ready()
    {
        SetupScene();
        SetupGraphics();
        SetupUI();
        StartRound();
    }
    
    private void SetupScene()
    {
        _camera = GetNode<Camera2D>("Camera2D");
        _ui = GetNode<CanvasLayer>("UI");
        _stageManager = StageManager.Instance;
        
        // Load a Gothic stage - default to cathedral
        if (_stageManager != null)
        {
            _stageManager.LoadStage("gothic_cathedral", this);
            GD.Print("Loaded Gothic cathedral stage");
        }
        
        // Create characters
        SpawnCharacters();
    }
    
    private void SetupGraphics()
    {
        // Get graphics system references
        _graphicsManager = CuttingEdgeGraphicsManager.Instance;
        _lightingSystem = DynamicLightingSystem.Instance;
        _particleSystem = AdvancedParticleSystem.Instance;
        
        // Configure graphics for gameplay
        if (_graphicsManager != null)
        {
            _graphicsManager.SetGraphicsQuality(CuttingEdgeGraphicsManager.GraphicsQuality.Ultra);
            GD.Print("Cutting-edge graphics enabled for gameplay");
        }
        
        // Setup dynamic lighting for characters
        if (_lightingSystem != null)
        {
            _lightingSystem.SetLightingMode(DynamicLightingSystem.LightingMode.Normal);
            GD.Print("Dynamic lighting system active");
        }
        
        // Add environment effects
        if (_particleSystem != null)
        {
            // Create subtle ambient particle effects
            _particleSystem.CreateParticleEffect(
                AdvancedParticleSystem.ParticleType.Dust, 
                new Vector2(0, 200), 
                0.3f, 
                2.0f
            );
            GD.Print("Advanced particle system initialized");
        }
    }
    
    private void SpawnCharacters()
    {
        // Load character scene
        var characterScene = GD.Load<PackedScene>("res://scenes/characters/Character.tscn");
        
        // Spawn Player 1
        _player1 = characterScene.Instantiate<Character>();
        _player1.CharacterId = "ryu";
        _player1.PlayerId = 0;
        _player1.Position = new Vector2(-200, 0);
        _player1.FacingRight = true;
        AddChild(_player1);
        
        // Spawn Player 2
        _player2 = characterScene.Instantiate<Character>();
        _player2.CharacterId = "ryu"; // Same character for now
        _player2.PlayerId = 1;
        _player2.Position = new Vector2(200, 0);
        _player2.FacingRight = false;
        AddChild(_player2);
        
        // Connect character signals
        _player1.HealthChanged += OnPlayer1HealthChanged;
        _player1.MeterChanged += OnPlayer1MeterChanged;
        _player2.HealthChanged += OnPlayer2HealthChanged;
        _player2.MeterChanged += OnPlayer2MeterChanged;
    }
    
    private void SetupUI()
    {
        _player1HealthBar = GetNode<ProgressBar>("UI/HUD/Player1Health");
        _player1MeterBar = GetNode<ProgressBar>("UI/HUD/Player1Meter");
        _player2HealthBar = GetNode<ProgressBar>("UI/HUD/Player2Health");
        _player2MeterBar = GetNode<ProgressBar>("UI/HUD/Player2Meter");
        _timerLabel = GetNode<Label>("UI/HUD/Timer");
        _roundLabel = GetNode<Label>("UI/HUD/Round");
        
        // Initialize UI
        UpdateRoundDisplay();
    }
    
    public override void _Process(double delta)
    {
        if (_roundActive)
        {
            UpdateTimer(delta);
            UpdateCamera();
            UpdateGraphicsEffects();
        }
    }
    
    private void UpdateTimer(double delta)
    {
        _roundTime -= (float)delta;
        _timerLabel.Text = Mathf.Ceil(_roundTime).ToString();
        
        if (_roundTime <= 0)
        {
            EndRound(RoundEndReason.TimeOut);
        }
    }
    
    private void UpdateCamera()
    {
        // Center camera between players
        if (_player1 != null && _player2 != null)
        {
            Vector2 midpoint = (_player1.Position + _player2.Position) / 2;
            _camera.Position = _camera.Position.Lerp(midpoint, 0.1f);
            
            // Adjust zoom based on distance
            float distance = _player1.Position.DistanceTo(_player2.Position);
            float targetZoom = Mathf.Clamp(1.0f - (distance / 1000.0f), 0.5f, 1.5f);
            _camera.Zoom = _camera.Zoom.Lerp(Vector2.One * targetZoom, 0.05f);
        }
    }
    
    private void OnPlayer1HealthChanged(int newHealth, int maxHealth)
    {
        if (_player1HealthBar != null)
        {
            _player1HealthBar.MaxValue = maxHealth;
            _player1HealthBar.Value = newHealth;
            
            if (newHealth <= 0)
            {
                EndRound(RoundEndReason.Player2Victory);
            }
        }
    }
    
    private void OnPlayer1MeterChanged(int newMeter, int maxMeter)
    {
        if (_player1MeterBar != null)
        {
            _player1MeterBar.MaxValue = maxMeter;
            _player1MeterBar.Value = newMeter;
        }
    }
    
    private void OnPlayer2HealthChanged(int newHealth, int maxHealth)
    {
        if (_player2HealthBar != null)
        {
            _player2HealthBar.MaxValue = maxHealth;
            _player2HealthBar.Value = newHealth;
            
            if (newHealth <= 0)
            {
                EndRound(RoundEndReason.Player1Victory);
            }
        }
    }
    
    private void OnPlayer2MeterChanged(int newMeter, int maxMeter)
    {
        if (_player2MeterBar != null)
        {
            _player2MeterBar.MaxValue = maxMeter;
            _player2MeterBar.Value = newMeter;
        }
    }
    
    private void StartRound()
    {
        _roundTime = 90.0f;
        _roundActive = true;
        
        // Reset character positions and health
        if (_player1 != null && _player2 != null)
        {
            _player1.Position = new Vector2(-200, 0);
            _player2.Position = new Vector2(200, 0);
            
            // Reset health would go here
        }
        
        GD.Print($"Round {_currentRound} started");
    }
    
    private void EndRound(RoundEndReason reason)
    {
        _roundActive = false;
        
        switch (reason)
        {
            case RoundEndReason.Player1Victory:
                _player1Wins++;
                GD.Print("Player 1 wins the round!");
                break;
            case RoundEndReason.Player2Victory:
                _player2Wins++;
                GD.Print("Player 2 wins the round!");
                break;
            case RoundEndReason.TimeOut:
                GD.Print("Time out!");
                // Determine winner by health
                if (_player1?.Health > _player2?.Health)
                    _player1Wins++;
                else if (_player2?.Health > _player1?.Health)
                    _player2Wins++;
                break;
        }
        
        // Check for match victory (best of 3)
        if (_player1Wins >= 2 || _player2Wins >= 2)
        {
            EndMatch();
        }
        else
        {
            // Start next round
            _currentRound++;
            CallDeferred(nameof(StartRound));
        }
        
        UpdateRoundDisplay();
    }
    
    private void EndMatch()
    {
        string winner = _player1Wins >= 2 ? "Player 1" : "Player 2";
        GD.Print($"Match over! {winner} wins!");
        
        // Return to character select or main menu
        GameManager.Instance?.ChangeState(GameState.CharacterSelect);
    }
    
    private void UpdateRoundDisplay()
    {
        _roundLabel.Text = $"Round {_currentRound}";
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("ui_cancel"))
        {
            // Pause menu or return to main menu
            GameManager.Instance?.ChangeState(GameState.MainMenu);
        }
    }
    
    /// <summary>
    /// Handle combat impact with cutting-edge graphics and stage effects
    /// </summary>
    public void OnCombatImpact(Vector2 position, float power = 1.0f, string moveType = "normal")
    {
        // Create impact particle effects
        if (_particleSystem != null)
        {
            switch (moveType.ToLower())
            {
                case "fire":
                    _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Fire, position, power);
                    break;
                case "lightning":
                    _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Lightning, position, power);
                    break;
                case "ice":
                    _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Ice, position, power);
                    break;
                default:
                    _particleSystem.CreateImpactEffect(position, power, Colors.Orange);
                    break;
            }
        }
        
        // Apply graphics effects
        if (_graphicsManager != null)
        {
            _graphicsManager.ApplyImpactEffect(this, position, power);
        }
        
        // Trigger stage-specific effects
        if (_stageManager != null)
        {
            if (power >= 1.5f)
            {
                _stageManager.TriggerStageEffect("heavy_hit", position, power);
            }
            else
            {
                _stageManager.TriggerStageEffect("combo_hit", position, power);
            }
        }
        
        // Adjust lighting for dramatic effect
        if (_lightingSystem != null && power >= 1.5f)
        {
            _lightingSystem.SetLightingMode(DynamicLightingSystem.LightingMode.Intense, 0.5f);
            
            // Return to normal lighting after effect
            var timer = new Timer { WaitTime = 1.0f, OneShot = true };
            AddChild(timer);
            timer.Timeout += () =>
            {
                _lightingSystem.SetLightingMode(DynamicLightingSystem.LightingMode.Normal, 1.0f);
                timer.QueueFree();
            };
            timer.Start();
        }
    }
    
    /// <summary>
    /// Handle special move activation with enhanced visuals and stage effects
    /// </summary>
    public void OnSpecialMoveActivated(Node2D character, string moveName, Color effectColor)
    {
        if (_graphicsManager != null)
        {
            _graphicsManager.ApplyCharacterHighlight(character, effectColor, 1.5f);
        }
        
        if (_particleSystem != null)
        {
            var position = character.Position;
            
            // Create special move particles based on move name
            if (moveName.ToLower().Contains("fire"))
            {
                _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Fire, position, 1.5f);
            }
            else if (moveName.ToLower().Contains("lightning"))
            {
                _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Lightning, position, 1.5f);
                _lightingSystem?.CreateLightningFlash();
            }
            else
            {
                _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Energy, position, 1.2f);
            }
        }
        
        // Trigger stage special effects for super moves
        if (_stageManager != null)
        {
            _stageManager.TriggerStageEffect("super_move", character.Position, 1.5f);
        }
        
        if (_lightingSystem != null)
        {
            _lightingSystem.SetLightingMode(DynamicLightingSystem.LightingMode.EpicMoment, 0.3f);
        }
    }
    
    private void UpdateGraphicsEffects()
    {
        // Update dynamic lighting based on character positions
        if (_lightingSystem != null && _player1 != null && _player2 != null)
        {
            _lightingSystem.UpdateDynamicLighting(_player1.Position, _player2.Position);
        }
        
        // Add low health visual effects
        if (_player1 != null && _player1.Health <= 20)
        {
            ApplyLowHealthEffect(_player1);
        }
        
        if (_player2 != null && _player2.Health <= 20)
        {
            ApplyLowHealthEffect(_player2);
        }
    }
    
    private void ApplyLowHealthEffect(Node2D character)
    {
        // Add dramatic lighting for low health
        if (_lightingSystem != null)
        {
            _lightingSystem.AttachCharacterLighting(character, Colors.Red, 0.8f);
        }
        
        // Trigger stage low health effects (like glowing gargoyle eyes)
        if (_stageManager != null)
        {
            _stageManager.TriggerStageEffect("low_health", character.Position, 0.8f);
        }
        
        // Periodic red particle effects
        if (_particleSystem != null && ((int)(Time.GetTicksMsec() / 1000)) % 3 == 0)
        {
            _particleSystem.CreateParticleEffect(
                AdvancedParticleSystem.ParticleType.Sparks, 
                character.Position, 
                0.5f, 
                0.8f
            );
        }
    }
    
    // Additional methods for stage interaction
    public void SwitchStage(string stageId)
    {
        if (_stageManager != null && !string.IsNullOrEmpty(stageId))
        {
            _stageManager.LoadStage(stageId, this);
            GD.Print($"Switched to stage: {stageId}");
        }
    }
    
    public string[] GetAvailableStages()
    {
        return _stageManager?.GetAvailableStageIds() ?? new string[0];
    }
}

public enum RoundEndReason
{
    Player1Victory,
    Player2Victory,
    TimeOut,
    Draw
}