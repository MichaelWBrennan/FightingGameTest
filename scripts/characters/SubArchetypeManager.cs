using System.Collections.Generic;
using System.Linq;
using Godot;

/// <summary>
/// Manages sub-archetype variations and applies modifications to base character data
/// </summary>
public partial class SubArchetypeManager : Node
{
    public static SubArchetypeManager Instance { get; private set; }

    public override void _Ready()
    {
        Instance = this;
    }

    /// <summary>
    /// Apply a sub-archetype modification to character data
    /// </summary>
    /// <param name="baseCharacterData">Base character data to modify</param>
    /// <param name="subArchetypeId">ID of the sub-archetype to apply</param>
    /// <returns>Modified character data</returns>
    public CharacterData ApplySubArchetype(CharacterData baseCharacterData, string subArchetypeId)
    {
        // Create a deep copy of the base character data
        var modifiedData = DeepCopyCharacterData(baseCharacterData);
        
        // Find the sub-archetype
        var subArchetype = baseCharacterData.SubArchetypes.FirstOrDefault(sa => sa.SubArchetypeId == subArchetypeId);
        if (subArchetype == null)
        {
            GD.PrintErr($"Sub-archetype '{subArchetypeId}' not found for character '{baseCharacterData.CharacterId}'");
            return modifiedData;
        }

        // Apply stat modifications
        ApplyStatModifications(modifiedData, subArchetype.StatModifiers);
        
        // Apply move modifications
        ApplyMoveModifications(modifiedData, subArchetype.MoveModifiers);
        
        // Add additional moves
        AddAdditionalMoves(modifiedData, subArchetype.AdditionalMoves);
        
        // Apply unique mechanic changes
        ApplyUniqueMechanicChanges(modifiedData, subArchetype.UniqueMechanicChanges);

        GD.Print($"Applied sub-archetype '{subArchetype.Name}' to character '{modifiedData.Name}'");
        return modifiedData;
    }

    /// <summary>
    /// Get the default sub-archetype for a character
    /// </summary>
    public SubArchetypeData GetDefaultSubArchetype(CharacterData characterData)
    {
        return characterData.SubArchetypes.FirstOrDefault(sa => sa.IsDefault) 
               ?? characterData.SubArchetypes.FirstOrDefault();
    }

    /// <summary>
    /// Get all available sub-archetypes for a character
    /// </summary>
    public List<SubArchetypeData> GetAvailableSubArchetypes(CharacterData characterData)
    {
        return characterData.SubArchetypes.ToList();
    }

    private void ApplyStatModifications(CharacterData characterData, StatModifiers modifiers)
    {
        characterData.Health = Mathf.RoundToInt(characterData.Health * modifiers.HealthMultiplier);
        characterData.WalkSpeed *= modifiers.WalkSpeedMultiplier;
        characterData.RunSpeed *= modifiers.RunSpeedMultiplier;
        characterData.JumpHeight *= modifiers.JumpHeightMultiplier;
        characterData.Weight = Mathf.RoundToInt(characterData.Weight * modifiers.WeightMultiplier);
    }

    private void ApplyMoveModifications(CharacterData characterData, Dictionary<string, MoveModifiers> moveModifiers)
    {
        foreach (var moveModPair in moveModifiers)
        {
            var moveId = moveModPair.Key;
            var modifier = moveModPair.Value;
            
            // Find the move in normals, specials, or supers
            MoveData targetMove = null;
            
            if (characterData.Moves.Normals.ContainsKey(moveId))
                targetMove = characterData.Moves.Normals[moveId];
            else if (characterData.Moves.Specials.ContainsKey(moveId))
                targetMove = characterData.Moves.Specials[moveId];
            else if (characterData.Moves.Supers.ContainsKey(moveId))
                targetMove = characterData.Moves.Supers[moveId];
                
            if (targetMove != null)
            {
                ApplyMoveModifier(targetMove, modifier);
            }
        }
    }

    private void ApplyMoveModifier(MoveData move, MoveModifiers modifier)
    {
        // Apply damage multiplier
        move.Damage = Mathf.RoundToInt(move.Damage * modifier.DamageMultiplier);
        
        // Apply frame data modifications
        move.StartupFrames += modifier.StartupFrameBonus;
        move.RecoveryFrames += modifier.RecoveryFrameBonus;
        move.BlockAdvantage += modifier.BlockAdvantageBonus;
        move.HitAdvantage += modifier.HitAdvantageBonus;
        
        // Ensure frame data doesn't go below reasonable minimums
        move.StartupFrames = Mathf.Max(1, move.StartupFrames);
        move.RecoveryFrames = Mathf.Max(1, move.RecoveryFrames);
        
        // Apply property changes
        foreach (var property in modifier.AddedProperties)
        {
            if (!move.Properties.Contains(property))
                move.Properties.Add(property);
        }
        
        foreach (var property in modifier.RemovedProperties)
        {
            move.Properties.Remove(property);
        }
    }

    private void AddAdditionalMoves(CharacterData characterData, Dictionary<string, MoveData> additionalMoves)
    {
        foreach (var movePair in additionalMoves)
        {
            var moveId = movePair.Key;
            var moveData = movePair.Value;
            
            // Determine where to add the move based on naming convention or properties
            if (moveId.StartsWith("super_"))
                characterData.Moves.Supers[moveId] = moveData;
            else if (moveId.StartsWith("special_"))
                characterData.Moves.Specials[moveId] = moveData;
            else
                characterData.Moves.Normals[moveId] = moveData;
        }
    }

    private void ApplyUniqueMechanicChanges(CharacterData characterData, List<string> mechanicChanges)
    {
        foreach (var change in mechanicChanges)
        {
            if (change.StartsWith("+"))
            {
                // Add mechanic
                var mechanic = change.Substring(1);
                if (!characterData.UniqueMechanics.Contains(mechanic))
                    characterData.UniqueMechanics.Add(mechanic);
            }
            else if (change.StartsWith("-"))
            {
                // Remove mechanic
                var mechanic = change.Substring(1);
                characterData.UniqueMechanics.Remove(mechanic);
            }
        }
    }

    private CharacterData DeepCopyCharacterData(CharacterData original)
    {
        // Simple deep copy implementation using JSON serialization
        var json = System.Text.Json.JsonSerializer.Serialize(original);
        return System.Text.Json.JsonSerializer.Deserialize<CharacterData>(json);
    }
}