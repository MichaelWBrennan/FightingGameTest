using Godot;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Enhanced Particle System for Pseudo 2.5D Effects
/// Optimized for BlazBlue/Skullgirls-style dramatic combat visuals
/// MIT Licensed - Free for commercial use
/// </summary>
public partial class Enhanced2D5ParticleSystem : Node2D
{
    public static Enhanced2D5ParticleSystem Instance { get; private set; }
    
    [Export] public bool EnableParticleEffects { get; set; } = true;
    [Export] public float ParticleIntensity { get; set; } = 1.0f;
    [Export] public int MaxActiveParticles { get; set; } = 150;
    [Export] public bool EnableDepthSorting { get; set; } = true;
    
    private readonly Dictionary<DepthLayer, Node2D> _particleLayers = new();
    private readonly List<Enhanced2DParticle> _activeParticles = new();
    private int _nextParticleId = 0;
    
    // Enhanced particle types for fighting games
    public enum ParticleType
    {
        Impact,
        Explosion,
        Energy,
        Sparks,
        Dust,
        Lightning,
        Fire,
        Ice,
        Wind,
        BloodSpray,
        MagicBurst,
        SwordSlash,
        Shockwave,
        ComboHit
    }
    
    public enum DepthLayer
    {
        Background = -100,
        MidGround = 0,
        Foreground = 100,
        UI = 200
    }
    
    public override void _Ready()
    {
        Instance = this;
        InitializeParticleLayers();
        InitializeParticleSystem();
        
        GD.Print("Enhanced2D5ParticleSystem: Advanced pseudo 2.5D particle system initialized");
    }
    
    private void InitializeParticleLayers()
    {
        foreach (DepthLayer layer in System.Enum.GetValues<DepthLayer>())
        {
            var layerNode = new Node2D
            {
                Name = $"ParticleLayer_{layer}",
                ZIndex = (int)layer
            };
            
            AddChild(layerNode);
            _particleLayers[layer] = layerNode;
        }
    }
    
    private void InitializeParticleSystem()
    {
        Name = "Enhanced2D5ParticleSystem";
        ZIndex = 50; // Particles render above most game elements
    }
    
    /// <summary>
    /// Create enhanced impact effect with depth awareness
    /// </summary>
    public void CreateImpactEffect(Vector2 position, float power, Color lightColor, ParticleType type = ParticleType.Impact, DepthLayer layer = DepthLayer.MidGround)
    {
        if (!EnableParticleEffects) return;
        
        var config = GetParticleConfig(type, power);
        CreateParticleEffect(position, config, lightColor, layer);
        
        // Add screen distortion for powerful hits
        if (power > 0.7f && Pseudo2D5Manager.Instance != null)
        {
            Pseudo2D5Manager.Instance.CreateDepthDistortion(position, power, 0.3f);
        }
        
        // Add camera shake for strong impacts
        if (power > 0.5f && CinematicCameraSystem.Instance != null)
        {
            CinematicCameraSystem.Instance.AddScreenShake(power * 0.3f);
        }
    }
    
    /// <summary>
    /// Create combo effect with multiple hit visualization
    /// </summary>
    public void CreateComboEffect(Vector2 position, int comboCount, Color comboColor)
    {
        if (!EnableParticleEffects) return;
        
        var baseIntensity = Mathf.Min(comboCount * 0.1f, 2.0f);
        
        // Create escalating particle effects
        for (int i = 0; i < Mathf.Min(comboCount, 10); i++)
        {
            var offset = new Vector2(
                (float)(GD.Randf() - 0.5f) * 40.0f,
                (float)(GD.Randf() - 0.5f) * 30.0f
            );
            
            var delay = i * 0.05f;
            GetTree().CreateTimer(delay).Timeout += () =>
            {
                CreateImpactEffect(position + offset, baseIntensity, comboColor, ParticleType.ComboHit);
            };
        }
        
        // Add special effect for high combos
        if (comboCount > 10)
        {
            CreateSpecialComboEffect(position, comboCount, comboColor);
        }
    }
    
    private void CreateSpecialComboEffect(Vector2 position, int comboCount, Color color)
    {
        var config = new ParticleConfig
        {
            Lifetime = 2.0f,
            Amount = 50,
            SpreadRadius = 100.0f,
            InitialVelocity = 150.0f,
            Gravity = new Vector2(0, 98),
            Scale = Vector2.One * 1.5f,
            Color = color,
            FadeOut = true,
            UsePhysics = true
        };
        
        CreateParticleEffect(position, config, color, DepthLayer.Foreground);
    }
    
