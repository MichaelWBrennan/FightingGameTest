using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;

/// <summary>
/// Manages the non-predatory Battle Pass system with meaningful rewards
/// </summary>
public partial class BattlePassManager : Node
{
    public static BattlePassManager Instance { get; private set; }
    
    private BattlePassSeason _currentSeason;
    private Dictionary<int, bool> _unlockedTiers = new();
    private int _currentExperience = 0;
    private bool _hasPremiumPass = false;
    private const string BATTLE_PASS_FILE = "user://battle_pass_progress.json";
    
    [Signal]
    public delegate void TierUnlockedEventHandler(int tier, string rewardId);
    
    [Signal]
    public delegate void ExperienceGainedEventHandler(int amount, int newTotal);
    
    [Signal]
    public delegate void SeasonEndedEventHandler(int seasonId);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadBattlePassProgress();
            InitializeCurrentSeason();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize the current battle pass season
    /// </summary>
    private void InitializeCurrentSeason()
    {
        _currentSeason = new BattlePassSeason
        {
            Id = 1,
            Name = "Warriors' Dawn",
            Description = "The first season celebrating fighting spirit",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(3),
            MaxTier = 50,
            ExperiencePerTier = 1000
        };
        
        // Initialize rewards with meaningful, non-filler content
        InitializeSeasonRewards();
    }
    
