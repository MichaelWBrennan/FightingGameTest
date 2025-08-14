using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Procedural Stage Generator for 2D Fighting Game Stages
/// Generates FGC-approved stages dynamically using contextual logic
/// Inspired by RealtimeProceduralSpriteGenerator for consistent style integration
/// </summary>
public partial class ProceduralStageGenerator : Node
{
    public static ProceduralStageGenerator Instance { get; private set; }
    
    // Performance monitoring and caching
    private Dictionary<string, CachedStage> _stageCache = new();
    private int _maxCacheSize = 50;
    private float _cacheCleanupInterval = 10.0f; // seconds
    private float _lastCacheCleanup = 0.0f;
    
    // Procedural generation
    private ProceduralStageConfig _currentConfig;
    private Node _textureGenerator; // GDScript texture generator
    
    [Signal]
    public delegate void StageGeneratedEventHandler(string stageId);
    
    /// <summary>
    /// Cached stage entry for performance optimization
    /// </summary>
    public class CachedStage
    {
        public StageData StageData { get; set; }
        public float GenerationTime { get; set; }
        public int AccessCount { get; set; } = 0;
        public float LastAccessTime { get; set; }
        public string FGCPrecedents { get; set; } // Comma-separated list of FGC precedents used
        
        public CachedStage(StageData stageData, float genTime, string precedents)
        {
            StageData = stageData;
            GenerationTime = genTime;
            LastAccessTime = Time.GetTicksUsec() / 1000000.0f;
            FGCPrecedents = precedents;
        }
    }
    
    /// <summary>
    /// Configuration for procedural stage generation
    /// </summary>
    public class ProceduralStageConfig
    {
        public string Theme { get; set; } = "classic"; // classic, urban, dojo, tournament
        public string TimeOfDay { get; set; } = "day"; // day, night, sunset, dynamic
        public string Mood { get; set; } = "neutral"; // neutral, intense, dramatic, festive
        public float CrowdIntensity { get; set; } = 0.5f; // 0.0 (empty) to 1.0 (packed)
        public bool EnableParallax { get; set; } = true;
        public bool EnableDynamicLighting { get; set; } = true;
        public bool EnableWeatherEffects { get; set; } = true;
        public string CharacterContext { get; set; } = ""; // Character ID for contextual elements
        public Dictionary<string, object> CustomParameters { get; set; } = new();
    }
    
    public override void _Ready()
    {
        if (Instance != null)
        {
            QueueFree();
            return;
        }
        Instance = this;
        
        InitializeFGCStageElements();
        SetProcess(true);
        
        GD.Print("ProceduralStageGenerator initialized");
    }
    
    private void InitializeFGCStageElements()
    {
        // FGC stage elements are static and self-contained
        // No initialization needed as they are defined as static dictionaries
        GD.Print("FGC Stage Elements library loaded");
        GD.Print($"Available background elements: {FGCStageElements.BackgroundElements.Count}");
        GD.Print($"Available environmental effects: {FGCStageElements.EnvironmentalEffects.Count}");
        GD.Print($"Available audio elements: {FGCStageElements.AudioElements.Count}");
        GD.Print($"Available lighting configurations: {FGCStageElements.LightingConfigurations.Count}");
        GD.Print($"Available ground configurations: {FGCStageElements.GroundConfigurations.Count}");
        
        // Initialize texture generator
        var textureGeneratorScript = GD.Load<GDScript>("res://scripts/stages/ProceduralStageTextureGenerator.gd");
        _textureGenerator = textureGeneratorScript.New().AsGodotObject() as Node;
        AddChild(_textureGenerator);
        
        GD.Print("Procedural texture generator initialized");
    }
    
    public override void _Process(double delta)
    {
        var currentTime = Time.GetTicksUsec() / 1000000.0f;
        if (currentTime - _lastCacheCleanup > _cacheCleanupInterval)
        {
            CleanupCache();
            _lastCacheCleanup = currentTime;
        }
    }
    