    /// <summary>
    /// Create sword slash effect with trail
    /// </summary>
    public void CreateSlashEffect(Vector2 startPos, Vector2 endPos, Color slashColor, float width = 10.0f)
    {
        if (!EnableParticleEffects) return;
        
        var direction = (endPos - startPos).Normalized();
        var distance = startPos.DistanceTo(endPos);
        var particleCount = Mathf.RoundToInt(distance / 20.0f);
        
        for (int i = 0; i < particleCount; i++)
        {
            var t = (float)i / particleCount;
            var position = startPos.Lerp(endPos, t);
            
            var perpendicular = new Vector2(-direction.Y, direction.X);
            var offset = perpendicular * (float)(GD.Randf() - 0.5f) * width;
            
            var config = new ParticleConfig
            {
                Lifetime = 0.5f + t * 0.3f,
                Amount = 3,
                SpreadRadius = 5.0f,
                InitialVelocity = 50.0f,
                Scale = Vector2.One * 0.8f,
                Color = slashColor,
                FadeOut = true
            };
            
            CreateParticleEffect(position + offset, config, slashColor, DepthLayer.Foreground);
        }
    }
    
    /// <summary>
    /// Create magical burst effect
    /// </summary>
    public void CreateMagicBurst(Vector2 position, Color magicColor, float intensity = 1.0f)
    {
        if (!EnableParticleEffects) return;
        
        // Inner explosion
        var innerConfig = new ParticleConfig
        {
            Lifetime = 1.0f,
            Amount = 30,
            SpreadRadius = 50.0f * intensity,
            InitialVelocity = 100.0f * intensity,
            Scale = Vector2.One * 1.2f,
            Color = magicColor,
            FadeOut = true
        };
        
        CreateParticleEffect(position, innerConfig, magicColor, DepthLayer.MidGround);
        
        // Outer sparkles
        var sparkleConfig = new ParticleConfig
        {
            Lifetime = 2.0f,
            Amount = 60,
            SpreadRadius = 120.0f * intensity,
            InitialVelocity = 80.0f * intensity,
            Gravity = new Vector2(0, -49), // Float upward
            Scale = Vector2.One * 0.6f,
            Color = magicColor.Lerp(Colors.White, 0.3f),
            FadeOut = true,
            UsePhysics = true
        };
        
        CreateParticleEffect(position, sparkleConfig, magicColor, DepthLayer.Foreground);
    }
    
    private void CreateParticleEffect(Vector2 position, ParticleConfig config, Color color, DepthLayer layer)
    {
        if (_activeParticles.Count >= MaxActiveParticles)
        {
            CleanupOldestParticles(10);
        }
        
        var particles = new CpuParticles2D
        {
            Name = $"Particles_{_nextParticleId++}",
            Position = position,
            ZIndex = (int)layer,
            Emitting = true
        };
        
        // Apply configuration
        ApplyParticleConfiguration(particles, config);
        
        // Add to appropriate layer
        _particleLayers[layer].AddChild(particles);
        
        var enhancedParticle = new Enhanced2DParticle
        {
            ParticleNode = particles,
            StartTime = Time.GetUnixTimeFromSystem(),
            Lifetime = config.Lifetime,
            Layer = layer
        };
        
        _activeParticles.Add(enhancedParticle);
        
        // Auto-cleanup after lifetime
        var timer = GetTree().CreateTimer(config.Lifetime);
        timer.Timeout += () =>
        {
            if (IsInstanceValid(particles))
            {
                particles.Emitting = false;
                // Let particles fade out naturally
                GetTree().CreateTimer(2.0).Timeout += () =>
                {
                    if (IsInstanceValid(particles))
                        particles.QueueFree();
                };
            }
            
            _activeParticles.RemoveAll(p => p.ParticleNode == particles);
        };
    }
    
