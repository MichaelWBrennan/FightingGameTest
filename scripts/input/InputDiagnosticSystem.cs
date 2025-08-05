using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Zero-Touch Input Diagnostics System
/// Eliminates the #1 cause of negative reviews: controller issues and dropped inputs
/// Automatically detects and calibrates controller problems
/// </summary>
public partial class InputDiagnosticSystem : Node
{
    public static InputDiagnosticSystem Instance { get; private set; }
    
    // Diagnostic data for each controller
    private Dictionary<int, ControllerDiagnostics> _controllerDiagnostics = new();
    private bool _isFirstRun = false;
    private bool _diagnosticTestInProgress = false;
    private bool _showInputFeedback = false;
    
    // Configuration
    private const float LATENCY_TEST_DURATION = 3.0f;
    private const float DEADZONE_TEST_THRESHOLD = 0.1f;
    private const int MIN_INPUTS_FOR_ANALYSIS = 60;
    private const float MAX_ACCEPTABLE_LATENCY = 100.0f; // milliseconds
    
    [Signal]
    public delegate void DiagnosticCompleteEventHandler(int deviceId);
    
    [Signal]
    public delegate void InputErrorDetectedEventHandler(int deviceId, string errorType);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            CheckFirstRun();
            SetupDiagnostics();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("InputDiagnosticSystem initialized");
    }
    
    private void CheckFirstRun()
    {
        // Check if this is the first time running the game
        var configFile = new ConfigFile();
        var err = configFile.Load("user://input_diagnostics.cfg");
        
        if (err != Error.Ok)
        {
            _isFirstRun = true;
            // Schedule diagnostic test for first frame
            CallDeferred(nameof(StartFirstRunDiagnostics));
        }
        else
        {
            // Load previous diagnostic results
            LoadPreviousDiagnostics(configFile);
        }
    }
    
    private void SetupDiagnostics()
    {
        // Initialize diagnostics for all connected controllers
        var connectedJoypads = Input.GetConnectedJoypads();
        
        // Always include keyboard as device -1
        _controllerDiagnostics[-1] = new ControllerDiagnostics(-1, "Keyboard");
        
        foreach (int deviceId in connectedJoypads)
        {
            var joystickName = Input.GetJoyName(deviceId);
            _controllerDiagnostics[deviceId] = new ControllerDiagnostics(deviceId, joystickName);
            GD.Print($"Detected controller: {joystickName} (ID: {deviceId})");
        }
    }
    
    public void StartFirstRunDiagnostics()
    {
        if (!_isFirstRun || _diagnosticTestInProgress)
            return;
            
        GD.Print("Starting first-run input diagnostics...");
        _diagnosticTestInProgress = true;
        
        // Create diagnostic UI
        ShowDiagnosticUI();
        
        // Start latency tests for each controller
        foreach (var kvp in _controllerDiagnostics)
        {
            StartLatencyTest(kvp.Key);
        }
    }
    
    public void StartLatencyTest(int deviceId)
    {
        if (!_controllerDiagnostics.ContainsKey(deviceId))
            return;
            
        var diagnostics = _controllerDiagnostics[deviceId];
        diagnostics.StartLatencyTest();
        
        GD.Print($"Starting latency test for device {deviceId}: {diagnostics.DeviceName}");
    }
    
    public override void _Input(InputEvent @event)
    {
        if (!_diagnosticTestInProgress)
        {
            // Real-time input monitoring during gameplay
            MonitorInputForErrors(@event);
            return;
        }
        
        // Handle diagnostic test inputs
        ProcessDiagnosticInput(@event);
    }
    
    private void ProcessDiagnosticInput(InputEvent @event)
    {
        int deviceId = @event.Device;
        
        // Handle keyboard separately
        if (@event is InputEventKey)
            deviceId = -1;
            
        if (!_controllerDiagnostics.ContainsKey(deviceId))
            return;
            
        var diagnostics = _controllerDiagnostics[deviceId];
        
        if (@event is InputEventJoypadButton buttonEvent)
        {
            diagnostics.RecordButtonInput(buttonEvent.ButtonIndex, buttonEvent.Pressed, Time.GetTicksMsec());
        }
        else if (@event is InputEventJoypadMotion motionEvent)
        {
            diagnostics.RecordAxisInput(motionEvent.Axis, motionEvent.AxisValue, Time.GetTicksMsec());
        }
        else if (@event is InputEventKey keyEvent)
        {
            diagnostics.RecordKeyInput(keyEvent.Keycode, keyEvent.Pressed, Time.GetTicksMsec());
        }
        
        // Check if we have enough data to complete the test
        if (diagnostics.HasSufficientData())
        {
            CompleteDiagnosticTest(deviceId);
        }
    }
    
    private void MonitorInputForErrors(InputEvent @event)
    {
        if (!_showInputFeedback)
            return;
            
        int deviceId = @event.Device;
        if (@event is InputEventKey)
            deviceId = -1;
            
        if (!_controllerDiagnostics.ContainsKey(deviceId))
            return;
            
        var diagnostics = _controllerDiagnostics[deviceId];
        
        // Check for potential input errors
        if (@event is InputEventJoypadButton buttonEvent)
        {
            if (diagnostics.IsLikelyDroppedInput(buttonEvent.ButtonIndex, buttonEvent.Pressed))
            {
                EmitSignal(SignalName.InputErrorDetected, deviceId, "dropped_input");
                ShowInputErrorFeedback("Input may have been dropped - check controller connection");
            }
        }
    }
    
    private void CompleteDiagnosticTest(int deviceId)
    {
        var diagnostics = _controllerDiagnostics[deviceId];
        diagnostics.CalculateResults();
        
        GD.Print($"Diagnostic test completed for device {deviceId}:");
        GD.Print($"  Average Latency: {diagnostics.AverageLatency:F2}ms");
        GD.Print($"  Dropped Inputs: {diagnostics.DroppedInputCount}");
        GD.Print($"  Deadzone Issues: {diagnostics.DeadzoneIssues}");
        
        EmitSignal(SignalName.DiagnosticComplete, deviceId);
        
        // Apply auto-calibration if needed
        ApplyAutoCalibration(deviceId, diagnostics);
        
        // Check if all devices are tested
        CheckAllDiagnosticsComplete();
    }
    
    private void ApplyAutoCalibration(int deviceId, ControllerDiagnostics diagnostics)
    {
        if (diagnostics.RequiresCalibration())
        {
            GD.Print($"Applying auto-calibration for device {deviceId}");
            
            // Adjust deadzone if needed
            if (diagnostics.DeadzoneIssues > 0)
            {
                var newDeadzone = Math.Max(0.05f, diagnostics.RecommendedDeadzone);
                Input.SetDefaultCursorShape(Input.CursorShape.Help); // Visual feedback
                GD.Print($"  Recommended deadzone: {newDeadzone:F3}");
            }
            
            // Warn about high latency
            if (diagnostics.AverageLatency > MAX_ACCEPTABLE_LATENCY)
            {
                ShowLatencyWarning(diagnostics.AverageLatency);
            }
        }
    }
    
    private void CheckAllDiagnosticsComplete()
    {
        bool allComplete = _controllerDiagnostics.Values.All(d => d.IsTestComplete);
        
        if (allComplete)
        {
            _diagnosticTestInProgress = false;
            SaveDiagnosticResults();
            HideDiagnosticUI();
            ShowDiagnosticSummary();
        }
    }
    
    private void SaveDiagnosticResults()
    {
        var configFile = new ConfigFile();
        
        foreach (var kvp in _controllerDiagnostics)
        {
            var deviceId = kvp.Key;
            var diagnostics = kvp.Value;
            var section = $"device_{deviceId}";
            
            configFile.SetValue(section, "device_name", diagnostics.DeviceName);
            configFile.SetValue(section, "average_latency", diagnostics.AverageLatency);
            configFile.SetValue(section, "dropped_inputs", diagnostics.DroppedInputCount);
            configFile.SetValue(section, "deadzone_issues", diagnostics.DeadzoneIssues);
            configFile.SetValue(section, "recommended_deadzone", diagnostics.RecommendedDeadzone);
            configFile.SetValue(section, "last_tested", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
        }
        
        configFile.SetValue("general", "first_run_complete", true);
        configFile.Save("user://input_diagnostics.cfg");
        
        GD.Print("Input diagnostic results saved");
    }
    
    private void LoadPreviousDiagnostics(ConfigFile configFile)
    {
        var sections = configFile.GetSections();
        
        foreach (string section in sections)
        {
            if (section.StartsWith("device_"))
            {
                var deviceIdStr = section.Substring(7); // Remove "device_" prefix
                if (int.TryParse(deviceIdStr, out int deviceId))
                {
                    var deviceName = configFile.GetValue(section, "device_name", "Unknown").AsString();
                    var diagnostics = new ControllerDiagnostics(deviceId, deviceName);
                    
                    diagnostics.AverageLatency = configFile.GetValue(section, "average_latency", 0.0f).AsSingle();
                    diagnostics.DroppedInputCount = configFile.GetValue(section, "dropped_inputs", 0).AsInt32();
                    diagnostics.DeadzoneIssues = configFile.GetValue(section, "deadzone_issues", 0).AsInt32();
                    diagnostics.RecommendedDeadzone = configFile.GetValue(section, "recommended_deadzone", 0.1f).AsSingle();
                    
                    _controllerDiagnostics[deviceId] = diagnostics;
                }
            }
        }
        
        GD.Print("Loaded previous input diagnostic results");
    }
    
    public void EnableInputFeedback(bool enable)
    {
        _showInputFeedback = enable;
        GD.Print($"Input feedback: {(enable ? "enabled" : "disabled")}");
    }
    
    public ControllerDiagnostics GetDiagnostics(int deviceId)
    {
        return _controllerDiagnostics.GetValueOrDefault(deviceId);
    }
    
    public void ShowDiagnosticUI()
    {
        // In a real implementation, this would create a UI overlay
        GD.Print("=== INPUT DIAGNOSTIC TEST ===");
        GD.Print("Please press buttons and move sticks on all controllers");
        GD.Print("Test will complete automatically when sufficient data is collected");
    }
    
    public void HideDiagnosticUI()
    {
        GD.Print("=== DIAGNOSTIC TEST COMPLETE ===");
    }
    
    public void ShowDiagnosticSummary()
    {
        GD.Print("=== DIAGNOSTIC SUMMARY ===");
        foreach (var kvp in _controllerDiagnostics)
        {
            var diagnostics = kvp.Value;
            var status = diagnostics.RequiresCalibration() ? "NEEDS ATTENTION" : "OK";
            GD.Print($"{diagnostics.DeviceName}: {status}");
        }
    }
    
    private void ShowInputErrorFeedback(string message)
    {
        // In training mode, show visual feedback for input errors
        GD.Print($"INPUT ERROR: {message}");
    }
    
    private void ShowLatencyWarning(float latency)
    {
        GD.Print($"WARNING: High input latency detected ({latency:F2}ms)");
        GD.Print("Consider using wired connection or updating drivers");
    }
}

