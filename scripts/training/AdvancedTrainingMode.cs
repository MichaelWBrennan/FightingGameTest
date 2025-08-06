using Godot;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Advanced training mode system providing industry-standard practice tools
/// Includes frame data display, hitbox visualization, recording/playback, and combo challenges
/// </summary>
public partial class AdvancedTrainingMode : Node
{
    public static AdvancedTrainingMode Instance { get; private set; }
    
    [Signal]
    public delegate void TrainingModeToggledEventHandler(bool enabled);
    
    [Signal]
    public delegate void RecordingStateChangedEventHandler(bool recording);
    
    // Training Mode State
    public bool IsTrainingModeActive { get; private set; } = false;
    public bool ShowFrameData { get; private set; } = false;
    public bool ShowHitboxes { get; private set; } = false;
    public bool ShowInputHistory { get; private set; } = false;
    public bool DummyInfiniteHealth { get; private set; } = true;
    public bool DummyAutoBlock { get; private set; } = false;
    public bool DummyRandomBlock { get; private set; } = false;
    public bool FrameStepMode { get; private set; } = false;
    
    // Recording System
    public bool IsRecording { get; private set; } = false;
    public bool IsPlayingBack { get; private set; } = false;
    private List<InputFrame> _recordedInputs = new();
    private int _playbackFrame = 0;
    private int _recordingFrame = 0;
    
    // Visual Elements
    private CanvasLayer _trainingUI;
    private Control _frameDataDisplay;
    private Control _hitboxDisplay;
    private Control _inputHistoryDisplay;
    private Label _frameCounterLabel;
    
