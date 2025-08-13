using Godot;

/// <summary>
/// Enhanced Graphics Demo Scene showcasing Pseudo 2.5D effects
/// Demonstrates BlazBlue/Skullgirls-style visual enhancements
/// MIT Licensed - Free for commercial use
/// </summary>
public partial class Enhanced2D5DemoScene : Node2D
{
    private CinematicCameraSystem _cameraSystem;
    private int _currentDemo = 0;
    private readonly string[] _demoNames = {
        "Parallax Depth Demo",
        "Character Lighting Demo",
        "Impact Effects Demo",
        "Slash Effects Demo",
        "Magic Burst Demo",
        "Combo System Demo",
        "Camera Cinematics Demo"
    };
    
    private Label _titleLabel;
    private Label _instructionsLabel;
    private Label _demoCounterLabel;
    
    // Demo objects
    private Sprite2D _backgroundFar;
    private Sprite2D _backgroundMid;
    private Sprite2D _backgroundNear;
    private Sprite2D _character1;
    private Sprite2D _character2;
    
    public override void _Ready()
    {
        SetupDemoScene();
        SetupUI();
        StartDemo();
    }
    
    private void SetupDemoScene()
    {
        // Create camera system if not present
        _cameraSystem = GetNode<CinematicCameraSystem>("CinematicCamera") ?? CreateCameraSystem();
        
        // Create demo background layers
        CreateBackgroundLayers();
        CreateCharacters();
        
        GD.Print("Enhanced2D5DemoScene: Demo scene initialized");
    }
    
    private CinematicCameraSystem CreateCameraSystem()
    {
        var camera = new CinematicCameraSystem
        {
            Name = "CinematicCamera",
            Position = Vector2.Zero
        };
        AddChild(camera);
        return camera;
    }
    
    private void CreateBackgroundLayers()
    {
        // Create placeholder sprites for background layers
        _backgroundFar = CreateBackgroundSprite("BackgroundFar", new Color(0.3f, 0.4f, 0.6f), new Vector2(400, 300), -500);
        _backgroundMid = CreateBackgroundSprite("BackgroundMid", new Color(0.5f, 0.6f, 0.8f), new Vector2(350, 250), -200);
        _backgroundNear = CreateBackgroundSprite("BackgroundNear", new Color(0.7f, 0.8f, 0.9f), new Vector2(300, 200), -50);
        
        // Register for parallax
        if (Pseudo2D5Manager.Instance != null)
        {
            Pseudo2D5Manager.Instance.RegisterParallaxNode(_backgroundFar, -2.0f, Pseudo2D5Manager.DepthLayer.BackgroundFar);
            Pseudo2D5Manager.Instance.RegisterParallaxNode(_backgroundMid, -1.0f, Pseudo2D5Manager.DepthLayer.BackgroundMid);
            Pseudo2D5Manager.Instance.RegisterParallaxNode(_backgroundNear, -0.3f, Pseudo2D5Manager.DepthLayer.BackgroundNear);
        }
    }
    
    private Sprite2D CreateBackgroundSprite(string name, Color color, Vector2 size, int zIndex)
    {
        var sprite = new Sprite2D
        {
            Name = name,
            ZIndex = zIndex
        };
        
        // Create a simple colored rectangle texture
        var image = Image.CreateEmpty((int)size.X, (int)size.Y, false, Image.Format.Rgba8);
        image.Fill(color);
        var texture = ImageTexture.CreateFromImage(image);
        
        sprite.Texture = texture;
        AddChild(sprite);
        
        return sprite;
    }
    
    private void CreateCharacters()
    {
        // Create SF2HD character sprites - Ryu (red theme) and Ken (blue theme) 
        _character1 = CreateCharacterSprite("Ryu", "ryu", Colors.Red, new Vector2(-150, 0));
        _character2 = CreateCharacterSprite("Ken", "ken", Colors.Blue, new Vector2(150, 0));
        
        // Add to players group for camera tracking
        _character1.AddToGroup("players");
        _character2.AddToGroup("players");
    }
    
