using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

/// <summary>
/// Comprehensive archetype system definitions based on fighting game analysis
/// Contains 10 main archetypes with 3 sub-styles each for strategic depth
/// </summary>
public static class ArchetypeDefinitions
{
    /// <summary>
    /// All main fighting game archetypes with their sub-style variations
    /// </summary>
    public static readonly Dictionary<string, ArchetypeDefinition> MainArchetypes = new()
    {
        ["shoto"] = new()
        {
            Name = "Shoto (All-Rounder)",
            Description = "The 'template' character. Solid tools in all phases.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["fundamentalist"] = new()
                {
                    Name = "Fundamentalist",
                    Description = "Focused on spacing, punishes, and textbook play.",
                    Examples = new[] { "Ryu (SF)", "Ky Kiske (GG)" },
                    PlayStyle = "Neutral game focused, well-rounded fundamentals",
                    StrengthFocus = "Solid foundation in all areas",
                    WeaknessFocus = "No overwhelming specialization",
                    DesignIntent = "Teach fighting game fundamentals"
                },
                ["pressure"] = new()
                {
                    Name = "Pressure Shoto", 
                    Description = "Trades balance for offensive momentum.",
                    Examples = new[] { "Ken (SF)", "Terry Bogard (KoF)" },
                    PlayStyle = "Aggressive rushdown with balanced tools",
                    StrengthFocus = "Enhanced pressure and frame advantage",
                    WeaknessFocus = "Reduced defensive options",
                    DesignIntent = "Offensive-minded shoto approach"
                },
                ["unorthodox"] = new()
                {
                    Name = "Unorthodox Shoto",
                    Description = "Retains shoto shell but alters core functions (e.g., no fireball).",
                    Examples = new[] { "Kyo Kusanagi (KoF)", "Leo Whitefang (GG)" },
                    PlayStyle = "Familiar tools with unique twists",
                    StrengthFocus = "Unconventional options surprise opponents",
                    WeaknessFocus = "Missing traditional shoto tools",
                    DesignIntent = "Familiar but different gameplay"
                }
            }
        },
        