    private void ApplyParticleConfiguration(CpuParticles2D particles, ParticleConfig config)
    {
        particles.Lifetime = config.Lifetime;
        particles.Amount = config.Amount;
        particles.Preprocess = 0.0;
        
        // Emission
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.EmissionSphereRadius = config.SpreadRadius;
        
        // Movement
        particles.Direction = Vector2.Up;
        particles.Spread = 45.0f;
        particles.InitialVelocityMin = config.InitialVelocity * 0.8f;
        particles.InitialVelocityMax = config.InitialVelocity * 1.2f;
        
        // Physics
        if (config.UsePhysics)
        {
            particles.Gravity = config.Gravity;
        }
        
        // Scale
        particles.ScaleAmountMin = config.Scale.X * 0.8f;
        particles.ScaleAmountMax = config.Scale.X * 1.2f;
        
        // Color and fading
        particles.Color = config.Color;
        
        if (config.FadeOut)
        {
            var gradient = new Gradient();
            gradient.AddPoint(0.0f, config.Color);
            gradient.AddPoint(1.0f, new Color(config.Color.R, config.Color.G, config.Color.B, 0.0f));
            particles.ColorRamp = gradient;
        }
        
        // Add some randomness for visual variety
        particles.AngleMin = 0.0f;
        particles.AngleMax = 360.0f;
        particles.AngularVelocityMin = -30.0f;
        particles.AngularVelocityMax = 30.0f;
    }
    
    private ParticleConfig GetParticleConfig(ParticleType type, float power)
    {
        var intensity = power * ParticleIntensity;
        
        return type switch
        {
            ParticleType.Impact => new ParticleConfig
            {
                Lifetime = 0.8f,
                Amount = Mathf.RoundToInt(20 * intensity),
                SpreadRadius = 30.0f * intensity,
                InitialVelocity = 120.0f * intensity,
                Scale = Vector2.One * intensity,
                Color = Colors.Orange,
                FadeOut = true
            },
            
            ParticleType.Explosion => new ParticleConfig
            {
                Lifetime = 1.2f,
                Amount = Mathf.RoundToInt(50 * intensity),
                SpreadRadius = 60.0f * intensity,
                InitialVelocity = 200.0f * intensity,
                Scale = Vector2.One * 1.5f * intensity,
                Color = Colors.Red,
                FadeOut = true
            },
            
            ParticleType.Lightning => new ParticleConfig
            {
                Lifetime = 0.3f,
                Amount = Mathf.RoundToInt(15 * intensity),
                SpreadRadius = 20.0f * intensity,
                InitialVelocity = 300.0f * intensity,
                Scale = Vector2.One * 0.8f,
                Color = Colors.Cyan,
                FadeOut = true
            },
            
            ParticleType.ComboHit => new ParticleConfig
            {
                Lifetime = 0.6f,
                Amount = Mathf.RoundToInt(8 * intensity),
                SpreadRadius = 25.0f * intensity,
                InitialVelocity = 100.0f * intensity,
                Scale = Vector2.One * 1.2f,
                Color = Colors.Yellow,
                FadeOut = true
            },
            
            _ => new ParticleConfig
            {
                Lifetime = 1.0f,
                Amount = Mathf.RoundToInt(25 * intensity),
                SpreadRadius = 40.0f * intensity,
                InitialVelocity = 100.0f * intensity,
                Scale = Vector2.One * intensity,
                Color = Colors.White,
                FadeOut = true
            }
        };
    }
    
    private void CleanupOldestParticles(int count)
    {
        var oldestParticles = _activeParticles
            .OrderBy(p => p.StartTime)
            .Take(count)
            .ToList();
        
        foreach (var particle in oldestParticles)
        {
            if (IsInstanceValid(particle.ParticleNode))
                particle.ParticleNode.QueueFree();
        }
        
        _activeParticles.RemoveAll(p => oldestParticles.Contains(p));
    }
    
    public override void _ExitTree()
    {
        Instance = null;
    }
}

/// <summary>
/// Particle configuration structure
/// </summary>
public struct ParticleConfig
{
    public float Lifetime;
    public int Amount;
    public float SpreadRadius;
    public float InitialVelocity;
    public Vector2 Gravity;
    public Vector2 Scale;
    public Color Color;
    public bool FadeOut;
    public bool UsePhysics;
}

/// <summary>
/// Enhanced 2D particle wrapper
/// </summary>
public class Enhanced2DParticle
{
    public CpuParticles2D ParticleNode;
    public double StartTime;
    public float Lifetime;
    public Enhanced2D5ParticleSystem.DepthLayer Layer;
}