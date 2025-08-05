using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Manages the ethical battle pass system with dual-track progression (free/premium)
/// Includes XP catch-up mechanics, post-season legacy reruns, and full transparency
/// </summary>
public partial class BattlePassManager : Node
{
    public static BattlePassManager Instance { get; private set; }
    
    private BattlePass _currentBattlePass;
    private Dictionary<string, PlayerBattlePassProgress> _playerProgress = new();
    private List<BattlePass> _legacyBattlePasses = new();
    private const string BATTLEPASS_DATA_FILE = "user://battlepass_data.json";
    private const string PLAYER_PROGRESS_FILE = "user://battlepass_progress.json";
    
    // Battle Pass configuration
    private const int SEASON_DURATION_DAYS = 90; // 3 months per season
    private const int MAX_TIER = 100;
    private const int BASE_XP_PER_TIER = 1000;
    private const int CATCHUP_XP_BONUS_PERCENT = 50; // 50% bonus XP after mid-season
    
    [Signal]
    public delegate void BattlePassPurchasedEventHandler(string playerId);
    
    [Signal]
    public delegate void TierUnlockedEventHandler(string playerId, int tier, string rewardId);
    
    [Signal]
    public delegate void SeasonEndedEventHandler(string seasonId);
    
    [Signal]
    public delegate void XpEarnedEventHandler(string playerId, int xpGained, string source);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadBattlePassData();
            LoadPlayerProgress();
            CheckSeasonStatus();
            InitializeCurrentSeason();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize the current season's battle pass
    /// </summary>
    private void InitializeCurrentSeason()
    {
        if (_currentBattlePass == null || IsSeasonExpired(_currentBattlePass))
        {
            StartNewSeason();
        }
    }
    
    /// <summary>
    /// Start a new battle pass season
    /// </summary>
    private void StartNewSeason()
    {
        // Archive current season if exists
        if (_currentBattlePass != null)
        {
            _legacyBattlePasses.Add(_currentBattlePass);
            EmitSignal(SignalName.SeasonEnded, _currentBattlePass.SeasonId);
        }
        
        // Create new season
        var seasonNumber = _legacyBattlePasses.Count + 1;
        _currentBattlePass = CreateNewBattlePass(seasonNumber);
        
        // Reset player progress for new season
        foreach (var playerId in _playerProgress.Keys.ToList())
        {
            _playerProgress[playerId].CurrentSeasonTier = 0;
            _playerProgress[playerId].CurrentSeasonXp = 0;
            _playerProgress[playerId].HasPremiumPass = false;
        }
        
        SaveBattlePassData();
        SavePlayerProgress();
        
        GD.Print($"Started new battle pass season: {_currentBattlePass.Name}");
    }
    
    /// <summary>
    /// Create a new battle pass for the season
    /// </summary>
    private BattlePass CreateNewBattlePass(int seasonNumber)
    {
        var battlePass = new BattlePass
        {
            SeasonId = $"season_{seasonNumber:D2}",
            Name = $"Season {seasonNumber}: Warrior's Path",
            Description = $"Embark on the warrior's journey through {MAX_TIER} tiers of rewards",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(SEASON_DURATION_DAYS),
            MaxTier = MAX_TIER,
            PremiumPassPrice = 999, // 999 Fighter Coins (~$9.99)
            PremiumPassCurrency = CurrencyType.Premium,
            IsCatchupActive = false
        };
        
        // Create tier rewards
        CreateTierRewards(battlePass);
        
        return battlePass;
    }
    
    /// <summary>
    /// Create rewards for all tiers in the battle pass
    /// </summary>
    private void CreateTierRewards(BattlePass battlePass)
    {
        for (int tier = 1; tier <= MAX_TIER; tier++)
        {
            // Free track rewards
            var freeReward = CreateFreeTrackReward(tier);
            if (freeReward != null)
            {
                battlePass.Rewards[tier] = new BattlePassTier
                {
                    Tier = tier,
                    XpRequired = CalculateXpRequired(tier),
                    FreeReward = freeReward
                };
            }
            
            // Premium track rewards
            var premiumReward = CreatePremiumTrackReward(tier);
            if (premiumReward != null)
            {
                if (battlePass.Rewards.ContainsKey(tier))
                {
                    battlePass.Rewards[tier].PremiumReward = premiumReward;
                }
                else
                {
                    battlePass.Rewards[tier] = new BattlePassTier
                    {
                        Tier = tier,
                        XpRequired = CalculateXpRequired(tier),
                        PremiumReward = premiumReward
                    };
                }
            }
        }
        
        GD.Print($"Created {battlePass.Rewards.Count} tier rewards for {battlePass.Name}");
    }
    
