using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Library of FGC-approved stage elements with canonical precedents
/// Each element is tagged with its source from respected competitive stages
/// </summary>
public static class FGCStageElements
{
    /// <summary>
    /// FGC stage element with precedent information
    /// </summary>
    public class StageElement
    {
        public string Name { get; set; }
        public string Category { get; set; } // background, foreground, effect, audio, lighting
        public string FGCPrecedent { get; set; } // Source game and stage
        public string Description { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();
        public bool CompetitiveViable { get; set; } = true;
        public string[] RequiredThemes { get; set; } = Array.Empty<string>();
        public float VisualImpact { get; set; } = 0.5f; // 0.0 = subtle, 1.0 = dramatic
    }
    
    // Core FGC design principles from respected stages
    public static readonly Dictionary<string, StageElement> CorePrinciples = new()
    {
        ["clear_playfield"] = new StageElement
        {
            Name = "Clear Playfield",
            Category = "design_principle",
            FGCPrecedent = "Street Fighter II (All Stages)",
            Description = "Maintain clear visual separation between playfield and background elements to ensure hitbox visibility",
            CompetitiveViable = true,
            Properties = new Dictionary<string, object>
            {
                ["min_contrast_ratio"] = 3.0f,
                ["no_hitbox_obstruction"] = true,
                ["clear_ground_plane"] = true
            }
        },
        
        ["balanced_visual_weight"] = new StageElement
        {
            Name = "Balanced Visual Weight",
            Category = "design_principle", 
            FGCPrecedent = "3rd Strike (All Stages)",
            Description = "Distribute visual elements evenly to avoid creating advantageous positions",
            CompetitiveViable = true,
            Properties = new Dictionary<string, object>
            {
                ["symmetrical_design"] = true,
                ["no_visual_distractions"] = true,
                ["balanced_color_distribution"] = true
            }
        },
        
        ["proper_depth_layering"] = new StageElement
        {
            Name = "Proper Depth Layering",
            Category = "design_principle",
            FGCPrecedent = "Guilty Gear Accent Core (All Stages)",
            Description = "Use parallax scrolling and depth cues to create visual depth without gameplay interference",
            CompetitiveViable = true,
            Properties = new Dictionary<string, object>
            {
                ["parallax_layers"] = true,
                ["atmospheric_perspective"] = true,
                ["clear_depth_separation"] = true
            }
        }
    };
    
