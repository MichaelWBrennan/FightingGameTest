using Godot;
using System.Collections.Generic;

/// <summary>
/// Simplified Dynamic Lighting System for cutting-edge stage illumination
/// Compatible with Godot 4.4 API
/// MIT Licensed - Free for commercial use
/// </summary>
public partial class DynamicLightingSystem : Node2D
{
    public static DynamicLightingSystem Instance { get; private set; }
    
    [Export] public bool EnableDynamicLighting { get; set; } = true;
    [Export] public float LightingIntensity { get; set; } = 1.0f;
    
    private readonly List<Node2D> _stageLights = new();
    private readonly Dictionary<Node2D, Node2D> _characterLights = new();
    
    // Lighting presets for different combat scenarios
    public enum LightingMode
    {
        Normal,
        Intense,
        Dramatic,
        EpicMoment,
        Victory
    }
    
    public override void _Ready()
    {
        Instance = this;
        InitializeLightingSystem();
        SetupStageLighting();
        
        GD.Print("DynamicLightingSystem: Simplified lighting system initialized");
    }
    
    private void InitializeLightingSystem()
    {
        // Initialize lighting with compatible APIs
        GD.Print("Lighting system initialized with sprite-based effects");
    }
    
    private void SetupStageLighting()
    {
        if (!EnableDynamicLighting)
            return;
        
        // Create visual lighting effects using sprites
        var stageLightConfigs = new[]
        {
            new { Position = new Vector2(-400, -200), Color = new Color(1.0f, 0.9f, 0.7f), Energy = 0.8f, Name = "KeyLight" },
            new { Position = new Vector2(400, -200), Color = new Color(0.7f, 0.8f, 1.0f), Energy = 0.6f, Name = "FillLight" },
            new { Position = new Vector2(0, -300), Color = new Color(1.0f, 1.0f, 0.9f), Energy = 0.4f, Name = "RimLight" }
        };
        
        foreach (var config in stageLightConfigs)
        {
            var lightEffect = CreateLightEffect(config.Position, config.Color, config.Energy);
            lightEffect.Name = config.Name;
            _stageLights.Add(lightEffect);
        }
        
        GD.Print($"Stage lighting configured with {_stageLights.Count} light effects");
    }
    
    private Node2D CreateLightEffect(Vector2 position, Color color, float energy)
    {
        var lightEffect = new Node2D
        {
            Position = position
        };
        
        var sprite = new Sprite2D
        {
            Modulate = color * energy * LightingIntensity,
            Scale = Vector2.One * 3.0f,
            ZIndex = -5
        };
        
        lightEffect.AddChild(sprite);
        AddChild(lightEffect);
        
        // Add subtle animation
        var tween = CreateTween();
        tween.SetLoops();
        tween.TweenProperty(sprite, "modulate:a", energy * LightingIntensity * 1.1f, 2.0f);
        tween.TweenProperty(sprite, "modulate:a", energy * LightingIntensity * 0.9f, 2.0f);
        
        return lightEffect;
    }
    
    /// <summary>
    /// Attach visual lighting to a character
    /// </summary>
    public void AttachCharacterLighting(Node2D character, Color lightColor, float intensity = 1.0f)
    {
        if (!EnableDynamicLighting || _characterLights.ContainsKey(character))
            return;
        
        var characterLight = CreateLightEffect(Vector2.Zero, lightColor, intensity);
        characterLight.Name = $"CharacterLight_{character.Name}";
        
        character.AddChild(characterLight);
        _characterLights[character] = characterLight;
        
        GD.Print($"Character lighting attached to {character.Name}");
    }
    
    /// <summary>
    /// Remove character lighting
    /// </summary>
    public void RemoveCharacterLighting(Node2D character)
    {
        if (!_characterLights.ContainsKey(character))
            return;
        
        var light = _characterLights[character];
        light.QueueFree();
        _characterLights.Remove(character);
        
        GD.Print($"Character lighting removed from {character.Name}");
    }
    
