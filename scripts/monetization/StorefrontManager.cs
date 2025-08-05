using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Manages the in-game storefront with rotating daily/weekly deals and permanent catalog
/// Includes smart personalization and vault system for limited-time items
/// </summary>
public partial class StorefrontManager : Node
{
    public static StorefrontManager Instance { get; private set; }
    
    private List<StoreItem> _dailyDeals = new();
    private List<StoreItem> _weeklyDeals = new();
    private List<StoreItem> _permanentCatalog = new();
    private List<StoreItem> _vaultItems = new();
    private Dictionary<string, PlayerPreferences> _playerPreferences = new();
    private const string STORE_DATA_FILE = "user://store_data.json";
    private const string PLAYER_PREFS_FILE = "user://player_store_preferences.json";
    
    [Signal]
    public delegate void StoreUpdatedEventHandler();
    
    [Signal]
    public delegate void DailyDealsRefreshedEventHandler();
    
    [Signal]
    public delegate void WeeklyDealsRefreshedEventHandler();
    
    [Signal]
    public delegate void VaultOpenedEventHandler();
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadStoreData();
            LoadPlayerPreferences();
            InitializePermanentCatalog();
            CheckForStoreUpdates();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize the permanent catalog with all available items
    /// </summary>
    private void InitializePermanentCatalog()
    {
        _permanentCatalog.Clear();
        
        // Add all cosmetics to permanent catalog (always available)
        if (CosmeticManager.Instance != null)
        {
            var allCosmetics = CosmeticManager.Instance.GetCosmeticsByType(CosmeticType.Skin);
            allCosmetics.AddRange(CosmeticManager.Instance.GetCosmeticsByType(CosmeticType.VictoryPose));
            allCosmetics.AddRange(CosmeticManager.Instance.GetCosmeticsByType(CosmeticType.Intro));
            allCosmetics.AddRange(CosmeticManager.Instance.GetCosmeticsByType(CosmeticType.Taunt));
            allCosmetics.AddRange(CosmeticManager.Instance.GetCosmeticsByType(CosmeticType.KOEffect));
            allCosmetics.AddRange(CosmeticManager.Instance.GetCosmeticsByType(CosmeticType.UITheme));
            allCosmetics.AddRange(CosmeticManager.Instance.GetCosmeticsByType(CosmeticType.AnnouncerPack));
            
            foreach (var cosmetic in allCosmetics)
            {
                _permanentCatalog.Add(new StoreItem
                {
                    ItemId = cosmetic.Id,
                    ItemType = StoreItemType.Cosmetic,
                    Name = cosmetic.Name,
                    Description = cosmetic.Description,
                    Price = cosmetic.Price,
                    Currency = cosmetic.Currency,
                    OriginalPrice = cosmetic.Price,
                    DiscountPercentage = 0,
                    IsOnSale = false,
                    Category = GetCategoryFromCosmeticType(cosmetic.Type),
                    Tier = cosmetic.Tier.ToString(),
                    CharacterId = cosmetic.CharacterId,
                    PreviewPath = cosmetic.PreviewPath
                });
            }
            
            // Add cosmetic sets
            var cosmeticSets = CosmeticManager.Instance.GetAvailableCosmeticSets();
            foreach (var set in cosmeticSets)
            {
                _permanentCatalog.Add(new StoreItem
                {
                    ItemId = set.Id,
                    ItemType = StoreItemType.CosmeticSet,
                    Name = set.Name,
                    Description = set.Description,
                    Price = set.BundlePrice,
                    Currency = set.Currency,
                    OriginalPrice = set.IndividualPrice,
                    DiscountPercentage = set.DiscountPercentage,
                    IsOnSale = true, // Sets are always "on sale" vs individual prices
                    Category = "Sets",
                    Tier = "Bundle",
                    CharacterId = "all"
                });
            }
        }
        
        // Add currency packs to permanent catalog
        if (CurrencyManager.Instance != null)
        {
            var currencyPacks = CurrencyManager.Instance.GetPremiumCurrencyPurchaseOptions();
            foreach (var pack in currencyPacks)
            {
                _permanentCatalog.Add(new StoreItem
                {
                    ItemId = pack.Id,
                    ItemType = StoreItemType.Currency,
                    Name = pack.Name,
                    Description = pack.Description,
                    Price = (int)(pack.UsdPrice * 100), // Convert to cents for display
                    Currency = CurrencyType.Premium, // Special handling for real money
                    OriginalPrice = (int)(pack.UsdPrice * 100),
                    DiscountPercentage = 0,
                    IsOnSale = pack.BonusAmount > 0,
                    Category = "Currency",
                    Tier = "Premium",
                    CharacterId = "all"
                });
            }
        }
        
        GD.Print($"Permanent catalog initialized with {_permanentCatalog.Count} items");
    }
    
