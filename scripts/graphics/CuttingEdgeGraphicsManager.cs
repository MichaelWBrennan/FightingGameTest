using Godot;
using System.Collections.Generic;

/// <summary>
/// Simplified Graphics Enhancement Manager for cutting-edge visual effects
/// Compatible with Godot 4.4 API
/// MIT Licensed - Free for commercial use
/// </summary>
public partial class CuttingEdgeGraphicsManager : Node
{
    public static CuttingEdgeGraphicsManager Instance { get; private set; }
    
    [Export] public bool EnableAdvancedEffects { get; set; } = true;
    [Export] public bool EnablePostProcessing { get; set; } = true;
    [Export] public float EffectsIntensity { get; set; } = 1.0f;
    
    private readonly Dictionary<string, ShaderMaterial> _combatShaders = new();
    private CanvasLayer _postProcessingLayer;
    private ColorRect _postProcessingRect;
    
    // Graphics quality presets
    public enum GraphicsQuality
    {
        Ultra,
        High,
        Medium,
        Low
    }
    
    public override void _Ready()
    {
        Instance = this;
        InitializeGraphicsSystem();
        LoadShaderResources();
        SetupPostProcessingPipeline();
        
        GD.Print("CuttingEdgeGraphicsManager: Advanced graphics system initialized");
    }
    
    private void InitializeGraphicsSystem()
    {
        // Load and apply cutting-edge environment if available
        var environmentPath = "res://assets/environments/CuttingEdgeEnvironment.tres";
        if (ResourceLoader.Exists(environmentPath))
        {
            var environment = GD.Load<Environment>(environmentPath);
            var viewport = GetViewport();
            if (viewport != null && environment != null)
            {
                // Use the camera's environment or the scene's environment
                var camera = viewport.GetCamera3D();
                if (camera != null)
                {
                    camera.Environment = environment;
                }
                GD.Print("Loaded cutting-edge environment resource");
            }
        }
        
        // Configure rendering settings
        ConfigureRenderingSettings();
    }
    
    private void LoadShaderResources()
    {
        // Load combat shaders
        var shaderPaths = new Dictionary<string, string>
        {
            ["impact"] = "res://assets/shaders/combat/ImpactShader.gdshader",
            ["highlight"] = "res://assets/shaders/combat/CharacterHighlight.gdshader",
            ["postprocess"] = "res://assets/shaders/combat/PostProcessing.gdshader"
        };
        
        foreach (var kvp in shaderPaths)
        {
            if (ResourceLoader.Exists(kvp.Value))
            {
                var shader = GD.Load<Shader>(kvp.Value);
                var material = new ShaderMaterial
                {
                    Shader = shader
                };
                _combatShaders[kvp.Key] = material;
                GD.Print($"Loaded shader: {kvp.Key}");
            }
            else
            {
                GD.PrintErr($"Shader not found: {kvp.Value}");
            }
        }
    }
    
    private void SetupPostProcessingPipeline()
    {
        if (!EnablePostProcessing || !_combatShaders.ContainsKey("postprocess"))
            return;
        
        // Create post-processing layer
        _postProcessingLayer = new CanvasLayer
        {
            Layer = 100, // Render on top
            Name = "PostProcessingLayer"
        };
        AddChild(_postProcessingLayer);
        
        // Create full-screen rect for post-processing
        _postProcessingRect = new ColorRect
        {
            Name = "PostProcessingRect",
            Material = _combatShaders["postprocess"],
            Color = Colors.White
        };
        
        // Set full rect manually
        _postProcessingRect.AnchorLeft = 0.0f;
        _postProcessingRect.AnchorTop = 0.0f;
        _postProcessingRect.AnchorRight = 1.0f;
        _postProcessingRect.AnchorBottom = 1.0f;
        _postProcessingRect.OffsetLeft = 0.0f;
        _postProcessingRect.OffsetTop = 0.0f;
        _postProcessingRect.OffsetRight = 0.0f;
        _postProcessingRect.OffsetBottom = 0.0f;
        _postProcessingLayer.AddChild(_postProcessingRect);
        
        GD.Print("Post-processing pipeline configured");
    }
    
    private void ConfigureRenderingSettings()
    {
        if (EnableAdvancedEffects)
        {
            // Configure MSAA for better quality
            GetViewport().Msaa2D = Viewport.Msaa.Msaa4X;
            
            GD.Print("Advanced rendering features enabled");
        }
    }
    