    /// <summary>
    /// Set lighting mode for dramatic combat moments
    /// </summary>
    public void SetLightingMode(LightingMode mode, float transitionTime = 1.0f)
    {
        if (!EnableDynamicLighting)
            return;
        
        var targetIntensity = LightingIntensity;
        var targetStageIntensity = 1.0f;
        
        switch (mode)
        {
            case LightingMode.Normal:
                targetIntensity = LightingIntensity;
                targetStageIntensity = 1.0f;
                break;
                
            case LightingMode.Intense:
                targetIntensity = LightingIntensity * 1.3f;
                targetStageIntensity = 1.2f;
                break;
                
            case LightingMode.Dramatic:
                targetIntensity = LightingIntensity * 0.7f;
                targetStageIntensity = 1.5f;
                break;
                
            case LightingMode.EpicMoment:
                targetIntensity = LightingIntensity * 1.5f;
                targetStageIntensity = 1.8f;
                break;
                
            case LightingMode.Victory:
                targetIntensity = LightingIntensity * 1.2f;
                targetStageIntensity = 1.4f;
                break;
        }
        
        // Animate lighting transition
        var tween = CreateTween();
        tween.SetParallel(true);
        
        // Animate stage lights
        foreach (var lightEffect in _stageLights)
        {
            var sprite = lightEffect.GetChild<Sprite2D>(0);
            if (sprite != null)
            {
                var currentAlpha = sprite.Modulate.A;
                tween.TweenProperty(sprite, "modulate:a", currentAlpha * targetStageIntensity, transitionTime);
            }
        }
        
        GD.Print($"Lighting mode set to: {mode} with transition time {transitionTime}s");
    }
    
    /// <summary>
    /// Create temporary spotlight effect
    /// </summary>
    public Node2D CreateSpotlight(Vector2 position, Color color, float intensity, float duration = 3.0f)
    {
        var spotlight = CreateLightEffect(position, color, intensity);
        spotlight.Name = "TempSpotlight";
        spotlight.ZIndex = 5;
        
        // Animate spotlight appearance and disappearance
        var sprite = spotlight.GetChild<Sprite2D>(0);
        if (sprite != null)
        {
            var tween = CreateTween();
            tween.TweenProperty(sprite, "modulate:a", intensity * LightingIntensity, 0.3f);
            tween.TweenProperty(sprite, "modulate:a", intensity * LightingIntensity, duration - 0.6f);
            tween.TweenProperty(sprite, "modulate:a", 0.0f, 0.3f);
            tween.TweenCallback(Callable.From(() => spotlight.QueueFree()));
        }
        
        GD.Print($"Temporary spotlight created at {position}");
        return spotlight;
    }
    
    /// <summary>
    /// Create lightning flash effect
    /// </summary>
    public void CreateLightningFlash(float intensity = 2.0f, float duration = 0.2f)
    {
        var flash = CreateLightEffect(Vector2.Zero, new Color(0.9f, 0.95f, 1.0f), intensity);
        flash.Name = "LightningFlash";
        flash.ZIndex = 10;
        
        var sprite = flash.GetChild<Sprite2D>(0);
        if (sprite != null)
        {
            sprite.Scale = Vector2.One * 20.0f;
            
            // Quick flash animation
            var tween = CreateTween();
            tween.TweenProperty(sprite, "modulate:a", 0.0f, duration);
            tween.TweenCallback(Callable.From(() => flash.QueueFree()));
        }
        
        GD.Print($"Lightning flash effect created with intensity {intensity}");
    }
    
    /// <summary>
    /// Update lighting based on character positions and actions
    /// </summary>
    public void UpdateDynamicLighting(Vector2 player1Pos, Vector2 player2Pos)
    {
        if (!EnableDynamicLighting || _stageLights.Count == 0)
            return;
        
        // Calculate midpoint between players
        var midpoint = (player1Pos + player2Pos) * 0.5f;
        
        // Adjust key light position to follow action
        if (_stageLights.Count > 0)
        {
            var keyLight = _stageLights[0];
            var targetPos = midpoint + new Vector2(-200, -150);
            
            var tween = CreateTween();
            tween.TweenProperty(keyLight, "position", targetPos, 0.5f);
        }
    }
    
    public override void _ExitTree()
    {
        Instance = null;
    }
    
    // Additional methods for StageManager integration
    public void SetAmbientLighting(Color ambientColor)
    {
        if (!EnableDynamicLighting) return;
        
        // Apply ambient lighting to all stage lights
        foreach (var stageLight in _stageLights)
        {
            var sprite = stageLight.GetChild<Sprite2D>(0);
            if (sprite != null)
            {
                sprite.Modulate = sprite.Modulate * ambientColor;
            }
        }
        
        GD.Print($"Ambient lighting set to: {ambientColor}");
    }
    
    public void SetMainDirectionalLight(Color lightColor, Vector3 lightDirection)
    {
        if (!EnableDynamicLighting) return;
        
        // Create or update main directional light
        if (_stageLights.Count > 0)
        {
            var mainLight = _stageLights[0];
            var sprite = mainLight.GetChild<Sprite2D>(0);
            if (sprite != null)
            {
                sprite.Modulate = lightColor;
                // Position based on direction (simplified 2D positioning)
                mainLight.Position = new Vector2(lightDirection.X * 300, lightDirection.Y * 200);
            }
        }
        
        GD.Print($"Main directional light set: color={lightColor}, direction={lightDirection}");
    }
}