    // Background elements from respected FGC stages
    public static readonly Dictionary<string, StageElement> BackgroundElements = new()
    {
        // Street Fighter II elements
        ["sf2_sky_gradient"] = new StageElement
        {
            Name = "Sky Gradient",
            Category = "background",
            FGCPrecedent = "Street Fighter II - Ryu Stage",
            Description = "Simple, non-distracting sky gradient that provides clean background",
            RequiredThemes = new[] { "classic", "dojo", "outdoor" },
            Properties = new Dictionary<string, object>
            {
                ["gradient_type"] = "vertical",
                ["color_stops"] = new[] { "sky_blue", "horizon_white" },
                ["parallax_multiplier"] = -0.05f
            }
        },
        
        ["sf2_mountain_silhouette"] = new StageElement
        {
            Name = "Mountain Silhouette",
            Category = "background",
            FGCPrecedent = "Street Fighter II - Ryu Stage",
            Description = "Distant mountain silhouettes that provide depth without distraction",
            RequiredThemes = new[] { "classic", "outdoor", "dojo" },
            Properties = new Dictionary<string, object>
            {
                ["depth"] = -3.0f,
                ["parallax_multiplier"] = -0.2f,
                ["opacity"] = 0.7f,
                ["color_tint"] = "atmospheric_blue"
            }
        },
        
        ["sf2_temple_architecture"] = new StageElement
        {
            Name = "Temple Architecture",
            Category = "background",
            FGCPrecedent = "Street Fighter II - Ryu Stage",
            Description = "Traditional temple structures providing cultural context",
            RequiredThemes = new[] { "dojo", "classic", "traditional" },
            Properties = new Dictionary<string, object>
            {
                ["architectural_style"] = "japanese_temple",
                ["depth"] = -1.5f,
                ["parallax_multiplier"] = -0.8f
            }
        },
        
        // 3rd Strike elements
        ["3s_urban_skyline"] = new StageElement
        {
            Name = "Urban Skyline",
            Category = "background",
            FGCPrecedent = "3rd Strike - Alex NY Stage", 
            Description = "Modern urban skyline with proper atmospheric perspective",
            RequiredThemes = new[] { "urban", "modern", "street" },
            Properties = new Dictionary<string, object>
            {
                ["depth"] = -2.5f,
                ["parallax_multiplier"] = -0.3f,
                ["atmospheric_perspective"] = true,
                ["lighting_integration"] = true
            }
        },
        
        ["3s_street_details"] = new StageElement
        {
            Name = "Street Details",
            Category = "background",
            FGCPrecedent = "3rd Strike - Dudley Stage",
            Description = "Urban street elements that add character without obstruction",
            RequiredThemes = new[] { "urban", "street" },
            Properties = new Dictionary<string, object>
            {
                ["element_types"] = new[] { "street_lamps", "trash_cans", "graffiti" },
                ["depth"] = -1.0f,
                ["parallax_multiplier"] = -1.0f,
                ["interaction_safe"] = true
            }
        },
        
        // Guilty Gear Accent Core elements
        ["ggac_layered_background"] = new StageElement
        {
            Name = "Multi-Layer Background",
            Category = "background",
            FGCPrecedent = "Guilty Gear Accent Core - May Ship Deck",
            Description = "Complex layered backgrounds with extensive parallax scrolling",
            RequiredThemes = new[] { "fantasy", "dramatic", "dynamic" },
            Properties = new Dictionary<string, object>
            {
                ["layer_count"] = 5,
                ["parallax_range"] = new[] { -0.05f, -1.2f },
                ["dynamic_elements"] = true,
                ["atmospheric_effects"] = true
            }
        },
        
        ["ggac_dramatic_lighting"] = new StageElement
        {
            Name = "Dramatic Lighting",
            Category = "lighting",
            FGCPrecedent = "Guilty Gear Accent Core - Sol Stage",
            Description = "High-contrast lighting that enhances mood without obscuring gameplay",
            Properties = new Dictionary<string, object>
            {
                ["contrast_ratio"] = 4.0f,
                ["shadow_intensity"] = 0.8f,
                ["dynamic_shadows"] = true,
                ["player_visibility_maintained"] = true
            }
        },
        
        // King of Fighters elements
        ["kof_crowd_system"] = new StageElement
        {
            Name = "Crowd System",
            Category = "background",
            FGCPrecedent = "KOF '98 - Stadium Stage",
            Description = "Animated crowd that reacts to combat without disrupting gameplay",
            RequiredThemes = new[] { "tournament", "stadium", "arena" },
            Properties = new Dictionary<string, object>
            {
                ["crowd_density"] = "variable",
                ["animation_intensity"] = "combat_reactive",
                ["visual_position"] = "background_only",
                ["audio_integration"] = true
            }
        },
        
        ["kof_banner_system"] = new StageElement
        {
            Name = "Banner System", 
            Category = "background",
            FGCPrecedent = "KOF '98 - Stadium Stage",
            Description = "Decorative banners and flags that add tournament atmosphere",
            RequiredThemes = new[] { "tournament", "festival", "arena" },
            Properties = new Dictionary<string, object>
            {
                ["banner_types"] = new[] { "tournament_flags", "sponsor_banners", "decorative_streamers" },
                ["animation"] = "subtle_wave",
                ["depth"] = -1.5f,
                ["competitive_neutral"] = true
            }
        },
        
        // Tekken elements
        ["tekken_arena_lighting"] = new StageElement
        {
            Name = "Arena Lighting",
            Category = "lighting",
            FGCPrecedent = "Tekken 3 - King of Iron Fist Tournament",
            Description = "Professional tournament lighting that maintains character visibility",
            RequiredThemes = new[] { "tournament", "arena", "professional" },
            Properties = new Dictionary<string, object>
            {
                ["lighting_type"] = "professional_arena",
                ["intensity"] = 1.0f,
                ["shadow_softness"] = 0.3f,
                ["player_rim_lighting"] = true
            }
        },
        
        ["tekken_floor_projection"] = new StageElement
        {
            Name = "Floor Projection",
            Category = "ground",
            FGCPrecedent = "Tekken - Tournament Stages",
            Description = "Tournament floor with clear boundaries and professional appearance",
            RequiredThemes = new[] { "tournament", "professional" },
            Properties = new Dictionary<string, object>
            {
                ["surface_type"] = "tournament_mat",
                ["boundary_marking"] = "subtle_lines",
                ["reflectivity"] = 0.1f,
                ["traction"] = 1.0f
            }
        }
    };
    
