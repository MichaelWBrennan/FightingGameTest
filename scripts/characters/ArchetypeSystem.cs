using System.Collections.Generic;
using System.Linq;
using Godot;

/// <summary>
/// Enhanced archetype system that provides detailed information about fighting game archetypes
/// and their strategic applications, integrating with the comprehensive archetype definitions
/// </summary>
public partial class ArchetypeSystem : Node
{
    public static ArchetypeSystem Instance { get; private set; }

    public override void _Ready()
    {
        Instance = this;
        GD.Print("ArchetypeSystem initialized with comprehensive fighting game archetype definitions");
    }

    /// <summary>
    /// Get detailed information about a main archetype
    /// </summary>
    public ArchetypeDefinition GetArchetypeDefinition(string archetypeId)
    {
        return ArchetypeDefinitions.MainArchetypes.GetValueOrDefault(archetypeId);
    }

    /// <summary>
    /// Get all available main archetypes
    /// </summary>
    public Dictionary<string, ArchetypeDefinition> GetAllArchetypes()
    {
        return ArchetypeDefinitions.MainArchetypes;
    }

    /// <summary>
    /// Get sub-style definition for a specific archetype
    /// </summary>
    public SubStyleDefinition GetSubStyleDefinition(string archetypeId, string subStyleId)
    {
        var archetype = GetArchetypeDefinition(archetypeId);
        return archetype?.SubStyles.GetValueOrDefault(subStyleId);
    }

    /// <summary>
    /// Get all sub-styles for a specific archetype
    /// </summary>
    public Dictionary<string, SubStyleDefinition> GetSubStyles(string archetypeId)
    {
        var archetype = GetArchetypeDefinition(archetypeId);
        return archetype?.SubStyles ?? new Dictionary<string, SubStyleDefinition>();
    }

    /// <summary>
    /// Get archetype information formatted for display
    /// </summary>
    public ArchetypeInfo GetArchetypeInfo(string archetypeId)
    {
        var definition = GetArchetypeDefinition(archetypeId);
        if (definition == null)
            return null;

        return new ArchetypeInfo
        {
            ArchetypeId = archetypeId,
            Name = definition.Name,
            Description = definition.Description,
            SubStyleCount = definition.SubStyles.Count,
            SubStyleIds = definition.SubStyles.Keys.ToList(),
            SubStyleNames = definition.SubStyles.Values.Select(s => s.Name).ToList()
        };
    }

    /// <summary>
    /// Get sub-style information formatted for display
    /// </summary>
    public SubStyleInfo GetSubStyleInfo(string archetypeId, string subStyleId)
    {
        var subStyle = GetSubStyleDefinition(archetypeId, subStyleId);
        if (subStyle == null)
            return null;

        return new SubStyleInfo
        {
            ArchetypeId = archetypeId,
            SubStyleId = subStyleId,
            Name = subStyle.Name,
            Description = subStyle.Description,
            Examples = subStyle.Examples.ToList(),
            PlayStyle = subStyle.PlayStyle,
            StrengthFocus = subStyle.StrengthFocus,
            WeaknessFocus = subStyle.WeaknessFocus,
            DesignIntent = subStyle.DesignIntent
        };
    }

    /// <summary>
    /// Find archetypes that match certain criteria
    /// </summary>
    public List<string> FindArchetypesByPlayStyle(string playStyleKeyword)
    {
        var results = new List<string>();
        
        foreach (var archetypePair in ArchetypeDefinitions.MainArchetypes)
        {
            var archetypeId = archetypePair.Key;
            var definition = archetypePair.Value;
            
            // Check main archetype description
            if (definition.Description.Contains(playStyleKeyword, System.StringComparison.OrdinalIgnoreCase))
            {
                results.Add(archetypeId);
                continue;
            }
            
            // Check sub-styles
            foreach (var subStyle in definition.SubStyles.Values)
            {
                if (subStyle.PlayStyle.Contains(playStyleKeyword, System.StringComparison.OrdinalIgnoreCase) ||
                    subStyle.Description.Contains(playStyleKeyword, System.StringComparison.OrdinalIgnoreCase))
                {
                    results.Add(archetypeId);
                    break;
                }
            }
        }
        
        return results;
    }

