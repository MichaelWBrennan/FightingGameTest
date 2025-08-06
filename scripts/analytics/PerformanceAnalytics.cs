using Godot;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Performance analytics system for monitoring game performance and network quality
/// Provides real-time FPS, frame time, network diagnostics, and performance optimization
/// </summary>
public partial class PerformanceAnalytics : Node
{
    public static PerformanceAnalytics Instance { get; private set; }
    
    [Signal]
    public delegate void PerformanceWarningEventHandler(PerformanceWarningType warningType, string details);
    
    [Signal]
    public delegate void NetworkQualityChangedEventHandler(NetworkQuality quality);
    
    // Performance Tracking
    public bool ShowPerformanceOverlay { get; private set; } = false;
    public float CurrentFPS { get; private set; } = 60.0f;
    public float AverageFrameTime { get; private set; } = 16.67f; // milliseconds
    public long MemoryUsage { get; private set; } = 0;
    public float CPUUsage { get; private set; } = 0.0f;
    public float GPUUsage { get; private set; } = 0.0f;
    
    // Network Diagnostics
    public int NetworkPing { get; private set; } = 0;
    public float NetworkJitter { get; private set; } = 0.0f;
    public float PacketLoss { get; private set; } = 0.0f;
    public NetworkQuality CurrentNetworkQuality { get; private set; } = NetworkQuality.Good;
    
    // Performance History
    private Queue<float> _fpsHistory = new();
    private Queue<float> _frameTimeHistory = new();
    private Queue<int> _pingHistory = new();
    private const int HistorySize = 300; // 5 seconds at 60 FPS
    
    // Performance Thresholds
    private const float LowFpsThreshold = 45.0f;
    private const float HighFrameTimeThreshold = 20.0f; // milliseconds
    private const int HighPingThreshold = 100; // milliseconds
    private const float HighJitterThreshold = 10.0f; // milliseconds
    private const float HighPacketLossThreshold = 2.0f; // percentage
    
    // UI Elements
    private CanvasLayer _performanceUI;
    private Control _performanceOverlay;
    private Label _fpsLabel;
    private Label _frameTimeLabel;
    private Label _memoryLabel;
    private Label _networkLabel;
    private TextureRect _performanceGraph;
    private Control _warningPanel;
    
    // Performance Monitoring
    private float _frameTimeAccumulator = 0.0f;
    private int _frameCount = 0;
    private float _updateInterval = 0.5f; // Update every 0.5 seconds
    private float _timeSinceUpdate = 0.0f;
    