    /// <summary>
    /// Get category string from cosmetic type
    /// </summary>
    private string GetCategoryFromCosmeticType(CosmeticType type)
    {
        return type switch
        {
            CosmeticType.Skin => "Skins",
            CosmeticType.VictoryPose => "Victory Poses",
            CosmeticType.Intro => "Intros",
            CosmeticType.Taunt => "Taunts",
            CosmeticType.KOEffect => "KO Effects",
            CosmeticType.UITheme => "UI Themes",
            CosmeticType.AnnouncerPack => "Announcer Packs",
            _ => "Other"
        };
    }
    
    /// <summary>
    /// Check for daily/weekly store updates
    /// </summary>
    private void CheckForStoreUpdates()
    {
        var now = DateTime.UtcNow;
        var lastDailyUpdate = GetLastUpdateTime("daily");
        var lastWeeklyUpdate = GetLastUpdateTime("weekly");
        
        // Check if daily deals need refresh (every 24 hours)
        if (now.Date > lastDailyUpdate.Date)
        {
            RefreshDailyDeals();
        }
        
        // Check if weekly deals need refresh (every Monday)
        var daysSinceMonday = (int)now.DayOfWeek == 0 ? 6 : (int)now.DayOfWeek - 1;
        var thisMonday = now.Date.AddDays(-daysSinceMonday);
        
        if (thisMonday > lastWeeklyUpdate.Date)
        {
            RefreshWeeklyDeals();
        }
        
        // Check for vault openings (first week of each month)
        if (now.Day <= 7 && now.Date.AddDays(-7).Month != now.Month)
        {
            OpenVault();
        }
    }
    
    /// <summary>
    /// Refresh daily deals with new discounted items
    /// </summary>
    private void RefreshDailyDeals()
    {
        _dailyDeals.Clear();
        
        var random = new Random(GetDeterministicSeed("daily"));
        var eligibleItems = GetEligibleItemsForDeals();
        
        // Select 4-6 random items for daily deals
        var dealCount = random.Next(4, 7);
        var selectedItems = eligibleItems.OrderBy(x => random.Next()).Take(dealCount);
        
        foreach (var item in selectedItems)
        {
            var dealItem = CreateDealItem(item, random.Next(15, 35)); // 15-35% discount
            _dailyDeals.Add(dealItem);
        }
        
        SetLastUpdateTime("daily", DateTime.UtcNow);
        SaveStoreData();
        EmitSignal(SignalName.DailyDealsRefreshed);
        
        GD.Print($"Daily deals refreshed with {_dailyDeals.Count} items");
    }
    
    /// <summary>
    /// Refresh weekly deals with larger discounts
    /// </summary>
    private void RefreshWeeklyDeals()
    {
        _weeklyDeals.Clear();
        
        var random = new Random(GetDeterministicSeed("weekly"));
        var eligibleItems = GetEligibleItemsForDeals();
        
        // Select 2-3 high-value items for weekly deals
        var dealCount = random.Next(2, 4);
        var selectedItems = eligibleItems
            .Where(i => i.Price >= 500) // Higher value items
            .OrderBy(x => random.Next())
            .Take(dealCount);
        
        foreach (var item in selectedItems)
        {
            var dealItem = CreateDealItem(item, random.Next(25, 50)); // 25-50% discount
            _weeklyDeals.Add(dealItem);
        }
        
        SetLastUpdateTime("weekly", DateTime.UtcNow);
        SaveStoreData();
        EmitSignal(SignalName.WeeklyDealsRefreshed);
        
        GD.Print($"Weekly deals refreshed with {_weeklyDeals.Count} items");
    }
    