    private void InitializeSeasonRewards()
    {
        _currentSeason.FreeRewards = new Dictionary<int, BattlePassReward>
        {
            [1] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "basic_victory_pose", Name = "Victory Stance" },
            [3] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "bronze_nameplate", Name = "Bronze Nameplate" },
            [5] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "fighter_emote_1", Name = "Respect Bow" },
            [8] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "ui_theme_warrior", Name = "Warrior UI Theme" },
            [10] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "ko_effect_lightning", Name = "Lightning KO" },
            [15] = new BattlePassReward { Type = RewardType.Music, ItemId = "track_victory_theme", Name = "Victory Theme" },
            [20] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "silver_nameplate", Name = "Silver Nameplate" },
            [25] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "ryu_alt_color_1", Name = "Ryu Crimson Gi" },
            [30] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "stage_variant_dojo", Name = "Evening Dojo" },
            [40] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "gold_nameplate", Name = "Gold Nameplate" },
            [50] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "season_1_title", Name = "Dawn Warrior Title" }
        };
        
        _currentSeason.PremiumRewards = new Dictionary<int, BattlePassReward>
        {
            [2] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "premium_intro_1", Name = "Dramatic Entry" },
            [4] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "ryu_premium_skin", Name = "Master's Robe" },
            [6] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "premium_ko_effect", Name = "Celestial Strike" },
            [9] = new BattlePassReward { Type = RewardType.Music, ItemId = "premium_battle_theme", Name = "Epic Battle OST" },
            [12] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "animated_nameplate", Name = "Animated Warrior Plate" },
            [18] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "premium_emote_set", Name = "Master's Gestures" },
            [22] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "stage_premium_variant", Name = "Mystic Dojo" },
            [28] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "exclusive_victory_quote", Name = "Wisdom of Ages" },
            [35] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "legendary_aura_effect", Name = "Champion's Aura" },
            [45] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "season_exclusive_skin", Name = "Dawn Champion" },
            [50] = new BattlePassReward { Type = RewardType.Cosmetic, ItemId = "legendary_finisher", Name = "Season Finisher" }
        };
    }
    
    /// <summary>
    /// Purchase premium battle pass
    /// </summary>
    public bool PurchasePremiumPass(float paidAmount)
    {
        const float PREMIUM_PASS_PRICE = 9.99f;
        
        if (Math.Abs(paidAmount - PREMIUM_PASS_PRICE) > 0.01f)
            return false;
            
        if (_hasPremiumPass)
            return false; // Already owned
            
        _hasPremiumPass = true;
        
        // Grant all premium rewards for already unlocked tiers
        foreach (var tier in _unlockedTiers.Keys)
        {
            if (_currentSeason.PremiumRewards.ContainsKey(tier))
            {
                var reward = _currentSeason.PremiumRewards[tier];
                GrantReward(reward);
            }
        }
        
        SaveBattlePassProgress();
        
        // Analytics for ethical monetization tracking
        TelemetryManager.Instance?.RecordBattlePassPurchase(_currentSeason.Id);
        
        return true;
    }
    
    /// <summary>
    /// Award experience from gameplay activities
    /// </summary>
    public void AwardExperience(int amount, string source)
    {
        _currentExperience += amount;
        EmitSignal(SignalName.ExperienceGained, amount, _currentExperience);
        
        // Check for tier unlocks
        CheckTierUnlocks();
        SaveBattlePassProgress();
        
        // Track experience sources for balancing
        TelemetryManager.Instance?.RecordBattlePassExperience(amount, source);
    }
    
    /// <summary>
    /// Check and unlock any available tiers
    /// </summary>
    private void CheckTierUnlocks()
    {
        int currentTier = _currentExperience / _currentSeason.ExperiencePerTier;
        currentTier = Math.Min(currentTier, _currentSeason.MaxTier);
        
        for (int tier = 1; tier <= currentTier; tier++)
        {
            if (!_unlockedTiers.ContainsKey(tier))
            {
                _unlockedTiers[tier] = true;
                
                // Grant free reward
                if (_currentSeason.FreeRewards.ContainsKey(tier))
                {
                    var freeReward = _currentSeason.FreeRewards[tier];
                    GrantReward(freeReward);
                    EmitSignal(SignalName.TierUnlocked, tier, freeReward.ItemId);
                }
                
                // Grant premium reward if owned
                if (_hasPremiumPass && _currentSeason.PremiumRewards.ContainsKey(tier))
                {
                    var premiumReward = _currentSeason.PremiumRewards[tier];
                    GrantReward(premiumReward);
                    EmitSignal(SignalName.TierUnlocked, tier, premiumReward.ItemId);
                }
            }
        }
    }
    
    /// <summary>
    /// Grant a battle pass reward to the player
    /// </summary>
    private void GrantReward(BattlePassReward reward)
    {
        switch (reward.Type)
        {
            case RewardType.Cosmetic:
                // Grant cosmetic through CosmeticManager
                CosmeticManager.Instance?._ownedCosmetics?.Add(reward.ItemId, true);
                break;
                
            case RewardType.Music:
                // Grant music track
                MusicManager.Instance?.UnlockTrack(reward.ItemId);
                break;
                
            case RewardType.Currency:
                // For future premium currency if needed (UGC marketplace)
                break;
        }
        
        GD.Print($"Granted Battle Pass reward: {reward.Name}");
    }
    
    /// <summary>
    /// Get current tier and progress
    /// </summary>
    public (int tier, int progress, int nextTierXP) GetProgress()
    {
        int currentTier = Math.Min(_currentExperience / _currentSeason.ExperiencePerTier, _currentSeason.MaxTier);
        int progress = _currentExperience % _currentSeason.ExperiencePerTier;
        int nextTierXP = _currentSeason.ExperiencePerTier - progress;
        
        return (currentTier, progress, nextTierXP);
    }
    
    /// <summary>
    /// Get days remaining in current season
    /// </summary>
    public int GetDaysRemaining()
    {
        var timeRemaining = _currentSeason.EndDate - DateTime.UtcNow;
        return Math.Max(0, timeRemaining.Days);
    }
    
    /// <summary>
    /// Handle season transition with FOMO mitigation
    /// </summary>
    public void EndSeason()
    {
        // Save current season progress for potential future access
        SaveSeasonArchive(_currentSeason.Id);
        
        EmitSignal(SignalName.SeasonEnded, _currentSeason.Id);
        
        // Reset for new season
        _unlockedTiers.Clear();
        _currentExperience = 0;
        _hasPremiumPass = false;
        
        // TODO: Initialize next season
        SaveBattlePassProgress();
    }
    
    private void SaveSeasonArchive(int seasonId)
    {
        // Store completed season data for potential "Season Vault" feature
        // This mitigates FOMO by allowing players to access previous content
        var archiveFile = $"user://battle_pass_season_{seasonId}_archive.json";
        try
        {
            var archiveData = new SeasonArchive
            {
                SeasonId = seasonId,
                CompletedTiers = new Dictionary<int, bool>(_unlockedTiers),
                HadPremiumPass = _hasPremiumPass,
                FinalExperience = _currentExperience
            };
            
            using var file = FileAccess.Open(archiveFile, FileAccess.ModeFlags.Write);
            var json = JsonSerializer.Serialize(archiveData, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(json);
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to save season archive: {ex.Message}");
        }
    }
    
    private void LoadBattlePassProgress()
    {
        try
        {
            if (FileAccess.FileExists(BATTLE_PASS_FILE))
            {
                using var file = FileAccess.Open(BATTLE_PASS_FILE, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                var data = JsonSerializer.Deserialize<BattlePassProgress>(json);
                
                if (data != null)
                {
                    _unlockedTiers = data.UnlockedTiers ?? new();
                    _currentExperience = data.CurrentExperience;
                    _hasPremiumPass = data.HasPremiumPass;
                }
            }
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to load battle pass progress: {ex.Message}");
        }
    }
    
    private void SaveBattlePassProgress()
    {
        try
        {
            var data = new BattlePassProgress
            {
                UnlockedTiers = _unlockedTiers,
                CurrentExperience = _currentExperience,
                HasPremiumPass = _hasPremiumPass,
                CurrentSeasonId = _currentSeason.Id
            };
            
            using var file = FileAccess.Open(BATTLE_PASS_FILE, FileAccess.ModeFlags.Write);
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(json);
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to save battle pass progress: {ex.Message}");
        }
    }
}

/// <summary>
/// Battle Pass season definition
/// </summary>
public class BattlePassSeason
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxTier { get; set; }
    public int ExperiencePerTier { get; set; }
    public Dictionary<int, BattlePassReward> FreeRewards { get; set; } = new();
    public Dictionary<int, BattlePassReward> PremiumRewards { get; set; } = new();
}

/// <summary>
/// Battle Pass reward item
/// </summary>
public class BattlePassReward
{
    public RewardType Type { get; set; }
    public string ItemId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
}

/// <summary>
/// Player's battle pass progress
/// </summary>
public class BattlePassProgress
{
    public Dictionary<int, bool> UnlockedTiers { get; set; } = new();
    public int CurrentExperience { get; set; }
    public bool HasPremiumPass { get; set; }
    public int CurrentSeasonId { get; set; }
}

/// <summary>
/// Archived season data for FOMO mitigation
/// </summary>
public class SeasonArchive
{
    public int SeasonId { get; set; }
    public Dictionary<int, bool> CompletedTiers { get; set; } = new();
    public bool HadPremiumPass { get; set; }
    public int FinalExperience { get; set; }
}

public enum RewardType
{
    Cosmetic,
    Music,
    Currency,
    Title
}