    // Particle and environmental effects
    public static readonly Dictionary<string, StageElement> EnvironmentalEffects = new()
    {
        ["sf2_dust_motes"] = new StageElement
        {
            Name = "Dust Motes",
            Category = "particles",
            FGCPrecedent = "Street Fighter II - Dojo Stages",
            Description = "Subtle dust particles that add atmosphere without distraction",
            RequiredThemes = new[] { "dojo", "indoor", "traditional" },
            VisualImpact = 0.1f,
            Properties = new Dictionary<string, object>
            {
                ["particle_count"] = "low",
                ["movement"] = "floating",
                ["opacity"] = 0.1f,
                ["size_range"] = new[] { 0.2f, 0.6f }
            }
        },
        
        ["3s_urban_atmosphere"] = new StageElement
        {
            Name = "Urban Atmosphere",
            Category = "particles",
            FGCPrecedent = "3rd Strike - Urban Stages",
            Description = "Subtle atmospheric haze and light particles for urban environments",
            RequiredThemes = new[] { "urban", "street", "modern" },
            VisualImpact = 0.2f,
            Properties = new Dictionary<string, object>
            {
                ["particle_type"] = "atmospheric_haze",
                ["density"] = "low",
                ["color_tint"] = "urban_gray",
                ["movement"] = "slow_drift"
            }
        },
        
        ["kof_celebration_effects"] = new StageElement
        {
            Name = "Celebration Effects",
            Category = "effects",
            FGCPrecedent = "KOF - Victory Animations",
            Description = "Victory celebration effects that trigger after round completion",
            RequiredThemes = new[] { "tournament", "festive" },
            VisualImpact = 0.8f,
            Properties = new Dictionary<string, object>
            {
                ["trigger"] = "round_victory",
                ["effect_type"] = "confetti_burst",
                ["duration"] = 2.0f,
                ["audio_integration"] = true
            }
        }
    };
    
    // Audio elements with FGC precedents
    public static readonly Dictionary<string, StageElement> AudioElements = new()
    {
        ["sf2_dojo_ambience"] = new StageElement
        {
            Name = "Dojo Ambience",
            Category = "audio",
            FGCPrecedent = "Street Fighter II - Ryu Stage",
            Description = "Subtle dojo ambience that doesn't interfere with audio cues",
            RequiredThemes = new[] { "dojo", "traditional" },
            Properties = new Dictionary<string, object>
            {
                ["ambient_volume"] = 0.2f,
                ["frequency_range"] = "low_mid",
                ["reverb_type"] = "small_room",
                ["audio_cue_preservation"] = true
            }
        },
        
        ["kof_crowd_reactions"] = new StageElement
        {
            Name = "Crowd Reactions",
            Category = "audio",
            FGCPrecedent = "KOF '98 - Tournament Stages", 
            Description = "Dynamic crowd audio that reacts to combat intensity",
            RequiredThemes = new[] { "tournament", "arena", "stadium" },
            Properties = new Dictionary<string, object>
            {
                ["reaction_triggers"] = new[] { "super_move", "combo_hit", "round_end" },
                ["volume_scaling"] = "combat_intensity",
                ["frequency_ducking"] = true,
                ["competitive_audio_priority"] = true
            }
        },
        
        ["tekken_tournament_audio"] = new StageElement
        {
            Name = "Tournament Audio",
            Category = "audio",
            FGCPrecedent = "Tekken - Tournament Stages",
            Description = "Professional tournament audio environment with proper mixing",
            RequiredThemes = new[] { "tournament", "professional" },
            Properties = new Dictionary<string, object>
            {
                ["reverb_profile"] = "large_arena",
                ["ambient_level"] = 0.3f,
                ["audio_clarity"] = "maximum",
                ["announcer_integration"] = true
            }
        }
    };
    
    // Lighting configurations from FGC stages
    public static readonly Dictionary<string, StageElement> LightingConfigurations = new()
    {
        ["sf2_daytime_lighting"] = new StageElement
        {
            Name = "SF2 Daytime Lighting",
            Category = "lighting",
            FGCPrecedent = "Street Fighter II - Daytime Stages",
            Description = "Classic daytime lighting with clear character visibility",
            Properties = new Dictionary<string, object>
            {
                ["ambient_color"] = new[] { 0.8f, 0.8f, 0.9f, 1.0f },
                ["main_light_color"] = new[] { 1.0f, 0.95f, 0.8f, 1.0f },
                ["shadow_intensity"] = 0.6f,
                ["character_contrast"] = "high"
            }
        },
        
        ["3s_urban_lighting"] = new StageElement
        {
            Name = "3S Urban Lighting",
            Category = "lighting",
            FGCPrecedent = "3rd Strike - Urban Night Stages",
            Description = "Urban night lighting with street lamp and neon influences",
            Properties = new Dictionary<string, object>
            {
                ["ambient_color"] = new[] { 0.3f, 0.4f, 0.6f, 1.0f },
                ["accent_lights"] = true,
                ["color_variety"] = "controlled_neon",
                ["mood"] = "atmospheric_urban"
            }
        },
        
        ["ggac_dramatic_lighting"] = new StageElement
        {
            Name = "GGAC Dramatic Lighting", 
            Category = "lighting",
            FGCPrecedent = "Guilty Gear Accent Core - Dramatic Stages",
            Description = "High-contrast dramatic lighting that maintains competitive viability",
            Properties = new Dictionary<string, object>
            {
                ["contrast_ratio"] = 4.5f,
                ["shadow_intensity"] = 0.85f,
                ["rim_lighting"] = true,
                ["dramatic_mood"] = true,
                ["competitive_compliance"] = true
            }
        }
    };
    