    /// <summary>
    /// Generate a stage procedurally based on configuration and context
    /// </summary>
    public StageData GenerateStage(ProceduralStageConfig config, string customStageId = null)
    {
        var startTime = Time.GetTicksUsec() / 1000000.0f;
        var stageId = customStageId ?? GenerateStageId(config);
        
        // Check cache first
        var cacheKey = GenerateCacheKey(config, stageId);
        if (_stageCache.ContainsKey(cacheKey))
        {
            var cachedStage = _stageCache[cacheKey];
            cachedStage.AccessCount++;
            cachedStage.LastAccessTime = startTime;
            
            GD.Print($"Retrieved cached stage: {stageId} (Precedents: {cachedStage.FGCPrecedents})");
            return cachedStage.StageData;
        }
        
        _currentConfig = config;
        var precedentsUsed = new List<string>();
        
        // Generate stage data procedurally
        var stageData = new StageData
        {
            StageId = stageId,
            Name = GenerateStageName(config),
            Description = GenerateStageDescription(config),
            Theme = config.Theme,
            Atmosphere = config.Mood
        };
        
        // Generate core systems
        stageData.Lighting = GenerateLighting(config, precedentsUsed);
        stageData.Camera = GenerateCamera(config, precedentsUsed);
        stageData.Ground = GenerateGround(config, precedentsUsed);
        
        // Generate layered backgrounds with parallax (Guilty Gear Accent Core precedent)
        stageData.BackgroundLayers = GenerateBackgroundLayers(config, precedentsUsed);
        stageData.ForegroundLayers = GenerateForegroundLayers(config, precedentsUsed);
        
        // Generate particle effects and environmental details
        stageData.ParticleEffects = GenerateParticleEffects(config, precedentsUsed);
        stageData.Audio = GenerateAudioConfiguration(config, precedentsUsed);
        stageData.SpecialEffects = GenerateSpecialEffects(config, precedentsUsed);
        
        // Ensure competitive viability (Universal FGC standard)
        stageData.Balancing = new BalancingData
        {
            CompetitiveViable = true,
            Asymmetrical = false,
            Hazards = false,
            Interactables = false
        };
        precedentsUsed.Add("Universal FGC Standard: Competitive Viability");
        
        var endTime = Time.GetTicksUsec() / 1000000.0f;
        var generationTime = endTime - startTime;
        
        // Cache the generated stage
        var precedentsList = string.Join(", ", precedentsUsed.Distinct());
        _stageCache[cacheKey] = new CachedStage(stageData, generationTime, precedentsList);
        
        // Maintain cache size
        if (_stageCache.Count > _maxCacheSize)
        {
            CleanupOldCacheEntries();
        }
        
        EmitSignal(SignalName.StageGenerated, stageId);
        GD.Print($"Generated stage: {stageData.Name} ({generationTime:F3}s) - Precedents: {precedentsList}");
        
        return stageData;
    }
    
