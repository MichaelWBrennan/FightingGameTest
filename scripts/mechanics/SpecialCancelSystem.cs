using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Special Cancel System inspired by Street Fighter II/Super Turbo
/// Enables normal-to-special and special-to-super cancels with distinct strategic purposes
/// </summary>
public partial class SpecialCancelSystem : Node
{
    public static SpecialCancelSystem Instance { get; private set; }
    
    public enum CancelType
    {
        NormalToSpecial,    // Cancel normal into special move
        SpecialToSuper,     // Cancel special into super move
        SpecialToSpecial,   // Cancel special into different special
        SuperCancel         // Cancel super into different super (rare)
    }
    
    public enum CancelWindow
    {
        Startup,    // Cancel during startup frames
        Active,     // Cancel during active frames (hit/block only)
        Recovery    // Cancel during recovery (specific moves only)
    }
    
    private Dictionary<int, PlayerCancelState> _playerCancelStates = new();
    
    // Cancel costs (distinct from Roman Cancel)
    private const int NORMAL_TO_SPECIAL_COST = 0;     // Free cancels for combos
    private const int SPECIAL_TO_SUPER_COST = 0;      // Free if meter available for super
    private const int SPECIAL_TO_SPECIAL_COST = 25;   // Meter cost for flexibility
    private const int SUPER_CANCEL_COST = 50;         // Expensive super cancels
    
    // Frame windows
    private const int DEFAULT_CANCEL_WINDOW = 4; // Frames to perform cancel
    private const int HIT_CONFIRM_WINDOW = 8;    // Extended window on hit
    
    [Signal]
    public delegate void CancelPerformedEventHandler(int playerId, CancelType type, string fromMove, string toMove);
    
    [Signal]
    public delegate void CancelChainExecutedEventHandler(int playerId, string moveChain);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializePlayers();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize cancel states for players
    /// </summary>
    private void InitializePlayers()
    {
        for (int i = 0; i < 2; i++)
        {
            _playerCancelStates[i] = new PlayerCancelState
            {
                PlayerId = i,
                CurrentCancelWindow = 0,
                LastMoveUsed = "",
                CancelChain = new List<string>(),
                HitConfirmed = false
            };
        }
    }
    
    /// <summary>
    /// Attempt to cancel current move into target move
    /// </summary>
    public bool TryCancel(Character character, string currentMove, string targetMove, CancelWindow window)
    {
        if (!CanPerformCancel(character, currentMove, targetMove, window)) return false;
        
        var cancelType = DetermineCancelType(character, currentMove, targetMove);
        int meterCost = GetCancelCost(cancelType);
        
        // Check meter requirement
        if (character.Meter < meterCost) return false;
        
        // Consume meter if required
        if (meterCost > 0)
        {
            character.ConsumeMeter(meterCost);
        }
        
        // Execute the cancel
        ExecuteCancel(character, currentMove, targetMove, cancelType, window);
        
        var state = _playerCancelStates[character.PlayerId];
        state.LastMoveUsed = targetMove;
        state.CancelChain.Add(targetMove);
        
        EmitSignal(SignalName.CancelPerformed, character.PlayerId, (int)cancelType, currentMove, targetMove);
        
        GD.Print($"{character.CharacterId} canceled {currentMove} into {targetMove}");
        return true;
    }
    
    /// <summary>
    /// Check if cancel is possible
    /// </summary>
    private bool CanPerformCancel(Character character, string currentMove, string targetMove, CancelWindow window)
    {
        // Must be in attacking state
        if (character.CurrentState != CharacterState.Attacking) return false;
        
        // Check if current move is cancelable
        if (!IsMoveCancelable(character, currentMove, window)) return false;
        
        // Check if target move exists and is available
        if (!IsTargetMoveValid(character, targetMove)) return false;
        
        // Check cancel chain limitations (prevent infinite cancels)
        var state = _playerCancelStates[character.PlayerId];
        if (state.CancelChain.Count >= GetMaxCancelChain(character)) return false;
        
        return true;
    }
    
