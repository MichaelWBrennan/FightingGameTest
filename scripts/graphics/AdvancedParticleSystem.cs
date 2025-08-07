using Godot;
using System.Collections.Generic;

/// <summary>
/// Simplified Particle Effects System for cutting-edge combat visuals
/// Compatible with Godot 4.4 API
/// MIT Licensed - Free for commercial use
/// </summary>
public partial class AdvancedParticleSystem : Node2D
{
    public static AdvancedParticleSystem Instance { get; private set; }
    
    [Export] public bool EnableParticleEffects { get; set; } = true;
    [Export] public float ParticleIntensity { get; set; } = 1.0f;
    [Export] public int MaxActiveParticles { get; set; } = 100;
    
    private readonly List<CpuParticles2D> _activeParticles = new();
    
    // Particle effect types
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
        Wind
    }
    
    public override void _Ready()
    {
        Instance = this;
        InitializeParticleSystem();
        
        GD.Print("AdvancedParticleSystem: Simplified particle effects initialized");
    }
    
    private void InitializeParticleSystem()
    {
        // Set up the particle system
        Name = "AdvancedParticleSystem";
        ZIndex = 100; // Render particles on top
        
        GD.Print("Particle system initialized with CPU particles");
    }
    
    /// <summary>
    /// Create particle effect at specified position
    /// </summary>
    public CpuParticles2D CreateParticleEffect(ParticleType type, Vector2 position, float intensity = 1.0f, float scale = 1.0f)
    {
        if (!EnableParticleEffects)
            return null;
        
        // Clean up old particles if we're at the limit
        CleanupOldParticles();
        
        // Create new particle effect
        var particles = new CpuParticles2D
        {
            Name = $"{type}Particles",
            Position = position,
            Emitting = true,
            Scale = Vector2.One * scale * ParticleIntensity
        };
        
        // Configure based on type
        ConfigureParticleEffect(particles, type, intensity);
        
        AddChild(particles);
        _activeParticles.Add(particles);
        
        // Schedule cleanup
        var timer = new Timer
        {
            WaitTime = particles.Lifetime + 1.0f,
            OneShot = true
        };
        AddChild(timer);
        timer.Timeout += () =>
        {
            CleanupParticle(particles);
            timer.QueueFree();
        };
        timer.Start();
        
        GD.Print($"Created {type} particle effect at {position} with intensity {intensity}");
        return particles;
    }
    
    private void ConfigureParticleEffect(CpuParticles2D particles, ParticleType type, float intensity)
    {
        switch (type)
        {
            case ParticleType.Impact:
                ConfigureImpactParticles(particles, intensity);
                break;
            case ParticleType.Explosion:
                ConfigureExplosionParticles(particles, intensity);
                break;
            case ParticleType.Energy:
                ConfigureEnergyParticles(particles, intensity);
                break;
            case ParticleType.Sparks:
                ConfigureSparksParticles(particles, intensity);
                break;
            case ParticleType.Dust:
                ConfigureDustParticles(particles, intensity);
                break;
            case ParticleType.Lightning:
                ConfigureLightningParticles(particles, intensity);
                break;
            case ParticleType.Fire:
                ConfigureFireParticles(particles, intensity);
                break;
            case ParticleType.Ice:
                ConfigureIceParticles(particles, intensity);
                break;
            case ParticleType.Wind:
                ConfigureWindParticles(particles, intensity);
                break;
        }
    }
    
    private void ConfigureImpactParticles(CpuParticles2D particles, float intensity)
    {
        particles.Amount = (int)(50 * intensity);
        particles.Lifetime = 1.0f;
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.Direction = Vector2.Up;
        particles.InitialVelocityMin = 100.0f;
        particles.InitialVelocityMax = 300.0f;
        particles.Gravity = new Vector2(0, 200);
        particles.ScaleAmountMin = 0.5f;
        particles.ScaleAmountMax = 2.0f;
        particles.Color = Colors.White;
        particles.ColorRamp = CreateSimpleGradient(Colors.White, Colors.Orange);
    }
    
    private void ConfigureExplosionParticles(CpuParticles2D particles, float intensity)
    {
        particles.Amount = (int)(100 * intensity);
        particles.Lifetime = 2.0f;
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.Direction = Vector2.Up;
        particles.Spread = 180.0f;
        particles.InitialVelocityMin = 200.0f;
        particles.InitialVelocityMax = 500.0f;
        particles.Gravity = new Vector2(0, 150);
        particles.ScaleAmountMin = 1.0f;
        particles.ScaleAmountMax = 3.0f;
        particles.Color = Colors.Yellow;
        particles.ColorRamp = CreateSimpleGradient(Colors.Yellow, Colors.Red);
    }
    
    private void ConfigureEnergyParticles(CpuParticles2D particles, float intensity)
    {
        particles.Amount = (int)(75 * intensity);
        particles.Lifetime = 1.5f;
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.Direction = Vector2.Up;
        particles.Spread = 45.0f;
        particles.InitialVelocityMin = 50.0f;
        particles.InitialVelocityMax = 200.0f;
        particles.Gravity = new Vector2(0, -50);
        particles.ScaleAmountMin = 0.3f;
        particles.ScaleAmountMax = 1.5f;
        particles.Color = Colors.Cyan;
        particles.ColorRamp = CreateSimpleGradient(Colors.Cyan, Colors.Blue);
    }
    
    private void ConfigureSparksParticles(CpuParticles2D particles, float intensity)
    {
        particles.Amount = (int)(40 * intensity);
        particles.Lifetime = 0.8f;
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.Direction = Vector2.Up;
        particles.Spread = 120.0f;
        particles.InitialVelocityMin = 150.0f;
        particles.InitialVelocityMax = 400.0f;
        particles.Gravity = new Vector2(0, 300);
        particles.ScaleAmountMin = 0.2f;
        particles.ScaleAmountMax = 0.8f;
        particles.Color = Colors.White;
        particles.ColorRamp = CreateSimpleGradient(Colors.White, Colors.Yellow);
    }
    
    private void ConfigureDustParticles(CpuParticles2D particles, float intensity)
    {
        particles.Amount = (int)(60 * intensity);
        particles.Lifetime = 2.5f;
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.Direction = Vector2.Up;
        particles.Spread = 60.0f;
        particles.InitialVelocityMin = 20.0f;
        particles.InitialVelocityMax = 100.0f;
        particles.Gravity = new Vector2(0, 50);
        particles.ScaleAmountMin = 1.0f;
        particles.ScaleAmountMax = 2.5f;
        particles.Color = new Color(0.8f, 0.7f, 0.5f);
        particles.ColorRamp = CreateSimpleGradient(new Color(0.8f, 0.7f, 0.5f), new Color(0.6f, 0.5f, 0.3f));
    }
    
    private void ConfigureLightningParticles(CpuParticles2D particles, float intensity)
    {
        particles.Amount = (int)(30 * intensity);
        particles.Lifetime = 0.3f;
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.Direction = Vector2.Up;
        particles.Spread = 30.0f;
        particles.InitialVelocityMin = 300.0f;
        particles.InitialVelocityMax = 600.0f;
        particles.Gravity = Vector2.Zero;
        particles.ScaleAmountMin = 0.1f;
        particles.ScaleAmountMax = 0.5f;
        particles.Color = Colors.White;
        particles.ColorRamp = CreateSimpleGradient(Colors.White, Colors.Cyan);
    }
    
    private void ConfigureFireParticles(CpuParticles2D particles, float intensity)
    {
        particles.Amount = (int)(90 * intensity);
        particles.Lifetime = 1.8f;
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.Direction = Vector2.Up;
        particles.Spread = 30.0f;
        particles.InitialVelocityMin = 50.0f;
        particles.InitialVelocityMax = 150.0f;
        particles.Gravity = new Vector2(0, -100);
        particles.ScaleAmountMin = 0.8f;
        particles.ScaleAmountMax = 2.0f;
        particles.Color = Colors.Yellow;
        particles.ColorRamp = CreateSimpleGradient(Colors.Yellow, Colors.Red);
    }
    
    private void ConfigureIceParticles(CpuParticles2D particles, float intensity)
    {
        particles.Amount = (int)(50 * intensity);
        particles.Lifetime = 2.2f;
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.Direction = Vector2.Up;
        particles.Spread = 90.0f;
        particles.InitialVelocityMin = 80.0f;
        particles.InitialVelocityMax = 200.0f;
        particles.Gravity = new Vector2(0, 200);
        particles.ScaleAmountMin = 0.3f;
        particles.ScaleAmountMax = 1.2f;
        particles.Color = Colors.White;
        particles.ColorRamp = CreateSimpleGradient(Colors.White, Colors.Cyan);
    }
    
    private void ConfigureWindParticles(CpuParticles2D particles, float intensity)
    {
        particles.Amount = (int)(100 * intensity);
        particles.Lifetime = 3.0f;
        particles.EmissionShape = CpuParticles2D.EmissionShapeEnum.Sphere;
        particles.Direction = Vector2.Right;
        particles.Spread = 45.0f;
        particles.InitialVelocityMin = 100.0f;
        particles.InitialVelocityMax = 300.0f;
        particles.Gravity = new Vector2(50, 30);
        particles.ScaleAmountMin = 0.5f;
        particles.ScaleAmountMax = 1.8f;
        particles.Color = new Color(0.9f, 0.9f, 1.0f, 0.3f);
        particles.ColorRamp = CreateSimpleGradient(new Color(0.9f, 0.9f, 1.0f, 0.3f), new Color(0.8f, 0.8f, 0.9f, 0.1f));
    }
    
    private Gradient CreateSimpleGradient(Color start, Color end)
    {
        var gradient = new Gradient();
        gradient.SetColor(0, start);
        gradient.SetColor(1, end);
        gradient.SetOffset(0, 0.0f);
        gradient.SetOffset(1, 1.0f);
        return gradient;
    }
    
    /// <summary>
    /// Create impact effect with appropriate particles
    /// </summary>
    public void CreateImpactEffect(Vector2 position, float power = 1.0f, Color? lightColor = null)
    {
        // Create particles based on impact power
        if (power >= 2.0f)
        {
            CreateParticleEffect(ParticleType.Explosion, position, power * 0.8f);
            CreateParticleEffect(ParticleType.Sparks, position, power * 0.6f, 0.8f);
        }
        else if (power >= 1.0f)
        {
            CreateParticleEffect(ParticleType.Impact, position, power);
            CreateParticleEffect(ParticleType.Dust, position, power * 0.4f, 0.6f);
        }
        else
        {
            CreateParticleEffect(ParticleType.Impact, position, power, 0.7f);
        }
        
        // Add dynamic lighting if available
        if (DynamicLightingSystem.Instance != null && lightColor.HasValue)
        {
            DynamicLightingSystem.Instance.CreateSpotlight(position, lightColor.Value, power, 0.8f);
        }
        
        GD.Print($"Created impact effect at {position} with power {power}");
    }
    
    private void CleanupOldParticles()
    {
        if (_activeParticles.Count <= MaxActiveParticles)
            return;
        
        // Remove oldest particles
        var particlesToRemove = _activeParticles.Count - MaxActiveParticles;
        for (int i = 0; i < particlesToRemove; i++)
        {
            if (_activeParticles.Count > 0)
            {
                var oldParticle = _activeParticles[0];
                CleanupParticle(oldParticle);
            }
        }
    }
    
    private void CleanupParticle(CpuParticles2D particle)
    {
        if (particle != null && IsInstanceValid(particle))
        {
            _activeParticles.Remove(particle);
            particle.QueueFree();
        }
    }
    
    /// <summary>
    /// Clear all active particle effects
    /// </summary>
    public void ClearAllParticles()
    {
        foreach (var particle in _activeParticles.ToArray())
        {
            CleanupParticle(particle);
        }
        _activeParticles.Clear();
        
        GD.Print("Cleared all active particle effects");
    }
    
    public override void _ExitTree()
    {
        Instance = null;
    }
}