using Godot;
using System.Text.Json;

/// <summary>
/// Test script to validate sub-archetype system functionality
/// </summary>
public partial class SubArchetypeTest : Node
{
    public override void _Ready()
    {
        // Test loading and validation of sub-archetypes
        TestSubArchetypeSystem();
    }

    private void TestSubArchetypeSystem()
    {
        GD.Print("=== Sub-Archetype System Test ===");
        
        // Test each character's sub-archetypes
        string[] characters = { "ryu", "chun_li", "zangief", "sagat", "lei_wulong", "ken" };
        
        foreach (var characterId in characters)
        {
            GD.Print($"\nTesting character: {characterId}");
            TestCharacterSubArchetypes(characterId);
        }
        
        GD.Print("\n=== Sub-Archetype System Test Complete ===");
    }

    private void TestCharacterSubArchetypes(string characterId)
    {
        // Load base character data
        string dataPath = $"res://data/characters/{characterId}.json";
        if (!FileAccess.FileExists(dataPath))
        {
            GD.PrintErr($"Character file not found: {dataPath}");
            return;
        }

        using var file = FileAccess.Open(dataPath, FileAccess.ModeFlags.Read);
        string jsonText = file.GetAsText();

        try
        {
            var baseData = JsonSerializer.Deserialize<CharacterData>(jsonText);
            
            GD.Print($"  Base Health: {baseData.Health}");
            GD.Print($"  Base Walk Speed: {baseData.WalkSpeed}");
            GD.Print($"  Sub-archetypes: {baseData.SubArchetypes.Count}");

            foreach (var subArchetype in baseData.SubArchetypes)
            {
                GD.Print($"    - {subArchetype.Name} (ID: {subArchetype.SubArchetypeId})");
                GD.Print($"      Description: {subArchetype.Description}");
                GD.Print($"      Is Default: {subArchetype.IsDefault}");
                
                // Test application if SubArchetypeManager is available
                if (SubArchetypeManager.Instance != null)
                {
                    var modifiedData = SubArchetypeManager.Instance.ApplySubArchetype(baseData, subArchetype.SubArchetypeId);
                    
                    GD.Print($"      Modified Health: {modifiedData.Health} (mult: {subArchetype.StatModifiers.HealthMultiplier})");
                    GD.Print($"      Modified Walk Speed: {modifiedData.WalkSpeed} (mult: {subArchetype.StatModifiers.WalkSpeedMultiplier})");
                    
                    if (subArchetype.AdditionalMoves.Count > 0)
                    {
                        GD.Print($"      Additional Moves: {subArchetype.AdditionalMoves.Count}");
                        foreach (var move in subArchetype.AdditionalMoves)
                        {
                            GD.Print($"        + {move.Value.Name}");
                        }
                    }
                }
            }
        }
        catch (System.Exception e)
        {
            GD.PrintErr($"Error testing character {characterId}: {e.Message}");
        }
    }
}