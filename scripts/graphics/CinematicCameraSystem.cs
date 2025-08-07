using Godot;
using System.Collections.Generic;

/// <summary>
/// Cinematic Camera Effects System for pseudo 2.5D fighting games
/// Provides dynamic camera movement, screen shake, and dramatic effects
/// Inspired by BlazBlue and Skullgirls cinematography
/// MIT Licensed - Free for commercial use
/// </summary>
public partial class CinematicCameraSystem : Camera2D
{
    public static CinematicCameraSystem Instance { get; private set; }
    
    [Export] public bool EnableCinematicEffects { get; set; } = true;
    [Export] public float CameraResponsiveness { get; set; } = 0.1f;
    [Export] public Vector2 CameraBounds { get; set; } = new Vector2(200, 100);
    
    // Screen shake parameters
    [Export] public float ShakeDecay { get; set; } = 0.8f;
    [Export] public float MaxShakeOffset { get; set; } = 30.0f;
    
    // Dynamic zoom parameters
    [Export] public float MinZoom { get; set; } = 0.5f;
    [Export] public float MaxZoom { get; set; } = 2.0f;
    [Export] public float ZoomSpeed { get; set; } = 2.0f;
    
    private Vector2 _basePosition;
    private float _shakeIntensity = 0.0f;
    private Vector2 _shakeOffset = Vector2.Zero;
    private float _targetZoom = 1.0f;
    private Vector2 _targetPosition = Vector2.Zero;
    private bool _isTrackingPlayers = true;
    
    // Player references for dynamic tracking
    private readonly List<Node2D> _trackedPlayers = new();
    
    // Cinematic modes
    public enum CinematicMode
    {
        Normal,
        CloseUp,
        WideShot,
        DramaticAngle,
        SuperMove,
        Victory
    }
    
    private CinematicMode _currentMode = CinematicMode.Normal;
    private Tween _cinematicTween;
    
    public override void _Ready()
    {
        Instance = this;
        _basePosition = GlobalPosition;
        _targetPosition = _basePosition;
        
        // Enable camera as current
        MakeCurrent();
        
        // Find players to track
        FindAndTrackPlayers();
        
        GD.Print("CinematicCameraSystem: Dynamic camera system initialized");
    }
    
    private void FindAndTrackPlayers()
    {
        // Look for player nodes in the scene
        var players = GetTree().GetNodesInGroup("players");
        foreach (Node player in players)
        {
            if (player is Node2D player2D)
            {
                _trackedPlayers.Add(player2D);
            }
        }
        
        GD.Print($"Tracking {_trackedPlayers.Count} players for camera system");
    }
    
    /// <summary>
    /// Add screen shake effect
    /// </summary>
    public void AddScreenShake(float intensity, float duration = 0.5f)
    {
        if (!EnableCinematicEffects) return;
        
        _shakeIntensity = Mathf.Min(_shakeIntensity + intensity, 1.0f);
        
        // Create shake decay tween
        if (_cinematicTween != null)
            _cinematicTween.Kill();
        
        _cinematicTween = CreateTween();
        _cinematicTween.TweenMethod(
            Callable.From<float>(value => _shakeIntensity = value),
            _shakeIntensity,
            0.0f,
            duration
        );
        
        GD.Print($"Added screen shake: intensity={intensity}, duration={duration}");
    }
    
    /// <summary>
    /// Set cinematic mode with smooth transition
    /// </summary>
    public void SetCinematicMode(CinematicMode mode, float transitionTime = 1.0f)
    {
        if (_currentMode == mode) return;
        
        _currentMode = mode;
        var newZoom = GetZoomForMode(mode);
        var newOffset = GetOffsetForMode(mode);
        
        if (_cinematicTween != null)
            _cinematicTween.Kill();
        
        _cinematicTween = CreateTween();
        _cinematicTween.SetParallel(true);
        
        // Animate zoom
        _cinematicTween.TweenMethod(
            Callable.From<float>(zoom => Zoom = Vector2.One * zoom),
            Zoom.X,
            newZoom,
            transitionTime
        );
        
        // Animate position offset
        _cinematicTween.TweenMethod(
            Callable.From<Vector2>(offset => Offset = offset),
            Offset,
            newOffset,
            transitionTime
        );
        
        GD.Print($"Set cinematic mode: {mode} with transition time {transitionTime}");
    }
    
