using Godot;

/// <summary>
/// Graphics Demo Scene to showcase cutting-edge visual effects
/// Demonstrates the advanced graphics capabilities
/// </summary>
public partial class GraphicsDemoScene : Node2D
{
    private CuttingEdgeGraphicsManager _graphicsManager;
    private DynamicLightingSystem _lightingSystem;
    private AdvancedParticleSystem _particleSystem;
    
    private Timer _demoTimer;
    private int _currentDemo = 0;
    private Label _demoLabel;
    
    public override void _Ready()
    {
        SetupDemo();
        StartDemo();
    }
    
    private void SetupDemo()
    {
        // Get graphics system references
        _graphicsManager = CuttingEdgeGraphicsManager.Instance;
        _lightingSystem = DynamicLightingSystem.Instance;
        _particleSystem = AdvancedParticleSystem.Instance;
        
        // Create demo UI
        var ui = new CanvasLayer { Name = "DemoUI" };
        AddChild(ui);
        
        _demoLabel = new Label
        {
            Text = "Graphics Demo Loading...",
            Position = new Vector2(50, 50)
        };
        ui.AddChild(_demoLabel);
        
        // Setup demo timer
        _demoTimer = new Timer
        {
            WaitTime = 3.0f,
            Autostart = false
        };
        AddChild(_demoTimer);
        _demoTimer.Timeout += NextDemo;
        
        // Set to ultra quality for demo
        if (_graphicsManager != null)
        {
            _graphicsManager.SetGraphicsQuality(CuttingEdgeGraphicsManager.GraphicsQuality.Ultra);
        }
        
        GD.Print("Graphics demo scene initialized");
    }
    
    private void StartDemo()
    {
        _currentDemo = 0;
        _demoTimer.Start();
        RunCurrentDemo();
    }
    
    private void NextDemo()
    {
        _currentDemo++;
        if (_currentDemo >= 8) // Loop back to start
            _currentDemo = 0;
        
        RunCurrentDemo();
    }
    
    private void RunCurrentDemo()
    {
        switch (_currentDemo)
        {
            case 0:
                DemoParticleEffects();
                break;
            case 1:
                DemoLightingModes();
                break;
            case 2:
                DemoImpactEffects();
                break;
            case 3:
                DemoEnergyEffects();
                break;
            case 4:
                DemoElementalEffects();
                break;
            case 5:
                DemoLightningFlash();
                break;
            case 6:
                DemoSpotlight();
                break;
            case 7:
                DemoEpicMoment();
                break;
        }
    }
    
