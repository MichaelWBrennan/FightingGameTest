using Godot;
using System.Text.Json;

/// <summary>
/// Demo script to showcase sub-archetype differences
/// </summary>
public partial class SubArchetypeDemo : Node
{
    public override void _Ready()
    {
        GD.Print("=== Sub-Archetype System Demo ===");
        DemonstrateRyuVariations();
        DemonstrateChunLiVariations();
        GD.Print("=== Demo Complete ===");
    }

    private void DemonstrateRyuVariations()
    {
        GD.Print("\n[RYU SUB-ARCHETYPE VARIATIONS]");
        
        string dataPath = "res://data/characters/ryu.json";
        using var file = FileAccess.Open(dataPath, FileAccess.ModeFlags.Read);
        string jsonText = file.GetAsText();
        var baseData = JsonSerializer.Deserialize<CharacterData>(jsonText);
        
        // Create SubArchetypeManager instance for testing
        var subManager = new SubArchetypeManager();
        
        foreach (var subArchetype in baseData.SubArchetypes)
        {
            var modifiedData = subManager.ApplySubArchetype(baseData, subArchetype.SubArchetypeId);
            
            GD.Print($"\n{subArchetype.Name}:");
            GD.Print($"  Description: {subArchetype.Description}");
            GD.Print($"  Health: {baseData.Health} → {modifiedData.Health}");
            GD.Print($"  Walk Speed: {baseData.WalkSpeed} → {modifiedData.WalkSpeed}");
            GD.Print($"  Run Speed: {baseData.RunSpeed} → {modifiedData.RunSpeed}");
            
            // Show move modifications
            if (subArchetype.MoveModifiers.Count > 0)
            {
                GD.Print("  Move Modifications:");
                foreach (var moveMod in subArchetype.MoveModifiers)
                {
                    GD.Print($"    {moveMod.Key}: Damage x{moveMod.Value.DamageMultiplier}, Startup {moveMod.Value.StartupFrameBonus:+0;-#}f");
                }
            }
            
            // Show additional moves
            if (subArchetype.AdditionalMoves.Count > 0)
            {
                GD.Print("  Additional Moves:");
                foreach (var move in subArchetype.AdditionalMoves)
                {
                    GD.Print($"    {move.Value.Name}: {move.Value.Description}");
                }
            }
        }
    }

    private void DemonstrateChunLiVariations()
    {
        GD.Print("\n[CHUN-LI SUB-ARCHETYPE VARIATIONS]");
        
        string dataPath = "res://data/characters/chun_li.json";
        using var file = FileAccess.Open(dataPath, FileAccess.ModeFlags.Read);
        string jsonText = file.GetAsText();
        var baseData = JsonSerializer.Deserialize<CharacterData>(jsonText);
        
        var subManager = new SubArchetypeManager();
        
        foreach (var subArchetype in baseData.SubArchetypes)
        {
            var modifiedData = subManager.ApplySubArchetype(baseData, subArchetype.SubArchetypeId);
            
            GD.Print($"\n{subArchetype.Name}:");
            GD.Print($"  Description: {subArchetype.Description}");
            GD.Print($"  Health: {baseData.Health} → {modifiedData.Health}");
            GD.Print($"  Walk Speed: {baseData.WalkSpeed:F1} → {modifiedData.WalkSpeed:F1}");
            GD.Print($"  Jump Height: {baseData.JumpHeight:F0} → {modifiedData.JumpHeight:F0}");
            
            if (subArchetype.AdditionalMoves.Count > 0)
            {
                GD.Print("  New Special Abilities:");
                foreach (var move in subArchetype.AdditionalMoves)
                {
                    GD.Print($"    {move.Value.Name}: {move.Value.Description}");
                }
            }
        }
    }
}