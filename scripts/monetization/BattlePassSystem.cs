using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Battle Pass 2.0 system with anti-FOMO mechanics and high value delivery
/// Features evergreen goals, catch-up tokens, and post-season unlock paths
/// </summary>
public partial class BattlePassSystem : Node
{
    public static BattlePassSystem Instance { get; private set; }
    
    private Dictionary<string, BattlePasData> _playerProgress = new();
    private BattlePassSeason _currentSeason;
    private Dictionary<int, BattlePassSeason> _pastSeasons = new();
    private const string BATTLE_PASS_FILE = "user://battle_pass_progress.json";
    private const decimal BATTLE_PASS_PRICE = 9.99m;
    
    [Signal]
    public delegate void BattlePassPurchasedEventHandler(int seasonNumber);
    
    [Signal]
    public delegate void TierUnlockedEventHandler(int tier, bool isPremium);
    
    [Signal]
    public delegate void SeasonCompletedEventHandler(int seasonNumber);

    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeCurrentSeason();
            LoadPlayerProgress();
        }
        else
        {
            QueueFree();
        }
    }

    /// <summary>
    /// Initialize current season with rewards and challenges
    /// </summary>
    private void InitializeCurrentSeason()
    {
        _currentSeason = new BattlePassSeason
        {
            SeasonNumber = 1,
            Name = "Warrior's Dawn",
            Description = "Begin your journey as a legendary fighter",
            StartDate = DateTime.Parse("2024-08-01"),
            EndDate = DateTime.Parse("2024-11-01"), // 3-month seasons
            MaxTier = 100,
            IsActive = true
        };

        InitializeSeasonRewards();
        InitializeEvergreenChallenges();
        
        GD.Print($"Battle Pass Season {_currentSeason.SeasonNumber} initialized: {_currentSeason.Name}");
    }

    private void InitializeSeasonRewards()
    {
        var rewards = new List<BattlePassReward>();

        // Free track rewards (every 5 tiers)
        for (int tier = 5; tier <= 100; tier += 5)
        {
            if (tier % 10 == 0) // Major milestones
            {
                rewards.Add(new BattlePassReward
                {
                    Tier = tier,
                    IsPremium = false,
                    RewardType = "cosmetic",
                    RewardId = $"free_skin_tier_{tier}",
                    Name = $"Tier {tier} Victory Skin",
                    Description = "Exclusive skin for reaching this milestone"
                });
            }
            else // Minor rewards
            {
                rewards.Add(new BattlePassReward
                {
                    Tier = tier,
                    IsPremium = false,
                    RewardType = "effect",
                    RewardId = $"free_effect_tier_{tier}",
                    Name = $"Special Effect #{tier/5}",
                    Description = "Unique visual effect"
                });
            }
        }

        // Premium track rewards (every tier from 1-100)
        for (int tier = 1; tier <= 100; tier++)
        {
            string rewardType = tier switch
            {
                <= 25 => "taunt",
                <= 50 => "intro",
                <= 75 => "skin",
                _ => "legendary_skin"
            };

            rewards.Add(new BattlePassReward
            {
                Tier = tier,
                IsPremium = true,
                RewardType = rewardType,
                RewardId = $"premium_{rewardType}_tier_{tier}",
                Name = $"Premium {rewardType.Replace("_", " ")} {tier}",
                Description = $"Exclusive premium content for tier {tier}"
            });
        }

        // Special milestone rewards
        rewards.Add(new BattlePassReward
        {
            Tier = 100,
            IsPremium = true,
            RewardType = "legendary_bundle",
            RewardId = "season_1_legendary_bundle",
            Name = "Champion's Legacy Bundle",
            Description = "Ultimate reward: Complete fighter transformation with exclusive effects",
            IsBundle = true,
            BundleContents = new() { "legendary_skin_complete", "champion_effects", "victory_anthem", "exclusive_nameplate" }
        });

        _currentSeason.Rewards = rewards;
    }

    private void InitializeEvergreenChallenges()
    {
        _currentSeason.Challenges = new List<BattlePassChallenge>
        {
            // Daily evergreen challenges (no time pressure)
            new BattlePassChallenge
            {
                Id = "daily_matches",
                Name = "Practice Makes Perfect",
                Description = "Complete matches to improve your skills",
                Type = "evergreen",
                RequiredProgress = 1,
                XPReward = 100,
                IsRepeatable = true,
                Category = "matches"
            },
            
            new BattlePassChallenge
            {
                Id = "daily_combos",
                Name = "Combo Artist",
                Description = "Land combo attacks in matches",
                Type = "evergreen",
                RequiredProgress = 5,
                XPReward = 150,
                IsRepeatable = true,
                Category = "combos"
            },

            // Weekly goals (no expiration)
            new BattlePassChallenge
            {
                Id = "weekly_different_fighters",
                Name = "Fighter Explorer",
                Description = "Play matches with different fighters",
                Type = "evergreen",
                RequiredProgress = 3,
                XPReward = 500,
                IsRepeatable = true,
                Category = "variety"
            },

            new BattlePassChallenge
            {
                Id = "weekly_perfect_rounds",
                Name = "Flawless Victory",
                Description = "Win rounds without taking damage",
                Type = "evergreen",
                RequiredProgress = 2,
                XPReward = 750,
                IsRepeatable = true,
                Category = "skill"
            },

            // Season-long goals
            new BattlePassChallenge
            {
                Id = "season_dedication",
                Name = "Dedicated Warrior",
                Description = "Play consistently throughout the season",
                Type = "seasonal",
                RequiredProgress = 50, // days of activity
                XPReward = 5000,
                IsRepeatable = false,
                Category = "dedication"
            }
        };
    }

    /// <summary>
    /// Get or create player progress data
    /// </summary>
    private BattlePasData GetPlayerProgress(string playerId = "player1")
    {
        if (!_playerProgress.ContainsKey(playerId))
        {
            _playerProgress[playerId] = new BattlePasData
            {
                PlayerId = playerId,
                CurrentSeasonNumber = _currentSeason.SeasonNumber,
                LastUpdated = DateTime.UtcNow
            };
        }
        return _playerProgress[playerId];
    }

    /// <summary>
    /// Purchase battle pass for current season
    /// </summary>
    public void PurchaseBattlePass(string playerId = "player1")
    {
        var playerData = GetPlayerProgress(playerId);
        
        if (playerData.HasPurchasedSeason(_currentSeason.SeasonNumber))
        {
            ShowAlreadyPurchasedDialog();
            return;
        }

        ShowPurchaseConfirmation(playerId);
    }

    private void ShowPurchaseConfirmation(string playerId)
    {
        var dialog = new ConfirmationDialog();
        dialog.Title = "Purchase Battle Pass";
        dialog.DialogText = $"Battle Pass: {_currentSeason.Name}\n\n" +
                           $"• Unlock {_currentSeason.Rewards.Count(r => r.IsPremium)} premium rewards\n" +
                           $"• No time pressure - complete at your own pace\n" +
                           $"• Catch-up tokens help you progress faster\n" +
                           $"• Access to vault after season ends\n\n" +
                           $"Price: ${BATTLE_PASS_PRICE:F2}";
        
        dialog.Confirmed += () => {
            ProcessBattlePassPurchase(playerId);
        };
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ProcessBattlePassPurchase(string playerId)
    {
        var playerData = GetPlayerProgress(playerId);
        playerData.PurchasedSeasons.Add(_currentSeason.SeasonNumber);
        
        // Grant any retroactive rewards for current tier
        GrantRetroactiveRewards(playerData);
        
        SavePlayerProgress();
        EmitSignal(SignalName.BattlePassPurchased, _currentSeason.SeasonNumber);
        
        ShowPurchaseSuccessDialog();
        
        GD.Print($"Battle Pass purchased for player {playerId}, season {_currentSeason.SeasonNumber}");
    }

    private void GrantRetroactiveRewards(BattlePasData playerData)
    {
        var currentTier = GetCurrentTier(playerData);
        var premiumRewards = _currentSeason.Rewards.Where(r => r.IsPremium && r.Tier <= currentTier);
        
        foreach (var reward in premiumRewards)
        {
            GrantReward(playerData, reward);
        }
    }

    /// <summary>
    /// Award XP to player and check for tier progression
    /// </summary>
    public void AwardXP(string playerId, int xpAmount, string source = "gameplay")
    {
        var playerData = GetPlayerProgress(playerId);
        var oldTier = GetCurrentTier(playerData);
        
        playerData.CurrentXP += xpAmount;
        var newTier = GetCurrentTier(playerData);
        
        // Check for tier ups
        for (int tier = oldTier + 1; tier <= newTier; tier++)
        {
            OnTierUnlocked(playerData, tier);
        }
        
        SavePlayerProgress();
        
        GD.Print($"Awarded {xpAmount} XP to {playerId} from {source}. Tier: {newTier}");
    }

    private void OnTierUnlocked(BattlePasData playerData, int tier)
    {
        // Grant free rewards
        var freeRewards = _currentSeason.Rewards.Where(r => !r.IsPremium && r.Tier == tier);
        foreach (var reward in freeRewards)
        {
            GrantReward(playerData, reward);
            EmitSignal(SignalName.TierUnlocked, tier, false);
        }
        
        // Grant premium rewards if battle pass is owned
        if (playerData.HasPurchasedSeason(_currentSeason.SeasonNumber))
        {
            var premiumRewards = _currentSeason.Rewards.Where(r => r.IsPremium && r.Tier == tier);
            foreach (var reward in premiumRewards)
            {
                GrantReward(playerData, reward);
                EmitSignal(SignalName.TierUnlocked, tier, true);
            }
        }
        
        // Check for season completion
        if (tier >= _currentSeason.MaxTier)
        {
            EmitSignal(SignalName.SeasonCompleted, _currentSeason.SeasonNumber);
        }
    }

    private void GrantReward(BattlePasData playerData, BattlePassReward reward)
    {
        playerData.UnlockedRewards.Add(reward.RewardId);
        
        // If it's a cosmetic, grant it to the cosmetic system
        if (CosmeticStorefront.Instance != null && reward.RewardType.Contains("skin") || 
            reward.RewardType.Contains("effect") || reward.RewardType.Contains("taunt"))
        {
            // Grant cosmetic directly without purchase
            // This would need integration with the cosmetic system
        }
        
        GD.Print($"Granted reward: {reward.Name} to {playerData.PlayerId}");
    }

    /// <summary>
    /// Get current tier based on XP
    /// </summary>
    public int GetCurrentTier(BattlePasData playerData)
    {
        const int XP_PER_TIER = 1000; // Base XP needed per tier
        return Math.Min(playerData.CurrentXP / XP_PER_TIER + 1, _currentSeason.MaxTier);
    }

    /// <summary>
    /// Complete a challenge and award XP
    /// </summary>
    public void CompleteChallenge(string playerId, string challengeId, int progress = 1)
    {
        var challenge = _currentSeason.Challenges.FirstOrDefault(c => c.Id == challengeId);
        if (challenge == null) return;
        
        var playerData = GetPlayerProgress(playerId);
        
        // Update challenge progress
        if (!playerData.ChallengeProgress.ContainsKey(challengeId))
        {
            playerData.ChallengeProgress[challengeId] = 0;
        }
        
        playerData.ChallengeProgress[challengeId] += progress;
        
        // Check if challenge is completed
        if (playerData.ChallengeProgress[challengeId] >= challenge.RequiredProgress)
        {
            AwardXP(playerId, challenge.XPReward, $"challenge_{challengeId}");
            
            // Reset repeatable challenges
            if (challenge.IsRepeatable)
            {
                playerData.ChallengeProgress[challengeId] = 0;
            }
            
            GD.Print($"Challenge completed: {challenge.Name} by {playerId}");
        }
    }

    /// <summary>
    /// Use catch-up token to boost XP
    /// </summary>
    public void UseCatchUpToken(string playerId)
    {
        var playerData = GetPlayerProgress(playerId);
        
        if (playerData.CatchUpTokens <= 0)
        {
            ShowNoCatchUpTokensDialog();
            return;
        }
        
        const int CATCH_UP_XP = 500;
        playerData.CatchUpTokens--;
        AwardXP(playerId, CATCH_UP_XP, "catch_up_token");
        
        ShowCatchUpUsedDialog(CATCH_UP_XP);
    }

    /// <summary>
    /// Grant catch-up tokens (given periodically or through events)
    /// </summary>
    public void GrantCatchUpTokens(string playerId, int count, string reason = "system")
    {
        var playerData = GetPlayerProgress(playerId);
        playerData.CatchUpTokens += count;
        SavePlayerProgress();
        
        GD.Print($"Granted {count} catch-up tokens to {playerId} - {reason}");
    }

    /// <summary>
    /// Access vault for past season content
    /// </summary>
    public List<BattlePassReward> GetVaultRewards(int seasonNumber)
    {
        if (_pastSeasons.ContainsKey(seasonNumber))
        {
            return _pastSeasons[seasonNumber].Rewards.Where(r => r.IsPremium).ToList();
        }
        return new List<BattlePassReward>();
    }

    /// <summary>
    /// Purchase specific item from vault (past season content)
    /// </summary>
    public void PurchaseFromVault(string playerId, int seasonNumber, string rewardId)
    {
        var vaultRewards = GetVaultRewards(seasonNumber);
        var reward = vaultRewards.FirstOrDefault(r => r.RewardId == rewardId);
        
        if (reward == null)
        {
            GD.PrintErr($"Vault reward not found: {rewardId}");
            return;
        }
        
        var vaultPrice = CalculateVaultPrice(reward);
        ShowVaultPurchaseConfirmation(playerId, reward, vaultPrice);
    }

    private decimal CalculateVaultPrice(BattlePassReward reward)
    {
        // Vault prices are individual item prices (no bundle discount)
        return reward.RewardType switch
        {
            "taunt" => 2.99m,
            "intro" => 3.99m,
            "skin" => 7.99m,
            "legendary_skin" => 12.99m,
            "legendary_bundle" => 19.99m,
            _ => 4.99m
        };
    }

    private void ShowVaultPurchaseConfirmation(string playerId, BattlePassReward reward, decimal price)
    {
        var dialog = new ConfirmationDialog();
        dialog.Title = "Vault Purchase";
        dialog.DialogText = $"{reward.Name}\n\n{reward.Description}\n\nVault Price: ${price:F2}\n\n" +
                           "This item was from a previous Battle Pass season.";
        
        dialog.Confirmed += () => {
            ProcessVaultPurchase(playerId, reward, price);
        };
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ProcessVaultPurchase(string playerId, BattlePassReward reward, decimal price)
    {
        var playerData = GetPlayerProgress(playerId);
        GrantReward(playerData, reward);
        SavePlayerProgress();
        
        // Track analytics
        if (CosmeticAnalytics.Instance != null)
        {
            CosmeticAnalytics.Instance.TrackVaultPurchase(reward.RewardId, price);
        }
        
        ShowVaultPurchaseSuccessDialog(reward);
        GD.Print($"Vault purchase completed: {reward.Name} for ${price:F2}");
    }

    // Dialog helper methods
    private void ShowAlreadyPurchasedDialog()
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Already Purchased";
        dialog.DialogText = "You already own this season's Battle Pass!";
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ShowPurchaseSuccessDialog()
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Battle Pass Activated";
        dialog.DialogText = $"Welcome to {_currentSeason.Name}!\n\nYour premium rewards are now unlocked. Complete challenges at your own pace!";
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ShowNoCatchUpTokensDialog()
    {
        var dialog = new AcceptDialog();
        dialog.Title = "No Catch-Up Tokens";
        dialog.DialogText = "You don't have any catch-up tokens available.\n\nTokens are granted periodically and through special events.";
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ShowCatchUpUsedDialog(int xpGained)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Catch-Up Token Used";
        dialog.DialogText = $"You gained {xpGained} XP!\n\nCatch-up tokens help you progress through the Battle Pass faster.";
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ShowVaultPurchaseSuccessDialog(BattlePassReward reward)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Vault Purchase Complete";
        dialog.DialogText = $"Successfully unlocked {reward.Name} from the vault!";
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    /// <summary>
    /// Get player's battle pass status
    /// </summary>
    public BattlePassStatus GetPlayerStatus(string playerId = "player1")
    {
        var playerData = GetPlayerProgress(playerId);
        var currentTier = GetCurrentTier(playerData);
        var xpForNextTier = ((currentTier) * 1000) - playerData.CurrentXP;
        
        return new BattlePassStatus
        {
            CurrentTier = currentTier,
            CurrentXP = playerData.CurrentXP,
            XPForNextTier = Math.Max(0, xpForNextTier),
            HasPremium = playerData.HasPurchasedSeason(_currentSeason.SeasonNumber),
            CatchUpTokens = playerData.CatchUpTokens,
            SeasonName = _currentSeason.Name,
            SeasonEndDate = _currentSeason.EndDate
        };
    }

    private void SavePlayerProgress()
    {
        try
        {
            var data = new BattlePassSaveData
            {
                PlayerProgress = _playerProgress,
                CurrentSeason = _currentSeason,
                PastSeasons = _pastSeasons,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(BATTLE_PASS_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save battle pass data: {e.Message}");
        }
    }

    private void LoadPlayerProgress()
    {
        try
        {
            if (FileAccess.FileExists(BATTLE_PASS_FILE))
            {
                using var file = FileAccess.Open(BATTLE_PASS_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<BattlePassSaveData>(jsonText);
                
                _playerProgress = data.PlayerProgress ?? new();
                _pastSeasons = data.PastSeasons ?? new();
                
                GD.Print($"Loaded battle pass data for {_playerProgress.Count} players");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load battle pass data: {e.Message}");
        }
    }
}

// Data structures
public class BattlePassSeason
{
    public int SeasonNumber { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxTier { get; set; }
    public bool IsActive { get; set; }
    public List<BattlePassReward> Rewards { get; set; } = new();
    public List<BattlePassChallenge> Challenges { get; set; } = new();
}

public class BattlePassReward
{
    public int Tier { get; set; }
    public bool IsPremium { get; set; }
    public string RewardType { get; set; } = "";
    public string RewardId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public bool IsBundle { get; set; }
    public List<string> BundleContents { get; set; } = new();
}

public class BattlePassChallenge
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Type { get; set; } = ""; // evergreen, seasonal
    public int RequiredProgress { get; set; }
    public int XPReward { get; set; }
    public bool IsRepeatable { get; set; }
    public string Category { get; set; } = "";
}

public class BattlePasData
{
    public string PlayerId { get; set; } = "";
    public int CurrentSeasonNumber { get; set; }
    public int CurrentXP { get; set; }
    public int CatchUpTokens { get; set; }
    public List<int> PurchasedSeasons { get; set; } = new();
    public List<string> UnlockedRewards { get; set; } = new();
    public Dictionary<string, int> ChallengeProgress { get; set; } = new();
    public DateTime LastUpdated { get; set; }
    
    public bool HasPurchasedSeason(int seasonNumber) => PurchasedSeasons.Contains(seasonNumber);
}

public class BattlePassStatus
{
    public int CurrentTier { get; set; }
    public int CurrentXP { get; set; }
    public int XPForNextTier { get; set; }
    public bool HasPremium { get; set; }
    public int CatchUpTokens { get; set; }
    public string SeasonName { get; set; } = "";
    public DateTime SeasonEndDate { get; set; }
}

public class BattlePassSaveData
{
    public Dictionary<string, BattlePasData> PlayerProgress { get; set; } = new();
    public BattlePassSeason CurrentSeason { get; set; }
    public Dictionary<int, BattlePassSeason> PastSeasons { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}