    /// <summary>
    /// Open vault with previously limited items
    /// </summary>
    private void OpenVault()
    {
        _vaultItems.Clear();
        
        // Add previously limited items back to rotation
        var limitedItems = GetPreviouslyLimitedItems();
        _vaultItems.AddRange(limitedItems);
        
        if (_vaultItems.Count > 0)
        {
            EmitSignal(SignalName.VaultOpened);
            GD.Print($"Vault opened with {_vaultItems.Count} returning items");
        }
    }
    
    /// <summary>
    /// Get eligible items for deals (not already owned, not in other deals)
    /// </summary>
    private List<StoreItem> GetEligibleItemsForDeals()
    {
        var eligibleItems = new List<StoreItem>();
        
        foreach (var item in _permanentCatalog)
        {
            // Skip if already owned
            if (item.ItemType == StoreItemType.Cosmetic && 
                CosmeticManager.Instance?.IsItemOwned(item.ItemId) == true)
                continue;
            
            // Skip currency packs and sets for now
            if (item.ItemType != StoreItemType.Cosmetic)
                continue;
            
            // Skip if already on sale
            if (item.IsOnSale)
                continue;
            
            eligibleItems.Add(item);
        }
        
        return eligibleItems;
    }
    
    /// <summary>
    /// Create a deal item with discount
    /// </summary>
    private StoreItem CreateDealItem(StoreItem originalItem, int discountPercentage)
    {
        var dealItem = new StoreItem
        {
            ItemId = originalItem.ItemId,
            ItemType = originalItem.ItemType,
            Name = originalItem.Name,
            Description = originalItem.Description,
            OriginalPrice = originalItem.Price,
            Price = (int)(originalItem.Price * (1f - discountPercentage / 100f)),
            Currency = originalItem.Currency,
            DiscountPercentage = discountPercentage,
            IsOnSale = true,
            Category = originalItem.Category,
            Tier = originalItem.Tier,
            CharacterId = originalItem.CharacterId,
            PreviewPath = originalItem.PreviewPath,
            SaleEndTime = DateTime.UtcNow.AddDays(1) // Daily deals last 24 hours
        };
        
        return dealItem;
    }
    
    /// <summary>
    /// Get personalized recommendations for a player
    /// </summary>
    public List<StoreItem> GetPersonalizedRecommendations(string playerId, int maxItems = 6)
    {
        var recommendations = new List<StoreItem>();
        var playerPrefs = GetPlayerPreferences(playerId);
        
        // Get items for player's favorite characters
        var favoriteCharacterItems = _permanentCatalog
            .Where(item => playerPrefs.FavoriteCharacters.Contains(item.CharacterId))
            .Where(item => !IsItemOwnedByPlayer(item.ItemId))
            .Take(maxItems / 2);
        
        recommendations.AddRange(favoriteCharacterItems);
        
        // Get items from preferred categories
        var categoryItems = _permanentCatalog
            .Where(item => playerPrefs.PreferredCategories.Contains(item.Category))
            .Where(item => !IsItemOwnedByPlayer(item.ItemId))
            .Where(item => !recommendations.Any(r => r.ItemId == item.ItemId))
            .Take(maxItems - recommendations.Count);
        
        recommendations.AddRange(categoryItems);
        
        // Fill remaining slots with popular items
        if (recommendations.Count < maxItems)
        {
            var popularItems = _permanentCatalog
                .Where(item => !IsItemOwnedByPlayer(item.ItemId))
                .Where(item => !recommendations.Any(r => r.ItemId == item.ItemId))
                .OrderByDescending(item => GetItemPopularity(item.ItemId))
                .Take(maxItems - recommendations.Count);
            
            recommendations.AddRange(popularItems);
        }
        
        return recommendations;
    }
    
    /// <summary>
    /// Get daily deals
    /// </summary>
    public List<StoreItem> GetDailyDeals() => new(_dailyDeals);
    
    /// <summary>
    /// Get weekly deals
    /// </summary>
    public List<StoreItem> GetWeeklyDeals() => new(_weeklyDeals);
    
    /// <summary>
    /// Get permanent catalog
    /// </summary>
    public List<StoreItem> GetPermanentCatalog() => new(_permanentCatalog);
    
    /// <summary>
    /// Get vault items
    /// </summary>
    public List<StoreItem> GetVaultItems() => new(_vaultItems);
    
    /// <summary>
    /// Get items by category
    /// </summary>
    public List<StoreItem> GetItemsByCategory(string category)
    {
        return _permanentCatalog.Where(item => item.Category == category).ToList();
    }
    
