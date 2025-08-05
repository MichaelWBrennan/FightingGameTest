using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Analytics system for cosmetic monetization tracking
/// Replaces character rotation analytics with cosmetic engagement metrics
/// </summary>
public partial class CosmeticAnalytics : Node
{
    public static CosmeticAnalytics Instance { get; private set; }
    
    private Dictionary<string, PlayerCosmeticData> _playerData = new();
    private CosmeticAnalyticsSummary _globalStats = new();
    private const string ANALYTICS_FILE = "user://cosmetic_analytics.json";
    
    [Signal]
    public delegate void AnalyticsEventEventHandler(string eventType, string data);

    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadAnalyticsData();
            
            // Connect to monetization events
            ConnectToSystems();
        }
        else
        {
            QueueFree();
        }
    }

    private void ConnectToSystems()
    {
        // Connect to cosmetic storefront events
        if (CosmeticStorefront.Instance != null)
        {
            CosmeticStorefront.Instance.CosmeticPurchased += OnCosmeticPurchased;
            CosmeticStorefront.Instance.StorefrontUpdated += OnStorefrontUpdated;
        }

        // Connect to battle pass events
        if (BattlePassSystem.Instance != null)
        {
            BattlePassSystem.Instance.BattlePassPurchased += OnBattlePassPurchased;
            BattlePassSystem.Instance.TierUnlocked += OnBattlePassTierUnlocked;
        }

        // Connect to cross-platform wallet events
        if (CrossPlatformWallet.Instance != null)
        {
            // CrossPlatformWallet.Instance.PurchaseCompleted += OnCrossPlatformPurchase;
            // CrossPlatformWallet.Instance.GiftSent += OnGiftSent;
        }
    }

    /// <summary>
    /// Track cosmetic purchase
    /// </summary>
    public void TrackPurchase(string cosmeticId, decimal price, string category, string playerId = "player1")
    {
        EnsurePlayerData(playerId);
        var playerData = _playerData[playerId];
        
        var purchaseEvent = new CosmeticPurchaseEvent
        {
            CosmeticId = cosmeticId,
            Price = price,
            Category = category,
            Timestamp = DateTime.UtcNow,
            Platform = "direct"
        };
        
        playerData.Purchases.Add(purchaseEvent);
        playerData.TotalSpent += price;
        playerData.LastPurchaseDate = DateTime.UtcNow;
        
        // Update global stats
        _globalStats.TotalRevenue += price;
        _globalStats.TotalPurchases++;
        
        if (!_globalStats.CategoryRevenue.ContainsKey(category))
        {
            _globalStats.CategoryRevenue[category] = 0;
        }
        _globalStats.CategoryRevenue[category] += price;

        // Simplified analytics data as string
        var analyticsData = $"player:{playerId},cosmetic:{cosmeticId},price:{price},category:{category},platform:direct";
        
        EmitSignal("AnalyticsEvent", "cosmetic_purchased", analyticsData);
        SaveAnalyticsData();
        
        GD.Print($"Tracked cosmetic purchase: {cosmeticId} for ${price:F2} by {playerId}");
    }

    /// <summary>
    /// Track vault purchase (legacy battle pass content)
    /// </summary>
    public void TrackVaultPurchase(string rewardId, decimal price, string playerId = "player1")
    {
        EnsurePlayerData(playerId);
        var playerData = _playerData[playerId];
        
        var vaultEvent = new VaultPurchaseEvent
        {
            RewardId = rewardId,
            Price = price,
            Timestamp = DateTime.UtcNow
        };
        
        playerData.VaultPurchases.Add(vaultEvent);
        playerData.TotalSpent += price;
        
        // Update global stats
        _globalStats.TotalRevenue += price;
        _globalStats.VaultPurchases++;
        
        var analyticsData = $"player:{playerId},reward:{rewardId},price:{price},source:vault";
        
        EmitSignal("AnalyticsEvent", "vault_purchased", analyticsData);
        SaveAnalyticsData();
        
        GD.Print($"Tracked vault purchase: {rewardId} for ${price:F2} by {playerId}");
    }

    /// <summary>
    /// Track cosmetic usage/equipping
    /// </summary>
    public void TrackCosmeticUsage(string cosmeticId, string category, string context = "match", string playerId = "player1")
    {
        EnsurePlayerData(playerId);
        var playerData = _playerData[playerId];
        
        var usageKey = $"{cosmeticId}_{category}";
        if (!playerData.CosmeticUsage.ContainsKey(usageKey))
        {
            playerData.CosmeticUsage[usageKey] = 0;
        }
        playerData.CosmeticUsage[usageKey]++;
        
        var analyticsData = $"player:{playerId},cosmetic:{cosmeticId},category:{category},context:{context}";
        
        EmitSignal("AnalyticsEvent", "cosmetic_used", analyticsData);
    }

    /// <summary>
    /// Track cosmetic preview engagement
    /// </summary>
    public void TrackCosmeticPreview(string cosmeticId, int previewDurationSeconds, bool purchased = false, string playerId = "player1")
    {
        EnsurePlayerData(playerId);
        var playerData = _playerData[playerId];
        
        var previewEvent = new CosmeticPreviewEvent
        {
            CosmeticId = cosmeticId,
            Duration = previewDurationSeconds,
            ResultedInPurchase = purchased,
            Timestamp = DateTime.UtcNow
        };
        
        playerData.PreviewEvents.Add(previewEvent);
        
        var analyticsData = $"player:{playerId},cosmetic:{cosmeticId},duration:{previewDurationSeconds},purchased:{purchased}";
        
        EmitSignal("AnalyticsEvent", "cosmetic_previewed", analyticsData);
    }

    /// <summary>
    /// Track battle pass engagement
    /// </summary>
    public void TrackBattlePassEngagement(string eventType, Dictionary<string, object> data, string playerId = "player1")
    {
        EnsurePlayerData(playerId);
        var playerData = _playerData[playerId];
        
        var engagementEvent = new BattlePassEngagementEvent
        {
            EventType = eventType,
            Data = data ?? new(),
            Timestamp = DateTime.UtcNow
        };
        
        playerData.BattlePassEvents.Add(engagementEvent);
        
        var analyticsData = $"player:{playerId},eventType:{eventType}";
        if (data != null)
        {
            foreach (var kvp in data)
            {
                analyticsData += $",{kvp.Key}:{kvp.Value}";
            }
        }
        
        EmitSignal("AnalyticsEvent", "battle_pass_engagement", analyticsData);
    }

    /// <summary>
    /// Generate comprehensive analytics report
    /// </summary>
    public CosmeticAnalyticsReport GenerateReport(DateTime? since = null)
    {
        var cutoff = since ?? DateTime.UtcNow.AddDays(-30);
        
        var report = new CosmeticAnalyticsReport
        {
            ReportPeriodStart = cutoff,
            ReportPeriodEnd = DateTime.UtcNow,
            TotalPlayers = _playerData.Count
        };

        foreach (var playerData in _playerData.Values)
        {
            var recentPurchases = playerData.Purchases.Where(p => p.Timestamp >= cutoff).ToList();
            var recentPreviews = playerData.PreviewEvents.Where(p => p.Timestamp >= cutoff).ToList();
            
            report.TotalRevenue += recentPurchases.Sum(p => p.Price);
            report.TotalPurchases += recentPurchases.Count;
            report.TotalPreviews += recentPreviews.Count;
            report.PreviewsWithPurchase += recentPreviews.Count(p => p.ResultedInPurchase);

            // Category breakdown
            foreach (var purchase in recentPurchases)
            {
                if (!report.CategoryRevenue.ContainsKey(purchase.Category))
                {
                    report.CategoryRevenue[purchase.Category] = 0;
                }
                report.CategoryRevenue[purchase.Category] += purchase.Price;
            }

            // Price point analysis
            foreach (var purchase in recentPurchases)
            {
                var priceRange = GetPriceRange(purchase.Price);
                if (!report.PricePointDistribution.ContainsKey(priceRange))
                {
                    report.PricePointDistribution[priceRange] = 0;
                }
                report.PricePointDistribution[priceRange]++;
            }
        }

        // Calculate derived metrics
        if (report.TotalPreviews > 0)
        {
            report.PreviewToConversionRate = (double)report.PreviewsWithPurchase / report.TotalPreviews;
        }

        if (report.TotalPlayers > 0)
        {
            report.AverageRevenuePerUser = report.TotalRevenue / report.TotalPlayers;
            report.PayingPlayerPercentage = (double)_playerData.Values.Count(p => p.Purchases.Any()) / report.TotalPlayers;
        }

        return report;
    }

    private string GetPriceRange(decimal price)
    {
        return price switch
        {
            < 5m => "$0-5",
            < 10m => "$5-10",
            < 15m => "$10-15",
            < 20m => "$15-20",
            _ => "$20+"
        };
    }

    /// <summary>
    /// Get player-specific analytics
    /// </summary>
    public PlayerCosmeticAnalytics GetPlayerAnalytics(string playerId)
    {
        if (!_playerData.ContainsKey(playerId))
        {
            return new PlayerCosmeticAnalytics { PlayerId = playerId };
        }

        var playerData = _playerData[playerId];
        var analytics = new PlayerCosmeticAnalytics
        {
            PlayerId = playerId,
            TotalSpent = playerData.TotalSpent,
            TotalPurchases = playerData.Purchases.Count,
            FirstPurchaseDate = playerData.Purchases.OrderBy(p => p.Timestamp).FirstOrDefault()?.Timestamp,
            LastPurchaseDate = playerData.LastPurchaseDate,
            FavoriteCategory = GetFavoriteCategory(playerData),
            VaultPurchases = playerData.VaultPurchases.Count,
            BattlePassEngagement = CalculateBattlePassEngagement(playerData)
        };

        // Calculate spending by category
        foreach (var purchase in playerData.Purchases)
        {
            if (!analytics.SpendingByCategory.ContainsKey(purchase.Category))
            {
                analytics.SpendingByCategory[purchase.Category] = 0;
            }
            analytics.SpendingByCategory[purchase.Category] += purchase.Price;
        }

        return analytics;
    }

    private string GetFavoriteCategory(PlayerCosmeticData playerData)
    {
        return playerData.Purchases
            .GroupBy(p => p.Category)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault()?.Key ?? "";
    }

    private double CalculateBattlePassEngagement(PlayerCosmeticData playerData)
    {
        // Simple engagement score based on battle pass events
        return playerData.BattlePassEvents.Count * 10; // Placeholder calculation
    }

    private void EnsurePlayerData(string playerId)
    {
        if (!_playerData.ContainsKey(playerId))
        {
            _playerData[playerId] = new PlayerCosmeticData
            {
                PlayerId = playerId,
                FirstSeen = DateTime.UtcNow
            };
        }
    }

    // Event handlers
    private void OnCosmeticPurchased(string cosmeticId)
    {
        // Additional tracking when cosmetic is purchased
        TrackCosmeticUsage(cosmeticId, "purchase", "storefront");
    }

    private void OnStorefrontUpdated()
    {
        TrackBattlePassEngagement("storefront_viewed", new());
    }

    private void OnBattlePassPurchased(int seasonNumber)
    {
        TrackBattlePassEngagement("battle_pass_purchased", new() { ["seasonNumber"] = seasonNumber });
    }

    private void OnBattlePassTierUnlocked(int tier, bool isPremium)
    {
        TrackBattlePassEngagement("tier_unlocked", new() { ["tier"] = tier, ["isPremium"] = isPremium });
    }

    private void OnCrossPlatformPurchase(string itemId, double price, string platform)
    {
        TrackPurchase(itemId, (decimal)price, "cross_platform", "player1");
    }

    private void OnGiftSent(string recipientId, string itemId)
    {
        TrackBattlePassEngagement("gift_sent", new() { ["recipientId"] = recipientId, ["itemId"] = itemId });
    }

    private void SaveAnalyticsData()
    {
        try
        {
            var data = new CosmeticAnalyticsSaveData
            {
                PlayerData = _playerData,
                GlobalStats = _globalStats,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(ANALYTICS_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save cosmetic analytics: {e.Message}");
        }
    }

    private void LoadAnalyticsData()
    {
        try
        {
            if (FileAccess.FileExists(ANALYTICS_FILE))
            {
                using var file = FileAccess.Open(ANALYTICS_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<CosmeticAnalyticsSaveData>(jsonText);
                
                _playerData = data.PlayerData ?? new();
                _globalStats = data.GlobalStats ?? new();
                
                GD.Print($"Loaded cosmetic analytics for {_playerData.Count} players");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load cosmetic analytics: {e.Message}");
        }
    }
}

// Data structures
public class PlayerCosmeticData
{
    public string PlayerId { get; set; } = "";
    public DateTime FirstSeen { get; set; }
    public DateTime? LastPurchaseDate { get; set; }
    public decimal TotalSpent { get; set; }
    public List<CosmeticPurchaseEvent> Purchases { get; set; } = new();
    public List<VaultPurchaseEvent> VaultPurchases { get; set; } = new();
    public List<CosmeticPreviewEvent> PreviewEvents { get; set; } = new();
    public List<BattlePassEngagementEvent> BattlePassEvents { get; set; } = new();
    public Dictionary<string, int> CosmeticUsage { get; set; } = new(); // cosmeticId_category -> usage count
}

public class CosmeticPurchaseEvent
{
    public string CosmeticId { get; set; } = "";
    public decimal Price { get; set; }
    public string Category { get; set; } = "";
    public string Platform { get; set; } = "";
    public DateTime Timestamp { get; set; }
}

public class VaultPurchaseEvent
{
    public string RewardId { get; set; } = "";
    public decimal Price { get; set; }
    public DateTime Timestamp { get; set; }
}

public class CosmeticPreviewEvent
{
    public string CosmeticId { get; set; } = "";
    public int Duration { get; set; }
    public bool ResultedInPurchase { get; set; }
    public DateTime Timestamp { get; set; }
}

public class BattlePassEngagementEvent
{
    public string EventType { get; set; } = "";
    public Dictionary<string, object> Data { get; set; } = new();
    public DateTime Timestamp { get; set; }
}

public class CosmeticAnalyticsSummary
{
    public decimal TotalRevenue { get; set; }
    public int TotalPurchases { get; set; }
    public int VaultPurchases { get; set; }
    public Dictionary<string, decimal> CategoryRevenue { get; set; } = new();
}

public class CosmeticAnalyticsReport
{
    public DateTime ReportPeriodStart { get; set; }
    public DateTime ReportPeriodEnd { get; set; }
    public int TotalPlayers { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalPurchases { get; set; }
    public int TotalPreviews { get; set; }
    public int PreviewsWithPurchase { get; set; }
    public double PreviewToConversionRate { get; set; }
    public decimal AverageRevenuePerUser { get; set; }
    public double PayingPlayerPercentage { get; set; }
    public Dictionary<string, decimal> CategoryRevenue { get; set; } = new();
    public Dictionary<string, int> PricePointDistribution { get; set; } = new();
}

public class PlayerCosmeticAnalytics
{
    public string PlayerId { get; set; } = "";
    public decimal TotalSpent { get; set; }
    public int TotalPurchases { get; set; }
    public DateTime? FirstPurchaseDate { get; set; }
    public DateTime? LastPurchaseDate { get; set; }
    public string FavoriteCategory { get; set; } = "";
    public int VaultPurchases { get; set; }
    public double BattlePassEngagement { get; set; }
    public Dictionary<string, decimal> SpendingByCategory { get; set; } = new();
}

public class CosmeticAnalyticsSaveData
{
    public Dictionary<string, PlayerCosmeticData> PlayerData { get; set; } = new();
    public CosmeticAnalyticsSummary GlobalStats { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}