    /// <summary>
    /// Generate lighting configuration based on FGC precedents
    /// </summary>
    private StageLightingData GenerateLighting(ProceduralStageConfig config, List<string> precedentsUsed)
    {
        var lighting = new StageLightingData();
        
        switch (config.TimeOfDay.ToLower())
        {
            case "day":
                // Street Fighter II daytime stages precedent
                lighting.AmbientColor = new[] { 0.8f, 0.8f, 0.9f, 1.0f };
                lighting.MainLightColor = new[] { 1.0f, 0.95f, 0.8f, 1.0f };
                lighting.MainLightDirection = new[] { -0.3f, -0.8f, 0.4f };
                precedentsUsed.Add("Street Fighter II: Daytime Lighting");
                break;
                
            case "night":
                // Street Fighter II Chun-Li stage precedent
                lighting.AmbientColor = new[] { 0.2f, 0.2f, 0.3f, 1.0f };
                lighting.MainLightColor = new[] { 0.7f, 0.8f, 1.0f, 1.0f };
                lighting.MainLightDirection = new[] { 0.2f, -0.9f, 0.3f };
                lighting.Moonlighting = true;
                precedentsUsed.Add("Street Fighter II: Chun-Li Stage Night Lighting");
                break;
                
            case "sunset":
                // 3rd Strike Third Strike precedent
                lighting.AmbientColor = new[] { 0.6f, 0.4f, 0.3f, 1.0f };
                lighting.MainLightColor = new[] { 1.0f, 0.6f, 0.3f, 1.0f };
                lighting.MainLightDirection = new[] { 0.5f, -0.6f, 0.3f };
                precedentsUsed.Add("3rd Strike: Sunset Lighting");
                break;
                
            default: // dynamic
                // Tekken dynamic lighting precedent
                lighting.AmbientColor = new[] { 0.5f, 0.5f, 0.6f, 1.0f };
                lighting.MainLightColor = new[] { 0.9f, 0.9f, 1.0f, 1.0f };
                lighting.MainLightDirection = new[] { -0.2f, -0.7f, 0.4f };
                lighting.EnableDynamicLighting = true;
                precedentsUsed.Add("Tekken: Dynamic Lighting System");
                break;
        }
        
        // Mood adjustments
        switch (config.Mood.ToLower())
        {
            case "intense":
                // Enhance contrast for dramatic effect
                lighting.ShadowIntensity = 0.9f;
                lighting.Flickering = true;
                precedentsUsed.Add("KOF: Intense Mood Lighting");
                break;
                
            case "dramatic":
                // High contrast lighting
                lighting.ShadowIntensity = 0.95f;
                lighting.EnableDynamicLighting = true;
                precedentsUsed.Add("Guilty Gear Accent Core: Dramatic Lighting");
                break;
                
            case "festive":
                // Warmer, more saturated lighting
                for (int i = 0; i < 3; i++)
                {
                    lighting.AmbientColor[i] *= 1.1f;
                    lighting.MainLightColor[i] *= 1.05f;
                }
                precedentsUsed.Add("KOF: Festival Stage Lighting");
                break;
        }
        
        return lighting;
    }
    
    /// <summary>
    /// Generate camera bounds based on FGC standards
    /// </summary>
    private CameraData GenerateCamera(ProceduralStageConfig config, List<string> precedentsUsed)
    {
        // Standard FGC camera bounds based on Street Fighter II
        var camera = new CameraData
        {
            BoundaryLeft = -800f,
            BoundaryRight = 800f,
            BoundaryTop = -400f,
            BoundaryBottom = 200f,
            DefaultZoom = 1.0f,
            MaxZoom = 1.3f,
            MinZoom = 0.7f,
            FollowSmoothness = 0.08f
        };
        
        // Adjust based on theme
        switch (config.Theme.ToLower())
        {
            case "tournament":
                // Tekken tournament stage camera precedent
                camera.BoundaryLeft = -900f;
                camera.BoundaryRight = 900f;
                camera.MaxZoom = 1.2f;
                precedentsUsed.Add("Tekken: Tournament Stage Camera Bounds");
                break;
                
            case "dojo":
                // Street Fighter dojo stage precedent
                camera.BoundaryLeft = -600f;
                camera.BoundaryRight = 600f;
                camera.FollowSmoothness = 0.06f;
                precedentsUsed.Add("Street Fighter II: Dojo Stage Camera");
                break;
                
            case "urban":
                // 3rd Strike urban stage precedent
                camera.BoundaryLeft = -850f;
                camera.BoundaryRight = 850f;
                camera.BoundaryTop = -450f;
                precedentsUsed.Add("3rd Strike: Urban Stage Camera");
                break;
                
            default:
                precedentsUsed.Add("Street Fighter II: Standard Camera Bounds");
                break;
        }
        
        return camera;
    }
    