    /// <summary>
    /// Get items for specific character
    /// </summary>
    public List<StoreItem> GetItemsForCharacter(string characterId)
    {
        return _permanentCatalog
            .Where(item => item.CharacterId == characterId || item.CharacterId == "all")
            .ToList();
    }
    
    /// <summary>
    /// Purchase item from store
    /// </summary>
    public bool PurchaseStoreItem(string itemId, string playerId = "player1")
    {
        var storeItem = FindStoreItem(itemId);
        if (storeItem == null)
        {
            GD.PrintErr($"Store item not found: {itemId}");
            return false;
        }
        
        bool success = false;
        
        switch (storeItem.ItemType)
        {
            case StoreItemType.Cosmetic:
                success = CosmeticManager.Instance?.PurchaseCosmetic(itemId) ?? false;
                break;
            case StoreItemType.CosmeticSet:
                success = CosmeticManager.Instance?.PurchaseCosmeticSet(itemId) ?? false;
                break;
            case StoreItemType.Currency:
                CurrencyManager.Instance?.InitiatePremiumCurrencyPurchase(itemId);
                success = true; // Purchase flow is separate
                break;
        }
        
        if (success)
        {
            // Update player preferences
            UpdatePlayerPreferences(playerId, storeItem);
        }
        
        return success;
    }
    
    /// <summary>
    /// Find store item by ID across all store sections
    /// </summary>
    private StoreItem FindStoreItem(string itemId)
    {
        return _dailyDeals.FirstOrDefault(item => item.ItemId == itemId) ??
               _weeklyDeals.FirstOrDefault(item => item.ItemId == itemId) ??
               _permanentCatalog.FirstOrDefault(item => item.ItemId == itemId) ??
               _vaultItems.FirstOrDefault(item => item.ItemId == itemId);
    }
    
    /// <summary>
    /// Update player preferences based on purchase
    /// </summary>
    private void UpdatePlayerPreferences(string playerId, StoreItem purchasedItem)
    {
        var playerPrefs = GetPlayerPreferences(playerId);
        
        // Track character preference
        if (!string.IsNullOrEmpty(purchasedItem.CharacterId) && purchasedItem.CharacterId != "all")
        {
            if (!playerPrefs.FavoriteCharacters.Contains(purchasedItem.CharacterId))
            {
                playerPrefs.FavoriteCharacters.Add(purchasedItem.CharacterId);
            }
        }
        
        // Track category preference
        if (!playerPrefs.PreferredCategories.Contains(purchasedItem.Category))
        {
            playerPrefs.PreferredCategories.Add(purchasedItem.Category);
        }
        
        // Track purchase
        playerPrefs.PurchaseHistory.Add(new StorePurchaseRecord
        {
            ItemId = purchasedItem.ItemId,
            ItemName = purchasedItem.Name,
            Price = purchasedItem.Price,
            Currency = purchasedItem.Currency,
            Timestamp = DateTime.UtcNow
        });
        
        playerPrefs.LastUpdated = DateTime.UtcNow;
        SavePlayerPreferences();
    }
    
    /// <summary>
    /// Get player preferences (create if doesn't exist)
    /// </summary>
    private PlayerPreferences GetPlayerPreferences(string playerId)
    {
        if (!_playerPreferences.ContainsKey(playerId))
        {
            _playerPreferences[playerId] = new PlayerPreferences
            {
                PlayerId = playerId,
                LastUpdated = DateTime.UtcNow
            };
        }
        
        return _playerPreferences[playerId];
    }
    
    /// <summary>
    /// Check if item is owned by player
    /// </summary>
    private bool IsItemOwnedByPlayer(string itemId)
    {
        return CosmeticManager.Instance?.IsItemOwned(itemId) ?? false;
    }
    
    /// <summary>
    /// Get item popularity (placeholder - would use analytics in production)
    /// </summary>
    private int GetItemPopularity(string itemId)
    {
        // In production, this would query analytics data
        // For now, return random value
        return new Random(itemId.GetHashCode()).Next(1, 100);
    }
    
    /// <summary>
    /// Get previously limited items for vault
    /// </summary>
    private List<StoreItem> GetPreviouslyLimitedItems()
    {
        // Placeholder - would return items that were previously limited
        return new List<StoreItem>();
    }
    