    /// <summary>
    /// Create free track reward for tier
    /// </summary>
    private BattlePassReward CreateFreeTrackReward(int tier)
    {
        // Every tier gets something on free track
        if (tier % 10 == 0) // Every 10th tier - cosmetic reward
        {
            return new BattlePassReward
            {
                Type = RewardType.Cosmetic,
                ItemId = $"battlepass_free_tier_{tier}_cosmetic",
                Quantity = 1,
                Name = $"Tier {tier} Victory Pose",
                Description = "Exclusive victory pose for battle pass completion"
            };
        }
        else if (tier % 5 == 0) // Every 5th tier - premium currency
        {
            return new BattlePassReward
            {
                Type = RewardType.PremiumCurrency,
                Quantity = 100,
                Name = "Fighter Coins",
                Description = "Premium currency for cosmetic purchases"
            };
        }
        else // Other tiers - soft currency or XP boosters
        {
            var random = new Random(tier);
            if (random.Next(2) == 0)
            {
                return new BattlePassReward
                {
                    Type = RewardType.SoftCurrency,
                    Quantity = 200 + (tier * 10),
                    Name = "Training Tokens",
                    Description = "Earned currency for progression rewards"
                };
            }
            else
            {
                return new BattlePassReward
                {
                    Type = RewardType.XpBooster,
                    Quantity = 1,
                    Name = "XP Boost Token",
                    Description = "Double XP for next 3 matches"
                };
            }
        }
    }
    
    /// <summary>
    /// Create premium track reward for tier
    /// </summary>
    private BattlePassReward CreatePremiumTrackReward(int tier)
    {
        // Premium track has rewards for most tiers
        if (tier % 25 == 0) // Major milestone rewards
        {
            return new BattlePassReward
            {
                Type = RewardType.CosmeticSet,
                ItemId = $"battlepass_premium_tier_{tier}_set",
                Quantity = 1,
                Name = $"Tier {tier} Elite Set",
                Description = "Exclusive cosmetic set for premium pass holders"
            };
        }
        else if (tier % 10 == 0) // Prestige cosmetics
        {
            return new BattlePassReward
            {
                Type = RewardType.Cosmetic,
                ItemId = $"battlepass_premium_tier_{tier}_prestige",
                Quantity = 1,
                Name = $"Tier {tier} Prestige Skin",
                Description = "Exclusive prestige-tier cosmetic"
            };
        }
        else if (tier % 5 == 0) // Animation packs
        {
            return new BattlePassReward
            {
                Type = RewardType.Cosmetic,
                ItemId = $"battlepass_premium_tier_{tier}_animation",
                Quantity = 1,
                Name = $"Tier {tier} Animation Pack",
                Description = "Exclusive intro/victory animations"
            };
        }
        else // Regular premium rewards
        {
            var random = new Random(tier + 1000); // Different seed than free track
            var rewardType = random.Next(3);
            
            switch (rewardType)
            {
                case 0:
                    return new BattlePassReward
                    {
                        Type = RewardType.PremiumCurrency,
                        Quantity = 150 + (tier * 5),
                        Name = "Fighter Coins Bonus",
                        Description = "Bonus premium currency"
                    };
                case 1:
                    return new BattlePassReward
                    {
                        Type = RewardType.SoftCurrency,
                        Quantity = 500 + (tier * 20),
                        Name = "Training Token Bonus",
                        Description = "Bonus earned currency"
                    };
                case 2:
                    return new BattlePassReward
                    {
                        Type = RewardType.XpBooster,
                        Quantity = 2,
                        Name = "Premium XP Boost",
                        Description = "Double XP for next 5 matches"
                    };
                default:
                    return null;
            }
        }
    }
    
