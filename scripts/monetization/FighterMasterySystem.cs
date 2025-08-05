using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Per-Fighter Mastery Progression System
/// Unlocks purely cosmetic rewards based on playtime, loyalty, and skill mastery
/// No monetization - rewards earned through dedication only
/// </summary>
public partial class FighterMasterySystem : Node
{
    public static FighterMasterySystem Instance { get; private set; }
    
    private Dictionary<string, Dictionary<string, FighterMasteryData>> _playerMastery = new(); // [playerId][fighterId]
    private Dictionary<string, FighterMasteryConfig> _fighterConfigs = new();
    private const string MASTERY_DATA_FILE = "user://fighter_mastery.json";
    
    [Signal]
    public delegate void MasteryLevelUpEventHandler(string playerId, string fighterId, int newLevel);
    
    [Signal]
    public delegate void MasteryRewardUnlockedEventHandler(string playerId, string fighterId, string rewardId);
    
    [Signal]
    public delegate void MasteryMilestoneReachedEventHandler(string playerId, string fighterId, string milestone);

    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeFighterConfigs();
            LoadMasteryData();
        }
        else
        {
            QueueFree();
        }
    }

    /// <summary>
    /// Initialize mastery configurations for all fighters
    /// </summary>
    private void InitializeFighterConfigs()
    {
        // Ryu mastery config
        _fighterConfigs["ryu"] = new FighterMasteryConfig
        {
            FighterId = "ryu",
            Name = "Ryu",
            MaxLevel = 100,
            XPCurve = GenerateXPCurve(100),
            Rewards = GenerateRyuRewards()
        };

        // Chun-Li mastery config  
        _fighterConfigs["chun_li"] = new FighterMasteryConfig
        {
            FighterId = "chun_li",
            Name = "Chun-Li",
            MaxLevel = 100,
            XPCurve = GenerateXPCurve(100),
            Rewards = GenerateChunLiRewards()
        };

        // Ken mastery config
        _fighterConfigs["ken"] = new FighterMasteryConfig
        {
            FighterId = "ken",
            Name = "Ken",
            MaxLevel = 100,
            XPCurve = GenerateXPCurve(100),
            Rewards = GenerateKenRewards()
        };

        // Zangief mastery config
        _fighterConfigs["zangief"] = new FighterMasteryConfig
        {
            FighterId = "zangief",
            Name = "Zangief",
            MaxLevel = 100,
            XPCurve = GenerateXPCurve(100),
            Rewards = GenerateZangiefRewards()
        };

        GD.Print($"Fighter mastery configs initialized for {_fighterConfigs.Count} fighters");
    }

    /// <summary>
    /// Generate XP curve for levels 1-maxLevel
    /// </summary>
    private Dictionary<int, int> GenerateXPCurve(int maxLevel)
    {
        var curve = new Dictionary<int, int>();
        
        for (int level = 1; level <= maxLevel; level++)
        {
            // Exponential curve with some smoothing
            var baseXP = 100;
            var multiplier = Math.Pow(1.1, level - 1);
            curve[level] = (int)(baseXP * multiplier);
        }
        
        return curve;
    }

    private List<MasteryReward> GenerateRyuRewards()
    {
        return new List<MasteryReward>
        {
            // Early levels - basic customizations
            new() { Level = 5, RewardType = "nameplate", RewardId = "ryu_student", Name = "Student of Martial Arts", Description = "Basic nameplate showing dedication" },
            new() { Level = 10, RewardType = "color_variant", RewardId = "ryu_red_gi", Name = "Red Training Gi", Description = "Alternate color scheme" },
            new() { Level = 15, RewardType = "intro_pose", RewardId = "ryu_meditation", Name = "Meditation Intro", Description = "Serene pre-match pose" },
            
            // Mid levels - special effects
            new() { Level = 25, RewardType = "hadouken_effect", RewardId = "ryu_blue_hadouken", Name = "Azure Hadouken", Description = "Blue-tinted energy projectile" },
            new() { Level = 35, RewardType = "victory_pose", RewardId = "ryu_bow_victory", Name = "Respectful Victory", Description = "Traditional martial arts bow" },
            new() { Level = 50, RewardType = "nameplate", RewardId = "ryu_warrior", Name = "Dedicated Warrior", Description = "Advanced nameplate with special effects" },
            
            // High levels - unique content
            new() { Level = 75, RewardType = "aura_effect", RewardId = "ryu_ki_aura", Name = "Fighting Spirit Aura", Description = "Visible ki energy emanating from fighter" },
            new() { Level = 90, RewardType = "legendary_intro", RewardId = "ryu_master_entrance", Name = "Master's Entrance", Description = "Elaborate entrance befitting a true master" },
            new() { Level = 100, RewardType = "ultimate_reward", RewardId = "ryu_true_master", Name = "True Master of Martial Arts", Description = "Ultimate recognition - complete visual transformation" }
        };
    }

    private List<MasteryReward> GenerateChunLiRewards()
    {
        return new List<MasteryReward>
        {
            new() { Level = 5, RewardType = "nameplate", RewardId = "chunli_officer", Name = "ICPO Officer", Description = "Law enforcement credentials" },
            new() { Level = 10, RewardType = "color_variant", RewardId = "chunli_blue_qipao", Name = "Azure Qipao", Description = "Elegant blue variant" },
            new() { Level = 15, RewardType = "intro_pose", RewardId = "chunli_stretching", Name = "Pre-Fight Stretching", Description = "Athletic warm-up routine" },
            new() { Level = 25, RewardType = "kikoken_effect", RewardId = "chunli_rainbow_kikoken", Name = "Rainbow Kikoken", Description = "Multi-colored energy projectile" },
            new() { Level = 35, RewardType = "victory_pose", RewardId = "chunli_justice_victory", Name = "Justice Served", Description = "Authoritative victory stance" },
            new() { Level = 50, RewardType = "nameplate", RewardId = "chunli_detective", Name = "Master Detective", Description = "Advanced investigator credentials" },
            new() { Level = 75, RewardType = "spinning_effect", RewardId = "chunli_lightning_legs", Name = "Lightning Leg Aura", Description = "Electric effects on rapid kicks" },
            new() { Level = 90, RewardType = "legendary_intro", RewardId = "chunli_helicopter_entrance", Name = "Helicopter Arrival", Description = "Dramatic arrival from above" },
            new() { Level = 100, RewardType = "ultimate_reward", RewardId = "chunli_justice_incarnate", Name = "Justice Incarnate", Description = "Ultimate law enforcement transformation" }
        };
    }

    private List<MasteryReward> GenerateKenRewards()
    {
        return new List<MasteryReward>
        {
            new() { Level = 5, RewardType = "nameplate", RewardId = "ken_student", Name = "Shoto Student", Description = "Following in Ryu's footsteps" },
            new() { Level = 10, RewardType = "color_variant", RewardId = "ken_black_gi", Name = "Shadow Training Gi", Description = "Sleek black variant" },
            new() { Level = 15, RewardType = "intro_pose", RewardId = "ken_hair_flip", Name = "Signature Hair Flip", Description = "Iconic pre-fight styling" },
            new() { Level = 25, RewardType = "hadouken_effect", RewardId = "ken_fire_hadouken", Name = "Flaming Hadouken", Description = "Fire-infused energy projectile" },
            new() { Level = 35, RewardType = "victory_pose", RewardId = "ken_thumbs_up", Name = "Confident Victory", Description = "Charismatic victory gesture" },
            new() { Level = 50, RewardType = "nameplate", RewardId = "ken_champion", Name = "Tournament Champion", Description = "Competitive achievement display" },
            new() { Level = 75, RewardType = "flame_aura", RewardId = "ken_burning_spirit", Name = "Burning Fighting Spirit", Description = "Fiery aura effect" },
            new() { Level = 90, RewardType = "legendary_intro", RewardId = "ken_motorcycle_entrance", Name = "Motorcycle Arrival", Description = "Stylish entrance on custom bike" },
            new() { Level = 100, RewardType = "ultimate_reward", RewardId = "ken_flame_master", Name = "Master of Flames", Description = "Ultimate fire-based transformation" }
        };
    }

    private List<MasteryReward> GenerateZangiefRewards()
    {
        return new List<MasteryReward>
        {
            new() { Level = 5, RewardType = "nameplate", RewardId = "zangief_wrestler", Name = "Professional Wrestler", Description = "Wrestling credentials" },
            new() { Level = 10, RewardType = "color_variant", RewardId = "zangief_blue_trunks", Name = "Championship Blue", Description = "Blue wrestling attire" },
            new() { Level = 15, RewardType = "intro_pose", RewardId = "zangief_flex", Name = "Muscle Showcase", Description = "Intimidating muscle display" },
            new() { Level = 25, RewardType = "grapple_effect", RewardId = "zangief_iron_grips", Name = "Iron Grip Effect", Description = "Metallic glow on grappling moves" },
            new() { Level = 35, RewardType = "victory_pose", RewardId = "zangief_muscle_victory", Name = "Strongman Victory", Description = "Powerful victory flex" },
            new() { Level = 50, RewardType = "nameplate", RewardId = "zangief_champion", Name = "Wrestling Champion", Description = "Championship belt nameplate" },
            new() { Level = 75, RewardType = "scars_effect", RewardId = "zangief_battle_scars", Name = "Battle-Tested Scars", Description = "Visible marks of countless battles" },
            new() { Level = 90, RewardType = "legendary_intro", RewardId = "zangief_ring_entrance", Name = "Wrestling Ring Entrance", Description = "Grand wrestling arena entrance" },
            new() { Level = 100, RewardType = "ultimate_reward", RewardId = "zangief_iron_body", Name = "Body of Iron", Description = "Ultimate physical conditioning transformation" }
        };
    }

    /// <summary>
    /// Get or create mastery data for player and fighter
    /// </summary>
    private FighterMasteryData GetMasteryData(string playerId, string fighterId)
    {
        if (!_playerMastery.ContainsKey(playerId))
        {
            _playerMastery[playerId] = new Dictionary<string, FighterMasteryData>();
        }

        if (!_playerMastery[playerId].ContainsKey(fighterId))
        {
            _playerMastery[playerId][fighterId] = new FighterMasteryData
            {
                PlayerId = playerId,
                FighterId = fighterId,
                Level = 1,
                CurrentXP = 0,
                FirstPlayDate = DateTime.UtcNow,
                LastPlayDate = DateTime.UtcNow
            };
        }

        return _playerMastery[playerId][fighterId];
    }

    /// <summary>
    /// Award mastery XP for various actions
    /// </summary>
    public void AwardMasteryXP(string playerId, string fighterId, int xpAmount, string source = "match")
    {
        if (!_fighterConfigs.ContainsKey(fighterId))
        {
            GD.PrintErr($"Fighter config not found: {fighterId}");
            return;
        }

        var masteryData = GetMasteryData(playerId, fighterId);
        var config = _fighterConfigs[fighterId];
        var oldLevel = masteryData.Level;

        masteryData.CurrentXP += xpAmount;
        masteryData.LastPlayDate = DateTime.UtcNow;
        masteryData.TotalXPEarned += xpAmount;

        // Track different XP sources
        if (!masteryData.XPSources.ContainsKey(source))
        {
            masteryData.XPSources[source] = 0;
        }
        masteryData.XPSources[source] += xpAmount;

        // Check for level ups
        var newLevel = CalculateLevel(masteryData.CurrentXP, config);
        if (newLevel > oldLevel && newLevel <= config.MaxLevel)
        {
            masteryData.Level = newLevel;
            OnLevelUp(playerId, fighterId, newLevel);
            
            // Check for milestone achievements
            CheckMilestones(playerId, fighterId, masteryData);
        }

        SaveMasteryData();
        GD.Print($"Awarded {xpAmount} mastery XP to {playerId} for {fighterId} from {source}. Level: {masteryData.Level}");
    }

    /// <summary>
    /// Calculate level based on current XP
    /// </summary>
    private int CalculateLevel(int currentXP, FighterMasteryConfig config)
    {
        int level = 1;
        int totalXPNeeded = 0;

        for (int i = 1; i <= config.MaxLevel; i++)
        {
            totalXPNeeded += config.XPCurve[i];
            if (currentXP >= totalXPNeeded)
            {
                level = i + 1;
            }
            else
            {
                break;
            }
        }

        return Math.Min(level, config.MaxLevel);
    }

    /// <summary>
    /// Handle level up and reward unlocking
    /// </summary>
    private void OnLevelUp(string playerId, string fighterId, int newLevel)
    {
        EmitSignal(SignalName.MasteryLevelUp, playerId, fighterId, newLevel);

        var config = _fighterConfigs[fighterId];
        var masteryData = GetMasteryData(playerId, fighterId);

        // Check for rewards at this level
        var rewards = config.Rewards.Where(r => r.Level == newLevel);
        foreach (var reward in rewards)
        {
            UnlockReward(playerId, fighterId, reward);
        }

        GD.Print($"Fighter mastery level up: {playerId} - {fighterId} reached level {newLevel}");
    }

    /// <summary>
    /// Unlock mastery reward
    /// </summary>
    private void UnlockReward(string playerId, string fighterId, MasteryReward reward)
    {
        var masteryData = GetMasteryData(playerId, fighterId);
        
        if (!masteryData.UnlockedRewards.Contains(reward.RewardId))
        {
            masteryData.UnlockedRewards.Add(reward.RewardId);
            EmitSignal(SignalName.MasteryRewardUnlocked, playerId, fighterId, reward.RewardId);
            
            ShowRewardUnlockedDialog(fighterId, reward);
            GD.Print($"Mastery reward unlocked: {reward.Name} for {playerId}/{fighterId}");
        }
    }

    /// <summary>
    /// Check for milestone achievements
    /// </summary>
    private void CheckMilestones(string playerId, string fighterId, FighterMasteryData masteryData)
    {
        var milestones = new List<(string id, string name, Func<FighterMasteryData, bool> condition)>
        {
            ("devotee", "Fighter Devotee", data => data.Level >= 25),
            ("expert", "Fighter Expert", data => data.Level >= 50),
            ("master", "Fighter Master", data => data.Level >= 75),
            ("legend", "Fighter Legend", data => data.Level >= 100),
            ("dedicated", "Dedicated Student", data => (DateTime.UtcNow - data.FirstPlayDate).TotalDays >= 30),
            ("loyal", "Loyal Fighter", data => (DateTime.UtcNow - data.FirstPlayDate).TotalDays >= 90),
            ("diverse_learner", "Diverse Learner", data => data.XPSources.Count >= 5)
        };

        foreach (var (id, name, condition) in milestones)
        {
            if (!masteryData.Milestones.Contains(id) && condition(masteryData))
            {
                masteryData.Milestones.Add(id);
                EmitSignal(SignalName.MasteryMilestoneReached, playerId, fighterId, id);
                ShowMilestoneReachedDialog(fighterId, name);
            }
        }
    }

    /// <summary>
    /// Track specific fighter usage events
    /// </summary>
    public void TrackFighterEvent(string playerId, string fighterId, string eventType, Dictionary<string, object> data = null)
    {
        var masteryData = GetMasteryData(playerId, fighterId);
        
        // Track event statistics
        if (!masteryData.EventStats.ContainsKey(eventType))
        {
            masteryData.EventStats[eventType] = 0;
        }
        masteryData.EventStats[eventType]++;

        // Award XP based on event type
        var xpAward = eventType switch
        {
            "match_played" => 50,
            "match_won" => 75,
            "perfect_round" => 100,
            "special_move_used" => 10,
            "super_move_used" => 25,
            "combo_performed" => 15,
            "counter_hit" => 20,
            "reversal" => 30,
            _ => 5
        };

        AwardMasteryXP(playerId, fighterId, xpAward, eventType);
    }

    /// <summary>
    /// Get player's mastery status for a fighter
    /// </summary>
    public MasteryStatus GetMasteryStatus(string playerId, string fighterId)
    {
        if (!_fighterConfigs.ContainsKey(fighterId))
        {
            return null;
        }

        var masteryData = GetMasteryData(playerId, fighterId);
        var config = _fighterConfigs[fighterId];
        
        var xpForCurrentLevel = GetXPForLevel(masteryData.Level, config);
        var xpForNextLevel = masteryData.Level < config.MaxLevel ? GetXPForLevel(masteryData.Level + 1, config) : xpForCurrentLevel;
        var xpIntoCurrentLevel = masteryData.CurrentXP - GetTotalXPForLevel(masteryData.Level - 1, config);
        var xpNeededForNext = xpForNextLevel - xpForCurrentLevel;

        return new MasteryStatus
        {
            FighterId = fighterId,
            FighterName = config.Name,
            Level = masteryData.Level,
            MaxLevel = config.MaxLevel,
            CurrentXP = masteryData.CurrentXP,
            XPIntoCurrentLevel = Math.Max(0, xpIntoCurrentLevel),
            XPNeededForNextLevel = masteryData.Level < config.MaxLevel ? Math.Max(0, xpNeededForNext - xpIntoCurrentLevel) : 0,
            UnlockedRewards = new List<string>(masteryData.UnlockedRewards),
            Milestones = new List<string>(masteryData.Milestones),
            DaysPlaying = (DateTime.UtcNow - masteryData.FirstPlayDate).Days,
            EventStats = new Dictionary<string, int>(masteryData.EventStats)
        };
    }

    private int GetXPForLevel(int level, FighterMasteryConfig config)
    {
        return config.XPCurve.GetValueOrDefault(level, 0);
    }

    private int GetTotalXPForLevel(int level, FighterMasteryConfig config)
    {
        int total = 0;
        for (int i = 1; i <= level; i++)
        {
            total += GetXPForLevel(i, config);
        }
        return total;
    }

    /// <summary>
    /// Get all fighter mastery statuses for a player
    /// </summary>
    public List<MasteryStatus> GetAllMasteryStatus(string playerId)
    {
        var statuses = new List<MasteryStatus>();
        
        foreach (var fighterId in _fighterConfigs.Keys)
        {
            statuses.Add(GetMasteryStatus(playerId, fighterId));
        }
        
        return statuses.OrderByDescending(s => s.Level).ThenByDescending(s => s.CurrentXP).ToList();
    }

    /// <summary>
    /// Get leaderboard for a specific fighter
    /// </summary>
    public List<MasteryLeaderboardEntry> GetFighterLeaderboard(string fighterId, int limit = 10)
    {
        var entries = new List<MasteryLeaderboardEntry>();
        
        foreach (var playerId in _playerMastery.Keys)
        {
            if (_playerMastery[playerId].ContainsKey(fighterId))
            {
                var masteryData = _playerMastery[playerId][fighterId];
                entries.Add(new MasteryLeaderboardEntry
                {
                    PlayerId = playerId,
                    FighterId = fighterId,
                    Level = masteryData.Level,
                    TotalXP = masteryData.TotalXPEarned,
                    DaysPlaying = (DateTime.UtcNow - masteryData.FirstPlayDate).Days
                });
            }
        }
        
        return entries.OrderByDescending(e => e.Level)
                     .ThenByDescending(e => e.TotalXP)
                     .Take(limit)
                     .ToList();
    }

    // UI Dialog methods
    private void ShowRewardUnlockedDialog(string fighterId, MasteryReward reward)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Mastery Reward Unlocked!";
        dialog.DialogText = $"🏆 {reward.Name}\n\n{reward.Description}\n\nUnlocked through dedication to {_fighterConfigs[fighterId].Name}!";
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ShowMilestoneReachedDialog(string fighterId, string milestoneName)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Milestone Achieved!";
        dialog.DialogText = $"🌟 {milestoneName}\n\nYou've reached a significant milestone with {_fighterConfigs[fighterId].Name}!";
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void SaveMasteryData()
    {
        try
        {
            var data = new MasterySaveData
            {
                PlayerMastery = _playerMastery,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(MASTERY_DATA_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save mastery data: {e.Message}");
        }
    }

    private void LoadMasteryData()
    {
        try
        {
            if (FileAccess.FileExists(MASTERY_DATA_FILE))
            {
                using var file = FileAccess.Open(MASTERY_DATA_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<MasterySaveData>(jsonText);
                
                _playerMastery = data.PlayerMastery ?? new();
                
                int totalMasteryData = 0;
                foreach (var playerData in _playerMastery.Values)
                {
                    totalMasteryData += playerData.Count;
                }
                
                GD.Print($"Loaded mastery data: {_playerMastery.Count} players, {totalMasteryData} fighter masteries");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load mastery data: {e.Message}");
        }
    }
}

// Data structures
public class FighterMasteryConfig
{
    public string FighterId { get; set; } = "";
    public string Name { get; set; } = "";
    public int MaxLevel { get; set; }
    public Dictionary<int, int> XPCurve { get; set; } = new(); // [level] = XP needed for that level
    public List<MasteryReward> Rewards { get; set; } = new();
}

public class MasteryReward
{
    public int Level { get; set; }
    public string RewardType { get; set; } = "";
    public string RewardId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
}

public class FighterMasteryData
{
    public string PlayerId { get; set; } = "";
    public string FighterId { get; set; } = "";
    public int Level { get; set; } = 1;
    public int CurrentXP { get; set; }
    public int TotalXPEarned { get; set; }
    public DateTime FirstPlayDate { get; set; }
    public DateTime LastPlayDate { get; set; }
    public List<string> UnlockedRewards { get; set; } = new();
    public List<string> Milestones { get; set; } = new();
    public Dictionary<string, int> XPSources { get; set; } = new(); // Track where XP came from
    public Dictionary<string, int> EventStats { get; set; } = new(); // Track various events
}

public class MasteryStatus
{
    public string FighterId { get; set; } = "";
    public string FighterName { get; set; } = "";
    public int Level { get; set; }
    public int MaxLevel { get; set; }
    public int CurrentXP { get; set; }
    public int XPIntoCurrentLevel { get; set; }
    public int XPNeededForNextLevel { get; set; }
    public List<string> UnlockedRewards { get; set; } = new();
    public List<string> Milestones { get; set; } = new();
    public int DaysPlaying { get; set; }
    public Dictionary<string, int> EventStats { get; set; } = new();
}

public class MasteryLeaderboardEntry
{
    public string PlayerId { get; set; } = "";
    public string FighterId { get; set; } = "";
    public int Level { get; set; }
    public int TotalXP { get; set; }
    public int DaysPlaying { get; set; }
}

public class MasterySaveData
{
    public Dictionary<string, Dictionary<string, FighterMasteryData>> PlayerMastery { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}