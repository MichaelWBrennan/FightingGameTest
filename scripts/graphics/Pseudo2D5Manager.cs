using Godot;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Pseudo 2.5D Manager for BlazBlue/Skullgirls-style depth rendering
/// Manages layered 2D sprites with 3D-like depth effects
/// MIT Licensed - Free for commercial use
/// </summary>
public partial class Pseudo2D5Manager : Node2D
{
    public static Pseudo2D5Manager Instance { get; private set; }
    
    [Export] public bool EnablePseudo2D5 { get; set; } = true;
    [Export] public float DepthScale { get; set; } = 1.0f;
    [Export] public float ParallaxStrength { get; set; } = 0.3f;
    [Export] public Vector2 CameraPosition { get; set; } = Vector2.Zero;
    
    // Depth layers for pseudo 2.5D rendering
    public enum DepthLayer
    {
        BackgroundFar = -1000,
        BackgroundMid = -500,
        BackgroundNear = -100,
        Stage = 0,
        Characters = 100,
        Effects = 200,
        UI = 1000
    }
    
    private readonly Dictionary<DepthLayer, CanvasLayer> _depthLayers = new();
    private readonly List<Node2D> _parallaxNodes = new();
    private Camera2D _mainCamera;
    private Vector2 _lastCameraPosition;
    
    // Enhanced lighting for pseudo 2.5D
    private readonly List<PseudoLightSource> _lightSources = new();
    
    public override void _Ready()
    {
        Instance = this;
        InitializeDepthLayers();
        SetupPseudo2D5Pipeline();
        
        GD.Print("Pseudo2D5Manager: Enhanced depth rendering system initialized");
    }
    
    private void InitializeDepthLayers()
    {
        // Create canvas layers for different depth levels
        foreach (DepthLayer layer in System.Enum.GetValues<DepthLayer>())
        {
            var canvasLayer = new CanvasLayer
            {
                Name = $"DepthLayer_{layer}",
                Layer = (int)layer
            };
            
            AddChild(canvasLayer);
            _depthLayers[layer] = canvasLayer;
            
            GD.Print($"Created depth layer: {layer} at Z={canvasLayer.Layer}");
        }
    }
    
    private void SetupPseudo2D5Pipeline()
    {
        // Find main camera
        _mainCamera = GetViewport().GetCamera2D();
        if (_mainCamera == null)
        {
            // Create a camera if none exists
            _mainCamera = new Camera2D { Name = "MainCamera2D" };
            GetTree().CurrentScene.AddChild(_mainCamera);
            GD.Print("Created main camera for pseudo 2.5D");
        }
        
        _lastCameraPosition = _mainCamera.GlobalPosition;
    }
    
    /// <summary>
    /// Register a node for parallax depth effects
    /// </summary>
    public void RegisterParallaxNode(Node2D node, float depthFactor = 1.0f, DepthLayer layer = DepthLayer.BackgroundMid)
    {
        if (!EnablePseudo2D5) return;
        
        // Move node to appropriate depth layer
        var targetLayer = _depthLayers[layer];
        node.Reparent(targetLayer);
        
        // Store parallax info in node metadata
        node.SetMeta("parallax_depth", depthFactor);
        node.SetMeta("original_position", node.Position);
        
        _parallaxNodes.Add(node);
        
        GD.Print($"Registered parallax node {node.Name} at depth {depthFactor} in layer {layer}");
    }
    
    /// <summary>
    /// Create a pseudo light source that affects sprite rendering
    /// </summary>
    public PseudoLightSource CreatePseudoLight(Vector2 position, Color color, float intensity = 1.0f, float radius = 200.0f)
    {
        var lightSource = new PseudoLightSource
        {
            Position = position,
            Color = color,
            Intensity = intensity,
            Radius = radius,
            Name = $"PseudoLight_{_lightSources.Count}"
        };
        
        _lightSources.Add(lightSource);
        AddChild(lightSource);
        
        GD.Print($"Created pseudo light at {position} with intensity {intensity}");
        return lightSource;
    }
    
    /// <summary>
    /// Apply pseudo 2.5D lighting to a character sprite
    /// </summary>
    public void ApplyPseudo2D5Lighting(Node2D character)
    {
        if (!EnablePseudo2D5) return;
        
        var sprite = character.GetNode<Sprite2D>("Sprite2D") ?? NodeExtensions.GetNodeInChildren<Sprite2D>(character);
        if (sprite == null) return;
        
        // Calculate lighting influence from all light sources
        var totalLighting = CalculateLightingForPosition(character.GlobalPosition);
        
        // Apply lighting to sprite material
        ApplyLightingToSprite(sprite, totalLighting);
    }
    