    /// <summary>
    /// Calculate XP required for a tier
    /// </summary>
    private int CalculateXpRequired(int tier)
    {
        // Gentle curve - slightly increasing requirements
        return BASE_XP_PER_TIER + (tier * 50);
    }
    
    /// <summary>
    /// Purchase premium battle pass for player
    /// </summary>
    public bool PurchasePremiumBattlePass(string playerId)
    {
        if (_currentBattlePass == null)
        {
            GD.PrintErr("No active battle pass to purchase");
            return false;
        }
        
        var playerProgress = GetPlayerProgress(playerId);
        
        if (playerProgress.HasPremiumPass)
        {
            GD.Print($"Player {playerId} already owns premium battle pass");
            return false;
        }
        
        // Check and spend currency
        if (CurrencyManager.Instance.SpendCurrency(_currentBattlePass.PremiumPassCurrency, 
            _currentBattlePass.PremiumPassPrice, $"Premium Battle Pass - {_currentBattlePass.Name}"))
        {
            playerProgress.HasPremiumPass = true;
            playerProgress.PremiumPassPurchaseDate = DateTime.UtcNow;
            
            // Grant retroactive premium rewards for already unlocked tiers
            GrantRetroactivePremiumRewards(playerId, playerProgress);
            
            SavePlayerProgress();
            EmitSignal(SignalName.BattlePassPurchased, playerId);
            
            GD.Print($"Premium battle pass purchased for player: {playerId}");
            return true;
        }
        
        return false;
    }
    
    /// <summary>
    /// Grant retroactive premium rewards for already unlocked tiers
    /// </summary>
    private void GrantRetroactivePremiumRewards(string playerId, PlayerBattlePassProgress playerProgress)
    {
        for (int tier = 1; tier <= playerProgress.CurrentSeasonTier; tier++)
        {
            if (_currentBattlePass.Rewards.ContainsKey(tier) && 
                _currentBattlePass.Rewards[tier].PremiumReward != null)
            {
                var reward = _currentBattlePass.Rewards[tier].PremiumReward;
                GrantReward(playerId, reward);
                
                GD.Print($"Granted retroactive premium reward for tier {tier}: {reward.Name}");
            }
        }
    }
    
    /// <summary>
    /// Award XP to player
    /// </summary>
    public void AwardXp(string playerId, int baseXp, string source)
    {
        if (_currentBattlePass == null || IsSeasonExpired(_currentBattlePass))
        {
            return; // No active season
        }
        
        var playerProgress = GetPlayerProgress(playerId);
        
        // Apply catch-up bonus if active
        var finalXp = baseXp;
        if (_currentBattlePass.IsCatchupActive)
        {
            finalXp = (int)(baseXp * (1 + CATCHUP_XP_BONUS_PERCENT / 100f));
        }
        
        // Apply XP boosters
        if (playerProgress.ActiveXpBoosters > 0)
        {
            finalXp *= 2; // Double XP from boosters
            playerProgress.ActiveXpBoosters--;
        }
        
        playerProgress.CurrentSeasonXp += finalXp;
        playerProgress.TotalXpEarned += finalXp;
        
        // Check for tier ups
        CheckForTierUps(playerId, playerProgress);
        
        SavePlayerProgress();
        EmitSignal(SignalName.XpEarned, playerId, finalXp, source);
        
        GD.Print($"Awarded {finalXp} XP to {playerId} for: {source}");
    }
    
