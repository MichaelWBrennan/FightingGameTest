using Godot;
using System.Linq;

/// <summary>
/// Stage Selection UI for Gothic 2.5D Stages
/// Allows players to choose from available Gothic-themed stages
/// </summary>
public partial class StageSelectScene : Control
{
    // UI References
    private GridContainer _stageGrid;
    private Label _stageNameLabel;
    private RichTextLabel _stageDescriptionLabel;
    private ColorRect _stagePreview;
    private Button _confirmButton;
    private Button _backButton;
    
    // Stage management
    private StageManager _stageManager;
    private string[] _availableStages;
    private int _selectedStageIndex = 0;
    private Button[] _stageButtons;
    
    [Signal]
    public delegate void StageSelectedEventHandler(string stageId);
    
    [Signal] 
    public delegate void BackToMenuEventHandler();
    
    public override void _Ready()
    {
        InitializeUI();
        LoadAvailableStages();
        SetupStageButtons();
        UpdateStageInfo();
        
        GD.Print("Stage Select Scene initialized");
    }
    
    private void InitializeUI()
    {
        // Main container
        var vbox = new VBoxContainer();
        AddChild(vbox);
        
        // Title
        var titleLabel = new Label
        {
            Text = "SELECT GOTHIC STAGE",
            HorizontalAlignment = HorizontalAlignment.Center
        };
        titleLabel.AddThemeStyleboxOverride("normal", new StyleBoxFlat());
        vbox.AddChild(titleLabel);
        
        // Main content container
        var hbox = new HBoxContainer();
        vbox.AddChild(hbox);
        
        // Stage grid (left side)
        var leftPanel = new VBoxContainer();
        hbox.AddChild(leftPanel);
        
        var stageGridLabel = new Label { Text = "Available Stages:" };
        leftPanel.AddChild(stageGridLabel);
        
        _stageGrid = new GridContainer { Columns = 1 };
        leftPanel.AddChild(_stageGrid);
        
        // Stage info panel (right side)
        var rightPanel = new VBoxContainer();
        hbox.AddChild(rightPanel);
        
        _stageNameLabel = new Label 
        { 
            Text = "Stage Name",
            HorizontalAlignment = HorizontalAlignment.Center
        };
        rightPanel.AddChild(_stageNameLabel);
        
        _stageDescriptionLabel = new RichTextLabel
        {
            CustomMinimumSize = new Vector2(400, 150),
            BbcodeEnabled = true,
            ScrollActive = false
        };
        rightPanel.AddChild(_stageDescriptionLabel);
        
        // Stage preview (placeholder)
        _stagePreview = new ColorRect
        {
            CustomMinimumSize = new Vector2(400, 200),
            Color = Colors.Gray
        };
        rightPanel.AddChild(_stagePreview);
        
        // Buttons
        var buttonContainer = new HBoxContainer();
        vbox.AddChild(buttonContainer);
        
        _backButton = new Button { Text = "Back" };
        _backButton.Pressed += OnBackPressed;
        buttonContainer.AddChild(_backButton);
        
        buttonContainer.AddChild(new Control()); // Spacer
        
        _confirmButton = new Button { Text = "Select Stage" };
        _confirmButton.Pressed += OnConfirmPressed;
        buttonContainer.AddChild(_confirmButton);
        
        // Style the UI with Gothic theme
        ApplyGothicTheme();
    }
    
    private void ApplyGothicTheme()
    {
        // Dark Gothic color scheme
        var darkBg = new StyleBoxFlat
        {
            BgColor = new Color(0.1f, 0.1f, 0.15f),
            BorderColor = new Color(0.3f, 0.2f, 0.4f),
            BorderWidthBottom = 2,
            BorderWidthLeft = 2,
            BorderWidthRight = 2,
            BorderWidthTop = 2
        };
        
        AddThemeStyleboxOverride("panel", darkBg);
        
        // Gothic text colors
        var textColor = new Color(0.9f, 0.9f, 1.0f);
        _stageNameLabel?.AddThemeColorOverride("font_color", textColor);
        _stageDescriptionLabel?.AddThemeColorOverride("default_color", textColor);
    }
    
    private void LoadAvailableStages()
    {
        _stageManager = StageManager.Instance;
        
        if (_stageManager != null)
        {
            _availableStages = _stageManager.GetAvailableStageIds();
            GD.Print($"Loaded {_availableStages.Length} Gothic stages for selection");
        }
        else
        {
            _availableStages = new string[] { "gothic_cathedral" }; // Fallback
            GD.PrintErr("StageManager not available, using fallback");
        }
    }
    
    private void SetupStageButtons()
    {
        if (_availableStages == null) return;
        
        _stageButtons = new Button[_availableStages.Length];
        
        for (int i = 0; i < _availableStages.Length; i++)
        {
            var stageId = _availableStages[i];
            var stageData = _stageManager?.GetStageData(stageId);
            
            var button = new Button
            {
                Text = stageData?.Name ?? GetStageName(stageId),
                ToggleMode = true,
                ButtonGroup = new ButtonGroup()
            };
            
            var index = i; // Capture for closure
            button.Pressed += () => OnStageButtonPressed(index);
            
            _stageButtons[i] = button;
            _stageGrid.AddChild(button);
        }
        
        // Select first stage by default
        if (_stageButtons.Length > 0)
        {
            _stageButtons[0].ButtonPressed = true;
            _selectedStageIndex = 0;
        }
    }
    
    private string GetStageName(string stageId)
    {
        return stageId switch
        {
            "gothic_cathedral" => "Gothic Cathedral",
            "gothic_castle" => "Gothic Castle Courtyard", 
            "gothic_crypt" => "Gothic Underground Crypt",
            _ => stageId.Replace("_", " ").ToTitleCase()
        };
    }
    
