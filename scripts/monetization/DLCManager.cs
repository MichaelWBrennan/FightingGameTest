using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Fighter Access Manager - All fighters are free and permanently available
/// Replaces old DLC system to align with gacha-free monetization approach
/// </summary>
public partial class DLCManager : Node
{
    public static DLCManager Instance { get; private set; }
    
    private Dictionary<string, bool> _availableFighters = new();
    private Dictionary<string, FighterInfo> _fighterCatalog = new();
    private const string FIGHTER_DATA_FILE = "user://fighter_availability.json";
    
    [Signal]
    public delegate void FighterUnlockedEventHandler(string fighterId);
    
    [Signal]
    public delegate void AllFightersAvailableEventHandler();
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeFighterCatalog();
            LoadFighterData();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize fighter catalog - all fighters are permanently free
    /// </summary>
    private void InitializeFighterCatalog()
    {
        // All fighters are permanently available and free
        _fighterCatalog["ryu"] = new FighterInfo
        {
            FighterId = "ryu",
            Name = "Ryu",
            Description = "A wandering warrior who trains constantly to become a true martial artist",
            Archetype = "Shoto",
            Complexity = "Beginner",
            IsFree = true,
            IsAvailable = true,
            ReleaseDate = DateTime.Parse("2024-08-01")
        };
        
        _fighterCatalog["chun_li"] = new FighterInfo
        {
            FighterId = "chun_li",
            Name = "Chun-Li",
            Description = "An ICPO officer seeking to bring criminals to justice",
            Archetype = "Rushdown",
            Complexity = "Intermediate",
            IsFree = true,
            IsAvailable = true,
            ReleaseDate = DateTime.Parse("2024-08-01")
        };
        
        _fighterCatalog["ken"] = new FighterInfo
        {
            FighterId = "ken",
            Name = "Ken Masters",
            Description = "Ryu's best friend and rival with a flamboyant fighting style",
            Archetype = "Shoto",
            Complexity = "Intermediate",
            IsFree = true,
            IsAvailable = true,
            ReleaseDate = DateTime.Parse("2024-08-01")
        };
        
        _fighterCatalog["zangief"] = new FighterInfo
        {
            FighterId = "zangief",
            Name = "Zangief",
            Description = "The Red Cyclone, a professional wrestler from Russia",
            Archetype = "Grappler",
            Complexity = "Advanced",
            IsFree = true,
            IsAvailable = true,
            ReleaseDate = DateTime.Parse("2024-08-01")
        };
        
        // Make all fighters available immediately
        foreach (var fighter in _fighterCatalog.Keys)
        {
            _availableFighters[fighter] = true;
        }
        
        GD.Print($"Fighter catalog initialized: {_fighterCatalog.Count} free fighters available");
        EmitSignal(SignalName.AllFightersAvailable);
    }
    
    /// <summary>
    /// Check if fighter is available (all fighters are always free)
    /// </summary>
    public bool IsFighterAvailable(string fighterId)
    {
        return _availableFighters.GetValueOrDefault(fighterId, false);
    }
    
    /// <summary>
    /// All fighters are free - compatibility method with old API
    /// </summary>
    public bool IsCharacterOwned(string characterId)
    {
        return _availableFighters.GetValueOrDefault(characterId, false);
    }
    
    /// <summary>
    /// All fighters are accessible - compatibility method
    /// </summary>
    public bool CanPlayerAccessCharacter(string characterId, string playerId = "player1")
    {
        return IsFighterAvailable(characterId);
    }
    
    /// <summary>
    /// No weekly rotation needed - all fighters are permanently free
    /// </summary>
    public string GetWeeklyFreeFighter(string playerId = "player1")
    {
        // Return first available fighter as a placeholder
        foreach (var fighter in _availableFighters.Keys)
        {
            if (_availableFighters[fighter])
            {
                return fighter;
            }
        }
        return "";
    }
    
    /// <summary>
    /// All fighters are permanently owned - no validation needed
    /// </summary>
    public bool ValidateCharacterForMatch(string characterId, int playerId)
    {
        bool isAvailable = IsFighterAvailable(characterId);
        
        if (!isAvailable)
        {
            ShowFighterNotAvailableDialog(characterId);
        }
        
        return isAvailable;
    }
    
    /// <summary>
    /// Show dialog for unavailable fighter (should rarely happen)
    /// </summary>
    private void ShowFighterNotAvailableDialog(string fighterId)
    {
        if (_fighterCatalog.ContainsKey(fighterId))
        {
            var fighter = _fighterCatalog[fighterId];
            
            var dialog = new AcceptDialog();
            dialog.Title = "Fighter Not Available";
            dialog.DialogText = $"{fighter.Name} is not yet available.\n\nThis fighter will be added in a future update!";
            
            GetTree().Root.AddChild(dialog);
            dialog.PopupCentered();
        }
    }
    