    /// <summary>
    /// Check if player has unlocked new tiers
    /// </summary>
    private void CheckForTierUps(string playerId, PlayerBattlePassProgress playerProgress)
    {
        var newTier = CalculateCurrentTier(playerProgress.CurrentSeasonXp);
        
        if (newTier > playerProgress.CurrentSeasonTier)
        {
            // Grant rewards for all newly unlocked tiers
            for (int tier = playerProgress.CurrentSeasonTier + 1; tier <= newTier; tier++)
            {
                if (_currentBattlePass.Rewards.ContainsKey(tier))
                {
                    var tierRewards = _currentBattlePass.Rewards[tier];
                    
                    // Grant free reward
                    if (tierRewards.FreeReward != null)
                    {
                        GrantReward(playerId, tierRewards.FreeReward);
                        EmitSignal(SignalName.TierUnlocked, playerId, tier, tierRewards.FreeReward.ItemId);
                    }
                    
                    // Grant premium reward if player owns premium pass
                    if (playerProgress.HasPremiumPass && tierRewards.PremiumReward != null)
                    {
                        GrantReward(playerId, tierRewards.PremiumReward);
                        EmitSignal(SignalName.TierUnlocked, playerId, tier, tierRewards.PremiumReward.ItemId);
                    }
                }
            }
            
            playerProgress.CurrentSeasonTier = newTier;
            GD.Print($"Player {playerId} reached tier {newTier}");
        }
    }
    
    /// <summary>
    /// Calculate current tier based on XP
    /// </summary>
    private int CalculateCurrentTier(int totalXp)
    {
        int tier = 0;
        int accumulatedXp = 0;
        
        for (int t = 1; t <= MAX_TIER; t++)
        {
            int xpForThisTier = CalculateXpRequired(t);
            if (totalXp >= accumulatedXp + xpForThisTier)
            {
                accumulatedXp += xpForThisTier;
                tier = t;
            }
            else
            {
                break;
            }
        }
        
        return Math.Min(tier, MAX_TIER);
    }
    
    /// <summary>
    /// Grant a reward to the player
    /// </summary>
    private void GrantReward(string playerId, BattlePassReward reward)
    {
        switch (reward.Type)
        {
            case RewardType.SoftCurrency:
                CurrencyManager.Instance?.AwardSoftCurrency(reward.Quantity, $"Battle Pass: {reward.Name}");
                break;
            case RewardType.PremiumCurrency:
                CurrencyManager.Instance?.AwardPremiumCurrency(reward.Quantity, $"Battle Pass: {reward.Name}");
                break;
            case RewardType.Cosmetic:
                // Grant cosmetic ownership (would integrate with CosmeticManager)
                GD.Print($"Granted cosmetic: {reward.ItemId}");
                break;
            case RewardType.CosmeticSet:
                // Grant cosmetic set (would integrate with CosmeticManager)
                GD.Print($"Granted cosmetic set: {reward.ItemId}");
                break;
            case RewardType.XpBooster:
                var playerProgress = GetPlayerProgress(playerId);
                playerProgress.ActiveXpBoosters += reward.Quantity;
                break;
        }
    }
    
    /// <summary>
    /// Activate catch-up mechanics (mid-season)
    /// </summary>
    public void ActivateCatchupMechanics()
    {
        if (_currentBattlePass != null)
        {
            _currentBattlePass.IsCatchupActive = true;
            SaveBattlePassData();
            GD.Print("Catch-up mechanics activated - 50% bonus XP for all players");
        }
    }
    
    /// <summary>
    /// Get player's battle pass progress
    /// </summary>
    public PlayerBattlePassProgress GetPlayerProgress(string playerId)
    {
        if (!_playerProgress.ContainsKey(playerId))
        {
            _playerProgress[playerId] = new PlayerBattlePassProgress
            {
                PlayerId = playerId,
                CurrentSeasonTier = 0,
                CurrentSeasonXp = 0,
                HasPremiumPass = false,
                ActiveXpBoosters = 0,
                TotalXpEarned = 0,
                LastUpdated = DateTime.UtcNow
            };
        }
        
        return _playerProgress[playerId];
    }
    
    /// <summary>
    /// Get current battle pass
    /// </summary>
    public BattlePass GetCurrentBattlePass() => _currentBattlePass;
    
    /// <summary>
    /// Get legacy battle passes for post-season access
    /// </summary>
    public List<BattlePass> GetLegacyBattlePasses() => new(_legacyBattlePasses);
    
    /// <summary>
    /// Check if season is expired
    /// </summary>
    private bool IsSeasonExpired(BattlePass battlePass)
    {
        return DateTime.UtcNow > battlePass.EndDate;
    }
    