    /// <summary>
    /// Generate ground configuration with proper collision bounds
    /// </summary>
    private GroundData GenerateGround(ProceduralStageConfig config, List<string> precedentsUsed)
    {
        var ground = new GroundData
        {
            Height = 0f,
            Friction = 1.0f,
            Bounds = new GroundBounds
            {
                Left = -600f,
                Right = 600f
            }
        };
        
        switch (config.Theme.ToLower())
        {
            case "dojo":
                ground.Material = "wood";
                ground.Friction = 0.95f;
                precedentsUsed.Add("Street Fighter II: Dojo Wooden Floor");
                break;
                
            case "urban":
                ground.Material = "concrete";
                ground.Friction = 1.0f;
                precedentsUsed.Add("3rd Strike: Urban Concrete Surface");
                break;
                
            case "tournament":
                ground.Material = "tournament_mat";
                ground.Friction = 0.98f;
                precedentsUsed.Add("Tekken: Tournament Mat Surface");
                break;
                
            default:
                ground.Material = "stone";
                ground.Friction = 1.0f;
                precedentsUsed.Add("Street Fighter II: Stone Surface");
                break;
        }
        
        return ground;
    }
    
    /// <summary>
    /// Generate background layers with proper parallax depth
    /// </summary>
    private List<LayerData> GenerateBackgroundLayers(ProceduralStageConfig config, List<string> precedentsUsed)
    {
        var layers = new List<LayerData>();
        
        // Generate layers based on Guilty Gear Accent Core parallax system
        precedentsUsed.Add("Guilty Gear Accent Core: Multi-layer Parallax System");
        
        // Far background (sky/horizon)
        layers.Add(CreateSkyLayer(config));
        
        // Mid background (distant elements)
        layers.Add(CreateDistantBackgroundLayer(config));
        
        // Near background (main stage elements)
        layers.Add(CreateMainBackgroundLayer(config));
        
        // Ground layer
        layers.Add(CreateGroundLayer(config));
        
        return layers;
    }
    
    /// <summary>
    /// Generate foreground layers that don't obstruct gameplay
    /// </summary>
    private List<LayerData> GenerateForegroundLayers(ProceduralStageConfig config, List<string> precedentsUsed)
    {
        var layers = new List<LayerData>();
        
        // Only add subtle foreground elements that don't obstruct hitboxes
        // Following Street Fighter II precedent of clear playfield
        precedentsUsed.Add("Street Fighter II: Clear Playfield Standard");
        
        if (config.Theme == "urban" && config.CrowdIntensity > 0.3f)
        {
            // 3rd Strike style subtle foreground crowd elements
            layers.Add(new LayerData
            {
                Name = "subtle_crowd_fg",
                Depth = 0.5f,
                ParallaxMultiplier = 1.1f,
                TexturePath = GetProceduralTexturePath("crowd_fg", config),
                Position = new[] { 0f, 20f },
                Scale = new[] { 0.8f, 0.8f },
                Tint = new[] { 0.7f, 0.7f, 0.8f, 0.6f }
            });
            precedentsUsed.Add("3rd Strike: Subtle Foreground Crowd");
        }
        
        return layers;
    }
    
    /// <summary>
    /// Generate particle effects based on theme and mood
    /// </summary>
    private List<ParticleEffectData> GenerateParticleEffects(ProceduralStageConfig config, List<string> precedentsUsed)
    {
        var effects = new List<ParticleEffectData>();
        
        // Base ambient particles
        if (config.EnableWeatherEffects)
        {
            switch (config.Theme.ToLower())
            {
                case "dojo":
                    // Street Fighter dojo dust motes
                    effects.Add(CreateDustMotesEffect());
                    precedentsUsed.Add("Street Fighter II: Dojo Dust Particles");
                    break;
                    
                case "urban":
                    // 3rd Strike urban atmosphere
                    effects.Add(CreateUrbanAtmosphereEffect());
                    precedentsUsed.Add("3rd Strike: Urban Atmospheric Particles");
                    break;
                    
                case "tournament":
                    // Tekken tournament atmosphere
                    effects.Add(CreateTournamentAtmosphereEffect());
                    precedentsUsed.Add("Tekken: Tournament Stage Atmosphere");
                    break;
            }
        }
        
        return effects;
    }
    