    // Stage-specific ground configurations
    public static readonly Dictionary<string, StageElement> GroundConfigurations = new()
    {
        ["sf2_dojo_floor"] = new StageElement
        {
            Name = "Dojo Wooden Floor",
            Category = "ground",
            FGCPrecedent = "Street Fighter II - Ryu Stage",
            Description = "Traditional wooden dojo flooring with proper traction",
            RequiredThemes = new[] { "dojo", "traditional" },
            Properties = new Dictionary<string, object>
            {
                ["surface_material"] = "wood",
                ["friction_coefficient"] = 0.95f,
                ["visual_texture"] = "wood_planks",
                ["audio_footsteps"] = "wood"
            }
        },
        
        ["3s_concrete_street"] = new StageElement
        {
            Name = "Concrete Street",
            Category = "ground",
            FGCPrecedent = "3rd Strike - Urban Stages",
            Description = "Urban concrete surface with street markings",
            RequiredThemes = new[] { "urban", "street" },
            Properties = new Dictionary<string, object>
            {
                ["surface_material"] = "concrete",
                ["friction_coefficient"] = 1.0f,
                ["street_markings"] = "subtle",
                ["wear_patterns"] = "realistic"
            }
        },
        
        ["tekken_tournament_mat"] = new StageElement
        {
            Name = "Tournament Mat",
            Category = "ground",
            FGCPrecedent = "Tekken - Tournament Stages",
            Description = "Professional tournament fighting surface",
            RequiredThemes = new[] { "tournament", "professional" },
            Properties = new Dictionary<string, object>
            {
                ["surface_material"] = "tournament_mat",
                ["friction_coefficient"] = 0.98f,
                ["boundary_lines"] = "professional",
                ["logo_integration"] = "tournament"
            }
        }
    };
    
    // Methods to query elements by criteria
    public static List<StageElement> GetElementsByTheme(string theme)
    {
        var elements = new List<StageElement>();
        
        foreach (var category in new[] { BackgroundElements, EnvironmentalEffects, AudioElements, LightingConfigurations, GroundConfigurations })
        {
            foreach (var element in category.Values)
            {
                if (element.RequiredThemes.Contains(theme) || element.RequiredThemes.Length == 0)
                {
                    elements.Add(element);
                }
            }
        }
        
        return elements;
    }
    
    public static List<StageElement> GetElementsByCategory(string category)
    {
        var elements = new List<StageElement>();
        
        foreach (var elementDict in new[] { BackgroundElements, EnvironmentalEffects, AudioElements, LightingConfigurations, GroundConfigurations })
        {
            foreach (var element in elementDict.Values)
            {
                if (element.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
                {
                    elements.Add(element);
                }
            }
        }
        
        return elements;
    }
    
    public static List<StageElement> GetElementsByPrecedent(string precedentGame)
    {
        var elements = new List<StageElement>();
        
        foreach (var elementDict in new[] { BackgroundElements, EnvironmentalEffects, AudioElements, LightingConfigurations, GroundConfigurations })
        {
            foreach (var element in elementDict.Values)
            {
                if (element.FGCPrecedent.ToLower().Contains(precedentGame.ToLower()))
                {
                    elements.Add(element);
                }
            }
        }
        
        return elements;
    }
    
    public static StageElement GetRandomElementForTheme(string theme, string category = null)
    {
        var availableElements = GetElementsByTheme(theme);
        
        if (!string.IsNullOrEmpty(category))
        {
            availableElements = availableElements.Where(e => e.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        
        if (availableElements.Count == 0) return null;
        
        var random = new Random();
        return availableElements[random.Next(availableElements.Count)];
    }
}