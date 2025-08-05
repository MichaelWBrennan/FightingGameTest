using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;
using System.Threading.Tasks;

/// <summary>
/// Cross-Platform Wallet & Unified Account System
/// Handles platform-agnostic purchases, real-time syncing, and entitlement management
/// Supports Steam, PSN, Xbox, Switch, mobile, and cloud delivery
/// </summary>
public partial class CrossPlatformWallet : Node
{
    public static CrossPlatformWallet Instance { get; private set; }
    
    private UnifiedAccount _currentAccount;
    private Dictionary<string, PlatformEntitlement> _platformEntitlements = new();
    private RegionalPricing _regionalPricing;
    private const string ACCOUNT_DATA_FILE = "user://unified_account.json";
    private const string WALLET_DATA_FILE = "user://wallet_data.json";
    
    [Signal]
    public delegate void AccountSyncedEventHandler();
    
    [Signal]
    public delegate void PurchaseCompletedEventHandler(string itemId, double price, string platform);
    
    [Signal]
    public delegate void EntitlementUpdatedEventHandler(string itemId, bool isOwned);
    
    [Signal]
    public delegate void GiftSentEventHandler(string recipientId, string itemId);

    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeRegionalPricing();
            LoadAccountData();
            ConnectToPlatforms();
        }
        else
        {
            QueueFree();
        }
    }

    /// <summary>
    /// Initialize regional pricing for different markets
    /// </summary>
    private void InitializeRegionalPricing()
    {
        _regionalPricing = new RegionalPricing
        {
            BaseCurrency = "USD",
            Regions = new Dictionary<string, RegionPricing>
            {
                ["USD"] = new() { CurrencyCode = "USD", TaxRate = 0.0f, PriceMultiplier = 1.0f, Symbol = "$" },
                ["EUR"] = new() { CurrencyCode = "EUR", TaxRate = 0.19f, PriceMultiplier = 0.85f, Symbol = "€" },
                ["GBP"] = new() { CurrencyCode = "GBP", TaxRate = 0.20f, PriceMultiplier = 0.75f, Symbol = "£" },
                ["JPY"] = new() { CurrencyCode = "JPY", TaxRate = 0.10f, PriceMultiplier = 110.0f, Symbol = "¥" },
                ["CNY"] = new() { CurrencyCode = "CNY", TaxRate = 0.13f, PriceMultiplier = 6.5f, Symbol = "¥" },
                ["BRL"] = new() { CurrencyCode = "BRL", TaxRate = 0.17f, PriceMultiplier = 5.0f, Symbol = "R$" },
                ["RUB"] = new() { CurrencyCode = "RUB", TaxRate = 0.20f, PriceMultiplier = 60.0f, Symbol = "₽" },
                ["KRW"] = new() { CurrencyCode = "KRW", TaxRate = 0.10f, PriceMultiplier = 1200.0f, Symbol = "₩" }
            }
        };
        
        GD.Print($"Regional pricing initialized for {_regionalPricing.Regions.Count} regions");
    }

    /// <summary>
    /// Connect to various platform services
    /// </summary>
    private async void ConnectToPlatforms()
    {
        // Steam integration
        await InitializeSteamWallet();
        
        // Console platform integrations would go here
        // await InitializePlayStationWallet();
        // await InitializeXboxWallet();
        // await InitializeNintendoWallet();
        
        // Mobile platform integrations
        // await InitializeGooglePlayWallet();
        // await InitializeAppleWallet();
        
        GD.Print("Platform wallet integrations initialized");
    }

    /// <summary>
    /// Initialize Steam wallet integration
    /// </summary>
    private async Task InitializeSteamWallet()
    {
        // In production, this would use Steamworks SDK
        // For now, simulate Steam connection
        _platformEntitlements["steam"] = new PlatformEntitlement
        {
            PlatformId = "steam",
            UserId = "76561198000000000", // Simulated Steam ID
            IsConnected = true,
            LastSyncTime = DateTime.UtcNow,
            OwnedItems = new HashSet<string>()
        };
        
        GD.Print("Steam wallet integration initialized (simulated)");
        await Task.CompletedTask;
    }

    /// <summary>
    /// Create or load unified account
    /// </summary>
    public async Task<bool> CreateUnifiedAccount(string displayName, string email = "")
    {
        if (_currentAccount != null)
        {
            GD.Print("Account already exists");
            return false;
        }

        _currentAccount = new UnifiedAccount
        {
            AccountId = Guid.NewGuid().ToString(),
            DisplayName = displayName,
            Email = email,
            CreatedDate = DateTime.UtcNow,
            LastSyncTime = DateTime.UtcNow,
            Region = DetectUserRegion()
        };

        SaveAccountData();
        await SyncAcrossPlatforms();
        
        GD.Print($"Unified account created: {displayName}");
        return true;
    }

    /// <summary>
    /// Detect user's region based on system locale
    /// </summary>
    private string DetectUserRegion()
    {
        // In production, would use proper locale detection
        var locale = OS.GetLocaleLanguage();
        return locale switch
        {
            "en" => "USD",
            "fr" => "EUR",
            "de" => "EUR",
            "es" => "EUR",
            "ja" => "JPY",
            "zh" => "CNY",
            "pt" => "BRL",
            "ru" => "RUB",
            "ko" => "KRW",
            _ => "USD"
        };
    }

    /// <summary>
    /// Purchase item with regional pricing
    /// </summary>
    public async Task<bool> PurchaseItem(string itemId, string platform = "direct")
    {
        if (_currentAccount == null)
        {
            ShowAccountRequiredDialog();
            return false;
        }

        // Get regional price
        var price = GetRegionalPrice(itemId, _currentAccount.Region);
        var regionInfo = _regionalPricing.Regions[_currentAccount.Region];
        
        // Show purchase confirmation
        var confirmed = await ShowPurchaseConfirmation(itemId, price, regionInfo);
        if (!confirmed)
        {
            return false;
        }

        // Process purchase through appropriate platform
        var success = await ProcessPlatformPurchase(itemId, price, platform);
        
        if (success)
        {
            // Add to account entitlements
            _currentAccount.OwnedItems.Add(itemId);
            _currentAccount.PurchaseHistory.Add(new PurchaseRecord
            {
                ItemId = itemId,
                Price = price,
                Currency = regionInfo.CurrencyCode,
                Platform = platform,
                Timestamp = DateTime.UtcNow,
                TransactionId = Guid.NewGuid().ToString()
            });

            SaveAccountData();
            await SyncAcrossPlatforms();
            
            EmitSignal(SignalName.PurchaseCompleted, itemId, (double)price, platform);
            EmitSignal(SignalName.EntitlementUpdated, itemId, true);
            
            GD.Print($"Purchase completed: {itemId} for {regionInfo.Symbol}{price:F2} on {platform}");
        }

        return success;
    }

    /// <summary>
    /// Get regional price for an item
    /// </summary>
    public decimal GetRegionalPrice(string itemId, string region = null)
    {
        region ??= _currentAccount?.Region ?? "USD";
        
        if (!_regionalPricing.Regions.ContainsKey(region))
        {
            region = "USD";
        }

        // Get base price from cosmetic storefront
        decimal basePrice = 0;
        if (CosmeticStorefront.Instance != null)
        {
            var cosmetic = CosmeticStorefront.Instance.GetCosmetic(itemId);
            if (cosmetic != null)
            {
                basePrice = cosmetic.Price;
            }
        }

        // Apply regional pricing
        var regionInfo = _regionalPricing.Regions[region];
        var localPrice = basePrice * (decimal)regionInfo.PriceMultiplier;
        
        // Add taxes
        var tax = localPrice * (decimal)regionInfo.TaxRate;
        
        return Math.Round(localPrice + tax, 2);
    }

    /// <summary>
    /// Process purchase through platform-specific payment system
    /// </summary>
    private async Task<bool> ProcessPlatformPurchase(string itemId, decimal price, string platform)
    {
        switch (platform.ToLower())
        {
            case "steam":
                return await ProcessSteamPurchase(itemId, price);
            case "playstation":
                return await ProcessPlayStationPurchase(itemId, price);
            case "xbox":
                return await ProcessXboxPurchase(itemId, price);
            case "nintendo":
                return await ProcessNintendoPurchase(itemId, price);
            case "direct":
            default:
                return await ProcessDirectPurchase(itemId, price);
        }
    }

    private async Task<bool> ProcessSteamPurchase(string itemId, decimal price)
    {
        // In production: Steamworks Microtransaction API
        GD.Print($"Processing Steam purchase: {itemId} for ${price:F2}");
        await Task.Delay(1000); // Simulate API call
        return true; // Simulate success
    }

    private async Task<bool> ProcessPlayStationPurchase(string itemId, decimal price)
    {
        // In production: PlayStation Store API
        GD.Print($"Processing PlayStation purchase: {itemId} for ${price:F2}");
        await Task.Delay(1000);
        return true;
    }

    private async Task<bool> ProcessXboxPurchase(string itemId, decimal price)
    {
        // In production: Microsoft Store API
        GD.Print($"Processing Xbox purchase: {itemId} for ${price:F2}");
        await Task.Delay(1000);
        return true;
    }

    private async Task<bool> ProcessNintendoPurchase(string itemId, decimal price)
    {
        // In production: Nintendo eShop API
        GD.Print($"Processing Nintendo purchase: {itemId} for ${price:F2}");
        await Task.Delay(1000);
        return true;
    }

    private async Task<bool> ProcessDirectPurchase(string itemId, decimal price)
    {
        // In production: Stripe, PayPal, or other payment processor
        GD.Print($"Processing direct purchase: {itemId} for ${price:F2}");
        await Task.Delay(1000);
        return true;
    }

    /// <summary>
    /// Sync account data across all connected platforms
    /// </summary>
    public async Task SyncAcrossPlatforms()
    {
        if (_currentAccount == null) return;

        var syncTasks = new List<Task>();
        
        foreach (var platform in _platformEntitlements.Values)
        {
            if (platform.IsConnected)
            {
                syncTasks.Add(SyncPlatformEntitlements(platform));
            }
        }

        await Task.WhenAll(syncTasks);
        
        _currentAccount.LastSyncTime = DateTime.UtcNow;
        SaveAccountData();
        EmitSignal(SignalName.AccountSynced);
        
        GD.Print("Cross-platform sync completed");
    }

    /// <summary>
    /// Sync entitlements for a specific platform
    /// </summary>
    private async Task SyncPlatformEntitlements(PlatformEntitlement platform)
    {
        try
        {
            // In production, query platform-specific APIs for owned items
            // For now, simulate sync
            await Task.Delay(500);
            
            platform.LastSyncTime = DateTime.UtcNow;
            GD.Print($"Synced entitlements for {platform.PlatformId}");
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to sync {platform.PlatformId}: {e.Message}");
        }
    }

    /// <summary>
    /// Send gift to another player
    /// </summary>
    public async Task<bool> SendGift(string recipientId, string itemId, string message = "")
    {
        if (_currentAccount == null)
        {
            ShowAccountRequiredDialog();
            return false;
        }

        // Check if item can be gifted
        if (!CanItemBeGifted(itemId))
        {
            ShowCannotGiftDialog(itemId);
            return false;
        }

        var price = GetRegionalPrice(itemId, _currentAccount.Region);
        var regionInfo = _regionalPricing.Regions[_currentAccount.Region];

        // Show gift confirmation
        var confirmed = await ShowGiftConfirmation(recipientId, itemId, price, regionInfo, message);
        if (!confirmed)
        {
            return false;
        }

        // Process gift purchase
        var success = await ProcessPlatformPurchase(itemId, price, "gift");
        
        if (success)
        {
            // Record gift transaction
            var giftRecord = new GiftRecord
            {
                GiftId = Guid.NewGuid().ToString(),
                SenderId = _currentAccount.AccountId,
                RecipientId = recipientId,
                ItemId = itemId,
                Message = message,
                Price = price,
                Currency = regionInfo.CurrencyCode,
                SentDate = DateTime.UtcNow,
                Status = "sent"
            };

            _currentAccount.GiftsSent.Add(giftRecord);
            SaveAccountData();
            
            // In production, notify recipient through platform/server
            await NotifyGiftRecipient(giftRecord);
            
            EmitSignal(SignalName.GiftSent, recipientId, itemId);
            ShowGiftSentDialog(recipientId, itemId);
            
            GD.Print($"Gift sent: {itemId} to {recipientId}");
        }

        return success;
    }

    /// <summary>
    /// Check if an item can be gifted
    /// </summary>
    private bool CanItemBeGifted(string itemId)
    {
        // Some items might not be giftable (region-restricted, etc.)
        return true; // For now, all items are giftable
    }

    /// <summary>
    /// Notify gift recipient
    /// </summary>
    private async Task NotifyGiftRecipient(GiftRecord gift)
    {
        // In production, send notification through platform or server
        await Task.Delay(100);
        GD.Print($"Gift notification sent to {gift.RecipientId}");
    }

    /// <summary>
    /// Check if player owns an item across all platforms
    /// </summary>
    public bool DoesPlayerOwnItem(string itemId)
    {
        if (_currentAccount?.OwnedItems.Contains(itemId) == true)
        {
            return true;
        }

        // Check platform entitlements
        foreach (var platform in _platformEntitlements.Values)
        {
            if (platform.OwnedItems.Contains(itemId))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Get purchase history with filtering
    /// </summary>
    public List<PurchaseRecord> GetPurchaseHistory(string platform = null, DateTime? since = null)
    {
        if (_currentAccount == null) return new List<PurchaseRecord>();

        var history = _currentAccount.PurchaseHistory.AsEnumerable();

        if (!string.IsNullOrEmpty(platform))
        {
            history = history.Where(p => p.Platform.Equals(platform, StringComparison.OrdinalIgnoreCase));
        }

        if (since.HasValue)
        {
            history = history.Where(p => p.Timestamp >= since.Value);
        }

        return history.OrderByDescending(p => p.Timestamp).ToList();
    }

    /// <summary>
    /// Export purchase data for GDPR compliance
    /// </summary>
    public string ExportPurchaseData()
    {
        if (_currentAccount == null) return "No account data available";

        var exportData = new
        {
            Account = new
            {
                _currentAccount.AccountId,
                _currentAccount.DisplayName,
                _currentAccount.CreatedDate,
                _currentAccount.Region
            },
            PurchaseHistory = _currentAccount.PurchaseHistory,
            GiftsSent = _currentAccount.GiftsSent,
            OwnedItems = _currentAccount.OwnedItems,
            ExportDate = DateTime.UtcNow
        };

        return JsonSerializer.Serialize(exportData, new JsonSerializerOptions { WriteIndented = true });
    }

    // Dialog methods
    private void ShowAccountRequiredDialog()
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Account Required";
        dialog.DialogText = "You need to create a unified account to make purchases.";
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private async Task<bool> ShowPurchaseConfirmation(string itemId, decimal price, RegionPricing region)
    {
        var tcs = new TaskCompletionSource<bool>();
        
        var dialog = new ConfirmationDialog();
        dialog.Title = "Confirm Purchase";
        dialog.DialogText = $"Purchase {itemId}\n\nPrice: {region.Symbol}{price:F2} {region.CurrencyCode}\nIncluding {region.TaxRate:P} tax\n\nConfirm purchase?";
        
        dialog.Confirmed += () => tcs.SetResult(true);
        dialog.Canceled += () => tcs.SetResult(false);
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
        
        return await tcs.Task;
    }

    private async Task<bool> ShowGiftConfirmation(string recipientId, string itemId, decimal price, RegionPricing region, string message)
    {
        var tcs = new TaskCompletionSource<bool>();
        
        var dialog = new ConfirmationDialog();
        dialog.Title = "Confirm Gift";
        dialog.DialogText = $"Send gift to: {recipientId}\nItem: {itemId}\nPrice: {region.Symbol}{price:F2}\nMessage: {message}\n\nConfirm gift purchase?";
        
        dialog.Confirmed += () => tcs.SetResult(true);
        dialog.Canceled += () => tcs.SetResult(false);
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
        
        return await tcs.Task;
    }

    private void ShowCannotGiftDialog(string itemId)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Cannot Gift Item";
        dialog.DialogText = $"{itemId} cannot be gifted due to restrictions.";
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ShowGiftSentDialog(string recipientId, string itemId)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Gift Sent";
        dialog.DialogText = $"Gift successfully sent to {recipientId}!\n\n{itemId} will be delivered to their account.";
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void SaveAccountData()
    {
        try
        {
            var data = new WalletSaveData
            {
                CurrentAccount = _currentAccount,
                PlatformEntitlements = _platformEntitlements,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(WALLET_DATA_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save wallet data: {e.Message}");
        }
    }

    private void LoadAccountData()
    {
        try
        {
            if (FileAccess.FileExists(WALLET_DATA_FILE))
            {
                using var file = FileAccess.Open(WALLET_DATA_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<WalletSaveData>(jsonText);
                
                _currentAccount = data.CurrentAccount;
                _platformEntitlements = data.PlatformEntitlements ?? new();
                
                GD.Print($"Loaded wallet data for account: {_currentAccount?.DisplayName ?? "None"}");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load wallet data: {e.Message}");
        }
    }
}

// Data structures
public class UnifiedAccount
{
    public string AccountId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Region { get; set; } = "USD";
    public DateTime CreatedDate { get; set; }
    public DateTime LastSyncTime { get; set; }
    public HashSet<string> OwnedItems { get; set; } = new();
    public List<PurchaseRecord> PurchaseHistory { get; set; } = new();
    public List<GiftRecord> GiftsSent { get; set; } = new();
    public List<GiftRecord> GiftsReceived { get; set; } = new();
}

public class PlatformEntitlement
{
    public string PlatformId { get; set; } = "";
    public string UserId { get; set; } = "";
    public bool IsConnected { get; set; }
    public DateTime LastSyncTime { get; set; }
    public HashSet<string> OwnedItems { get; set; } = new();
}

public class RegionalPricing
{
    public string BaseCurrency { get; set; } = "USD";
    public Dictionary<string, RegionPricing> Regions { get; set; } = new();
}

public class RegionPricing
{
    public string CurrencyCode { get; set; } = "";
    public float TaxRate { get; set; }
    public float PriceMultiplier { get; set; }
    public string Symbol { get; set; } = "";
}

public class PurchaseRecord
{
    public string ItemId { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "";
    public string Platform { get; set; } = "";
    public DateTime Timestamp { get; set; }
    public string TransactionId { get; set; } = "";
}

public class GiftRecord
{
    public string GiftId { get; set; } = "";
    public string SenderId { get; set; } = "";
    public string RecipientId { get; set; } = "";
    public string ItemId { get; set; } = "";
    public string Message { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "";
    public DateTime SentDate { get; set; }
    public string Status { get; set; } = ""; // sent, received, expired
}

public class WalletSaveData
{
    public UnifiedAccount CurrentAccount { get; set; }
    public Dictionary<string, PlatformEntitlement> PlatformEntitlements { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}