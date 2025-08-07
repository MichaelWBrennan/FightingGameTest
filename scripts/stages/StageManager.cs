using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;

/// <summary>
/// Manages 2.5D fighting game stages with Gothic architecture themes
/// Integrates with existing pseudo 2.5D graphics system
/// </summary>
public partial class StageManager : Node
{
    public static StageManager Instance { get; private set; }
    
    // Stage data and management
    private Dictionary<string, StageData> _availableStages = new();
    private StageData _currentStageData;
    private Node2D _currentStageScene;
    private string _currentStageId = "";
    
    // Stage components
    private List<StageLayer> _backgroundLayers = new();
    private List<StageLayer> _foregroundLayers = new();
    private List<Node2D> _particleEffects = new();
    private StaticBody2D _ground;
    private CollisionShape2D _groundCollision;
    
    // Graphics integration
    private Pseudo2D5Manager _pseudo2D5Manager;
    private Enhanced2D5ParticleSystem _particleSystem;
    private CinematicCameraSystem _cameraSystem;
    private DynamicLightingSystem _lightingSystem;
    
    // Audio components
    private AudioStreamPlayer _ambientPlayer;
    private AudioStreamPlayer _musicPlayer;
    
    [Signal]
    public delegate void StageLoadedEventHandler(string stageId);
    
    [Signal]
    public delegate void StageEffectTriggeredEventHandler(string effectName);
    
    public override void _Ready()
    {
        if (Instance != null)
        {
            QueueFree();
            return;
        }
        Instance = this;
        
        InitializeComponents();
        LoadAvailableStages();
        
        GD.Print("StageManager initialized with Gothic 2.5D stage support");
    }
    
    private void InitializeComponents()
    {
        // Get graphics system references
        _pseudo2D5Manager = Pseudo2D5Manager.Instance;
        _particleSystem = Enhanced2D5ParticleSystem.Instance;
        _cameraSystem = CinematicCameraSystem.Instance;
        _lightingSystem = DynamicLightingSystem.Instance;
        
        // Create audio players
        _ambientPlayer = new AudioStreamPlayer
        {
            Name = "StageAmbientPlayer",
            Bus = "Master"
        };
        AddChild(_ambientPlayer);
        
        _musicPlayer = new AudioStreamPlayer
        {
            Name = "StageMusicPlayer", 
            Bus = "Music"
        };
        AddChild(_musicPlayer);
        
        GD.Print("Stage audio system initialized");
    }
    
    private void LoadAvailableStages()
    {
        var stagePaths = new[]
        {
            "res://data/stages/cathedral.json",
            "res://data/stages/castle.json", 
            "res://data/stages/crypt.json"
        };
        
        foreach (var stagePath in stagePaths)
        {
            try
            {
                if (FileAccess.FileExists(stagePath))
                {
                    var stageData = LoadStageData(stagePath);
                    if (stageData != null)
                    {
                        _availableStages[stageData.StageId] = stageData;
                        GD.Print($"Loaded Gothic stage: {stageData.Name}");
                    }
                }
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to load stage from {stagePath}: {e.Message}");
            }
        }
        
        GD.Print($"Loaded {_availableStages.Count} Gothic stages");
    }
    