    /// <summary>
    /// Apply impact effect to a character or object
    /// </summary>
    public void ApplyImpactEffect(Node2D target, Vector2 impactPoint, float intensity = 1.0f)
    {
        if (!EnableAdvancedEffects || !_combatShaders.ContainsKey("impact"))
            return;
        
        // Create impact effect
        var impactNode = new Node2D
        {
            Name = "ImpactEffect",
            Position = impactPoint
        };
        
        var sprite = new Sprite2D
        {
            Material = _combatShaders["impact"]
        };
        
        impactNode.AddChild(sprite);
        target.AddChild(impactNode);
        
        // Animate the effect
        var tween = CreateTween();
        tween.TweenMethod(
            Callable.From<float>(value => SetShaderParam(sprite, "impact_intensity", value)),
            intensity,
            0.0f,
            0.5f
        );
        tween.TweenCallback(Callable.From(() => impactNode.QueueFree()));
        
        GD.Print($"Applied impact effect at {impactPoint} with intensity {intensity}");
    }
    
    /// <summary>
    /// Apply character highlight effect
    /// </summary>
    public void ApplyCharacterHighlight(Node2D character, Color highlightColor, float duration = 2.0f)
    {
        if (!EnableAdvancedEffects || !_combatShaders.ContainsKey("highlight"))
            return;
        
        // Find character's sprite
        var sprite = character.GetNode<Sprite2D>("Sprite2D") ?? NodeExtensions.GetNodeInChildren<Sprite2D>(character);
        if (sprite == null)
        {
            GD.PrintErr("No sprite found for character highlight");
            return;
        }
        
        // Store original material
        var originalMaterial = sprite.Material;
        
        // Apply highlight shader
        var highlightMaterial = _combatShaders["highlight"].Duplicate() as ShaderMaterial;
        SetShaderParam(sprite, "outline_color", highlightColor);
        sprite.Material = highlightMaterial;
        
        // Remove highlight after duration
        var timer = new Timer
        {
            WaitTime = duration,
            OneShot = true
        };
        AddChild(timer);
        timer.Timeout += () =>
        {
            sprite.Material = originalMaterial;
            timer.QueueFree();
        };
        timer.Start();
        
        GD.Print($"Applied character highlight to {character.Name}");
    }
    
    /// <summary>
    /// Create dynamic stage lighting (simplified version)
    /// </summary>
    public Node2D CreateDynamicLight(Vector2 position, Color color, float energy = 1.0f)
    {
        // Create a visual light effect using sprites and shaders instead of Light2D
        var lightEffect = new Node2D
        {
            Name = "DynamicLightEffect",
            Position = position
        };
        
        var sprite = new Sprite2D
        {
            Name = "LightSprite",
            Modulate = color * energy,
            Scale = Vector2.One * 2.0f
        };
        
        lightEffect.AddChild(sprite);
        GetTree().CurrentScene.AddChild(lightEffect);
        
        // Add subtle animation
        var tween = CreateTween();
        tween.SetLoops();
        tween.TweenProperty(sprite, "modulate:a", 0.8f, 1.0f);
        tween.TweenProperty(sprite, "modulate:a", 1.2f, 1.0f);
        
        GD.Print($"Created dynamic light effect at {position}");
        return lightEffect;
    }
    
    /// <summary>
    /// Set graphics quality preset
    /// </summary>
    public void SetGraphicsQuality(GraphicsQuality quality)
    {
        switch (quality)
        {
            case GraphicsQuality.Ultra:
                GetViewport().Msaa2D = Viewport.Msaa.Msaa8X;
                EnableAdvancedEffects = true;
                EnablePostProcessing = true;
                EffectsIntensity = 1.0f;
                break;
                
            case GraphicsQuality.High:
                GetViewport().Msaa2D = Viewport.Msaa.Msaa4X;
                EnableAdvancedEffects = true;
                EnablePostProcessing = true;
                EffectsIntensity = 0.8f;
                break;
                
            case GraphicsQuality.Medium:
                GetViewport().Msaa2D = Viewport.Msaa.Msaa2X;
                EnableAdvancedEffects = true;
                EnablePostProcessing = false;
                EffectsIntensity = 0.6f;
                break;
                
            case GraphicsQuality.Low:
                GetViewport().Msaa2D = Viewport.Msaa.Disabled;
                EnableAdvancedEffects = false;
                EnablePostProcessing = false;
                EffectsIntensity = 0.3f;
                break;
        }
        
        GD.Print($"Graphics quality set to: {quality}");
    }
    
    private void SetShaderParam(Node node, string param, Variant value)
    {
        if (node is Sprite2D sprite && sprite.Material is ShaderMaterial material)
        {
            material.SetShaderParameter(param, value);
        }
        else if (node is ColorRect rect && rect.Material is ShaderMaterial rectMaterial)
        {
            rectMaterial.SetShaderParameter(param, value);
        }
    }
    
    public override void _ExitTree()
    {
        Instance = null;
    }
}

/// <summary>
/// Node extension methods for graphics operations
/// </summary>
public static class NodeExtensions
{
    public static T GetNodeInChildren<T>(Node node) where T : Node
    {
        foreach (Node child in node.GetChildren())
        {
            if (child is T result)
                return result;
            
            var nested = GetNodeInChildren<T>(child);
            if (nested != null)
                return nested;
        }
        return null;
    }
}