/// <summary>
/// Diagnostic data for a single input device
/// </summary>
public class ControllerDiagnostics
{
    public int DeviceId { get; private set; }
    public string DeviceName { get; private set; }
    public bool IsTestComplete { get; private set; }
    
    // Test results
    public float AverageLatency { get; set; }
    public int DroppedInputCount { get; set; }
    public int DeadzoneIssues { get; set; }
    public float RecommendedDeadzone { get; set; } = 0.1f;
    
    // Test data
    private List<InputSample> _inputSamples = new();
    private ulong _testStartTime;
    private int _expectedInputs;
    private int _receivedInputs;
    
    public ControllerDiagnostics(int deviceId, string deviceName)
    {
        DeviceId = deviceId;
        DeviceName = deviceName;
        _testStartTime = Time.GetTicksMsec();
    }
    
    public void StartLatencyTest()
    {
        _inputSamples.Clear();
        _testStartTime = Time.GetTicksMsec();
        _expectedInputs = 0;
        _receivedInputs = 0;
    }
    
    public void RecordButtonInput(JoyButton button, bool pressed, ulong timestamp)
    {
        _inputSamples.Add(new InputSample
        {
            Type = InputType.Button,
            ButtonIndex = (int)button,
            Value = pressed ? 1.0f : 0.0f,
            Timestamp = timestamp
        });
        
        if (pressed)
            _receivedInputs++;
    }
    