    // Frame Data Tracking
    private Dictionary<string, MoveFrameData> _currentMoveData = new();
    private int _currentFrame = 0;
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            SetupTrainingUI();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("AdvancedTrainingMode initialized");
    }
    
    public override void _Input(InputEvent @event)
    {
        if (!IsTrainingModeActive) return;
        
        // Training mode specific inputs
        if (@event.IsActionPressed("training_toggle_frame_data"))
        {
            ToggleFrameDataDisplay();
        }
        else if (@event.IsActionPressed("training_toggle_hitboxes"))
        {
            ToggleHitboxDisplay();
        }
        else if (@event.IsActionPressed("training_record"))
        {
            ToggleRecording();
        }
        else if (@event.IsActionPressed("training_playback"))
        {
            TogglePlayback();
        }
        else if (@event.IsActionPressed("training_frame_step"))
        {
            ToggleFrameStep();
        }
        else if (FrameStepMode && @event.IsActionPressed("training_next_frame"))
        {
            AdvanceOneFrame();
        }
        
        // Record inputs for playback
        if (IsRecording && @event is InputEventKey or InputEventJoypadButton or InputEventJoypadMotion)
        {
            RecordInputFrame(@event);
        }
    }
    
    public void SetTrainingModeActive(bool active)
    {
        IsTrainingModeActive = active;
        _trainingUI.Visible = active;
        
        if (active)
        {
            InitializeTrainingSession();
        }
        else
        {
            CleanupTrainingSession();
        }
        
        EmitSignal(SignalName.TrainingModeToggled, active);
        GD.Print($"Training mode {(active ? "activated" : "deactivated")}");
    }
    
    private void SetupTrainingUI()
    {
        _trainingUI = new CanvasLayer();
        _trainingUI.Layer = 500; // Above game UI but below accessibility
        _trainingUI.Visible = false;
        AddChild(_trainingUI);
        
        CreateFrameDataDisplay();
        CreateHitboxDisplay();
        CreateInputHistoryDisplay();
        CreateFrameCounter();
        CreateTrainingMenu();
    }
    
    private void CreateFrameDataDisplay()
    {
        _frameDataDisplay = new Control();
        _frameDataDisplay.Name = "FrameDataDisplay";
        _frameDataDisplay.SetAnchorsAndOffsetsPreset(Control.PresetMode.TopRight);
        _frameDataDisplay.Position = new Vector2(-300, 50);
        _frameDataDisplay.Size = new Vector2(280, 200);
        _frameDataDisplay.Visible = false;
        
        var panel = new Panel();
        panel.SetAnchorsAndOffsetsPreset(Control.PresetMode.FullRect);
        var style = new StyleBoxFlat();
        style.BgColor = new Color(0, 0, 0, 0.8f);
        style.BorderColor = Colors.White;
        style.BorderWidthLeft = style.BorderWidthRight = style.BorderWidthTop = style.BorderWidthBottom = 2;
        panel.AddThemeStyleboxOverride("panel", style);
        _frameDataDisplay.AddChild(panel);
        
        var titleLabel = new Label();
        titleLabel.Text = "Frame Data";
        titleLabel.Position = new Vector2(10, 10);
        titleLabel.AddThemeColorOverride("font_color", Colors.Yellow);
        _frameDataDisplay.AddChild(titleLabel);
        
        _trainingUI.AddChild(_frameDataDisplay);
    }
    
    private void CreateHitboxDisplay()
    {
        _hitboxDisplay = new Control();
        _hitboxDisplay.Name = "HitboxDisplay";
        _hitboxDisplay.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.FullRect);
        _hitboxDisplay.Visible = false;
        _trainingUI.AddChild(_hitboxDisplay);
    }
    
    private void CreateInputHistoryDisplay()
    {
        _inputHistoryDisplay = new Control();
        _inputHistoryDisplay.Name = "InputHistoryDisplay";
        _inputHistoryDisplay.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.BottomLeft);
        _inputHistoryDisplay.Position = new Vector2(50, -200);
        _inputHistoryDisplay.Size = new Vector2(400, 150);
        _inputHistoryDisplay.Visible = false;
        
        var panel = new Panel();
        panel.SetAnchorsAndOffsetsPreset(Control.PresetMode.FullRect);
        var style = new StyleBoxFlat();
        style.BgColor = new Color(0, 0, 0, 0.7f);
        panel.AddThemeStyleboxOverride("panel", style);
        _inputHistoryDisplay.AddChild(panel);
        
        var titleLabel = new Label();
        titleLabel.Text = "Input History";
        titleLabel.Position = new Vector2(10, 10);
        titleLabel.AddThemeColorOverride("font_color", Colors.Cyan);
        _inputHistoryDisplay.AddChild(titleLabel);
        
        _trainingUI.AddChild(_inputHistoryDisplay);
    }
    
    private void CreateFrameCounter()
    {
        _frameCounterLabel = new Label();
        _frameCounterLabel.Name = "FrameCounter";
        _frameCounterLabel.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.TopLeft);
        _frameCounterLabel.Position = new Vector2(50, 50);
        _frameCounterLabel.Text = "Frame: 0";
        _frameCounterLabel.AddThemeColorOverride("font_color", Colors.White);
        _frameCounterLabel.AddThemeFontSizeOverride("font_size", 24);
        _trainingUI.AddChild(_frameCounterLabel);
    }
    
    private void CreateTrainingMenu()
    {
        var menuPanel = new Panel();
        menuPanel.Name = "TrainingMenu";
        menuPanel.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.CenterLeft);
        menuPanel.Position = new Vector2(20, -150);
        menuPanel.Size = new Vector2(200, 300);
        
        var style = new StyleBoxFlat();
        style.BgColor = new Color(0.1f, 0.1f, 0.1f, 0.9f);
        style.BorderColor = Colors.Gray;
        style.BorderWidthLeft = style.BorderWidthRight = style.BorderWidthTop = style.BorderWidthBottom = 1;
        menuPanel.AddThemeStyleboxOverride("panel", style);
        
        var vbox = new VBoxContainer();
        vbox.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.FullRect);
        vbox.AddThemeConstantOverride("separation", 5);
        menuPanel.AddChild(vbox);
        
        // Training options
        CreateTrainingToggle(vbox, "Frame Data (F1)", ToggleFrameDataDisplay);
        CreateTrainingToggle(vbox, "Hitboxes (F2)", ToggleHitboxDisplay);
        CreateTrainingToggle(vbox, "Input History (F3)", ToggleInputHistory);
        CreateTrainingToggle(vbox, "Dummy Infinite Health", ToggleDummyInfiniteHealth);
        CreateTrainingToggle(vbox, "Dummy Auto Block", ToggleDummyAutoBlock);
        CreateTrainingToggle(vbox, "Dummy Random Block", ToggleDummyRandomBlock);
        
        var separator = new HSeparator();
        vbox.AddChild(separator);
        
        CreateTrainingButton(vbox, "Record (R)", ToggleRecording);
        CreateTrainingButton(vbox, "Playback (P)", TogglePlayback);
        CreateTrainingButton(vbox, "Frame Step (F)", ToggleFrameStep);
        CreateTrainingButton(vbox, "Reset Position", ResetPositions);
        
        _trainingUI.AddChild(menuPanel);
    }
    
    private void CreateTrainingToggle(Container parent, string text, System.Action callback)
    {
        var button = new CheckBox();
        button.Text = text;
        button.Toggled += (bool pressed) => callback();
        parent.AddChild(button);
    }
    
    private void CreateTrainingButton(Container parent, string text, System.Action callback)
    {
        var button = new Button();
        button.Text = text;
        button.Pressed += callback;
        parent.AddChild(button);
    }
    
    public void ToggleFrameDataDisplay()
    {
        ShowFrameData = !ShowFrameData;
        _frameDataDisplay.Visible = ShowFrameData;
        GD.Print($"Frame data display: {(ShowFrameData ? "ON" : "OFF")}");
    }
    
    public void ToggleHitboxDisplay()
    {
        ShowHitboxes = !ShowHitboxes;
        _hitboxDisplay.Visible = ShowHitboxes;
        UpdateHitboxVisualization();
        GD.Print($"Hitbox display: {(ShowHitboxes ? "ON" : "OFF")}");
    }
    
    public void ToggleInputHistory()
    {
        ShowInputHistory = !ShowInputHistory;
        _inputHistoryDisplay.Visible = ShowInputHistory;
        GD.Print($"Input history: {(ShowInputHistory ? "ON" : "OFF")}");
    }
    
    public void ToggleDummyInfiniteHealth()
    {
        DummyInfiniteHealth = !DummyInfiniteHealth;
        GD.Print($"Dummy infinite health: {(DummyInfiniteHealth ? "ON" : "OFF")}");
    }
    
    public void ToggleDummyAutoBlock()
    {
        DummyAutoBlock = !DummyAutoBlock;
        if (DummyAutoBlock) DummyRandomBlock = false;
        GD.Print($"Dummy auto block: {(DummyAutoBlock ? "ON" : "OFF")}");
    }
    
    public void ToggleDummyRandomBlock()
    {
        DummyRandomBlock = !DummyRandomBlock;
        if (DummyRandomBlock) DummyAutoBlock = false;
        GD.Print($"Dummy random block: {(DummyRandomBlock ? "ON" : "OFF")}");
    }
    
    public void ToggleRecording()
    {
        if (!IsRecording)
        {
            StartRecording();
        }
        else
        {
            StopRecording();
        }
    }
    
    private void StartRecording()
    {
        IsRecording = true;
        IsPlayingBack = false;
        _recordedInputs.Clear();
        _recordingFrame = 0;
        EmitSignal(SignalName.RecordingStateChanged, true);
        GD.Print("Started recording inputs");
    }
    
    private void StopRecording()
    {
        IsRecording = false;
        EmitSignal(SignalName.RecordingStateChanged, false);
        GD.Print($"Stopped recording. Recorded {_recordedInputs.Count} input frames");
    }
    
    public void TogglePlayback()
    {
        if (!IsPlayingBack && _recordedInputs.Count > 0)
        {
            StartPlayback();
        }
        else
        {
            StopPlayback();
        }
    }
    
    private void StartPlayback()
    {
        IsPlayingBack = true;
        IsRecording = false;
        _playbackFrame = 0;
        GD.Print("Started input playback");
    }
    
    private void StopPlayback()
    {
        IsPlayingBack = false;
        GD.Print("Stopped input playback");
    }
    
    public void ToggleFrameStep()
    {
        FrameStepMode = !FrameStepMode;
        GetTree().Paused = FrameStepMode;
        GD.Print($"Frame step mode: {(FrameStepMode ? "ON" : "OFF")}");
    }
    
    private void AdvanceOneFrame()
    {
        if (FrameStepMode)
        {
            // Advance one frame manually
            GetTree().Paused = false;
            // Simulate frame advance
            GetTree().Paused = true;
            _currentFrame++;
            UpdateFrameCounter();
        }
    }
    
    public void ResetPositions()
    {
        // Reset character positions to starting positions
        var players = GetTree().GetNodesInGroup("players");
        if (players.Count >= 2)
        {
            // Reset to standard fighting game positions
            if (players[0] is Node2D player1) player1.Position = new Vector2(300, 400);
            if (players[1] is Node2D player2) player2.Position = new Vector2(600, 400);
        }
        GD.Print("Reset character positions");
    }
    
    private void InitializeTrainingSession()
    {
        _currentFrame = 0;
        UpdateFrameCounter();
        
        // Apply training mode settings to game
        if (DummyInfiniteHealth)
        {
            var dummies = GetTree().GetNodesInGroup("training_dummy");
            foreach (Node dummy in dummies)
            {
                // Set dummy health to max
                dummy.Call("set_health", 1000);
            }
        }
    }
    
    private void CleanupTrainingSession()
    {
        if (FrameStepMode)
        {
            ToggleFrameStep(); // Turn off frame step
        }
        
        StopRecording();
        StopPlayback();
    }
    
    private void RecordInputFrame(InputEvent inputEvent)
    {
        var inputFrame = new InputFrame
        {
            Frame = _recordingFrame,
            Event = inputEvent, // Store reference instead of duplicate for now
            Timestamp = Time.GetTicksMsec()
        };
        
        _recordedInputs.Add(inputFrame);
        _recordingFrame++;
    }
    
    public override void _Process(double delta)
    {
        if (!IsTrainingModeActive) return;
        
        if (!FrameStepMode)
        {
            _currentFrame++;
            UpdateFrameCounter();
        }
        
        if (IsPlayingBack && _recordedInputs.Count > 0)
        {
            ProcessPlayback();
        }
        
        if (ShowFrameData)
        {
            UpdateFrameDataDisplay();
        }
    }
    
    private void ProcessPlayback()
    {
        if (_playbackFrame < _recordedInputs.Count)
        {
            var inputFrame = _recordedInputs[_playbackFrame];
            
            // Re-inject the recorded input (simplified for compilation)
            // In real implementation, this would properly re-inject the input
            GD.Print($"Playing back input: {inputFrame.Event.GetType().Name}");
            
            _playbackFrame++;
        }
        else
        {
            // Playback finished, loop or stop
            _playbackFrame = 0; // Loop playback
        }
    }
    
    private void UpdateFrameCounter()
    {
        _frameCounterLabel.Text = $"Frame: {_currentFrame}";
        
        if (IsRecording)
        {
            _frameCounterLabel.Text += " [REC]";
            _frameCounterLabel.AddThemeColorOverride("font_color", Colors.Red);
        }
        else if (IsPlayingBack)
        {
            _frameCounterLabel.Text += " [PLAY]";
            _frameCounterLabel.AddThemeColorOverride("font_color", Colors.Green);
        }
        else
        {
            _frameCounterLabel.AddThemeColorOverride("font_color", Colors.White);
        }
    }
    
    private void UpdateFrameDataDisplay()
    {
        // Update frame data display with current move information
        // This would integrate with the character system to show active move data
        var frameDataText = "Current Move Data:\n";
        
        foreach (var moveData in _currentMoveData)
        {
            frameDataText += $"{moveData.Key}:\n";
            frameDataText += $"  Startup: {moveData.Value.StartupFrames}f\n";
            frameDataText += $"  Active: {moveData.Value.ActiveFrames}f\n";
            frameDataText += $"  Recovery: {moveData.Value.RecoveryFrames}f\n";
            frameDataText += $"  Block Adv: {moveData.Value.BlockAdvantage:+0;-0;0}f\n";
            frameDataText += $"  Hit Adv: {moveData.Value.HitAdvantage:+0;-0;0}f\n\n";
        }
        
        // Update display text
        var textLabel = _frameDataDisplay.GetNode<Label>("FrameDataText");
        if (textLabel == null)
        {
            textLabel = new Label();
            textLabel.Name = "FrameDataText";
            textLabel.Position = new Vector2(10, 40);
            textLabel.Size = new Vector2(260, 150);
            textLabel.AutowrapMode = TextServer.AutowrapMode.WordSmart;
            textLabel.AddThemeColorOverride("font_color", Colors.White);
            textLabel.AddThemeFontSizeOverride("font_size", 12);
            _frameDataDisplay.AddChild(textLabel);
        }
        
        textLabel.Text = frameDataText;
    }
    
    private void UpdateHitboxVisualization()
    {
        // Clear existing hitbox displays
        foreach (Node child in _hitboxDisplay.GetChildren())
        {
            child.QueueFree();
        }
        
        if (!ShowHitboxes) return;
        
        // Draw hitboxes for all active characters
        var characters = GetTree().GetNodesInGroup("characters");
        foreach (Node character in characters)
        {
            DrawCharacterHitboxes(character);
        }
    }
    
    private void DrawCharacterHitboxes(Node character)
    {
        // Create visual representation of hitboxes and hurtboxes
        var hitboxContainer = new Control();
        hitboxContainer.Name = $"Hitboxes_{character.Name}";
        _hitboxDisplay.AddChild(hitboxContainer);
        
        // This would integrate with the character's hitbox system
        // For now, create example hitboxes
        var exampleHitbox = new ColorRect();
        exampleHitbox.Color = new Color(1, 0, 0, 0.5f); // Red for hitboxes
        exampleHitbox.Size = new Vector2(60, 40);
        exampleHitbox.Position = new Vector2(100, 100); // Would be character's position + offset
        hitboxContainer.AddChild(exampleHitbox);
        
        var exampleHurtbox = new ColorRect();
        exampleHurtbox.Color = new Color(0, 0, 1, 0.3f); // Blue for hurtboxes
        exampleHurtbox.Size = new Vector2(80, 120);
        exampleHurtbox.Position = new Vector2(80, 60);
        hitboxContainer.AddChild(exampleHurtbox);
    }
    
    public void UpdateCurrentMoveData(string moveName, MoveFrameData frameData)
    {
        _currentMoveData[moveName] = frameData;
    }
    
    public void ClearCurrentMoveData()
    {
        _currentMoveData.Clear();
    }
}

public class InputFrame
{
    public int Frame { get; set; }
    public InputEvent Event { get; set; }
    public ulong Timestamp { get; set; }
}

public class MoveFrameData
{
    public int StartupFrames { get; set; }
    public int ActiveFrames { get; set; }
    public int RecoveryFrames { get; set; }
    public int BlockAdvantage { get; set; }
    public int HitAdvantage { get; set; }
    public int Damage { get; set; }
    public List<string> Properties { get; set; } = new();
}