    /// <summary>
    /// Generate audio configuration with proper mixing
    /// </summary>
    private AudioData GenerateAudioConfiguration(ProceduralStageConfig config, List<string> precedentsUsed)
    {
        var audio = new AudioData
        {
            AmbientVolume = 0.3f,
            MusicVolume = 0.6f
        };
        
        // Set reverb based on theme (KOF audio design precedent)
        switch (config.Theme.ToLower())
        {
            case "dojo":
                audio.Reverb = new ReverbData { RoomSize = 0.6f, Damping = 0.4f, WetLevel = 0.3f };
                precedentsUsed.Add("KOF: Dojo Audio Reverb");
                break;
                
            case "tournament":
                audio.Reverb = new ReverbData { RoomSize = 0.9f, Damping = 0.2f, WetLevel = 0.7f };
                precedentsUsed.Add("KOF: Large Arena Audio Reverb");
                break;
                
            case "urban":
                audio.Reverb = new ReverbData { RoomSize = 0.8f, Damping = 0.3f, WetLevel = 0.5f };
                precedentsUsed.Add("3rd Strike: Urban Audio Ambience");
                break;
        }
        
        return audio;
    }
    
    /// <summary>
    /// Generate special effects for combat interactions
    /// </summary>
    private List<SpecialEffectData> GenerateSpecialEffects(ProceduralStageConfig config, List<string> precedentsUsed)
    {
        var effects = new List<SpecialEffectData>();
        
        // Universal FGC special effects
        effects.Add(new SpecialEffectData
        {
            Name = "super_flash",
            Trigger = "super_move",
            Effect = "screen_flash",
            Duration = 0.2f,
            Color = new[] { 1.0f, 1.0f, 1.0f, 0.8f }
        });
        precedentsUsed.Add("Street Fighter II: Super Move Screen Flash");
        
        // Theme-specific effects
        switch (config.Theme.ToLower())
        {
            case "tournament":
                effects.Add(new SpecialEffectData
                {
                    Name = "crowd_cheer",
                    Trigger = "combo_hit",
                    Effect = "audio_burst",
                    Duration = 1.0f,
                    Intensity = config.CrowdIntensity
                });
                precedentsUsed.Add("Tekken: Tournament Crowd Reactions");
                break;
        }
        
        return effects;
    }
    
    // Helper methods for layer generation
    private LayerData CreateSkyLayer(ProceduralStageConfig config)
    {
        var skyColors = config.TimeOfDay switch
        {
            "day" => new[] { 0.5f, 0.7f, 1.0f, 1.0f },
            "night" => new[] { 0.1f, 0.1f, 0.3f, 1.0f },
            "sunset" => new[] { 1.0f, 0.6f, 0.3f, 1.0f },
            _ => new[] { 0.6f, 0.6f, 0.8f, 1.0f }
        };
        
        return new LayerData
        {
            Name = "procedural_sky",
            Depth = -4.0f,
            ParallaxMultiplier = -0.05f,
            TexturePath = GetProceduralTexturePath("sky", config),
            Position = new[] { 0f, -400f },
            Scale = new[] { 2.5f, 2.5f },
            Tint = skyColors
        };
    }
    
    private LayerData CreateDistantBackgroundLayer(ProceduralStageConfig config)
    {
        return new LayerData
        {
            Name = "procedural_distant_bg",
            Depth = -2.5f,
            ParallaxMultiplier = -0.3f,
            TexturePath = GetProceduralTexturePath("distant_bg", config),
            Position = new[] { 0f, -200f },
            Scale = new[] { 1.8f, 1.8f },
            Tint = new[] { 0.6f, 0.7f, 0.8f, 0.9f },
            AtmosphericPerspective = true
        };
    }
    