    private StageData LoadStageData(string filePath)
    {
        using var file = FileAccess.Open(filePath, FileAccess.ModeFlags.Read);
        if (file == null)
        {
            GD.PrintErr($"Cannot open stage file: {filePath}");
            return null;
        }
        
        var jsonText = file.GetAsText();
        try
        {
            var stageData = JsonSerializer.Deserialize<StageData>(jsonText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true
            });
            
            return stageData;
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to parse stage JSON {filePath}: {e.Message}");
            return null;
        }
    }
    
    public void LoadStage(string stageId, Node2D parent = null)
    {
        if (!_availableStages.ContainsKey(stageId))
        {
            GD.PrintErr($"Stage not found: {stageId}");
            return;
        }
        
        // Clean up previous stage
        UnloadCurrentStage();
        
        _currentStageData = _availableStages[stageId];
        _currentStageId = stageId;
        
        // Use provided parent or GameplayScene
        var stageParent = parent ?? GetNode("/root/GameplayScene") as Node2D;
        if (stageParent == null)
        {
            GD.PrintErr("Cannot find stage parent node");
            return;
        }
        
        // Create stage container
        _currentStageScene = new Node2D { Name = "Stage" };
        stageParent.AddChild(_currentStageScene);
        
        // Load stage components
        CreateGround();
        CreateBackgroundLayers();
        CreateForegroundLayers();
        CreateParticleEffects();
        SetupLighting();
        SetupAudio();
        SetupCamera();
        
        EmitSignal(SignalName.StageLoaded, stageId);
        
        GD.Print($"Loaded Gothic stage: {_currentStageData.Name}");
    }
    
    private void CreateGround()
    {
        _ground = new StaticBody2D { Name = "Ground" };
        _currentStageScene.AddChild(_ground);
        
        // Create ground collision
        var groundShape = new RectangleShape2D();
        var groundData = _currentStageData.Ground;
        groundShape.Size = new Vector2(
            groundData.Bounds.Right - groundData.Bounds.Left,
            100
        );
        
        _groundCollision = new CollisionShape2D
        {
            Shape = groundShape,
            Position = new Vector2(
                (groundData.Bounds.Left + groundData.Bounds.Right) / 2f,
                groundData.Height + 50
            )
        };
        _ground.AddChild(_groundCollision);
        
        // Set collision layer for players
        _ground.CollisionLayer = 8; // Stage layer
        _ground.CollisionMask = 0;
    }
    
    private void CreateBackgroundLayers()
    {
        var backgroundContainer = new Node2D { Name = "BackgroundLayers" };
        _currentStageScene.AddChild(backgroundContainer);
        
        // Sort layers by depth (furthest first)
        var sortedLayers = _currentStageData.BackgroundLayers
            .OrderBy(l => l.Depth)
            .ToList();
        
        foreach (var layerData in sortedLayers)
        {
            CreateStageLayer(layerData, backgroundContainer);
        }
    }
    
    private void CreateForegroundLayers()
    {
        if (_currentStageData.ForegroundLayers?.Any() != true) return;
        
        var foregroundContainer = new Node2D { Name = "ForegroundLayers" };
        _currentStageScene.AddChild(foregroundContainer);
        
        // Sort layers by depth (nearest first for foreground)
        var sortedLayers = _currentStageData.ForegroundLayers
            .OrderByDescending(l => l.Depth)
            .ToList();
        
        foreach (var layerData in sortedLayers)
        {
            CreateStageLayer(layerData, foregroundContainer);
        }
    }
    
    private void CreateStageLayer(LayerData layerData, Node2D parent)
    {
        var layer = new StageLayer();
        layer.Initialize(layerData);
        parent.AddChild(layer);
        
        if (layerData.Depth < 0)
            _backgroundLayers.Add(layer);
        else
            _foregroundLayers.Add(layer);
        
        // Register with Pseudo2D5 manager for parallax
        if (_pseudo2D5Manager != null)
        {
            _pseudo2D5Manager.RegisterParallaxNode(
                layer,
                layerData.ParallaxMultiplier,
                GetDepthLayerFromDepth(layerData.Depth)
            );
        }
    }
    
    private Pseudo2D5Manager.DepthLayer GetDepthLayerFromDepth(float depth)
    {
        return depth switch
        {
            < -2.5f => Pseudo2D5Manager.DepthLayer.BackgroundFar,
            < -1.5f => Pseudo2D5Manager.DepthLayer.BackgroundMid,
            < -0.5f => Pseudo2D5Manager.DepthLayer.BackgroundNear,
            < 0.5f => Pseudo2D5Manager.DepthLayer.Stage,
            < 1.5f => Pseudo2D5Manager.DepthLayer.Effects,
            _ => Pseudo2D5Manager.DepthLayer.UI
        };
    }
    
    private void CreateParticleEffects()
    {
        if (_currentStageData.ParticleEffects?.Any() != true) return;
        
        foreach (var effectData in _currentStageData.ParticleEffects)
        {
            CreateParticleEffect(effectData);
        }
    }
    
    private void CreateParticleEffect(ParticleEffectData effectData)
    {
        if (_particleSystem == null) return;
        
        var position = new Vector2(effectData.Position[0], effectData.Position[1]);
        var color = new Color(
            effectData.Properties.Color[0],
            effectData.Properties.Color[1], 
            effectData.Properties.Color[2],
            effectData.Properties.Color[3]
        );
        
        // Create continuous ambient particle effect
        var particleType = GetParticleTypeFromString(effectData.ParticleType);
        _particleSystem.CreateContinuousEffect(
            particleType,
            position,
            effectData.Emission.Rate,
            effectData.Properties.Lifetime[1],
            color
        );
    }
    
    private Enhanced2D5ParticleSystem.ParticleType GetParticleTypeFromString(string typeString)
    {
        return typeString.ToLower() switch
        {
            "dust" => Enhanced2D5ParticleSystem.ParticleType.Dust,
            "smoke" => Enhanced2D5ParticleSystem.ParticleType.Dust, // Use Dust as fallback
            "embers" => Enhanced2D5ParticleSystem.ParticleType.Fire,
            "ash" => Enhanced2D5ParticleSystem.ParticleType.Dust,
            "mist" => Enhanced2D5ParticleSystem.ParticleType.Dust, // Use Dust as fallback
            "lightray" => Enhanced2D5ParticleSystem.ParticleType.Energy,
            "mysticalwisp" => Enhanced2D5ParticleSystem.ParticleType.MagicBurst,
            _ => Enhanced2D5ParticleSystem.ParticleType.Dust
        };
    }
    
    private void SetupLighting()
    {
        if (_lightingSystem == null) return;
        
        var lighting = _currentStageData.Lighting;
        
        // Set ambient lighting
        var ambientColor = new Color(
            lighting.AmbientColor[0],
            lighting.AmbientColor[1],
            lighting.AmbientColor[2],
            lighting.AmbientColor[3]
        );
        
        _lightingSystem.SetAmbientLighting(ambientColor);
        
        // Set main directional light
        var mainLightColor = new Color(
            lighting.MainLightColor[0],
            lighting.MainLightColor[1],
            lighting.MainLightColor[2],
            lighting.MainLightColor[3]
        );
        
        _lightingSystem.SetMainDirectionalLight(
            mainLightColor,
            new Vector3(
                lighting.MainLightDirection[0],
                lighting.MainLightDirection[1],
                lighting.MainLightDirection[2]
            )
        );
    }
    
    private void SetupAudio()
    {
        var audio = _currentStageData.Audio;
        if (audio == null) return;
        
        // Load and play ambient track
        if (!string.IsNullOrEmpty(audio.AmbientTrack))
        {
            var ambientStream = GD.Load<AudioStream>(audio.AmbientTrack);
            if (ambientStream != null)
            {
                _ambientPlayer.Stream = ambientStream;
                _ambientPlayer.VolumeDb = Mathf.LinearToDb(audio.AmbientVolume);
                _ambientPlayer.Autoplay = true;
                _ambientPlayer.Play();
            }
        }
        
        // Load and play music track
        if (!string.IsNullOrEmpty(audio.MusicTrack))
        {
            var musicStream = GD.Load<AudioStream>(audio.MusicTrack);
            if (musicStream != null)
            {
                _musicPlayer.Stream = musicStream;
                _musicPlayer.VolumeDb = Mathf.LinearToDb(audio.MusicVolume);
                _musicPlayer.Autoplay = true;
                _musicPlayer.Play();
            }
        }
    }
    
    private void SetupCamera()
    {
        if (_cameraSystem == null) return;
        
        var camera = _currentStageData.Camera;
        _cameraSystem.SetCameraBounds(
            camera.BoundaryLeft,
            camera.BoundaryRight, 
            camera.BoundaryTop,
            camera.BoundaryBottom
        );
        
        _cameraSystem.SetZoomLimits(camera.MinZoom, camera.MaxZoom);
        _cameraSystem.SetFollowSmoothness(camera.FollowSmoothness);
    }
    
    public void TriggerStageEffect(string trigger, Vector2 position, float intensity = 1.0f)
    {
        if (_currentStageData?.SpecialEffects == null) return;
        
        foreach (var effect in _currentStageData.SpecialEffects)
        {
            if (effect.Trigger == trigger)
            {
                ExecuteSpecialEffect(effect, position, intensity);
            }
        }
    }
    
    private void ExecuteSpecialEffect(SpecialEffectData effect, Vector2 position, float intensity)
    {
        switch (effect.Effect)
        {
            case "screen_flash":
                _cameraSystem?.CreateScreenFlash(
                    new Color(effect.Color[0], effect.Color[1], effect.Color[2], effect.Color[3]),
                    effect.Duration
                );
                break;
                
            case "layer_glow":
                ApplyLayerGlow(effect.TargetLayer, effect.GlowColor, effect.Duration);
                break;
                
            case "particle_burst":
                CreateEffectParticleBurst(position, effect, intensity);
                break;
                
            case "multi_candle_flare":
                CreateCandleFlareEffect(effect, intensity);
                break;
                
            case "symbol_activation":
                ActivateFloorSymbols(effect, intensity);
                break;
        }
        
        EmitSignal(SignalName.StageEffectTriggered, effect.Name);
    }
    
    private void ApplyLayerGlow(string layerName, float[] glowColor, float duration)
    {
        var targetLayer = _backgroundLayers.FirstOrDefault(l => l.LayerName == layerName);
        targetLayer?.ApplyGlowEffect(
            new Color(glowColor[0], glowColor[1], glowColor[2], glowColor[3]),
            duration
        );
    }
    
    private void CreateEffectParticleBurst(Vector2 position, SpecialEffectData effect, float intensity)
    {
        if (_particleSystem == null) return;
        
        var particleType = GetParticleTypeFromString(effect.ParticleType);
        _particleSystem.CreateBurstEffect(particleType, position, intensity * 2.0f, effect.Duration);
    }
    
    private void CreateCandleFlareEffect(SpecialEffectData effect, float intensity)
    {
        // Find all candle layers and create flare effects
        foreach (var layer in _backgroundLayers)
        {
            if (layer.LayerName.Contains("candle"))
            {
                layer.CreateLightFlare(
                    new Color(effect.Color[0], effect.Color[1], effect.Color[2], effect.Color[3]),
                    effect.Duration,
                    intensity
                );
            }
        }
    }
    
    private void ActivateFloorSymbols(SpecialEffectData effect, float intensity)
    {
        var symbolLayer = _backgroundLayers.FirstOrDefault(l => l.LayerName.Contains("symbol"));
        symbolLayer?.ActivateSymbolGlow(effect.GlowIntensity * intensity, effect.Duration);
    }
    
    private void UnloadCurrentStage()
    {
        // Stop audio
        _ambientPlayer?.Stop();
        _musicPlayer?.Stop();
        
        // Clear stage components
        _backgroundLayers.Clear();
        _foregroundLayers.Clear();
        _particleEffects.Clear();
        
        // Remove stage scene
        _currentStageScene?.QueueFree();
        _currentStageScene = null;
        
        _currentStageData = null;
        _currentStageId = "";
    }
    
    // Public API methods
    public string[] GetAvailableStageIds() => _availableStages.Keys.ToArray();
    
    public StageData GetStageData(string stageId) => 
        _availableStages.ContainsKey(stageId) ? _availableStages[stageId] : null;
    
    public string GetCurrentStageId() => _currentStageId;
    
    public bool IsStageLoaded() => _currentStageScene != null && _currentStageData != null;
    
    public void SetStageEffectIntensity(float intensity)
    {
        foreach (var layer in _backgroundLayers.Concat(_foregroundLayers))
        {
            layer.SetEffectIntensity(intensity);
        }
    }
    
    public override void _ExitTree()
    {
        UnloadCurrentStage();
        Instance = null;
    }
}