    /// <summary>
    /// Determine the type of cancel being performed
    /// </summary>
    private CancelType DetermineCancelType(Character character, string currentMove, string targetMove)
    {
        bool currentIsNormal = character.Data?.Moves?.Normals?.ContainsKey(currentMove) ?? false;
        bool currentIsSpecial = character.Data?.Moves?.Specials?.ContainsKey(currentMove) ?? false;
        bool currentIsSuper = character.Data?.Moves?.Supers?.ContainsKey(currentMove) ?? false;
        
        bool targetIsSpecial = character.Data?.Moves?.Specials?.ContainsKey(targetMove) ?? false;
        bool targetIsSuper = character.Data?.Moves?.Supers?.ContainsKey(targetMove) ?? false;
        
        if (currentIsNormal && targetIsSpecial)
            return CancelType.NormalToSpecial;
        else if (currentIsSpecial && targetIsSuper)
            return CancelType.SpecialToSuper;
        else if (currentIsSpecial && targetIsSpecial)
            return CancelType.SpecialToSpecial;
        else if (currentIsSuper && targetIsSuper)
            return CancelType.SuperCancel;
        
        return CancelType.NormalToSpecial; // Default
    }
    
    /// <summary>
    /// Get meter cost for cancel type
    /// </summary>
    private int GetCancelCost(CancelType type)
    {
        var config = BalanceManager.Instance?.GetCurrentConfig();
        float multiplier = config?.SystemAdjustments?.MeterSystem?.SuperCostMultiplier ?? 1.0f;
        
        int baseCost = type switch
        {
            CancelType.NormalToSpecial => NORMAL_TO_SPECIAL_COST,
            CancelType.SpecialToSuper => SPECIAL_TO_SUPER_COST,
            CancelType.SpecialToSpecial => SPECIAL_TO_SPECIAL_COST,
            CancelType.SuperCancel => SUPER_CANCEL_COST,
            _ => 0
        };
        
        return (int)(baseCost * multiplier);
    }
    
    /// <summary>
    /// Check if move can be canceled in the given window
    /// </summary>
    private bool IsMoveCancelable(Character character, string moveName, CancelWindow window)
    {
        if (character.Data?.Moves == null) return false;
        
        MoveData moveData = null;
        
        // Find the move data
        if (character.Data.Moves.Normals.ContainsKey(moveName))
            moveData = character.Data.Moves.Normals[moveName];
        else if (character.Data.Moves.Specials.ContainsKey(moveName))
            moveData = character.Data.Moves.Specials[moveName];
        else if (character.Data.Moves.Supers.ContainsKey(moveName))
            moveData = character.Data.Moves.Supers[moveName];
        
        if (moveData == null) return false;
        
        // Check if move has cancelable property
        if (!moveData.Properties.Contains("cancelable")) return false;
        
        // Check window-specific cancels
        return window switch
        {
            CancelWindow.Startup => moveData.Properties.Contains("startup_cancelable"),
            CancelWindow.Active => moveData.Properties.Contains("cancelable"), // Standard cancel
            CancelWindow.Recovery => moveData.Properties.Contains("recovery_cancelable"),
            _ => false
        };
    }
    
    /// <summary>
    /// Check if target move is valid for cancel
    /// </summary>
    private bool IsTargetMoveValid(Character character, string targetMove)
    {
        if (character.Data?.Moves == null) return false;
        
        // Check if move exists
        bool exists = character.Data.Moves.Normals.ContainsKey(targetMove) ||
                     character.Data.Moves.Specials.ContainsKey(targetMove) ||
                     character.Data.Moves.Supers.ContainsKey(targetMove);
        
        if (!exists) return false;
        
        // Check if move is disabled by balance system
        if (BalanceManager.Instance?.IsMoveDisabled(character.CharacterId, targetMove) == true)
            return false;
        
        return true;
    }
    
    /// <summary>
    /// Get maximum cancel chain length for character archetype
    /// </summary>
    private int GetMaxCancelChain(Character character)
    {
        return character.Data?.Archetype switch
        {
            "technical" => 4,   // Technical characters get longer chains
            "rushdown" => 3,    // Rushdown gets good chains
            "shoto" => 2,       // Shotos get standard chains
            "grappler" => 1,    // Grapplers get minimal chains
            "zoner" => 2,       // Zoners get standard chains
            _ => 2              // Default
        };
    }
    