    private float GetZoomForMode(CinematicMode mode)
    {
        return mode switch
        {
            CinematicMode.CloseUp => 1.5f,
            CinematicMode.WideShot => 0.7f,
            CinematicMode.DramaticAngle => 1.2f,
            CinematicMode.SuperMove => 1.8f,
            CinematicMode.Victory => 1.3f,
            _ => 1.0f
        };
    }
    
    private Vector2 GetOffsetForMode(CinematicMode mode)
    {
        return mode switch
        {
            CinematicMode.DramaticAngle => new Vector2(20, -10),
            CinematicMode.SuperMove => new Vector2(0, -30),
            CinematicMode.Victory => new Vector2(0, -20),
            _ => Vector2.Zero
        };
    }
    
    /// <summary>
    /// Focus camera on specific position with zoom
    /// </summary>
    public void FocusOnPosition(Vector2 position, float zoom = 1.0f, float transitionTime = 0.5f)
    {
        _isTrackingPlayers = false;
        _targetPosition = position;
        _targetZoom = Mathf.Clamp(zoom, MinZoom, MaxZoom);
        
        if (_cinematicTween != null)
            _cinematicTween.Kill();
        
        _cinematicTween = CreateTween();
        _cinematicTween.SetParallel(true);
        
        _cinematicTween.TweenProperty(this, "global_position", position, transitionTime);
        _cinematicTween.TweenProperty(this, "zoom", Vector2.One * _targetZoom, transitionTime);
    }
    
    /// <summary>
    /// Resume normal player tracking
    /// </summary>
    public void ResumePlayerTracking()
    {
        _isTrackingPlayers = true;
        SetCinematicMode(CinematicMode.Normal);
    }
    
    /// <summary>
    /// Create dramatic camera movement for special moves
    /// </summary>
    public void CreateDramaticMovement(Vector2 startPos, Vector2 endPos, float duration = 2.0f)
    {
        if (!EnableCinematicEffects) return;
        
        _isTrackingPlayers = false;
        SetCinematicMode(CinematicMode.SuperMove, 0.2f);
        
        if (_cinematicTween != null)
            _cinematicTween.Kill();
        
        _cinematicTween = CreateTween();
        _cinematicTween.SetParallel(true);
        
        // Dramatic camera arc movement
        var midPoint = (startPos + endPos) * 0.5f + new Vector2(0, -50);
        
        _cinematicTween.TweenMethod(
            Callable.From<float>(t => {
                var pos = BezierCurve(startPos, midPoint, endPos, t);
                GlobalPosition = pos;
            }),
            0.0f,
            1.0f,
            duration
        );
        
        // Add slight shake during movement
        _cinematicTween.TweenMethod(
            Callable.From<float>(shake => _shakeIntensity = shake),
            0.0f,
            0.3f,
            duration * 0.3f
        );
        _cinematicTween.TweenMethod(
            Callable.From<float>(shake => _shakeIntensity = shake),
            0.3f,
            0.0f,
            duration * 0.7f
        );
        
        // Resume tracking after dramatic movement
        _cinematicTween.TweenCallback(Callable.From(() => ResumePlayerTracking()));
    }
    
    private Vector2 BezierCurve(Vector2 p0, Vector2 p1, Vector2 p2, float t)
    {
        var u = 1.0f - t;
        return u * u * p0 + 2 * u * t * p1 + t * t * p2;
    }
    
    public override void _Process(double delta)
    {
        if (!EnableCinematicEffects) return;
        
        UpdateShake();
        
        if (_isTrackingPlayers)
        {
            UpdatePlayerTracking();
        }
    }
    
    private void UpdateShake()
    {
        if (_shakeIntensity > 0.01f)
        {
            // Generate random shake offset
            _shakeOffset = new Vector2(
                (float)(GD.Randf() - 0.5f) * 2.0f,
                (float)(GD.Randf() - 0.5f) * 2.0f
            ) * _shakeIntensity * MaxShakeOffset;
            
            // Apply decay
            _shakeIntensity *= ShakeDecay;
            
            // Update camera position with shake
            Offset = _shakeOffset;
        }
        else
        {
            _shakeIntensity = 0.0f;
            _shakeOffset = Vector2.Zero;
            if (_currentMode == CinematicMode.Normal)
                Offset = Vector2.Zero;
        }
    }
    
