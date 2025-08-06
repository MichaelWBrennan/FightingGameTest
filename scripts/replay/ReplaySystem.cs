using Godot;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Linq;

/// <summary>
/// Advanced replay system for match recording, playback, and sharing
/// Industry-standard features for competitive fighting games
/// </summary>
public partial class ReplaySystem : Node
{
    public static ReplaySystem Instance { get; private set; }
    
    [Signal]
    public delegate void ReplayRecordingStartedEventHandler(string replayId);
    
    [Signal]
    public delegate void ReplayRecordingStoppedEventHandler(string replayId, float duration, int frameCount);
    
    [Signal]
    public delegate void ReplayPlaybackStartedEventHandler(string replayId);
    
    [Signal]
    public delegate void ReplayPlaybackStoppedEventHandler();
    
    // Recording state
    public bool IsRecording { get; private set; } = false;
    public bool IsPlayingBack { get; private set; } = false;
    public ReplayMatchData CurrentReplay { get; private set; }
    
    // Playback state
    private int _playbackFrame = 0;
    private float _playbackSpeed = 1.0f;
    private bool _isPaused = false;
    private bool _showReplayUI = false;
    
    // Replay storage
    private Dictionary<string, ReplayMatchData> _loadedReplays = new();
    private const string ReplayDirectory = "user://replays/";
    private const int MaxReplaysToKeep = 100;
    