    /// <summary>
    /// Get strategic matchup information between archetypes
    /// </summary>
    public MatchupInfo GetArchetypeMatchup(string archetype1, string archetype2)
    {
        // Basic matchup logic based on archetype strengths/weaknesses
        // This could be expanded with detailed matchup data
        
        var def1 = GetArchetypeDefinition(archetype1);
        var def2 = GetArchetypeDefinition(archetype2);
        
        if (def1 == null || def2 == null)
            return null;

        return new MatchupInfo
        {
            Archetype1 = archetype1,
            Archetype2 = archetype2,
            Advantage = CalculateBasicMatchupAdvantage(archetype1, archetype2),
            Notes = GenerateMatchupNotes(def1, def2)
        };
    }

    /// <summary>
    /// Generate a balanced roster suggestion using archetype diversity
    /// </summary>
    public List<ArchetypeRosterSuggestion> SuggestBalancedRoster(int targetSize = 12)
    {
        var suggestions = new List<ArchetypeRosterSuggestion>();
        var archetypeIds = ArchetypeDefinitions.MainArchetypes.Keys.ToList();
        
        // Ensure at least one of each main archetype for diversity
        var selectedArchetypes = new HashSet<string>();
        
        // Priority archetypes for fundamental gameplay
        string[] priorityArchetypes = { "shoto", "rushdown", "grappler", "zoner" };
        
        foreach (var archetype in priorityArchetypes)
        {
            if (selectedArchetypes.Count < targetSize)
            {
                selectedArchetypes.Add(archetype);
                suggestions.Add(new ArchetypeRosterSuggestion
                {
                    ArchetypeId = archetype,
                    Priority = "High",
                    Reason = "Core fighting game archetype essential for balanced roster"
                });
            }
        }
        
        // Add remaining archetypes for variety
        foreach (var archetype in archetypeIds)
        {
            if (selectedArchetypes.Count >= targetSize)
                break;
                
            if (!selectedArchetypes.Contains(archetype))
            {
                selectedArchetypes.Add(archetype);
                suggestions.Add(new ArchetypeRosterSuggestion
                {
                    ArchetypeId = archetype,
                    Priority = "Medium",
                    Reason = "Adds strategic depth and variety to roster"
                });
            }
        }
        
        return suggestions;
    }

    private float CalculateBasicMatchupAdvantage(string archetype1, string archetype2)
    {
        // Simple matchup calculation based on common fighting game patterns
        var matchups = new Dictionary<(string, string), float>();
        
        // Zoner vs Grappler (zoner advantage)
        matchups[("zoner", "grappler")] = 0.6f;
        matchups[("grappler", "zoner")] = 0.4f;
        
        // Rushdown vs Zoner (rushdown advantage)
        matchups[("rushdown", "zoner")] = 0.6f;
        matchups[("zoner", "rushdown")] = 0.4f;
        
        // Grappler vs Rushdown (even/slight grappler advantage)
        matchups[("grappler", "rushdown")] = 0.55f;
        matchups[("rushdown", "grappler")] = 0.45f;
        
        // Shoto tends to be even with most archetypes
        matchups[("shoto", "rushdown")] = 0.5f;
        matchups[("shoto", "grappler")] = 0.5f;
        matchups[("shoto", "zoner")] = 0.5f;
        
        return matchups.GetValueOrDefault((archetype1, archetype2), 0.5f);
    }

    private string GenerateMatchupNotes(ArchetypeDefinition def1, ArchetypeDefinition def2)
    {
        return $"{def1.Name} vs {def2.Name}: Strategic matchup based on archetype strengths and weaknesses.";
    }
}

/// <summary>
/// Display information about an archetype
/// </summary>
public class ArchetypeInfo
{
    public string ArchetypeId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int SubStyleCount { get; set; }
    public List<string> SubStyleIds { get; set; } = new();
    public List<string> SubStyleNames { get; set; } = new();
}

/// <summary>
/// Display information about a sub-style
/// </summary>
public class SubStyleInfo
{
    public string ArchetypeId { get; set; }
    public string SubStyleId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public List<string> Examples { get; set; } = new();
    public string PlayStyle { get; set; }
    public string StrengthFocus { get; set; }
    public string WeaknessFocus { get; set; }
    public string DesignIntent { get; set; }
}

/// <summary>
/// Matchup information between archetypes
/// </summary>
public class MatchupInfo
{
    public string Archetype1 { get; set; }
    public string Archetype2 { get; set; }
    public float Advantage { get; set; } // 0.5 = even, >0.5 = advantage to archetype1
    public string Notes { get; set; }
}

/// <summary>
/// Roster suggestion for balanced competitive play
/// </summary>
public class ArchetypeRosterSuggestion
{
    public string ArchetypeId { get; set; }
    public string Priority { get; set; } // High, Medium, Low
    public string Reason { get; set; }
}