        ["rushdown"] = new()
        {
            Name = "Rushdown",
            Description = "Aggressive, high-tempo characters that excel in close-range offense.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["speedster"] = new()
                {
                    Name = "Speedster",
                    Description = "Overwhelms with sheer movement and frame advantage.",
                    Examples = new[] { "Chipp Zanuff (GG)", "Cammy (SF)" },
                    PlayStyle = "Extreme mobility and fast attacks",
                    StrengthFocus = "Speed and overwhelming offense",
                    WeaknessFocus = "Low health, high execution requirements",
                    DesignIntent = "Pure speed and aggression"
                },
                ["brawler"] = new()
                {
                    Name = "Brawler",
                    Description = "High priority normals, frame traps, and raw damage.",
                    Examples = new[] { "Dudley (SF)", "Jago (KI)" },
                    PlayStyle = "Strong normals and frame trap pressure",
                    StrengthFocus = "High damage and priority attacks",
                    WeaknessFocus = "Limited range and defensive options",
                    DesignIntent = "Raw power in close range"
                },
                ["mixup_demon"] = new()
                {
                    Name = "Mix-up Demon",
                    Description = "Low/throw or left/right vortex-focused pressure.",
                    Examples = new[] { "Millia Rage (GG)", "El Fuerte (SF)" },
                    PlayStyle = "Constant high/low and left/right pressure",
                    StrengthFocus = "Unpredictable offense and resets",
                    WeaknessFocus = "Requires constant momentum",
                    DesignIntent = "Force constant guessing games"
                }
            }
        },
        
        ["grappler"] = new()
        {
            Name = "Grappler", 
            Description = "Dominates close-range via command grabs and hard reads.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["classic"] = new()
                {
                    Name = "Classic Grappler",
                    Description = "Slow, tanky, with massive command grabs.",
                    Examples = new[] { "Zangief (SF)", "Tager (BB)" },
                    PlayStyle = "Patient approach with huge damage payoffs",
                    StrengthFocus = "Massive damage and health",
                    WeaknessFocus = "Slow movement and vulnerable to zoning",
                    DesignIntent = "High risk, high reward grab specialist"
                },
                ["mobile"] = new()
                {
                    Name = "Mobile Grappler",
                    Description = "Gains access through dashes, rolls, or ranged grabs.",
                    Examples = new[] { "Laura (SFV)", "King (Tekken)" },
                    PlayStyle = "Mobile approach with grab threats",
                    StrengthFocus = "Mobility options and grab mixups",
                    WeaknessFocus = "Lower damage than classic grapplers",
                    DesignIntent = "Modern grappler with mobility"
                },
                ["strike_grab_hybrid"] = new()
                {
                    Name = "Strike-Grab Hybrid",
                    Description = "Mixes in strong normals for ambiguous approach.",
                    Examples = new[] { "Clark (KoF)", "Alex (SF)" },
                    PlayStyle = "Balance of strikes and grabs",
                    StrengthFocus = "Ambiguous offense and versatility",
                    WeaknessFocus = "Not specialized in pure grappling",
                    DesignIntent = "Grappler with strong strike game"
                }
            }
        },
        
        ["zoner"] = new()
        {
            Name = "Zoner",
            Description = "Controls space and tempo with projectiles or range tools.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["projectile"] = new()
                {
                    Name = "Projectile Zoner",
                    Description = "Uses fireballs or traps to wall opponents out.",
                    Examples = new[] { "Guile (SF)", "Peacock (SG)" },
                    PlayStyle = "Projectile-based space control",
                    StrengthFocus = "Excellent full-screen control",
                    WeaknessFocus = "Vulnerable when projectiles are bypassed",
                    DesignIntent = "Traditional zoning with projectiles"
                },
                ["disjoint"] = new()
                {
                    Name = "Disjoint Zoner", 
                    Description = "Long-range normals or weapons for space control.",
                    Examples = new[] { "Axl Low (GG)", "Dhalsim (SF)" },
                    PlayStyle = "Long-range normals and space denial",
                    StrengthFocus = "Safe pokes and long range",
                    WeaknessFocus = "Close-range weakness",
                    DesignIntent = "Physical space control without projectiles"
                },
                ["trap_setup"] = new()
                {
                    Name = "Trap/Setup Zoner",
                    Description = "Lays hazards that restrict movement.",
                    Examples = new[] { "Venom (GG)", "Testament (GGST)" },
                    PlayStyle = "Setup-based area denial",
                    StrengthFocus = "Area control and strategic positioning",
                    WeaknessFocus = "Setup time requirements",
                    DesignIntent = "Strategic space control through setups"
                }
            }
        },
        
        ["mixup"] = new()
        {
            Name = "Mix-up",
            Description = "Forces constant guessing through ambiguous or layered offense.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["fifty_fifty_specialist"] = new()
                {
                    Name = "50/50 Specialist",
                    Description = "Constant high/low or left/right threats.",
                    Examples = new[] { "I-No (GG)", "Xiaoyu (Tekken)" },
                    PlayStyle = "Pure guessing game offense",
                    StrengthFocus = "Unpredictable attack patterns",
                    WeaknessFocus = "Requires constant offense to stay effective",
                    DesignIntent = "Force binary defensive choices"
                },
                ["okizeme_master"] = new()
                {
                    Name = "Okizeme Master",
                    Description = "Threat multiplies after each knockdown.",
                    Examples = new[] { "Akuma (SF)", "Viper (SF4)" },
                    PlayStyle = "Knockdown-focused pressure cycling",
                    StrengthFocus = "Devastating wake-up pressure",
                    WeaknessFocus = "Needs to secure knockdowns first",
                    DesignIntent = "Reward aggressive knockdown pursuit"
                },
                ["crossup_machine"] = new()
                {
                    Name = "Cross-up Machine",
                    Description = "Air mobility and fast jumps for left/right pressure.",
                    Examples = new[] { "Marvel's Wolverine", "Yosuke (P4A)" },
                    PlayStyle = "Air-based left/right mixups",
                    StrengthFocus = "Superior air mobility and crossups",
                    WeaknessFocus = "Grounded neutral game weakness",
                    DesignIntent = "Air-based offensive specialist"
                }
            }
        },
        
        ["setplay"] = new()
        {
            Name = "Setplay",
            Description = "Controls the match by locking the opponent into a predetermined offensive sequence.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["summoner"] = new()
                {
                    Name = "Summoner",
                    Description = "Uses minions or assists.",
                    Examples = new[] { "Zato-1 (GG)", "Rosalina & Luma (Smash)" },
                    PlayStyle = "Multi-entity coordination",
                    StrengthFocus = "Overwhelming multi-front offense",
                    WeaknessFocus = "Complex execution and resource management",
                    DesignIntent = "Puppet-like control with assists"
                },
                ["trap_layer"] = new()
                {
                    Name = "Trap Layer",
                    Description = "Deploys objects or hazards to lock down options.",
                    Examples = new[] { "Arakune (BB)", "Venom (GG)" },
                    PlayStyle = "Area denial through deployed hazards",
                    StrengthFocus = "Battlefield control and area denial",
                    WeaknessFocus = "Setup time and resource management",
                    DesignIntent = "Strategic battlefield control"
                },
                ["hard_knockdown_looper"] = new()
                {
                    Name = "Hard Knockdown Looper",
                    Description = "Loops pressure after each hit.",
                    Examples = new[] { "Millia Rage (GG)", "Elphelt (GGXrd)" },
                    PlayStyle = "Pressure loop maintenance",
                    StrengthFocus = "Self-sustaining offense loops",
                    WeaknessFocus = "Needs initial setup to begin loops",
                    DesignIntent = "Perpetual pressure once established"
                }
            }
        },
        
        ["puppet"] = new()
        {
            Name = "Puppet",
            Description = "Controls two entities at once—indirect offense and multitasking.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["true_puppet"] = new()
                {
                    Name = "True Puppet",
                    Description = "Full control of both units.",
                    Examples = new[] { "Carl Clover (BB)", "Zato-1 (GG)" },
                    PlayStyle = "Simultaneous two-entity control",
                    StrengthFocus = "Ultimate offensive control and coverage",
                    WeaknessFocus = "Extreme execution requirements",
                    DesignIntent = "Master-level multitasking gameplay"
                },
                ["shadow_clone"] = new()
                {
                    Name = "Shadow Clone",
                    Description = "Duplicate mirrors attacks or adds pressure.",
                    Examples = new[] { "Noob Saibot (MK11)", "Stand users (JoJo's)" },
                    PlayStyle = "Attack duplication and extension",
                    StrengthFocus = "Extended combos and coverage",
                    WeaknessFocus = "Limited independent puppet control",
                    DesignIntent = "Enhanced versions of main character"
                },
                ["interval_puppet"] = new()
                {
                    Name = "Interval Puppet",
                    Description = "Puppet acts on cooldown or automatic timer.",
                    Examples = new[] { "Rosalina & Luma (Smash)", "Popo/Nana (Smash)" },
                    PlayStyle = "Periodic puppet assistance",
                    StrengthFocus = "Reduced execution with puppet benefits",
                    WeaknessFocus = "Limited puppet control timing",
                    DesignIntent = "Accessible puppet gameplay"
                }
            }
        },
        
        ["counter"] = new()
        {
            Name = "Counter",
            Description = "Punishes aggression with defensive triggers or reversal tools.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["reactive"] = new()
                {
                    Name = "Reactive",
                    Description = "Strong anti-airs, punishes, and counters.",
                    Examples = new[] { "Geese Howard (KoF)", "Gouken (SF)" },
                    PlayStyle = "Defensive punishment specialist",
                    StrengthFocus = "Excellent defensive options and punishes",
                    WeaknessFocus = "Limited offensive initiation",
                    DesignIntent = "Reward defensive mastery"
                },
                ["parry_master"] = new()
                {
                    Name = "Parry Master",
                    Description = "Parry system mastery defines skill ceiling.",
                    Examples = new[] { "Third Strike Ken", "Garou's Kain" },
                    PlayStyle = "Parry-based defense to offense conversion",
                    StrengthFocus = "Superior defensive options with high reward",
                    WeaknessFocus = "High execution barrier",
                    DesignIntent = "Technical defensive gameplay"
                },
                ["bait_and_punish"] = new()
                {
                    Name = "Bait & Punish",
                    Description = "Lures mistakes via fakeouts or stance cancels.",
                    Examples = new[] { "Baiken (GG)", "Asuka (Tekken 8)" },
                    PlayStyle = "Deception and punishment tactics",
                    StrengthFocus = "Mind games and counter-attack setups",
                    WeaknessFocus = "Requires opponent mistakes to excel",
                    DesignIntent = "Psychological warfare specialist"
                }
            }
        },
        
        ["stance"] = new()
        {
            Name = "Stance",
            Description = "Changes combat capabilities on the fly.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["dual_mode"] = new()
                {
                    Name = "Dual Mode",
                    Description = "Two full movesets or forms.",
                    Examples = new[] { "Gen (SF)", "Lei Wulong (Tekken)" },
                    PlayStyle = "Complete transformation between modes",
                    StrengthFocus = "Versatility and adaptability",
                    WeaknessFocus = "Complex character knowledge requirements",
                    DesignIntent = "Two characters in one"
                },
                ["combo_stance"] = new()
                {
                    Name = "Combo Stance",
                    Description = "Changes stance mid-string for optimization.",
                    Examples = new[] { "Jam Kuradoberi (GG)", "Maxi (SC)" },
                    PlayStyle = "Stance transitions during combos",
                    StrengthFocus = "Extended combo potential and variety",
                    WeaknessFocus = "Execution-heavy optimization",
                    DesignIntent = "Reward stance transition mastery"
                },
                ["utility_stance"] = new()
                {
                    Name = "Utility Stance",
                    Description = "Switches to gain tools situationally.",
                    Examples = new[] { "V-Trigger Chun-Li", "Vega (SFV)" },
                    PlayStyle = "Situational stance activation",
                    StrengthFocus = "Adaptability to different situations",
                    WeaknessFocus = "Resource management requirements",
                    DesignIntent = "Tactical stance utilization"
                }
            }
        },
        
        ["big_body"] = new()
        {
            Name = "Big Body / Heavy",
            Description = "High risk–reward archetype. Large frame, massive damage.",
            SubStyles = new Dictionary<string, SubStyleDefinition>
            {
                ["armored_powerhouse"] = new()
                {
                    Name = "Armored Powerhouse",
                    Description = "Super armor and unstoppable offense.",
                    Examples = new[] { "Gigas (Tekken)", "Juggernaut (MvC2)" },
                    PlayStyle = "Armor through attacks with massive damage",
                    StrengthFocus = "Unstoppable offense and huge damage",
                    WeaknessFocus = "Slow and predictable movement",
                    DesignIntent = "Unstoppable force gameplay"
                },
                ["wall_of_pain"] = new()
                {
                    Name = "Wall of Pain",
                    Description = "Dominates neutral with huge normals.",
                    Examples = new[] { "Abigail (SFV)", "Aganos (KI)" },
                    PlayStyle = "Space control through massive hitboxes",
                    StrengthFocus = "Superior range and priority",
                    WeaknessFocus = "Slow startup and recovery",
                    DesignIntent = "Neutral game domination through size"
                },
                ["glass_golem"] = new()
                {
                    Name = "Glass Golem",
                    Description = "Slow but lacks defense, built around burst.",
                    Examples = new[] { "Kanji (P4A)", "Nemesis (UMvC3)" },
                    PlayStyle = "High damage but fragile despite size",
                    StrengthFocus = "Extreme damage potential",
                    WeaknessFocus = "Poor defensive options despite size",
                    DesignIntent = "High-risk, high-reward big body"
                }
            }
        }
    };
}

/// <summary>
/// Defines a main fighting game archetype and its variations
/// </summary>
public class ArchetypeDefinition
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public Dictionary<string, SubStyleDefinition> SubStyles { get; set; } = new();
}

/// <summary>
/// Defines a sub-style variation of a main archetype
/// </summary>
public class SubStyleDefinition
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string[] Examples { get; set; } = Array.Empty<string>();
    public string PlayStyle { get; set; } = "";
    public string StrengthFocus { get; set; } = "";
    public string WeaknessFocus { get; set; } = "";
    public string DesignIntent { get; set; } = "";
}