    // UI Elements
    private CanvasLayer _replayUI;
    private Control _replayControls;
    private Label _replayInfoLabel;
    private Slider _playbackSpeedSlider;
    private Slider _frameSlider;
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeReplaySystem();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("ReplaySystem initialized");
    }
    
    public override void _Input(InputEvent @event)
    {
        if (IsPlayingBack)
        {
            HandlePlaybackInput(@event);
        }
        else if (!IsRecording)
        {
            HandleStandardInput(@event);
        }
    }
    
    private void HandlePlaybackInput(InputEvent @event)
    {
        if (@event.IsActionPressed("replay_pause"))
        {
            TogglePlaybackPause();
        }
        else if (@event.IsActionPressed("replay_speed_up"))
        {
            AdjustPlaybackSpeed(0.25f);
        }
        else if (@event.IsActionPressed("replay_speed_down"))
        {
            AdjustPlaybackSpeed(-0.25f);
        }
        else if (@event.IsActionPressed("replay_frame_forward"))
        {
            AdvanceFrame(1);
        }
        else if (@event.IsActionPressed("replay_frame_backward"))
        {
            AdvanceFrame(-1);
        }
        else if (@event.IsActionPressed("replay_restart"))
        {
            RestartPlayback();
        }
        else if (@event.IsActionPressed("replay_toggle_ui"))
        {
            ToggleReplayUI();
        }
    }
    
    private void HandleStandardInput(InputEvent @event)
    {
        if (@event.IsActionPressed("replay_quick_save"))
        {
            QuickSaveLastMatch();
        }
    }
    
    private void InitializeReplaySystem()
    {
        // Ensure replay directory exists
        DirAccess.Open("user://").MakeDirRecursiveAbsolute(ReplayDirectory);
        
        CreateReplayUI();
        LoadReplayList();
        
        // Connect to game events
        if (GameManager.Instance != null)
        {
            GameManager.Instance.GameStateChanged += OnGameStateChanged;
        }
    }
    
    private void CreateReplayUI()
    {
        _replayUI = new CanvasLayer();
        _replayUI.Layer = 600; // Above training mode
        _replayUI.Visible = false;
        AddChild(_replayUI);
        
        CreateReplayControls();
        CreateReplayInfoDisplay();
    }
    
    private void CreateReplayControls()
    {
        _replayControls = new Panel();
        _replayControls.SetAnchorsAndOffsetsPreset(Control.PresetMode.BottomWide);
        _replayControls.Position = new Vector2(0, -100);
        _replayControls.Size = new Vector2(0, 80);
        
        var style = new StyleBoxFlat();
        style.BgColor = new Color(0, 0, 0, 0.8f);
        style.BorderColor = Colors.Gray;
        style.BorderWidthTop = 2;
        _replayControls.AddThemeStyleboxOverride("panel", style);
        
        var hbox = new HBoxContainer();
        hbox.SetAnchorsAndOffsetsPreset(Control.PresetMode.FullRect);
        hbox.AddThemeConstantOverride("separation", 20);
        _replayControls.AddChild(hbox);
        
        // Playback controls
        CreatePlaybackButton(hbox, "⏮", RestartPlayback);
        CreatePlaybackButton(hbox, "⏪", () => AdvanceFrame(-10));
        CreatePlaybackButton(hbox, _isPaused ? "▶" : "⏸", TogglePlaybackPause);
        CreatePlaybackButton(hbox, "⏩", () => AdvanceFrame(10));
        CreatePlaybackButton(hbox, "⏭", () => _playbackFrame = CurrentReplay?.InputSequence.Count ?? 0);
        
        // Speed control
        var speedLabel = new Label();
        speedLabel.Text = "Speed:";
        speedLabel.VerticalAlignment = VerticalAlignment.Center;
        hbox.AddChild(speedLabel);
        
        _playbackSpeedSlider = new HSlider();
        _playbackSpeedSlider.MinValue = 0.25f;
        _playbackSpeedSlider.MaxValue = 4.0f;
        _playbackSpeedSlider.Step = 0.25f;
        _playbackSpeedSlider.Value = 1.0f;
        _playbackSpeedSlider.CustomMinimumSize = new Vector2(150, 0);
        _playbackSpeedSlider.ValueChanged += (double value) => SetPlaybackSpeed((float)value);
        hbox.AddChild(_playbackSpeedSlider);
        
        // Frame slider
        var frameLabel = new Label();
        frameLabel.Text = "Frame:";
        frameLabel.VerticalAlignment = VerticalAlignment.Center;
        hbox.AddChild(frameLabel);
        
        _frameSlider = new HSlider();
        _frameSlider.MinValue = 0;
        _frameSlider.CustomMinimumSize = new Vector2(300, 0);
        _frameSlider.ValueChanged += (double value) => JumpToFrame((int)value);
        hbox.AddChild(_frameSlider);
        
        _replayUI.AddChild(_replayControls);
    }
    
    private void CreatePlaybackButton(Container parent, string text, System.Action callback)
    {
        var button = new Button();
        button.Text = text;
        button.CustomMinimumSize = new Vector2(40, 40);
        button.Pressed += callback;
        parent.AddChild(button);
    }
    
    private void CreateReplayInfoDisplay()
    {
        _replayInfoLabel = new RichTextLabel();
        _replayInfoLabel.SetAnchorsAndOffsetsPreset(Control.PresetMode.TopLeft);
        _replayInfoLabel.Position = new Vector2(20, 20);
        _replayInfoLabel.Size = new Vector2(400, 120);
        _replayInfoLabel.BbcodeEnabled = true;
        _replayInfoLabel.FitContent = true;
        
        var style = new StyleBoxFlat();
        style.BgColor = new Color(0, 0, 0, 0.7f);
        style.BorderColor = Colors.White;
        style.BorderWidthLeft = style.BorderWidthRight = style.BorderWidthTop = style.BorderWidthBottom = 1;
        _replayInfoLabel.AddThemeStyleboxOverride("normal", style);
        
        _replayUI.AddChild(_replayInfoLabel);
    }
    
    public void StartRecording(string player1Name, string player2Name, string stage)
    {
        if (IsRecording || IsPlayingBack) return;
        
        string replayId = GenerateReplayId();
        
        CurrentReplay = new ReplayMatchData
        {
            ReplayId = replayId,
            Version = GetGameVersion(),
            Timestamp = Time.GetDatetimeStringFromSystem(),
            Player1Name = player1Name,
            Player2Name = player2Name,
            Stage = stage,
            InputSequence = new List<ReplayInputFrame>(),
            GameStateCheckpoints = new List<ReplayCheckpoint>(),
            Duration = 0.0f
        };
        
        IsRecording = true;
        GD.Print($"Started recording replay: {replayId}");
        EmitSignal(SignalName.ReplayRecordingStarted, replayId);
    }
    
    public void StopRecording(string winner, float matchDuration)
    {
        if (!IsRecording || CurrentReplay == null) return;
        
        CurrentReplay.Winner = winner;
        CurrentReplay.Duration = matchDuration;
        CurrentReplay.FrameCount = CurrentReplay.InputSequence.Count;
        
        // Save replay to disk
        SaveReplay(CurrentReplay);
        
        IsRecording = false;
        GD.Print($"Stopped recording replay: {CurrentReplay.ReplayId}");
        EmitSignal(SignalName.ReplayRecordingStopped, CurrentReplay.ReplayId, CurrentReplay.Duration, CurrentReplay.FrameCount);
        
        CurrentReplay = null;
    }
    
    public void RecordInputFrame(int player, InputEvent inputEvent, ReplayGameStateSnapshot gameState)
    {
        if (!IsRecording || CurrentReplay == null) return;
        
        var inputFrame = new ReplayInputFrame
        {
            Frame = CurrentReplay.InputSequence.Count,
            Player = player,
            InputType = GetInputType(inputEvent),
            InputData = SerializeInputEvent(inputEvent),
            Timestamp = Time.GetTicksMsec()
        };
        
        CurrentReplay.InputSequence.Add(inputFrame);
        
        // Save game state checkpoints periodically for fast seeking
        if (CurrentReplay.InputSequence.Count % 60 == 0) // Every second at 60 FPS
        {
            var checkpoint = new ReplayCheckpoint
            {
                Frame = CurrentReplay.InputSequence.Count,
                GameState = gameState
            };
            CurrentReplay.GameStateCheckpoints.Add(checkpoint);
        }
    }
    
    public async void PlayReplay(string replayId)
    {
        if (IsRecording || IsPlayingBack) return;
        
        ReplayMatchData replay = null;
        
        // Try to load from memory first
        if (_loadedReplays.ContainsKey(replayId))
        {
            replay = _loadedReplays[replayId];
        }
        else
        {
            // Load from disk
            replay = LoadReplay(replayId);
        }
        
        if (replay == null)
        {
            GD.PrintErr($"Failed to load replay: {replayId}");
            return;
        }
        
        CurrentReplay = replay;
        IsPlayingBack = true;
        _playbackFrame = 0;
        _playbackSpeed = 1.0f;
        _isPaused = false;
        
        // Setup UI
        _showReplayUI = true;
        _replayUI.Visible = true;
        UpdateFrameSlider();
        UpdateReplayInfo();
        
        // Initialize game state for replay
        await InitializeReplayGameState(replay);
        
        GD.Print($"Started playing replay: {replayId}");
        EmitSignal(SignalName.ReplayPlaybackStarted, replayId);
    }
    
    public void StopPlayback()
    {
        if (!IsPlayingBack) return;
        
        IsPlayingBack = false;
        _showReplayUI = false;
        _replayUI.Visible = false;
        CurrentReplay = null;
        
        GD.Print("Stopped replay playback");
        EmitSignal(SignalName.ReplayPlaybackStopped);
    }
    
    public override void _Process(double delta)
    {
        if (IsPlayingBack && !_isPaused && CurrentReplay != null)
        {
            ProcessReplayPlayback(delta);
        }
    }
    
    private void ProcessReplayPlayback(double delta)
    {
        float frameAdvance = _playbackSpeed * 60.0f * (float)delta; // Assuming 60 FPS
        
        for (int i = 0; i < (int)frameAdvance; i++)
        {
            if (_playbackFrame >= CurrentReplay.InputSequence.Count)
            {
                // Replay finished
                StopPlayback();
                return;
            }
            
            var inputFrame = CurrentReplay.InputSequence[_playbackFrame];
            
            // Re-inject the input
            var inputEvent = DeserializeInputEvent(inputFrame.InputData, inputFrame.InputType);
            if (inputEvent != null)
            {
                Input.ParseInputEvent(inputEvent);
            }
            
            _playbackFrame++;
        }
        
        UpdateReplayUI();
    }
    
    private void TogglePlaybackPause()
    {
        _isPaused = !_isPaused;
        GD.Print($"Replay playback {(_isPaused ? "paused" : "resumed")}");
    }
    
    private void AdjustPlaybackSpeed(float adjustment)
    {
        SetPlaybackSpeed(_playbackSpeed + adjustment);
    }
    
    private void SetPlaybackSpeed(float speed)
    {
        _playbackSpeed = Mathf.Clamp(speed, 0.25f, 4.0f);
        _playbackSpeedSlider.Value = _playbackSpeed;
        GD.Print($"Playback speed: {_playbackSpeed:F2}x");
    }
    
    private void AdvanceFrame(int frames)
    {
        if (CurrentReplay == null) return;
        
        _playbackFrame = Mathf.Clamp(_playbackFrame + frames, 0, CurrentReplay.InputSequence.Count);
        UpdateReplayUI();
    }
    
    private void JumpToFrame(int frame)
    {
        if (CurrentReplay == null) return;
        
        _playbackFrame = Mathf.Clamp(frame, 0, CurrentReplay.InputSequence.Count);
        
        // Find nearest checkpoint and restore game state
        var checkpoint = CurrentReplay.GameStateCheckpoints
            .Where(c => c.Frame <= _playbackFrame)
            .OrderByDescending(c => c.Frame)
            .FirstOrDefault();
        
        if (checkpoint != null)
        {
            RestoreGameState(checkpoint.GameState);
            
            // Fast-forward from checkpoint to target frame
            for (int i = checkpoint.Frame; i < _playbackFrame; i++)
            {
                var inputFrame = CurrentReplay.InputSequence[i];
                var inputEvent = DeserializeInputEvent(inputFrame.InputData, inputFrame.InputType);
                if (inputEvent != null)
                {
                    Input.ParseInputEvent(inputEvent);
                }
            }
        }
        
        UpdateReplayUI();
    }
    
    private void RestartPlayback()
    {
        JumpToFrame(0);
    }
    
    private void ToggleReplayUI()
    {
        _showReplayUI = !_showReplayUI;
        _replayControls.Visible = _showReplayUI;
    }
    
    private void UpdateReplayUI()
    {
        if (!_showReplayUI || CurrentReplay == null) return;
        
        _frameSlider.Value = _playbackFrame;
        UpdateReplayInfo();
    }
    
    private void UpdateFrameSlider()
    {
        if (CurrentReplay != null)
        {
            _frameSlider.MaxValue = CurrentReplay.InputSequence.Count;
        }
    }
    
    private void UpdateReplayInfo()
    {
        if (CurrentReplay == null) return;
        
        float currentTime = _playbackFrame / 60.0f; // Assuming 60 FPS
        float totalTime = CurrentReplay.Duration;
        
        string infoText = $"[b]{CurrentReplay.Player1Name}[/b] vs [b]{CurrentReplay.Player2Name}[/b]\n";
        infoText += $"Stage: {CurrentReplay.Stage}\n";
        infoText += $"Time: {currentTime:F1}s / {totalTime:F1}s\n";
        infoText += $"Frame: {_playbackFrame} / {CurrentReplay.FrameCount}\n";
        if (!string.IsNullOrEmpty(CurrentReplay.Winner))
        {
            infoText += $"Winner: [color=yellow]{CurrentReplay.Winner}[/color]";
        }
        
        _replayInfoLabel.Text = infoText;
    }
    
    private void SaveReplay(ReplayMatchData replay)
    {
        string fileName = $"{ReplayDirectory}{replay.ReplayId}.json";
        
        try
        {
            var json = JsonSerializer.Serialize(replay, new JsonSerializerOptions { WriteIndented = true });
            using var file = FileAccess.Open(fileName, FileAccess.ModeFlags.Write);
            file.StoreString(json);
            
            _loadedReplays[replay.ReplayId] = replay;
            
            // Clean up old replays if we have too many
            CleanupOldReplays();
            
            GD.Print($"Saved replay: {fileName}");
        }
        catch (System.Exception e)
        {
            GD.PrintErr($"Failed to save replay {replay.ReplayId}: {e.Message}");
        }
    }
    
    private ReplayMatchData LoadReplay(string replayId)
    {
        string fileName = $"{ReplayDirectory}{replayId}.json";
        
        try
        {
            using var file = FileAccess.Open(fileName, FileAccess.ModeFlags.Read);
            if (file == null) return null;
            
            var json = file.GetAsText();
            var replay = JsonSerializer.Deserialize<ReplayMatchData>(json);
            
            if (replay != null)
            {
                _loadedReplays[replayId] = replay;
            }
            
            return replay;
        }
        catch (System.Exception e)
        {
            GD.PrintErr($"Failed to load replay {replayId}: {e.Message}");
            return null;
        }
    }
    
    private void LoadReplayList()
    {
        var dir = DirAccess.Open(ReplayDirectory);
        if (dir == null) return;
        
        dir.ListDirBegin();
        string fileName = dir.GetNext();
        
        while (!string.IsNullOrEmpty(fileName))
        {
            if (fileName.EndsWith(".json"))
            {
                string replayId = fileName.Replace(".json", "");
                // Only load metadata initially, full data loaded on demand
                var replay = LoadReplayMetadata(replayId);
                if (replay != null)
                {
                    _loadedReplays[replayId] = replay;
                }
            }
            fileName = dir.GetNext();
        }
        
        dir.ListDirEnd();
        GD.Print($"Loaded {_loadedReplays.Count} replay files");
    }
    
    private ReplayMatchData LoadReplayMetadata(string replayId)
    {
        // Load only essential metadata for listing purposes
        // Full replay data loaded when actually playing
        return LoadReplay(replayId);
    }
    
    private void CleanupOldReplays()
    {
        if (_loadedReplays.Count <= MaxReplaysToKeep) return;
        
        // Keep most recent replays
        var sortedReplays = _loadedReplays.Values
            .OrderByDescending(r => r.Timestamp)
            .ToList();
        
        for (int i = MaxReplaysToKeep; i < sortedReplays.Count; i++)
        {
            var oldReplay = sortedReplays[i];
            DeleteReplay(oldReplay.ReplayId);
        }
    }
    
    public void DeleteReplay(string replayId)
    {
        string fileName = $"{ReplayDirectory}{replayId}.json";
        
        if (FileAccess.FileExists(fileName))
        {
            DirAccess.RemoveAbsolute(fileName);
        }
        
        _loadedReplays.Remove(replayId);
        GD.Print($"Deleted replay: {replayId}");
    }
    
    public void QuickSaveLastMatch()
    {
        // Save the most recent replay with a special marker
        if (CurrentReplay != null)
        {
            CurrentReplay.IsQuickSaved = true;
            SaveReplay(CurrentReplay);
            GD.Print("Quick saved last match");
        }
    }
    
    public List<ReplayMatchData> GetReplayList()
    {
        return _loadedReplays.Values.OrderByDescending(r => r.Timestamp).ToList();
    }
    
    private string GenerateReplayId()
    {
        return $"replay_{Time.GetDatetimeStringFromSystem().Replace(":", "").Replace("-", "").Replace(" ", "_")}_{GD.Randi() % 10000:D4}";
    }
    
    private string GetGameVersion()
    {
        // Get current game version
        return "1.0.0"; // Would be dynamic in real implementation
    }
    
    private string GetInputType(InputEvent inputEvent)
    {
        return inputEvent switch
        {
            InputEventKey => "key",
            InputEventJoypadButton => "joypad_button",
            InputEventJoypadMotion => "joypad_motion",
            _ => "unknown"
        };
    }
    
    private Dictionary<string, object> SerializeInputEvent(InputEvent inputEvent)
    {
        // Serialize input event to dictionary for JSON storage
        var data = new Dictionary<string, object>();
        
        switch (inputEvent)
        {
            case InputEventKey key:
                data["keycode"] = (int)key.Keycode;
                data["pressed"] = key.Pressed;
                break;
            case InputEventJoypadButton button:
                data["button_index"] = button.ButtonIndex;
                data["pressed"] = button.Pressed;
                break;
            case InputEventJoypadMotion motion:
                data["axis"] = motion.Axis;
                data["axis_value"] = motion.AxisValue;
                break;
        }
        
        return data;
    }
    
    private InputEvent DeserializeInputEvent(Dictionary<string, object> data, string inputType)
    {
        try
        {
            return inputType switch
            {
                "key" => CreateKeyEvent(data),
                "joypad_button" => CreateJoypadButtonEvent(data),
                "joypad_motion" => CreateJoypadMotionEvent(data),
                _ => null
            };
        }
        catch (System.Exception e)
        {
            GD.PrintErr($"Failed to deserialize input event: {e.Message}");
            return null;
        }
    }
    
    private InputEventKey CreateKeyEvent(Dictionary<string, object> data)
    {
        var keyEvent = new InputEventKey();
        keyEvent.Keycode = (Key)(int)data["keycode"];
        keyEvent.Pressed = (bool)data["pressed"];
        return keyEvent;
    }
    
    private InputEventJoypadButton CreateJoypadButtonEvent(Dictionary<string, object> data)
    {
        var buttonEvent = new InputEventJoypadButton();
        buttonEvent.ButtonIndex = (JoyButton)(int)data["button_index"];
        buttonEvent.Pressed = (bool)data["pressed"];
        return buttonEvent;
    }
    
    private InputEventJoypadMotion CreateJoypadMotionEvent(Dictionary<string, object> data)
    {
        var motionEvent = new InputEventJoypadMotion();
        motionEvent.Axis = (JoyAxis)(int)data["axis"];
        motionEvent.AxisValue = (float)data["axis_value"];
        return motionEvent;
    }
    
    private async System.Threading.Tasks.Task InitializeReplayGameState(ReplayMatchData replay)
    {
        // Initialize game to match replay conditions
        // This would integrate with the game manager to load proper stage, characters, etc.
        GD.Print($"Initializing replay game state for {replay.Player1Name} vs {replay.Player2Name}");
        await GetTree().ProcessFrame;
    }
    
    private void RestoreGameState(ReplayGameStateSnapshot gameState)
    {
        // Restore game state from checkpoint
        // This would restore character positions, health, meter, etc.
        GD.Print("Restoring game state from checkpoint");
    }
    
    private void OnGameStateChanged()
    {
        // Handle game state changes during recording
        if (IsRecording)
        {
            // Could record additional metadata here
        }
    }
}

public class ReplayMatchData
{
    public string ReplayId { get; set; }
    public string Version { get; set; }
    public string Timestamp { get; set; }
    public string Player1Name { get; set; }
    public string Player2Name { get; set; }
    public string Stage { get; set; }
    public string Winner { get; set; }
    public float Duration { get; set; }
    public int FrameCount { get; set; }
    public bool IsQuickSaved { get; set; } = false;
    public List<ReplayInputFrame> InputSequence { get; set; }
    public List<ReplayCheckpoint> GameStateCheckpoints { get; set; }
}

public class ReplayInputFrame
{
    public int Frame { get; set; }
    public int Player { get; set; }
    public string InputType { get; set; }
    public Dictionary<string, object> InputData { get; set; }
    public ulong Timestamp { get; set; }
}

public class ReplayCheckpoint
{
    public int Frame { get; set; }
    public ReplayGameStateSnapshot GameState { get; set; }
}

public class ReplayGameStateSnapshot
{
    public Dictionary<string, object> PlayerStates { get; set; }
    public Dictionary<string, object> GameData { get; set; }
    public float GameTime { get; set; }
}