    private Sprite2D CreateCharacterSprite(string name, string characterId, Color accentColor, Vector2 position)
    {
        var sprite = new Sprite2D
        {
            Name = name,
            Position = position,
            ZIndex = 50
        };
        
        // Load SF2HD character sprite - try enhanced version first, fallback to original
        string enhancedSpritePath = $"res://assets/sprites/street_fighter_6/{characterId}/sprites/{characterId}_idle_enhanced.png";
        string originalSpritePath = $"res://assets/sprites/street_fighter_6/{characterId}/sprites/{characterId}_idle.png";
        
        string spritePath = ResourceLoader.Exists(enhancedSpritePath) ? enhancedSpritePath : originalSpritePath;
        
        if (ResourceLoader.Exists(spritePath))
        {
            var texture = GD.Load<Texture2D>(spritePath);
            if (texture != null)
            {
                sprite.Texture = texture;
                GD.Print($"Loaded SF2HD sprite for {characterId}: {spritePath} ({texture.GetSize()})");
            }
            else
            {
                GD.PrintErr($"Failed to load texture: {spritePath}");
                // Fallback to simple colored rectangle
                CreateFallbackTexture(sprite, accentColor);
            }
        }
        else
        {
            GD.PrintErr($"Sprite file not found: {spritePath}");
            // Fallback to simple colored rectangle
            CreateFallbackTexture(sprite, accentColor);
        }
        
        // Apply pseudo 2.5D character shader
        var shaderPath = "res://assets/shaders/combat/Pseudo2D5Character.gdshader";
        if (ResourceLoader.Exists(shaderPath))
        {
            var shader = GD.Load<Shader>(shaderPath);
            var material = new ShaderMaterial { Shader = shader };
            sprite.Material = material;
            
            // Set shader parameters
            material.SetShaderParameter("main_light_color", Colors.White);
            material.SetShaderParameter("rim_light_color", accentColor.Lerp(Colors.White, 0.5f));
            material.SetShaderParameter("lighting_intensity", 1.2f);
        }
        
        AddChild(sprite);
        return sprite;
    }
    
    private void CreateFallbackTexture(Sprite2D sprite, Color color)
    {
        // Create fallback colored rectangle if sprite loading fails
        var image = Image.CreateEmpty(64, 96, false, Image.Format.Rgba8);
        image.Fill(color);
        var texture = ImageTexture.CreateFromImage(image);
        sprite.Texture = texture;
        GD.PrintErr($"Using fallback colored rectangle for {sprite.Name}");
    }
    
    private void SetupUI()
    {
        // Create UI layer
        var uiLayer = new CanvasLayer
        {
            Name = "UI",
            Layer = 100
        };
        AddChild(uiLayer);
        
        // Title
        _titleLabel = new Label
        {
            Text = "PSEUDO 2.5D GRAPHICS DEMO\nBlazBlue/Skullgirls Style Enhancement",
            Position = new Vector2(20, 20),
            Size = new Vector2(800, 80),
            HorizontalAlignment = HorizontalAlignment.Center
        };
        uiLayer.AddChild(_titleLabel);
        
        // Instructions
        _instructionsLabel = new Label
        {
            Text = "SPACE: Next Demo • ESC: Return to Menu • ENTER: Toggle Effects",
            Position = new Vector2(20, 500),
            Size = new Vector2(800, 40),
            HorizontalAlignment = HorizontalAlignment.Center
        };
        uiLayer.AddChild(_instructionsLabel);
        
        // Demo counter
        _demoCounterLabel = new Label
        {
            Position = new Vector2(20, 100),
            Size = new Vector2(400, 40),
            HorizontalAlignment = HorizontalAlignment.Left
        };
        uiLayer.AddChild(_demoCounterLabel);
        
        UpdateDemoUI();
    }
    
    private void StartDemo()
    {
        RunCurrentDemo();
    }
    
    private void RunCurrentDemo()
    {
        switch (_currentDemo)
        {
            case 0:
                RunParallaxDemo();
                break;
            case 1:
                RunLightingDemo();
                break;
            case 2:
                RunImpactEffectsDemo();
                break;
            case 3:
                RunSlashEffectsDemo();
                break;
            case 4:
                RunMagicBurstDemo();
                break;
            case 5:
                RunComboDemo();
                break;
            case 6:
                RunCinematicsDemo();
                break;
        }
        
        UpdateDemoUI();
    }
    
    private void RunParallaxDemo()
    {
        GD.Print("Running parallax depth demo");
        
        // Animate camera to show parallax effect
        if (_cameraSystem != null)
        {
            var tween = CreateTween();
            tween.SetLoops();
            tween.TweenProperty(_cameraSystem, "global_position", new Vector2(-200, 0), 2.0f);
            tween.TweenProperty(_cameraSystem, "global_position", new Vector2(200, 0), 2.0f);
        }
    }
    
    private void RunLightingDemo()
    {
        GD.Print("Running character lighting demo");
        
        // Create dynamic lighting effects
        if (Pseudo2D5Manager.Instance != null)
        {
            var light1 = Pseudo2D5Manager.Instance.CreatePseudoLight(_character1.Position + new Vector2(-50, -50), Colors.Orange, 1.5f);
            var light2 = Pseudo2D5Manager.Instance.CreatePseudoLight(_character2.Position + new Vector2(50, -50), Colors.Cyan, 1.5f);
            
            light1.AnimatePulse = true;
            light2.AnimatePulse = true;
        }
    }
    