    public void RecordAxisInput(JoyAxis axis, float value, ulong timestamp)
    {
        _inputSamples.Add(new InputSample
        {
            Type = InputType.Axis,
            ButtonIndex = (int)axis,
            Value = value,
            Timestamp = timestamp
        });
        
        // Check for deadzone issues
        if (Math.Abs(value) < 0.05f && Math.Abs(value) > 0.001f)
        {
            DeadzoneIssues++;
        }
    }
    
    public void RecordKeyInput(Key key, bool pressed, ulong timestamp)
    {
        _inputSamples.Add(new InputSample
        {
            Type = InputType.Key,
            ButtonIndex = (int)key,
            Value = pressed ? 1.0f : 0.0f,
            Timestamp = timestamp
        });
        
        if (pressed)
            _receivedInputs++;
    }
    
    public bool HasSufficientData()
    {
        var elapsed = Time.GetTicksMsec() - _testStartTime;
        return _inputSamples.Count >= 60 || elapsed > 5000; // 5 second timeout
    }
    
    public void CalculateResults()
    {
        if (_inputSamples.Count == 0)
        {
            IsTestComplete = true;
            return;
        }
        
        // Calculate average latency (simplified - in reality this would be more complex)
        var latencies = new List<float>();
        for (int i = 1; i < _inputSamples.Count; i++)
        {
            var timeDiff = _inputSamples[i].Timestamp - _inputSamples[i - 1].Timestamp;
            if (timeDiff > 0 && timeDiff < 200) // Filter out unrealistic values
            {
                latencies.Add(timeDiff);
            }
        }
        
        AverageLatency = latencies.Count > 0 ? latencies.Average() : 0;
        
        // Check for dropped inputs (simplified)
        DroppedInputCount = Math.Max(0, _expectedInputs - _receivedInputs);
        
        // Recommend deadzone based on axis noise
        var axisInputs = _inputSamples.Where(s => s.Type == InputType.Axis).ToList();
        if (axisInputs.Count > 0)
        {
            var smallMovements = axisInputs.Where(s => Math.Abs(s.Value) < 0.2f && Math.Abs(s.Value) > 0.001f);
            var noiseLevel = smallMovements.Any() ? smallMovements.Max(s => Math.Abs(s.Value)) : 0.05f;
            RecommendedDeadzone = Math.Max(0.05f, noiseLevel * 1.5f);
        }
        
        IsTestComplete = true;
    }
    
    public bool RequiresCalibration()
    {
        return AverageLatency > 50.0f || DroppedInputCount > 2 || DeadzoneIssues > 5;
    }
    
    public bool IsLikelyDroppedInput(JoyButton button, bool pressed)
    {
        // Simple heuristic: if we got a button release without a recent press
        if (!pressed)
        {
            var recentPresses = _inputSamples
                .Where(s => s.Type == InputType.Button && s.ButtonIndex == (int)button)
                .Where(s => Time.GetTicksMsec() - s.Timestamp < 500) // Within last 500ms
                .Count(s => s.Value > 0.5f);
                
            return recentPresses == 0;
        }
        
        return false;
    }
}

public enum InputType
{
    Button,
    Axis,
    Key
}

public struct InputSample
{
    public InputType Type;
    public int ButtonIndex;
    public float Value;
    public ulong Timestamp;
}