    /// <summary>
    /// Check season status and handle transitions
    /// </summary>
    private void CheckSeasonStatus()
    {
        if (_currentBattlePass == null) return;
        
        var now = DateTime.UtcNow;
        var seasonProgress = (now - _currentBattlePass.StartDate).TotalDays / SEASON_DURATION_DAYS;
        
        // Activate catch-up at 50% through season
        if (seasonProgress >= 0.5 && !_currentBattlePass.IsCatchupActive)
        {
            ActivateCatchupMechanics();
        }
        
        // End season if expired
        if (IsSeasonExpired(_currentBattlePass))
        {
            StartNewSeason();
        }
    }
    
    /// <summary>
    /// Get XP sources and values for transparency
    /// </summary>
    public Dictionary<string, int> GetXpSources()
    {
        return new Dictionary<string, int>
        {
            { "Match Victory", 500 },
            { "Match Completion", 200 },
            { "First Win of Day", 1000 },
            { "Character Mastery", 300 },
            { "Training Mode", 100 },
            { "Ranked Win", 750 },
            { "Perfect Victory", 200 },
            { "Multi-hit Combo", 50 },
            { "Daily Challenge", 800 },
            { "Weekly Challenge", 2000 }
        };
    }
    
    /// <summary>
    /// Save battle pass data
    /// </summary>
    private void SaveBattlePassData()
    {
        try
        {
            var data = new BattlePassSaveData
            {
                CurrentBattlePass = _currentBattlePass,
                LegacyBattlePasses = _legacyBattlePasses,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(BATTLEPASS_DATA_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save battle pass data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load battle pass data
    /// </summary>
    private void LoadBattlePassData()
    {
        try
        {
            if (FileAccess.FileExists(BATTLEPASS_DATA_FILE))
            {
                using var file = FileAccess.Open(BATTLEPASS_DATA_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<BattlePassSaveData>(jsonText);
                
                _currentBattlePass = data.CurrentBattlePass;
                _legacyBattlePasses = data.LegacyBattlePasses ?? new List<BattlePass>();
                
                GD.Print("Battle pass data loaded");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load battle pass data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Save player progress
    /// </summary>
    private void SavePlayerProgress()
    {
        try
        {
            using var file = FileAccess.Open(PLAYER_PROGRESS_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(_playerProgress, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save player progress: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load player progress
    /// </summary>
    private void LoadPlayerProgress()
    {
        try
        {
            if (FileAccess.FileExists(PLAYER_PROGRESS_FILE))
            {
                using var file = FileAccess.Open(PLAYER_PROGRESS_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                _playerProgress = JsonSerializer.Deserialize<Dictionary<string, PlayerBattlePassProgress>>(jsonText) ?? new();
                
                GD.Print($"Player progress loaded for {_playerProgress.Count} players");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load player progress: {e.Message}");
        }
    }
}

// Data structures
public enum RewardType
{
    SoftCurrency,
    PremiumCurrency,
    Cosmetic,
    CosmeticSet,
    XpBooster
}

public class BattlePass
{
    public string SeasonId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxTier { get; set; }
    public int PremiumPassPrice { get; set; }
    public CurrencyType PremiumPassCurrency { get; set; }
    public bool IsCatchupActive { get; set; }
    public Dictionary<int, BattlePassTier> Rewards { get; set; } = new();
}

public class BattlePassTier
{
    public int Tier { get; set; }
    public int XpRequired { get; set; }
    public BattlePassReward FreeReward { get; set; }
    public BattlePassReward PremiumReward { get; set; }
}

public class BattlePassReward
{
    public RewardType Type { get; set; }
    public string ItemId { get; set; } = "";
    public int Quantity { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
}

public class PlayerBattlePassProgress
{
    public string PlayerId { get; set; } = "";
    public int CurrentSeasonTier { get; set; }
    public int CurrentSeasonXp { get; set; }
    public bool HasPremiumPass { get; set; }
    public DateTime PremiumPassPurchaseDate { get; set; }
    public int ActiveXpBoosters { get; set; }
    public int TotalXpEarned { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class BattlePassSaveData
{
    public BattlePass CurrentBattlePass { get; set; }
    public List<BattlePass> LegacyBattlePasses { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}