    private LightingData CalculateLightingForPosition(Vector2 position)
    {
        var lighting = new LightingData
        {
            AmbientColor = new Color(0.2f, 0.2f, 0.3f, 1.0f),
            MainLightColor = Colors.White,
            RimLightColor = new Color(0.8f, 0.9f, 1.0f, 1.0f),
            Intensity = 1.0f
        };
        
        foreach (var light in _lightSources.Where(l => l.IsActive))
        {
            var distance = position.DistanceTo(light.GlobalPosition);
            if (distance > light.Radius) continue;
            
            var falloff = 1.0f - (distance / light.Radius);
            falloff = Mathf.Pow(falloff, 2.0f); // Quadratic falloff
            
            var influence = light.Intensity * falloff;
            lighting.MainLightColor = lighting.MainLightColor.Lerp(light.Color, influence * 0.5f);
            lighting.Intensity += influence * 0.3f;
        }
        
        return lighting;
    }
    
    private void ApplyLightingToSprite(Sprite2D sprite, LightingData lighting)
    {
        // Apply lighting through modulation and shader parameters
        sprite.Modulate = sprite.Modulate.Lerp(lighting.MainLightColor, 0.3f);
        
        // If using custom shader, set lighting parameters
        if (sprite.Material is ShaderMaterial material)
        {
            material.SetShaderParameter("ambient_color", lighting.AmbientColor);
            material.SetShaderParameter("main_light_color", lighting.MainLightColor);
            material.SetShaderParameter("rim_light_color", lighting.RimLightColor);
            material.SetShaderParameter("lighting_intensity", lighting.Intensity);
        }
    }
    
    public override void _Process(double delta)
    {
        if (!EnablePseudo2D5 || _mainCamera == null) return;
        
        UpdateParallax();
        UpdatePseudoLighting();
    }
    
    private void UpdateParallax()
    {
        var currentCameraPos = _mainCamera.GlobalPosition;
        var cameraDelta = currentCameraPos - _lastCameraPosition;
        
        foreach (var node in _parallaxNodes.Where(n => IsInstanceValid(n)))
        {
            var depthFactor = node.GetMeta("parallax_depth").AsSingle();
            var originalPos = node.GetMeta("original_position").AsVector2();
            
            // Apply parallax offset based on camera movement and depth
            var parallaxOffset = cameraDelta * depthFactor * ParallaxStrength;
            node.Position = originalPos - parallaxOffset;
        }
        
        _lastCameraPosition = currentCameraPos;
    }
    
    private void UpdatePseudoLighting()
    {
        // Update lighting for all characters in the scene
        var characters = GetTree().GetNodesInGroup("characters");
        foreach (Node character in characters)
        {
            if (character is Node2D character2D)
            {
                ApplyPseudo2D5Lighting(character2D);
            }
        }
    }
    
    /// <summary>
    /// Create depth-based screen distortion effect
    /// </summary>
    public void CreateDepthDistortion(Vector2 centerPoint, float intensity = 1.0f, float duration = 0.5f)
    {
        if (!EnablePseudo2D5) return;
        
        // Create a temporary distortion effect
        var distortionNode = new Node2D
        {
            Name = "DepthDistortion",
            Position = centerPoint
        };
        
        var sprite = new Sprite2D();
        distortionNode.AddChild(sprite);
        _depthLayers[DepthLayer.Effects].AddChild(distortionNode);
        
        // Animate distortion effect
        var tween = CreateTween();
        tween.TweenProperty(sprite, "scale", Vector2.One * 3.0f, duration * 0.7f);
        tween.Parallel().TweenProperty(sprite, "modulate:a", 0.0f, duration);
        tween.TweenCallback(Callable.From(() => distortionNode.QueueFree()));
    }
    
    /// <summary>
    /// Move a node to a specific depth layer
    /// </summary>
    public void SetNodeDepthLayer(Node node, DepthLayer layer)
    {
        if (!_depthLayers.ContainsKey(layer)) return;
        
        node.Reparent(_depthLayers[layer]);
        GD.Print($"Moved {node.Name} to depth layer {layer}");
    }
    
    public override void _ExitTree()
    {
        Instance = null;
    }
}

/// <summary>
/// Pseudo light source for 2.5D lighting effects
/// </summary>
public partial class PseudoLightSource : Node2D
{
    [Export] public Color Color { get; set; } = Colors.White;
    [Export] public float Intensity { get; set; } = 1.0f;
    [Export] public float Radius { get; set; } = 200.0f;
    [Export] public bool IsActive { get; set; } = true;
    [Export] public bool AnimatePulse { get; set; } = false;
    
    private float _pulseTime = 0.0f;
    private float _originalIntensity;
    
    public override void _Ready()
    {
        _originalIntensity = Intensity;
    }
    
    public override void _Process(double delta)
    {
        if (AnimatePulse)
        {
            _pulseTime += (float)delta * 2.0f;
            Intensity = _originalIntensity + Mathf.Sin(_pulseTime) * 0.3f;
        }
    }
}

/// <summary>
/// Lighting data structure for pseudo 2.5D lighting
/// </summary>
public struct LightingData
{
    public Color AmbientColor;
    public Color MainLightColor;
    public Color RimLightColor;
    public float Intensity;
}