    private LayerData CreateMainBackgroundLayer(ProceduralStageConfig config)
    {
        return new LayerData
        {
            Name = "procedural_main_bg",
            Depth = -1.0f,
            ParallaxMultiplier = -1.0f,
            TexturePath = GetProceduralTexturePath("main_bg", config),
            Position = new[] { 0f, -50f },
            Scale = new[] { 1.0f, 1.0f },
            Tint = new[] { 1.0f, 1.0f, 1.0f, 1.0f },
            EnableLighting = true,
            ShadowCasting = true
        };
    }
    
    private LayerData CreateGroundLayer(ProceduralStageConfig config)
    {
        return new LayerData
        {
            Name = "procedural_ground",
            Depth = 0.0f,
            ParallaxMultiplier = -1.2f,
            TexturePath = GetProceduralTexturePath("ground", config),
            Position = new[] { 0f, 80f },
            Scale = new[] { 1.0f, 1.0f },
            Tint = new[] { 0.9f, 0.9f, 1.0f, 1.0f }
        };
    }
    
    // Particle effect generators
    private ParticleEffectData CreateDustMotesEffect()
    {
        return new ParticleEffectData
        {
            Name = "dojo_dust_motes",
            Type = "ambient",
            Position = new[] { 0f, -100f },
            ParticleType = "Dust",
            Emission = new EmissionData { Amount = 30, Rate = 1.0f },
            Properties = new ParticlePropertiesData
            {
                Scale = new[] { 0.2f, 0.6f },
                Speed = new[] { 5f, 15f },
                Lifetime = new[] { 8.0f, 12.0f },
                Color = new[] { 1.0f, 1.0f, 0.9f, 0.1f },
                FloatingMotion = true
            }
        };
    }
    
    private ParticleEffectData CreateUrbanAtmosphereEffect()
    {
        return new ParticleEffectData
        {
            Name = "urban_atmosphere",
            Type = "ambient",
            Position = new[] { 0f, -150f },
            ParticleType = "Mist",
            Emission = new EmissionData { Amount = 40, Rate = 2.0f },
            Properties = new ParticlePropertiesData
            {
                Scale = new[] { 1.0f, 2.5f },
                Speed = new[] { 10f, 25f },
                Lifetime = new[] { 5.0f, 8.0f },
                Color = new[] { 0.8f, 0.9f, 1.0f, 0.05f }
            }
        };
    }
    
    private ParticleEffectData CreateTournamentAtmosphereEffect()
    {
        return new ParticleEffectData
        {
            Name = "tournament_atmosphere",
            Type = "ambient", 
            Position = new[] { 0f, -200f },
            ParticleType = "LightRay",
            Emission = new EmissionData { Amount = 20, Rate = 0.5f },
            Properties = new ParticlePropertiesData
            {
                Scale = new[] { 0.8f, 1.5f },
                Speed = new[] { 2f, 8f },
                Lifetime = new[] { 10.0f, 15.0f },
                Color = new[] { 1.0f, 1.0f, 0.9f, 0.15f }
            }
        };
    }
    
    // Utility methods
    private string GenerateStageId(ProceduralStageConfig config)
    {
        var baseId = $"proc_{config.Theme}_{config.TimeOfDay}_{config.Mood}";
        if (!string.IsNullOrEmpty(config.CharacterContext))
        {
            baseId += $"_{config.CharacterContext}";
        }
        return baseId;
    }
    
    private string GenerateStageName(ProceduralStageConfig config)
    {
        var themeNames = new Dictionary<string, string>
        {
            ["classic"] = "Classic Arena",
            ["urban"] = "Urban Battleground", 
            ["dojo"] = "Training Dojo",
            ["tournament"] = "Tournament Stage"
        };
        
        var timeModifiers = new Dictionary<string, string>
        {
            ["day"] = "Daytime",
            ["night"] = "Midnight",
            ["sunset"] = "Sunset",
            ["dynamic"] = "Dynamic"
        };
        
        var baseName = themeNames.GetValueOrDefault(config.Theme, "Arena");
        var timeModifier = timeModifiers.GetValueOrDefault(config.TimeOfDay, "");
        
        return $"{timeModifier} {baseName}".Trim();
    }
    