    private void OnStageButtonPressed(int index)
    {
        _selectedStageIndex = index;
        
        // Update other buttons
        for (int i = 0; i < _stageButtons.Length; i++)
        {
            _stageButtons[i].ButtonPressed = (i == index);
        }
        
        UpdateStageInfo();
        UpdateStagePreview();
    }
    
    private void UpdateStageInfo()
    {
        if (_selectedStageIndex < 0 || _selectedStageIndex >= _availableStages.Length) return;
        
        var stageId = _availableStages[_selectedStageIndex];
        var stageData = _stageManager?.GetStageData(stageId);
        
        if (stageData != null)
        {
            _stageNameLabel.Text = stageData.Name;
            _stageDescriptionLabel.Text = $"[b]{stageData.Name}[/b]\n\n{stageData.Description}\n\n[i]Theme: {stageData.Theme.ToTitleCase()}\nAtmosphere: {stageData.Atmosphere.ToTitleCase()}[/i]";
        }
        else
        {
            _stageNameLabel.Text = GetStageName(stageId);
            _stageDescriptionLabel.Text = $"[b]{GetStageName(stageId)}[/b]\n\nA mysterious Gothic fighting stage with dramatic architecture and atmospheric effects.";
        }
    }
    
    private void UpdateStagePreview()
    {
        if (_selectedStageIndex < 0 || _selectedStageIndex >= _availableStages.Length) return;
        
        var stageId = _availableStages[_selectedStageIndex];
        
        // Generate preview color based on stage theme
        var previewColor = stageId switch
        {
            "gothic_cathedral" => new Color(0.4f, 0.3f, 0.6f), // Purple for stained glass
            "gothic_castle" => new Color(0.3f, 0.3f, 0.4f),    // Dark gray for stone
            "gothic_crypt" => new Color(0.2f, 0.2f, 0.3f),     // Very dark for underground
            _ => new Color(0.4f, 0.4f, 0.5f)
        };
        
        _stagePreview.Color = previewColor;
        
        // Add some visual pattern to represent the stage
        CreateStagePreviewPattern(stageId);
    }
    
    private void CreateStagePreviewPattern(string stageId)
    {
        // Clear existing pattern
        foreach (Node child in _stagePreview.GetChildren())
        {
            child.QueueFree();
        }
        
        // Create simple pattern based on stage
        switch (stageId)
        {
            case "gothic_cathedral":
                CreateCathedralPattern();
                break;
            case "gothic_castle":
                CreateCastlePattern();
                break;
            case "gothic_crypt":
                CreateCryptPattern();
                break;
        }
    }
    
    private void CreateCathedralPattern()
    {
        // Create simple spire-like shapes
        for (int i = 0; i < 3; i++)
        {
            var spire = new ColorRect
            {
                Size = new Vector2(20, 80),
                Position = new Vector2(100 + i * 100, 120),
                Color = new Color(0.8f, 0.7f, 0.9f, 0.6f)
            };
            _stagePreview.AddChild(spire);
        }
    }
    
    private void CreateCastlePattern()
    {
        // Create battlements pattern
        for (int i = 0; i < 5; i++)
        {
            var battlement = new ColorRect
            {
                Size = new Vector2(40, 60),
                Position = new Vector2(50 + i * 60, 140),
                Color = new Color(0.7f, 0.7f, 0.8f, 0.7f)
            };
            _stagePreview.AddChild(battlement);
        }
    }
    
    private void CreateCryptPattern()
    {
        // Create arch pattern
        for (int i = 0; i < 2; i++)
        {
            var arch = new ColorRect
            {
                Size = new Vector2(80, 100),
                Position = new Vector2(120 + i * 120, 100),
                Color = new Color(0.6f, 0.6f, 0.7f, 0.5f)
            };
            _stagePreview.AddChild(arch);
        }
    }
    
    private void OnConfirmPressed()
    {
        if (_selectedStageIndex >= 0 && _selectedStageIndex < _availableStages.Length)
        {
            var selectedStageId = _availableStages[_selectedStageIndex];
            EmitSignal(SignalName.StageSelected, selectedStageId);
            GD.Print($"Stage selected: {selectedStageId}");
        }
    }
    
    private void OnBackPressed()
    {
        EmitSignal(SignalName.BackToMenu);
        GD.Print("Returning to menu from stage select");
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("ui_cancel"))
        {
            OnBackPressed();
        }
        else if (@event.IsActionPressed("ui_up") && _selectedStageIndex > 0)
        {
            OnStageButtonPressed(_selectedStageIndex - 1);
        }
        else if (@event.IsActionPressed("ui_down") && _selectedStageIndex < _availableStages.Length - 1)
        {
            OnStageButtonPressed(_selectedStageIndex + 1);
        }
        else if (@event.IsActionPressed("ui_accept"))
        {
            OnConfirmPressed();
        }
    }
    
    public void SetSelectedStage(string stageId)
    {
        for (int i = 0; i < _availableStages.Length; i++)
        {
            if (_availableStages[i] == stageId)
            {
                OnStageButtonPressed(i);
                break;
            }
        }
    }
    
    public string GetSelectedStageId()
    {
        if (_selectedStageIndex >= 0 && _selectedStageIndex < _availableStages.Length)
            return _availableStages[_selectedStageIndex];
        return "gothic_cathedral"; // Fallback
    }
}

// Extension method for string title case conversion
public static class StringExtensions
{
    public static string ToTitleCase(this string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        
        var words = input.Split(' ', '_', '-');
        for (int i = 0; i < words.Length; i++)
        {
            if (words[i].Length > 0)
            {
                words[i] = char.ToUpper(words[i][0]) + words[i].Substring(1).ToLower();
            }
        }
        return string.Join(" ", words);
    }
}