    /// <summary>
    /// Execute the cancel
    /// </summary>
    private void ExecuteCancel(Character character, string currentMove, string targetMove, CancelType type, CancelWindow window)
    {
        // Create cancel effect
        CreateCancelEffect(character.GlobalPosition, type, currentMove, targetMove);
        
        // Apply cancel-specific mechanics
        switch (type)
        {
            case CancelType.NormalToSpecial:
                ExecuteNormalToSpecialCancel(character, currentMove, targetMove);
                break;
                
            case CancelType.SpecialToSuper:
                ExecuteSpecialToSuperCancel(character, currentMove, targetMove);
                break;
                
            case CancelType.SpecialToSpecial:
                ExecuteSpecialToSpecialCancel(character, currentMove, targetMove);
                break;
                
            case CancelType.SuperCancel:
                ExecuteSuperCancel(character, currentMove, targetMove);
                break;
        }
    }
    
    /// <summary>
    /// Execute normal to special cancel
    /// </summary>
    private void ExecuteNormalToSpecialCancel(Character character, string normal, string special)
    {
        // Immediate transition with combo advantage
        // This maintains combo scaling and timing
        
        GD.Print($"Normal to special cancel: {normal} → {special}");
    }
    
    /// <summary>
    /// Execute special to super cancel
    /// </summary>
    private void ExecuteSpecialToSuperCancel(Character character, string special, string super)
    {
        // Enhanced super properties when canceled into
        // More damage, invincibility, or additional hits
        
        GD.Print($"Special to super cancel: {special} → {super}");
    }
    
    /// <summary>
    /// Execute special to special cancel
    /// </summary>
    private void ExecuteSpecialToSpecialCancel(Character character, string special1, String special2)
    {
        // Flexible movement and combo options
        // Costs meter for enhanced flexibility
        
        GD.Print($"Special to special cancel: {special1} → {special2}");
    }
    
    /// <summary>
    /// Execute super cancel
    /// </summary>
    private void ExecuteSuperCancel(Character character, string super1, string super2)
    {
        // Rare, expensive cancels for maximum damage
        // Dramatic visual effects
        
        GD.Print($"Super cancel: {super1} → {super2}");
    }
    
    /// <summary>
    /// Create cancel visual effects
    /// </summary>
    private void CreateCancelEffect(Vector2 position, CancelType type, string fromMove, string toMove)
    {
        Color effectColor = type switch
        {
            CancelType.NormalToSpecial => Colors.Blue,
            CancelType.SpecialToSuper => Colors.Red,
            CancelType.SpecialToSpecial => Colors.Green,
            CancelType.SuperCancel => Colors.Purple,
            _ => Colors.White
        };
        
        GD.Print($"Cancel Effect: {type} from {fromMove} to {toMove} at {position}");
        
        // In real implementation, this would create:
        // - Flash effects
        // - Trail effects
        // - Sound effects
        // - Screen freeze for dramatic cancels
    }
    
    /// <summary>
    /// Mark hit confirm for extended cancel windows
    /// </summary>
    public void MarkHitConfirm(int playerId, bool confirmed)
    {
        if (_playerCancelStates.ContainsKey(playerId))
        {
            _playerCancelStates[playerId].HitConfirmed = confirmed;
        }
    }
    
    /// <summary>
    /// Reset cancel chain (called at round start or after combo ends)
    /// </summary>
    public void ResetCancelChain(int playerId)
    {
        if (_playerCancelStates.ContainsKey(playerId))
        {
            var state = _playerCancelStates[playerId];
            state.CancelChain.Clear();
            state.CurrentCancelWindow = 0;
            state.HitConfirmed = false;
        }
    }
    
    /// <summary>
    /// Get current cancel chain for player
    /// </summary>
    public List<string> GetCancelChain(int playerId)
    {
        return _playerCancelStates.GetValueOrDefault(playerId)?.CancelChain ?? new List<string>();
    }
    
    /// <summary>
    /// Check if special cancel system is enabled
    /// </summary>
    public bool IsSpecialCancelEnabled()
    {
        return BalanceManager.Instance?.GetCurrentConfig()?.SystemAdjustments?.ComboScaling?.Enabled ?? true;
    }
}

/// <summary>
/// Cancel state tracking for a player
/// </summary>
public class PlayerCancelState
{
    public int PlayerId { get; set; }
    public int CurrentCancelWindow { get; set; } = 0;
    public string LastMoveUsed { get; set; } = "";
    public List<string> CancelChain { get; set; } = new();
    public bool HitConfirmed { get; set; } = false;
}