    // Network Monitoring
    private float _networkUpdateInterval = 1.0f; // Update every second
    private float _timeSinceNetworkUpdate = 0.0f;
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializePerformanceMonitoring();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("PerformanceAnalytics initialized");
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("performance_toggle_overlay"))
        {
            TogglePerformanceOverlay();
        }
        else if (@event.IsActionPressed("performance_toggle_detailed"))
        {
            ToggleDetailedView();
        }
    }
    
    public override void _Process(double delta)
    {
        MonitorFramePerformance((float)delta);
        UpdatePerformanceUI((float)delta);
        
        _timeSinceUpdate += (float)delta;
        _timeSinceNetworkUpdate += (float)delta;
        
        if (_timeSinceUpdate >= _updateInterval)
        {
            UpdatePerformanceMetrics();
            _timeSinceUpdate = 0.0f;
        }
        
        if (_timeSinceNetworkUpdate >= _networkUpdateInterval)
        {
            UpdateNetworkMetrics();
            _timeSinceNetworkUpdate = 0.0f;
        }
    }
    
    private void InitializePerformanceMonitoring()
    {
        CreatePerformanceUI();
        
        // Initialize performance history
        for (int i = 0; i < HistorySize; i++)
        {
            _fpsHistory.Enqueue(60.0f);
            _frameTimeHistory.Enqueue(16.67f);
            _pingHistory.Enqueue(50);
        }
    }
    
    private void CreatePerformanceUI()
    {
        _performanceUI = new CanvasLayer();
        _performanceUI.Layer = 1100; // Very high priority for debugging
        _performanceUI.Visible = false;
        AddChild(_performanceUI);
        
        CreatePerformanceOverlay();
        CreateWarningPanel();
    }
    
    private void CreatePerformanceOverlay()
    {
        _performanceOverlay = new Panel();
        _performanceOverlay.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.TopRight);
        _performanceOverlay.Position = new Vector2(-320, 20);
        _performanceOverlay.Size = new Vector2(300, 200);
        
        var style = new StyleBoxFlat();
        style.BgColor = new Color(0, 0, 0, 0.8f);
        style.BorderColor = Colors.Green;
        style.BorderWidthLeft = style.BorderWidthRight = style.BorderWidthTop = style.BorderWidthBottom = 2;
        style.CornerRadiusTopLeft = style.CornerRadiusTopRight = 
        style.CornerRadiusBottomLeft = style.CornerRadiusBottomRight = 5;
        _performanceOverlay.AddThemeStyleboxOverride("panel", style);
        
        var vbox = new VBoxContainer();
        vbox.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.FullRect);
        vbox.AddThemeConstantOverride("separation", 5);
        _performanceOverlay.AddChild(vbox);
        
        // Title
        var titleLabel = new Label();
        titleLabel.Text = "Performance Monitor";
        titleLabel.HorizontalAlignment = HorizontalAlignment.Center;
        titleLabel.AddThemeColorOverride("font_color", Colors.Yellow);
        titleLabel.AddThemeFontSizeOverride("font_size", 16);
        vbox.AddChild(titleLabel);
        
        // FPS
        _fpsLabel = new Label();
        _fpsLabel.Text = "FPS: 60.0";
        _fpsLabel.AddThemeColorOverride("font_color", Colors.White);
        vbox.AddChild(_fpsLabel);
        
        // Frame Time
        _frameTimeLabel = new Label();
        _frameTimeLabel.Text = "Frame Time: 16.7ms";
        _frameTimeLabel.AddThemeColorOverride("font_color", Colors.White);
        vbox.AddChild(_frameTimeLabel);
        
        // Memory
        _memoryLabel = new Label();
        _memoryLabel.Text = "Memory: 0 MB";
        _memoryLabel.AddThemeColorOverride("font_color", Colors.White);
        vbox.AddChild(_memoryLabel);
        
        // Network
        _networkLabel = new Label();
        _networkLabel.Text = "Network: Good";
        _networkLabel.AddThemeColorOverride("font_color", Colors.Green);
        vbox.AddChild(_networkLabel);
        
        // Performance graph
        _performanceGraph = new TextureRect();
        _performanceGraph.CustomMinimumSize = new Vector2(280, 60);
        _performanceGraph.ExpandMode = TextureRect.ExpandModeEnum.FitWidthProportional;
        vbox.AddChild(_performanceGraph);
        
        _performanceUI.AddChild(_performanceOverlay);
    }
    
    private void CreateWarningPanel()
    {
        _warningPanel = new Panel();
        _warningPanel.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.CenterWide);
        _warningPanel.Position = new Vector2(0, -50);
        _warningPanel.Size = new Vector2(0, 40);
        _warningPanel.Visible = false;
        
        var style = new StyleBoxFlat();
        style.BgColor = new Color(1, 0.2f, 0, 0.9f);
        style.BorderColor = Colors.Red;
        style.BorderWidthTop = style.BorderWidthBottom = 2;
        _warningPanel.AddThemeStyleboxOverride("panel", style);
        
        var warningLabel = new Label();
        warningLabel.Name = "WarningText";
        warningLabel.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.FullRect);
        warningLabel.HorizontalAlignment = HorizontalAlignment.Center;
        warningLabel.VerticalAlignment = VerticalAlignment.Center;
        warningLabel.Text = "Performance Warning";
        warningLabel.AddThemeColorOverride("font_color", Colors.White);
        warningLabel.AddThemeFontSizeOverride("font_size", 18);
        _warningPanel.AddChild(warningLabel);
        
        _performanceUI.AddChild(_warningPanel);
    }
    
    public void TogglePerformanceOverlay()
    {
        ShowPerformanceOverlay = !ShowPerformanceOverlay;
        _performanceUI.Visible = ShowPerformanceOverlay;
        GD.Print($"Performance overlay: {(ShowPerformanceOverlay ? "ON" : "OFF")}");
    }
    
    public void ToggleDetailedView()
    {
        // Toggle between basic and detailed performance view
        var isDetailed = _performanceOverlay.Size.Y > 200;
        
        if (isDetailed)
        {
            _performanceOverlay.Size = new Vector2(300, 200);
        }
        else
        {
            _performanceOverlay.Size = new Vector2(300, 350);
            AddDetailedMetrics();
        }
    }
    
    private void AddDetailedMetrics()
    {
        var vbox = _performanceOverlay.GetChild<VBoxContainer>(0);
        
        // Add detailed metrics if not already present
        if (vbox.GetChildCount() <= 6)
        {
            var separator = new HSeparator();
            vbox.AddChild(separator);
            
            var cpuLabel = new Label();
            cpuLabel.Name = "CPULabel";
            cpuLabel.Text = "CPU: 0%";
            cpuLabel.AddThemeColorOverride("font_color", Colors.White);
            vbox.AddChild(cpuLabel);
            
            var gpuLabel = new Label();
            gpuLabel.Name = "GPULabel";
            gpuLabel.Text = "GPU: 0%";
            gpuLabel.AddThemeColorOverride("font_color", Colors.White);
            vbox.AddChild(gpuLabel);
            
            var pingLabel = new Label();
            pingLabel.Name = "PingLabel";
            pingLabel.Text = "Ping: 0ms";
            pingLabel.AddThemeColorOverride("font_color", Colors.White);
            vbox.AddChild(pingLabel);
            
            var jitterLabel = new Label();
            jitterLabel.Name = "JitterLabel";
            jitterLabel.Text = "Jitter: 0ms";
            jitterLabel.AddThemeColorOverride("font_color", Colors.White);
            vbox.AddChild(jitterLabel);
            
            var packetLossLabel = new Label();
            packetLossLabel.Name = "PacketLossLabel";
            packetLossLabel.Text = "Packet Loss: 0%";
            packetLossLabel.AddThemeColorOverride("font_color", Colors.White);
            vbox.AddChild(packetLossLabel);
        }
    }
    
    private void MonitorFramePerformance(float delta)
    {
        _frameTimeAccumulator += delta * 1000.0f; // Convert to milliseconds
        _frameCount++;
        
        // Update FPS calculation
        CurrentFPS = 1.0f / delta;
        
        // Add to history
        _fpsHistory.Enqueue(CurrentFPS);
        _frameTimeHistory.Enqueue(delta * 1000.0f);
        
        // Maintain history size
        if (_fpsHistory.Count > HistorySize)
        {
            _fpsHistory.Dequeue();
            _frameTimeHistory.Dequeue();
        }
    }
    
    private void UpdatePerformanceMetrics()
    {
        // Calculate average frame time
        if (_frameCount > 0)
        {
            AverageFrameTime = _frameTimeAccumulator / _frameCount;
            _frameTimeAccumulator = 0.0f;
            _frameCount = 0;
        }
        
        // Update memory usage (simplified for Godot 4)
        MemoryUsage = OS.GetStaticMemoryPeakUsage();
        
        // Update CPU/GPU usage (simplified - would need platform-specific implementations)
        CPUUsage = EstimateCPUUsage();
        GPUUsage = EstimateGPUUsage();
        
        // Check for performance warnings
        CheckPerformanceWarnings();
    }
    
    private void UpdateNetworkMetrics()
    {
        // Update network metrics (would integrate with actual network system)
        NetworkPing = SimulateNetworkPing();
        NetworkJitter = CalculateNetworkJitter();
        PacketLoss = SimulatePacketLoss();
        
        // Add ping to history
        _pingHistory.Enqueue(NetworkPing);
        if (_pingHistory.Count > HistorySize)
        {
            _pingHistory.Dequeue();
        }
        
        // Determine network quality
        UpdateNetworkQuality();
    }
    
    private void UpdatePerformanceUI(float delta)
    {
        if (!ShowPerformanceOverlay) return;
        
        // Update main metrics
        _fpsLabel.Text = $"FPS: {CurrentFPS:F1}";
        _fpsLabel.AddThemeColorOverride("font_color", CurrentFPS >= LowFpsThreshold ? Colors.Green : Colors.Red);
        
        _frameTimeLabel.Text = $"Frame Time: {AverageFrameTime:F1}ms";
        _frameTimeLabel.AddThemeColorOverride("font_color", AverageFrameTime <= HighFrameTimeThreshold ? Colors.Green : Colors.Red);
        
        _memoryLabel.Text = $"Memory: {MemoryUsage / (1024 * 1024):F0} MB";
        
        _networkLabel.Text = $"Network: {CurrentNetworkQuality}";
        _networkLabel.AddThemeColorOverride("font_color", GetNetworkQualityColor(CurrentNetworkQuality));
        
        // Update detailed metrics if visible
        UpdateDetailedMetricsUI();
        
        // Update performance graph
        UpdatePerformanceGraph();
    }
    
    private void UpdateDetailedMetricsUI()
    {
        var vbox = _performanceOverlay.GetChild<VBoxContainer>(0);
        
        var cpuLabel = vbox.GetNodeOrNull<Label>("CPULabel");
        if (cpuLabel != null)
        {
            cpuLabel.Text = $"CPU: {CPUUsage:F1}%";
            cpuLabel.AddThemeColorOverride("font_color", CPUUsage <= 80.0f ? Colors.Green : Colors.Red);
        }
        
        var gpuLabel = vbox.GetNodeOrNull<Label>("GPULabel");
        if (gpuLabel != null)
        {
            gpuLabel.Text = $"GPU: {GPUUsage:F1}%";
            gpuLabel.AddThemeColorOverride("font_color", GPUUsage <= 80.0f ? Colors.Green : Colors.Red);
        }
        
        var pingLabel = vbox.GetNodeOrNull<Label>("PingLabel");
        if (pingLabel != null)
        {
            pingLabel.Text = $"Ping: {NetworkPing}ms";
            pingLabel.AddThemeColorOverride("font_color", NetworkPing <= HighPingThreshold ? Colors.Green : Colors.Red);
        }
        
        var jitterLabel = vbox.GetNodeOrNull<Label>("JitterLabel");
        if (jitterLabel != null)
        {
            jitterLabel.Text = $"Jitter: {NetworkJitter:F1}ms";
            jitterLabel.AddThemeColorOverride("font_color", NetworkJitter <= HighJitterThreshold ? Colors.Green : Colors.Red);
        }
        
        var packetLossLabel = vbox.GetNodeOrNull<Label>("PacketLossLabel");
        if (packetLossLabel != null)
        {
            packetLossLabel.Text = $"Packet Loss: {PacketLoss:F1}%";
            packetLossLabel.AddThemeColorOverride("font_color", PacketLoss <= HighPacketLossThreshold ? Colors.Green : Colors.Red);
        }
    }
    
    private void UpdatePerformanceGraph()
    {
        // Create a simple performance graph texture
        var image = Image.CreateEmpty(280, 60, false, Image.Format.Rgb8);
        image.Fill(Colors.Black);
        
        // Draw FPS history
        var fpsArray = _fpsHistory.ToArray();
        for (int i = 1; i < fpsArray.Length; i++)
        {
            int x1 = (i - 1) * 280 / fpsArray.Length;
            int x2 = i * 280 / fpsArray.Length;
            int y1 = (int)(60 - (fpsArray[i - 1] / 120.0f * 60));
            int y2 = (int)(60 - (fpsArray[i] / 120.0f * 60));
            
            // Simple line drawing (would be more sophisticated in real implementation)
            if (x2 < 280 && y2 >= 0 && y2 < 60)
            {
                var color = fpsArray[i] >= LowFpsThreshold ? Colors.Green : Colors.Red;
                image.SetPixel(x2, y2, color);
            }
        }
        
        var texture = ImageTexture.CreateFromImage(image);
        _performanceGraph.Texture = texture;
    }
    
    private void CheckPerformanceWarnings()
    {
        var warnings = new List<string>();
        
        if (CurrentFPS < LowFpsThreshold)
        {
            warnings.Add($"Low FPS: {CurrentFPS:F1}");
        }
        
        if (AverageFrameTime > HighFrameTimeThreshold)
        {
            warnings.Add($"High frame time: {AverageFrameTime:F1}ms");
        }
        
        if (NetworkPing > HighPingThreshold)
        {
            warnings.Add($"High ping: {NetworkPing}ms");
        }
        
        if (NetworkJitter > HighJitterThreshold)
        {
            warnings.Add($"High jitter: {NetworkJitter:F1}ms");
        }
        
        if (PacketLoss > HighPacketLossThreshold)
        {
            warnings.Add($"Packet loss: {PacketLoss:F1}%");
        }
        
        if (warnings.Count > 0)
        {
            ShowPerformanceWarning(string.Join(", ", warnings));
        }
        else
        {
            HidePerformanceWarning();
        }
    }
    
    private void ShowPerformanceWarning(string warning)
    {
        _warningPanel.Visible = true;
        var warningLabel = _warningPanel.GetNode<Label>("WarningText");
        warningLabel.Text = $"⚠ {warning}";
        
        EmitSignal(SignalName.PerformanceWarning, (int)PerformanceWarningType.General, warning);
    }
    
    private void HidePerformanceWarning()
    {
        _warningPanel.Visible = false;
    }
    
    private void UpdateNetworkQuality()
    {
        var oldQuality = CurrentNetworkQuality;
        
        if (NetworkPing <= 50 && NetworkJitter <= 5.0f && PacketLoss <= 1.0f)
        {
            CurrentNetworkQuality = NetworkQuality.Excellent;
        }
        else if (NetworkPing <= 100 && NetworkJitter <= 10.0f && PacketLoss <= 2.0f)
        {
            CurrentNetworkQuality = NetworkQuality.Good;
        }
        else if (NetworkPing <= 150 && NetworkJitter <= 20.0f && PacketLoss <= 5.0f)
        {
            CurrentNetworkQuality = NetworkQuality.Fair;
        }
        else
        {
            CurrentNetworkQuality = NetworkQuality.Poor;
        }
        
        if (oldQuality != CurrentNetworkQuality)
        {
            EmitSignal(SignalName.NetworkQualityChanged, (int)CurrentNetworkQuality);
        }
    }
    
    private Color GetNetworkQualityColor(NetworkQuality quality)
    {
        return quality switch
        {
            NetworkQuality.Excellent => Colors.Green,
            NetworkQuality.Good => Colors.LightGreen,
            NetworkQuality.Fair => Colors.Yellow,
            NetworkQuality.Poor => Colors.Red,
            _ => Colors.White
        };
    }
    
    // Simplified estimations - would use platform-specific APIs in real implementation
    private float EstimateCPUUsage()
    {
        // Estimate based on frame time and FPS
        return Mathf.Clamp((AverageFrameTime / 16.67f) * 100.0f, 0.0f, 100.0f);
    }
    
    private float EstimateGPUUsage()
    {
        // Simplified GPU usage estimation
        var drawCalls = RenderingServer.GetRenderingInfo(RenderingServer.RenderingInfo.TypeVisible, RenderingServer.RenderingInfo.DrawCallsInFrame);
        return Mathf.Clamp(drawCalls / 1000.0f * 100.0f, 0.0f, 100.0f);
    }
    
    private int SimulateNetworkPing()
    {
        // In real implementation, this would measure actual network latency
        return GD.RandRange(20, 150);
    }
    
    private float CalculateNetworkJitter()
    {
        if (_pingHistory.Count < 2) return 0.0f;
        
        var pings = _pingHistory.ToArray();
        float totalVariance = 0.0f;
        
        for (int i = 1; i < pings.Length; i++)
        {
            totalVariance += Mathf.Abs(pings[i] - pings[i - 1]);
        }
        
        return totalVariance / (pings.Length - 1);
    }
    
    private float SimulatePacketLoss()
    {
        // In real implementation, this would track actual packet loss
        return GD.RandRange(0.0f, 5.0f);
    }
    
    public PerformanceReport GeneratePerformanceReport()
    {
        return new PerformanceReport
        {
            AverageFPS = _fpsHistory.Average(),
            MinimumFPS = _fpsHistory.Min(),
            MaximumFPS = _fpsHistory.Max(),
            AverageFrameTime = _frameTimeHistory.Average(),
            AveragePing = _pingHistory.Average(),
            AverageJitter = NetworkJitter,
            AveragePacketLoss = PacketLoss,
            MemoryUsage = MemoryUsage,
            NetworkQuality = CurrentNetworkQuality,
            GeneratedAt = Time.GetDatetimeStringFromSystem()
        };
    }
}

public enum PerformanceWarningType
{
    General,
    LowFPS,
    HighFrameTime,
    MemoryLeak,
    NetworkIssue
}

public enum NetworkQuality
{
    Poor,
    Fair,
    Good,
    Excellent
}

public class PerformanceReport
{
    public float AverageFPS { get; set; }
    public float MinimumFPS { get; set; }
    public float MaximumFPS { get; set; }
    public float AverageFrameTime { get; set; }
    public float AveragePing { get; set; }
    public float AverageJitter { get; set; }
    public float AveragePacketLoss { get; set; }
    public long MemoryUsage { get; set; }
    public NetworkQuality NetworkQuality { get; set; }
    public string GeneratedAt { get; set; }
}