    /// <summary>
    /// Get all available fighters
    /// </summary>
    public List<FighterInfo> GetAvailableFighters()
    {
        var available = new List<FighterInfo>();
        
        foreach (var fighter in _fighterCatalog.Values)
        {
            if (fighter.IsAvailable)
            {
                available.Add(fighter);
            }
        }
        
        return available;
    }
    
    /// <summary>
    /// Get fighter information
    /// </summary>
    public FighterInfo GetFighterInfo(string fighterId)
    {
        return _fighterCatalog.GetValueOrDefault(fighterId);
    }
    
    /// <summary>
    /// Add new fighter to catalog (for content updates)
    /// </summary>
    public void AddNewFighter(FighterInfo fighterInfo)
    {
        _fighterCatalog[fighterInfo.FighterId] = fighterInfo;
        _availableFighters[fighterInfo.FighterId] = fighterInfo.IsAvailable;
        
        if (fighterInfo.IsAvailable)
        {
            EmitSignal(SignalName.FighterUnlocked, fighterInfo.FighterId);
            ShowNewFighterDialog(fighterInfo);
        }
        
        SaveFighterData();
        GD.Print($"New fighter added: {fighterInfo.Name}");
    }
    
    /// <summary>
    /// Show new fighter announcement
    /// </summary>
    private void ShowNewFighterDialog(FighterInfo fighter)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "New Fighter Available!";
        dialog.DialogText = $"{fighter.Name} has joined the roster!\n\n{fighter.Description}\n\nArchetype: {fighter.Archetype}\nComplexity: {fighter.Complexity}";
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }
    
    /// <summary>
    /// Get fighter statistics
    /// </summary>
    public FighterStats GetFighterStats()
    {
        var stats = new FighterStats
        {
            TotalFighters = _fighterCatalog.Count,
            AvailableFighters = _availableFighters.Values.Where(v => v).Count(),
            FightersByArchetype = new Dictionary<string, int>(),
            FightersByComplexity = new Dictionary<string, int>()
        };
        
        foreach (var fighter in _fighterCatalog.Values)
        {
            if (fighter.IsAvailable)
            {
                // Count by archetype
                if (!stats.FightersByArchetype.ContainsKey(fighter.Archetype))
                {
                    stats.FightersByArchetype[fighter.Archetype] = 0;
                }
                stats.FightersByArchetype[fighter.Archetype]++;
                
                // Count by complexity
                if (!stats.FightersByComplexity.ContainsKey(fighter.Complexity))
                {
                    stats.FightersByComplexity[fighter.Complexity] = 0;
                }
                stats.FightersByComplexity[fighter.Complexity]++;
            }
        }
        
        return stats;
    }
    
    /// <summary>
    /// Save fighter availability data
    /// </summary>
    private void SaveFighterData()
    {
        try
        {
            var data = new FighterSaveData
            {
                AvailableFighters = _availableFighters,
                FighterCatalog = _fighterCatalog,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(FIGHTER_DATA_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
            
            GD.Print("Fighter data saved");
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save fighter data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load fighter availability data
    /// </summary>
    private void LoadFighterData()
    {
        try
        {
            if (FileAccess.FileExists(FIGHTER_DATA_FILE))
            {
                using var file = FileAccess.Open(FIGHTER_DATA_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<FighterSaveData>(jsonText);
                
                // Only load if we have saved data, otherwise use initialized catalog
                if (data.FighterCatalog?.Count > 0)
                {
                    _fighterCatalog = data.FighterCatalog;
                    _availableFighters = data.AvailableFighters ?? new();
                }
                
                GD.Print("Fighter data loaded");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load fighter data: {e.Message}");
        }
    }
}
// Data structures for free fighter system
public class FighterInfo
{
    public string FighterId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Archetype { get; set; } = "";
    public string Complexity { get; set; } = "";
    public bool IsFree { get; set; } = true; // All fighters are free
    public bool IsAvailable { get; set; } = true;
    public DateTime ReleaseDate { get; set; }
}

public class FighterStats
{
    public int TotalFighters { get; set; }
    public int AvailableFighters { get; set; }
    public Dictionary<string, int> FightersByArchetype { get; set; } = new();
    public Dictionary<string, int> FightersByComplexity { get; set; } = new();
}

public class FighterSaveData
{
    public Dictionary<string, bool> AvailableFighters { get; set; } = new();
    public Dictionary<string, FighterInfo> FighterCatalog { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}