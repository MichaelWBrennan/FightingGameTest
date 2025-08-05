using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Clash and Priority system inspired by Samurai Shodown
/// </summary>
public partial class ClashPrioritySystem : Node
{
    public static ClashPrioritySystem Instance { get; private set; }
    
    public enum ClashResult
    {
        NoClash,
        MutualClash,
        Player1Wins,
        Player2Wins
    }
    
    public enum AttackPriority
    {
        Low = 1,        // Light attacks
        Medium = 2,     // Medium attacks  
        High = 3,       // Heavy attacks
        Special = 4,    // Special moves
        Super = 5,      // Super moves
        Throw = 6       // Command grabs (beat everything but jumps)
    }
    
    private const int CLASH_WINDOW_FRAMES = 3; // Frames where attacks can clash
    
    [Signal]
    public delegate void ClashOccurredEventHandler(ClashResult result, Vector2 position);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Check for clash between two attacks
    /// </summary>
    public ClashResult CheckClash(Character attacker1, Character attacker2, string move1, string move2)
    {
        if (!CanClash(attacker1, attacker2)) return ClashResult.NoClash;
        
        var priority1 = GetMovePriority(attacker1, move1);
        var priority2 = GetMovePriority(attacker2, move2);
        
        var result = DetermineClashResult(priority1, priority2);
        
        if (result != ClashResult.NoClash)
        {
            Vector2 clashPosition = (attacker1.GlobalPosition + attacker2.GlobalPosition) / 2;
            ExecuteClash(result, attacker1, attacker2, clashPosition);
        }
        
        return result;
    }
    
    /// <summary>
    /// Check if characters can clash
    /// </summary>
    private bool CanClash(Character char1, Character char2)
    {
        // Both must be attacking
        if (char1.CurrentState != CharacterState.Attacking || 
            char2.CurrentState != CharacterState.Attacking)
            return false;
        
        // Must be within clash window timing
        return Math.Abs(char1.StateFrame - char2.StateFrame) <= CLASH_WINDOW_FRAMES;
    }
    
    /// <summary>
    /// Get priority level for a move
    /// </summary>
    private AttackPriority GetMovePriority(Character character, string moveName)
    {
        if (character.Data?.Moves == null) return AttackPriority.Low;
        
        // Check supers first (highest priority)
        if (character.Data.Moves.Supers.ContainsKey(moveName))
        {
            return AttackPriority.Super;
        }
        
        // Check specials
        if (character.Data.Moves.Specials.ContainsKey(moveName))
        {
            var special = character.Data.Moves.Specials[moveName];
            if (special.Properties.Contains("throw") || special.Properties.Contains("command_grab"))
                return AttackPriority.Throw;
            return AttackPriority.Special;
        }
        
        // Check normals
        if (character.Data.Moves.Normals.ContainsKey(moveName))
        {
            var normal = character.Data.Moves.Normals[moveName];
            
            // Determine priority by move strength
            if (moveName.Contains("heavy") || normal.Damage >= 100)
                return AttackPriority.High;
            else if (moveName.Contains("medium") || normal.Damage >= 70)
                return AttackPriority.Medium;
            else
                return AttackPriority.Low;
        }
        
        return AttackPriority.Low;
    }
    
    /// <summary>
    /// Determine clash result based on priorities
    /// </summary>
    private ClashResult DetermineClashResult(AttackPriority priority1, AttackPriority priority2)
    {
        if (priority1 == priority2)
        {
            return ClashResult.MutualClash;
        }
        else if (priority1 > priority2)
        {
            return ClashResult.Player1Wins;
        }
        else
        {
            return ClashResult.Player2Wins;
        }
    }
    
    /// <summary>
    /// Execute clash effects
    /// </summary>
    private void ExecuteClash(ClashResult result, Character char1, Character char2, Vector2 position)
    {
        switch (result)
        {
            case ClashResult.MutualClash:
                HandleMutualClash(char1, char2, position);
                break;
                
            case ClashResult.Player1Wins:
                HandlePriorityWin(char1, char2, position);
                break;
                
            case ClashResult.Player2Wins:
                HandlePriorityWin(char2, char1, position);
                break;
        }
        
        EmitSignal(SignalName.ClashOccurred, (int)result, position);
    }
    
    /// <summary>
    /// Handle mutual clash (both attacks cancel)
    /// </summary>
    private void HandleMutualClash(Character char1, Character char2, Vector2 position)
    {
        // Both characters return to neutral
        char1.ChangeState(CharacterState.Idle);
        char2.ChangeState(CharacterState.Idle);
        
        // Push characters apart
        PushCharactersApart(char1, char2);
        
        // Both gain meter for clashing
        char1.GainMeter(10);
        char2.GainMeter(10);
        
        // Create visual effect
        CreateClashEffect(position, ClashResult.MutualClash);
        
        GD.Print("Mutual clash! Both attacks canceled.");
    }
    
    /// <summary>
    /// Handle priority win (one attack beats the other)
    /// </summary>
    private void HandlePriorityWin(Character winner, Character loser, Vector2 position)
    {
        // Winner continues their attack
        // Loser gets interrupted
        loser.ChangeState(CharacterState.Hit);
        
        // Winner gains meter bonus
        winner.GainMeter(15);
        
        // Loser takes minor clash damage
        loser.TakeDamage(25);
        
        // Create visual effect
        CreateClashEffect(position, ClashResult.Player1Wins); // Result will be determined by caller
        
        GD.Print($"{winner.CharacterId} wins priority clash against {loser.CharacterId}!");
    }
    
    /// <summary>
    /// Push characters apart during mutual clash
    /// </summary>
    private void PushCharactersApart(Character char1, Character char2)
    {
        Vector2 direction = (char2.GlobalPosition - char1.GlobalPosition).Normalized();
        float pushDistance = 50f;
        
        char1.Position -= direction * pushDistance;
        char2.Position += direction * pushDistance;
    }
    
    /// <summary>
    /// Create visual clash effect
    /// </summary>
    private void CreateClashEffect(Vector2 position, ClashResult result)
    {
        Color effectColor = result switch
        {
            ClashResult.MutualClash => Colors.White,
            ClashResult.Player1Wins => Colors.Blue,
            ClashResult.Player2Wins => Colors.Red,
            _ => Colors.Gray
        };
        
        string effectText = result switch
        {
            ClashResult.MutualClash => "CLASH!",
            ClashResult.Player1Wins => "P1 PRIORITY!",
            ClashResult.Player2Wins => "P2 PRIORITY!",
            _ => ""
        };
        
        GD.Print($"Clash Effect: {effectText} at {position}");
        
        // In a real implementation, this would create:
        // - Screen flash
        // - Particle effects
        // - Sound effects  
        // - Temporary slow motion for dramatic effect
    }
    
    /// <summary>
    /// Get clash advantage for character archetype
    /// </summary>
    public float GetClashAdvantage(Character character)
    {
        // Some archetypes may have clash advantages
        return character.Data?.Archetype switch
        {
            "technical" => 1.1f, // Technical characters get slight clash advantage
            "grappler" => 0.9f,  // Grapplers are worse at clashing
            _ => 1.0f
        };
    }
    
    /// <summary>
    /// Check if clash system is enabled
    /// </summary>
    public bool IsClashEnabled()
    {
        // Could be disabled by balance config or game mode
        return true;
    }
}