    private string GenerateStageDescription(ProceduralStageConfig config)
    {
        return $"A procedurally generated {config.Theme} stage set during {config.TimeOfDay} with {config.Mood} atmosphere, designed for competitive FGC gameplay.";
    }
    
    private string GetProceduralTexturePath(string layerType, ProceduralStageConfig config)
    {
        // Generate texture procedurally using the texture generator
        if (_textureGenerator != null)
        {
            try
            {
                var paletteParam = config.CustomParameters.ContainsKey("primary_palette") 
                    ? config.CustomParameters["primary_palette"].ToString() 
                    : "default";
                    
                var texture = _textureGenerator.Call("generate_stage_texture", 
                    layerType, config.Theme, config.TimeOfDay, paletteParam, "medium");
                    
                if (texture.VariantType != Variant.Type.Nil)
                {
                    // In a full implementation, we would save the texture and return its path
                    // For now, we'll use a placeholder that indicates procedural generation
                    return $"procedural://{config.Theme}_{layerType}_{config.TimeOfDay}_{paletteParam}";
                }
            }
            catch (Exception e)
            {
                GD.PrintErr($"Failed to generate procedural texture: {e.Message}");
            }
        }
        
        // Fallback to placeholder paths
        return $"res://assets/stages/procedural/{config.Theme}_{layerType}_{config.TimeOfDay}.png";
    }
    
    private string GenerateCacheKey(ProceduralStageConfig config, string stageId)
    {
        return $"{stageId}_{config.CrowdIntensity:F1}_{config.EnableParallax}_{config.EnableDynamicLighting}_{config.EnableWeatherEffects}";
    }
    
    /// <summary>
    /// Get performance and caching statistics
    /// </summary>
    public Dictionary<string, object> GetPerformanceStats()
    {
        var avgGenTime = 0.0f;
        var hitRatio = 0.0f;
        
        if (_stageCache.Count > 0)
        {
            avgGenTime = _stageCache.Values.Average(c => c.GenerationTime);
            hitRatio = _stageCache.Values.Sum(c => c.AccessCount) / (float)_stageCache.Values.Sum(c => Math.Max(1, c.AccessCount));
        }
        
        return new Dictionary<string, object>
        {
            ["cache_size"] = _stageCache.Count,
            ["cache_hit_ratio"] = hitRatio,
            ["avg_generation_time"] = avgGenTime,
            ["max_cache_size"] = _maxCacheSize
        };
    }
    
    private void CleanupCache()
    {
        var currentTime = Time.GetTicksUsec() / 1000000.0f;
        var keysToRemove = _stageCache
            .Where(kvp => currentTime - kvp.Value.LastAccessTime > 300.0f) // Remove entries older than 5 minutes
            .Select(kvp => kvp.Key)
            .ToList();
            
        foreach (var key in keysToRemove)
        {
            _stageCache.Remove(key);
        }
        
        if (keysToRemove.Count > 0)
        {
            GD.Print($"Cleaned up {keysToRemove.Count} cached stages");
        }
    }
    
    private void CleanupOldCacheEntries()
    {
        // Remove least recently used entries
        var entriesToRemove = _stageCache
            .OrderBy(kvp => kvp.Value.LastAccessTime)
            .Take(_stageCache.Count - (int)(_maxCacheSize * 0.8f))
            .Select(kvp => kvp.Key)
            .ToList();
            
        foreach (var key in entriesToRemove)
        {
            _stageCache.Remove(key);
        }
    }
    
    public override void _ExitTree()
    {
        Instance = null;
    }
}