    private void RunImpactEffectsDemo()
    {
        GD.Print("Running impact effects demo");
        
        // Create repeating impact effects
        var timer = new Timer
        {
            WaitTime = 1.0f,
            Autostart = true
        };
        AddChild(timer);
        
        timer.Timeout += () =>
        {
            if (Enhanced2D5ParticleSystem.Instance != null)
            {
                var randomPos = new Vector2(
                    (float)(GD.Randf() - 0.5f) * 400.0f,
                    (float)(GD.Randf() - 0.5f) * 200.0f
                );
                
                Enhanced2D5ParticleSystem.Instance.CreateImpactEffect(
                    randomPos,
                    0.8f,
                    Colors.Orange,
                    Enhanced2D5ParticleSystem.ParticleType.Impact
                );
            }
        };
    }
    
    private void RunSlashEffectsDemo()
    {
        GD.Print("Running slash effects demo");
        
        var timer = new Timer
        {
            WaitTime = 1.5f,
            Autostart = true
        };
        AddChild(timer);
        
        timer.Timeout += () =>
        {
            if (Enhanced2D5ParticleSystem.Instance != null)
            {
                var startPos = new Vector2(-200, (float)(GD.Randf() - 0.5f) * 100);
                var endPos = new Vector2(200, (float)(GD.Randf() - 0.5f) * 100);
                
                Enhanced2D5ParticleSystem.Instance.CreateSlashEffect(startPos, endPos, Colors.Cyan, 15.0f);
            }
        };
    }
    
    private void RunMagicBurstDemo()
    {
        GD.Print("Running magic burst demo");
        
        var timer = new Timer
        {
            WaitTime = 2.0f,
            Autostart = true
        };
        AddChild(timer);
        
        timer.Timeout += () =>
        {
            if (Enhanced2D5ParticleSystem.Instance != null)
            {
                var randomPos = new Vector2(
                    (float)(GD.Randf() - 0.5f) * 300.0f,
                    (float)(GD.Randf() - 0.5f) * 150.0f
                );
                
                Enhanced2D5ParticleSystem.Instance.CreateMagicBurst(randomPos, Colors.Purple, 1.2f);
            }
        };
    }
    
    private void RunComboDemo()
    {
        GD.Print("Running combo effects demo");
        
        var comboCount = 1;
        var timer = new Timer
        {
            WaitTime = 0.5f,
            Autostart = true
        };
        AddChild(timer);
        
        timer.Timeout += () =>
        {
            if (Enhanced2D5ParticleSystem.Instance != null)
            {
                Enhanced2D5ParticleSystem.Instance.CreateComboEffect(
                    _character1.Position + new Vector2(30, -20),
                    comboCount,
                    Colors.Yellow
                );
                
                comboCount++;
                if (comboCount > 20) comboCount = 1;
            }
        };
    }
    
    private void RunCinematicsDemo()
    {
        GD.Print("Running cinematics demo");
        
        if (_cameraSystem != null)
        {
            var timer = new Timer
            {
                WaitTime = 3.0f,
                Autostart = true
            };
            AddChild(timer);
            
            timer.Timeout += () =>
            {
                var modes = new[] { 
                    CinematicCameraSystem.CinematicMode.CloseUp,
                    CinematicCameraSystem.CinematicMode.WideShot,
                    CinematicCameraSystem.CinematicMode.DramaticAngle,
                    CinematicCameraSystem.CinematicMode.Normal
                };
                
                var randomMode = modes[GD.Randi() % modes.Length];
                _cameraSystem.SetCinematicMode(randomMode, 0.8f);
                
                // Add screen shake
                _cameraSystem.AddScreenShake(0.5f, 0.3f);
            };
        }
    }
    
    private void UpdateDemoUI()
    {
        if (_demoCounterLabel != null)
        {
            _demoCounterLabel.Text = $"Demo {_currentDemo + 1}/{_demoNames.Length}: {_demoNames[_currentDemo]}";
        }
    }
    
    public override void _Input(InputEvent inputEvent)
    {
        if (inputEvent.IsActionPressed("ui_accept")) // Space
        {
            NextDemo();
        }
        else if (inputEvent.IsActionPressed("ui_cancel")) // Escape
        {
            ReturnToMainMenu();
        }
        else if (Input.IsActionJustPressed("ui_select")) // Enter
        {
            ToggleEffects();
        }
    }
    
    private void NextDemo()
    {
        // Clear current demo timers
        foreach (Node child in GetChildren())
        {
            if (child is Timer timer)
                timer.QueueFree();
        }
        
        _currentDemo = (_currentDemo + 1) % _demoNames.Length;
        RunCurrentDemo();
    }
    
    private void ReturnToMainMenu()
    {
        GetTree().ChangeSceneToFile("res://scenes/main_menu/MainMenu.tscn");
    }
    
    private void ToggleEffects()
    {
        if (Pseudo2D5Manager.Instance != null)
        {
            Pseudo2D5Manager.Instance.EnablePseudo2D5 = !Pseudo2D5Manager.Instance.EnablePseudo2D5;
            GD.Print($"Pseudo 2.5D effects: {Pseudo2D5Manager.Instance.EnablePseudo2D5}");
        }
    }
}