    private void DemoParticleEffects()
    {
        _demoLabel.Text = "CUTTING-EDGE GRAPHICS DEMO\n\nParticle Systems Showcase\n• Advanced CPU Particles\n• Multiple Effect Types\n• Smart Memory Management";
        
        if (_particleSystem == null) return;
        
        // Create various particle effects
        _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Impact, new Vector2(-300, 0), 1.5f);
        _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Explosion, new Vector2(0, 0), 1.2f);
        _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Energy, new Vector2(300, 0), 1.0f);
        _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Sparks, new Vector2(-150, 150), 0.8f);
        _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Dust, new Vector2(150, 150), 0.6f);
        
        GD.Print("Demo: Particle Effects Showcase");
    }
    
    private void DemoLightingModes()
    {
        _demoLabel.Text = "CUTTING-EDGE GRAPHICS DEMO\n\nDynamic Lighting System\n• Real-time Lighting Effects\n• Dramatic Combat Modes\n• Sprite-based Compatibility";
        
        if (_lightingSystem == null) return;
        
        // Cycle through lighting modes
        var modes = new[] { 
            DynamicLightingSystem.LightingMode.Normal,
            DynamicLightingSystem.LightingMode.Intense,
            DynamicLightingSystem.LightingMode.Dramatic
        };
        
        var mode = modes[_currentDemo % modes.Length];
        _lightingSystem.SetLightingMode(mode, 1.0f);
        
        GD.Print($"Demo: Lighting Mode - {mode}");
    }
    
    private void DemoImpactEffects()
    {
        _demoLabel.Text = "CUTTING-EDGE GRAPHICS DEMO\n\nCombat Impact Effects\n• Multiple Impact Types\n• Dynamic Power Scaling\n• Integrated Lighting";
        
        if (_particleSystem == null) return;
        
        // Create powerful impact effects
        _particleSystem.CreateImpactEffect(new Vector2(-200, -100), 2.5f, Colors.Orange);
        _particleSystem.CreateImpactEffect(new Vector2(200, -100), 2.0f, Colors.Red);
        _particleSystem.CreateImpactEffect(new Vector2(0, 100), 1.5f, Colors.Yellow);
        
        GD.Print("Demo: Impact Effects");
    }
    
    private void DemoEnergyEffects()
    {
        _demoLabel.Text = "CUTTING-EDGE GRAPHICS DEMO\n\nEnergy & Special Move Effects\n• Energy Particles\n• Character Highlighting\n• Visual Feedback Systems";
        
        if (_particleSystem == null) return;
        
        // Create energy effects at different positions
        for (int i = 0; i < 5; i++)
        {
            var angle = i * Mathf.Pi * 2.0f / 5.0f;
            var position = new Vector2(Mathf.Cos(angle) * 200, Mathf.Sin(angle) * 200);
            _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Energy, position, 1.0f);
        }
        
        GD.Print("Demo: Energy Effects");
    }
    
    private void DemoElementalEffects()
    {
        _demoLabel.Text = "CUTTING-EDGE GRAPHICS DEMO\n\nElemental Effects System\n• Fire, Ice, Lightning Effects\n• Particle Type Variety\n• Elemental Combat Support";
        
        if (_particleSystem == null) return;
        
        // Create elemental effects
        _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Fire, new Vector2(-200, 0), 1.3f);
        _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Ice, new Vector2(0, 0), 1.3f);
        _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Lightning, new Vector2(200, 0), 1.3f);
        _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Wind, new Vector2(0, -150), 1.0f);
        
        GD.Print("Demo: Elemental Effects");
    }
    
    private void DemoLightningFlash()
    {
        _demoLabel.Text = "CUTTING-EDGE GRAPHICS DEMO\n\nLightning Flash Effects\n• Screen-wide Flash\n• Dramatic Lighting\n• Epic Moment Creation";
        
        if (_lightingSystem == null) return;
        
        // Create lightning flash
        _lightingSystem.CreateLightningFlash(2.5f, 0.3f);
        _lightingSystem.SetLightingMode(DynamicLightingSystem.LightingMode.EpicMoment, 0.2f);
        
        GD.Print("Demo: Lightning Flash");
    }
    
    private void DemoSpotlight()
    {
        _demoLabel.Text = "CUTTING-EDGE GRAPHICS DEMO\n\nSpotlight System\n• Dynamic Spotlights\n• Temporary Effects\n• Position-based Lighting";
        
        if (_lightingSystem == null) return;
        
        // Create moving spotlights
        _lightingSystem.CreateSpotlight(new Vector2(-300, -200), Colors.Red, 1.5f, 2.5f);
        _lightingSystem.CreateSpotlight(new Vector2(300, -200), Colors.Blue, 1.5f, 2.5f);
        _lightingSystem.CreateSpotlight(new Vector2(0, 200), Colors.Green, 1.5f, 2.5f);
        
        GD.Print("Demo: Spotlight Effects");
    }
    
    private void DemoEpicMoment()
    {
        _demoLabel.Text = "CUTTING-EDGE GRAPHICS DEMO\n\nEpic Moment Showcase\n• Maximum Visual Impact\n• Combined Effects Systems\n• Tournament-Ready Presentation";
        
        // Set epic lighting
        if (_lightingSystem != null)
        {
            _lightingSystem.SetLightingMode(DynamicLightingSystem.LightingMode.EpicMoment, 0.5f);
            _lightingSystem.CreateLightningFlash(3.0f, 0.4f);
        }
        
        // Create multiple combined effects
        if (_particleSystem != null)
        {
            _particleSystem.CreateImpactEffect(new Vector2(0, -100), 3.0f, Colors.Gold);
            _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Energy, new Vector2(0, 0), 2.0f);
            _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Lightning, new Vector2(-150, 50), 1.5f);
            _particleSystem.CreateParticleEffect(AdvancedParticleSystem.ParticleType.Lightning, new Vector2(150, 50), 1.5f);
        }
        
        GD.Print("Demo: Epic Moment - Maximum Visual Impact!");
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("ui_accept"))
        {
            NextDemo();
        }
        else if (@event.IsActionPressed("ui_cancel"))
        {
            GetTree().ChangeSceneToFile("res://scenes/main_menu/MainMenu.tscn");
        }
    }
}