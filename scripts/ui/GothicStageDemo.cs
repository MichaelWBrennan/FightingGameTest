using Godot;

/// <summary>
/// Gothic Stage Demo - Showcases the 2.5D Gothic stages with ArcSys-inspired visuals
/// </summary>
public partial class GothicStageDemo : Control
{
    private StageManager _stageManager;
    private Node2D _stageContainer;
    private Label _infoLabel;
    private Label _instructionLabel;
    
    private string[] _availableStages;
    private int _currentStageIndex = 0;
    
    public override void _Ready()
    {
        SetupDemoUI();
        InitializeStageSystem();
        LoadFirstStage();
        
        GD.Print("Gothic Stage Demo initialized");
    }
    
    private void SetupDemoUI()
    {
        // Create dark background
        var background = new ColorRect
        {
            Color = new Color(0.05f, 0.05f, 0.1f),
            MouseFilter = Control.MouseFilterEnum.Ignore
        };
        background.SetAnchorsAndOffsetsPreset(Control.PresetMode.FullRect);
        AddChild(background);
        
        // Create stage container
        _stageContainer = new Node2D { Name = "StageContainer" };
        AddChild(_stageContainer);
        
        // Info UI
        var uiContainer = new VBoxContainer();
        AddChild(uiContainer);
        
        _infoLabel = new Label
        {
            Text = "Gothic Stage Demo",
            HorizontalAlignment = HorizontalAlignment.Center
        };
        _infoLabel.AddThemeColorOverride("font_color", Colors.White);
        _infoLabel.AddThemeStyleboxOverride("normal", new StyleBoxFlat { BgColor = new Color(0, 0, 0, 0.5f) });
        uiContainer.AddChild(_infoLabel);
        
        _instructionLabel = new RichTextLabel
        {
            CustomMinimumSize = new Vector2(800, 100),
            BbcodeEnabled = true,
            ScrollActive = false,
            Text = "[center][color=yellow]Controls:[/color]\n[color=white]SPACE - Next Stage | ESC - Exit Demo | Enter - Toggle Effects[/color][/center]"
        };
        _instructionLabel.Position = new Vector2(200, 50);
        AddChild(_instructionLabel);
        
        // Position UI at top
        uiContainer.Position = new Vector2(200, 20);
    }
    
    private void InitializeStageSystem()
    {
        _stageManager = StageManager.Instance;
        
        if (_stageManager != null)
        {
            _availableStages = _stageManager.GetAvailableStageIds();
            GD.Print($"Found {_availableStages.Length} Gothic stages for demo");
        }
        else
        {
            GD.PrintErr("StageManager not found - demo cannot continue");
            _availableStages = new string[0];
        }
    }
    
    private void LoadFirstStage()
    {
        if (_availableStages?.Length > 0)
        {
            LoadStage(_currentStageIndex);
        }
    }
    
    private void LoadStage(int index)
    {
        if (index < 0 || index >= _availableStages.Length) return;
        
        var stageId = _availableStages[index];
        var stageData = _stageManager.GetStageData(stageId);
        
        // Load the stage
        _stageManager.LoadStage(stageId, _stageContainer);
        
        // Update info display
        if (stageData != null)
        {
            _infoLabel.Text = $"Gothic Stage Demo - {stageData.Name} ({index + 1}/{_availableStages.Length})";
            
            _instructionLabel.Text = $"[center][color=yellow]{stageData.Name}[/color]\n" +
                                   $"[color=lightblue]{stageData.Description}[/color]\n" +
                                   $"[color=gray]Theme: {stageData.Theme} | Atmosphere: {stageData.Atmosphere}[/color]\n\n" +
                                   "[color=white]SPACE - Next Stage | ESC - Exit | ENTER - Toggle Effects[/color][/center]";
        }
        
        // Trigger some demo effects
        CallDeferred(nameof(StartDemoEffects));
        
        GD.Print($"Loaded Gothic stage: {stageData?.Name ?? stageId}");
    }
    
    private void StartDemoEffects()
    {
        if (_stageManager == null) return;
        
        // Create a timer for periodic effects
        var effectTimer = new Timer
        {
            WaitTime = 3.0f,
            Autostart = true,
            OneShot = false
        };
        effectTimer.Timeout += TriggerRandomStageEffect;
        AddChild(effectTimer);
        
        // Initial dramatic effect
        _stageManager.TriggerStageEffect("super_move", new Vector2(0, 0), 1.0f);
    }
    
    private void TriggerRandomStageEffect()
    {
        if (_stageManager == null) return;
        
        var effects = new[] { "combo_hit", "heavy_hit", "super_move", "low_health" };
        var randomEffect = effects[GD.Randi() % effects.Length];
        var randomPosition = new Vector2(
            GD.RandRange(-400, 400),
            GD.RandRange(-100, 100)
        );
        
        _stageManager.TriggerStageEffect(randomEffect, randomPosition, GD.RandRange(0.5f, 1.5f));
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("ui_cancel"))
        {
            // Return to main menu
            GameManager.Instance?.ChangeState(GameState.MainMenu);
        }
        else if (@event.IsActionPressed("ui_accept") || Input.IsKeyPressed(Key.Space))
        {
            // Next stage
            _currentStageIndex = (_currentStageIndex + 1) % _availableStages.Length;
            LoadStage(_currentStageIndex);
        }
        else if (Input.IsKeyPressed(Key.Enter))
        {
            // Toggle stage effects
            var currentIntensity = GD.RandRange(0.5f, 2.0f);
            _stageManager?.SetStageEffectIntensity(currentIntensity);
            GD.Print($"Stage effect intensity set to: {currentIntensity}");
        }
        else if (Input.IsKeyPressed(Key.Key1))
        {
            // Load specific stage
            LoadStage(0);
            _currentStageIndex = 0;
        }
        else if (Input.IsKeyPressed(Key.Key2) && _availableStages.Length > 1)
        {
            LoadStage(1);
            _currentStageIndex = 1;
        }
        else if (Input.IsKeyPressed(Key.Key3) && _availableStages.Length > 2)
        {
            LoadStage(2);
            _currentStageIndex = 2;
        }
    }
    
    public override void _ExitTree()
    {
        // Clean up any timers
        foreach (Node child in GetChildren())
        {
            if (child is Timer timer)
            {
                timer.QueueFree();
            }
        }
    }
}