    /// <summary>
    /// Get deterministic seed for store rotations
    /// </summary>
    private int GetDeterministicSeed(string type)
    {
        var now = DateTime.UtcNow;
        var seedString = type == "daily" ? 
            $"daily_{now:yyyy-MM-dd}" : 
            $"weekly_{now:yyyy}-{GetWeekOfYear(now)}";
        
        return Math.Abs(seedString.GetHashCode());
    }
    
    /// <summary>
    /// Get week of year
    /// </summary>
    private int GetWeekOfYear(DateTime date)
    {
        var jan1 = new DateTime(date.Year, 1, 1);
        var daysSinceJan1 = (date - jan1).Days;
        return (daysSinceJan1 / 7) + 1;
    }
    
    /// <summary>
    /// Get last update time for store section
    /// </summary>
    private DateTime GetLastUpdateTime(string section)
    {
        var setting = $"store/last_{section}_update";
        var timestampString = ProjectSettings.GetSetting(setting, "").AsString();
        
        if (DateTime.TryParse(timestampString, out var timestamp))
            return timestamp;
        
        return DateTime.MinValue;
    }
    
    /// <summary>
    /// Set last update time for store section
    /// </summary>
    private void SetLastUpdateTime(string section, DateTime timestamp)
    {
        var setting = $"store/last_{section}_update";
        ProjectSettings.SetSetting(setting, timestamp.ToString("O"));
        ProjectSettings.Save();
    }
    
    /// <summary>
    /// Save store data
    /// </summary>
    private void SaveStoreData()
    {
        try
        {
            var data = new StoreData
            {
                DailyDeals = _dailyDeals,
                WeeklyDeals = _weeklyDeals,
                VaultItems = _vaultItems,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(STORE_DATA_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save store data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load store data
    /// </summary>
    private void LoadStoreData()
    {
        try
        {
            if (FileAccess.FileExists(STORE_DATA_FILE))
            {
                using var file = FileAccess.Open(STORE_DATA_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<StoreData>(jsonText);
                
                _dailyDeals = data.DailyDeals ?? new List<StoreItem>();
                _weeklyDeals = data.WeeklyDeals ?? new List<StoreItem>();
                _vaultItems = data.VaultItems ?? new List<StoreItem>();
                
                GD.Print("Store data loaded");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load store data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Save player preferences
    /// </summary>
    private void SavePlayerPreferences()
    {
        try
        {
            using var file = FileAccess.Open(PLAYER_PREFS_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(_playerPreferences, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save player preferences: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load player preferences
    /// </summary>
    private void LoadPlayerPreferences()
    {
        try
        {
            if (FileAccess.FileExists(PLAYER_PREFS_FILE))
            {
                using var file = FileAccess.Open(PLAYER_PREFS_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                _playerPreferences = JsonSerializer.Deserialize<Dictionary<string, PlayerPreferences>>(jsonText) ?? new();
                
                GD.Print($"Player preferences loaded for {_playerPreferences.Count} players");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load player preferences: {e.Message}");
        }
    }
}

// Data structures
public enum StoreItemType
{
    Cosmetic,
    CosmeticSet,
    Currency
}

public class StoreItem
{
    public string ItemId { get; set; } = "";
    public StoreItemType ItemType { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int Price { get; set; }
    public int OriginalPrice { get; set; }
    public CurrencyType Currency { get; set; }
    public int DiscountPercentage { get; set; }
    public bool IsOnSale { get; set; }
    public string Category { get; set; } = "";
    public string Tier { get; set; } = "";
    public string CharacterId { get; set; } = "";
    public string PreviewPath { get; set; } = "";
    public DateTime SaleEndTime { get; set; }
}

public class StoreData
{
    public List<StoreItem> DailyDeals { get; set; } = new();
    public List<StoreItem> WeeklyDeals { get; set; } = new();
    public List<StoreItem> VaultItems { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class PlayerPreferences
{
    public string PlayerId { get; set; } = "";
    public List<string> FavoriteCharacters { get; set; } = new();
    public List<string> PreferredCategories { get; set; } = new();
    public List<StorePurchaseRecord> PurchaseHistory { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class StorePurchaseRecord
{
    public string ItemId { get; set; } = "";
    public string ItemName { get; set; } = "";
    public int Price { get; set; }
    public CurrencyType Currency { get; set; }
    public DateTime Timestamp { get; set; }
}