    private void UpdatePlayerTracking()
    {
        if (_trackedPlayers.Count == 0) return;
        
        // Calculate center point between players
        var centerPoint = Vector2.Zero;
        var validPlayers = 0;
        
        foreach (var player in _trackedPlayers)
        {
            if (IsInstanceValid(player))
            {
                centerPoint += player.GlobalPosition;
                validPlayers++;
            }
        }
        
        if (validPlayers == 0) return;
        
        centerPoint /= validPlayers;
        
        // Calculate distance between players for zoom adjustment
        float maxDistance = 0.0f;
        if (validPlayers > 1)
        {
            for (int i = 0; i < _trackedPlayers.Count - 1; i++)
            {
                for (int j = i + 1; j < _trackedPlayers.Count; j++)
                {
                    if (IsInstanceValid(_trackedPlayers[i]) && IsInstanceValid(_trackedPlayers[j]))
                    {
                        float distance = _trackedPlayers[i].GlobalPosition.DistanceTo(_trackedPlayers[j].GlobalPosition);
                        maxDistance = Mathf.Max(maxDistance, distance);
                    }
                }
            }
        }
        
        // Adjust zoom based on player distance
        float desiredZoom = Mathf.Lerp(MaxZoom, MinZoom, maxDistance / 400.0f);
        desiredZoom = Mathf.Clamp(desiredZoom, MinZoom, MaxZoom);
        
        // Smooth camera movement
        _targetPosition = centerPoint;
        _targetZoom = desiredZoom;
        
        GlobalPosition = GlobalPosition.Lerp(_targetPosition, CameraResponsiveness);
        Zoom = Zoom.Lerp(Vector2.One * _targetZoom, CameraResponsiveness * 0.5f);
    }
    
    public override void _ExitTree()
    {
        Instance = null;
    }
    
    // Additional methods for StageManager integration
    public void SetCameraBounds(float left, float right, float top, float bottom)
    {
        // Store camera boundaries for stage constraints
        _cameraBounds = new Rect2(left, top, right - left, bottom - top);
        GD.Print($"Camera bounds set: left={left}, right={right}, top={top}, bottom={bottom}");
    }
    
    public void SetZoomLimits(float minZoom, float maxZoom)
    {
        MinZoom = minZoom;
        MaxZoom = maxZoom;
        GD.Print($"Zoom limits set: min={minZoom}, max={maxZoom}");
    }
    
    public void SetFollowSmoothness(float smoothness)
    {
        CameraResponsiveness = smoothness;
        GD.Print($"Camera follow smoothness set to: {smoothness}");
    }
    
    public void CreateScreenFlash(Color flashColor, float duration)
    {
        if (!EnableCinematicEffects) return;
        
        // Create a screen flash effect using a ColorRect overlay
        var flashOverlay = new ColorRect
        {
            Name = "ScreenFlash",
            Color = flashColor,
            MouseFilter = Control.MouseFilterEnum.Ignore
        };
        
        // Make it cover the entire screen
        flashOverlay.AnchorLeft = 0.0f;
        flashOverlay.AnchorTop = 0.0f;
        flashOverlay.AnchorRight = 1.0f;
        flashOverlay.AnchorBottom = 1.0f;
        flashOverlay.OffsetLeft = 0.0f;
        flashOverlay.OffsetTop = 0.0f;
        flashOverlay.OffsetRight = 0.0f;
        flashOverlay.OffsetBottom = 0.0f;
        
        // Add to the UI layer (assuming it exists)
        var gameplayScene = GetNode("/root/GameplayScene");
        var uiLayer = gameplayScene?.GetNode("UI") as CanvasLayer;
        
        if (uiLayer != null)
        {
            uiLayer.AddChild(flashOverlay);
            
            // Animate the flash
            var tween = CreateTween();
            tween.TweenProperty(flashOverlay, "color:a", 0.0f, duration);
            tween.TweenCallback(Callable.From(() => flashOverlay.QueueFree()));
        }
        
        GD.Print($"Screen flash created: color={flashColor}, duration={duration}");
    }
    
    // Store camera bounds
    private Rect2 _cameraBounds = new Rect2(-800, -400, 1600, 800);
}