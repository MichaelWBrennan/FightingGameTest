using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Manages dual currency system: Soft currency (earned via gameplay) and Premium currency (purchased with real money)
/// Ensures transparent pricing with real money equivalents and no obfuscation
/// </summary>
public partial class CurrencyManager : Node
{
    public static CurrencyManager Instance { get; private set; }
    
    private CurrencyWallet _playerWallet = new();
    private Dictionary<string, CurrencyPrice> _currencyPrices = new();
    private const string WALLET_FILE = "user://player_wallet.json";
    
    // Currency exchange rates (premium currency to USD)
    private const float PREMIUM_CURRENCY_USD_RATE = 0.01f; // 1 premium = $0.01 USD
    
    [Signal]
    public delegate void CurrencyChangedEventHandler(CurrencyType currencyType, int oldAmount, int newAmount);
    
    [Signal]
    public delegate void PurchaseCompletedEventHandler(string itemId, CurrencyType currencyUsed, int amount);
    
    [Signal]
    public delegate void InsufficientFundsEventHandler(CurrencyType currencyType, int required, int available);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadWalletData();
            InitializeCurrencyPrices();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize currency pricing for premium currency purchases
    /// </summary>
    private void InitializeCurrencyPrices()
    {
        // Premium currency purchase tiers with bonus amounts for larger purchases
        _currencyPrices["premium_small"] = new CurrencyPrice
        {
            Id = "premium_small",
            Name = "Fighter Coins - Small Pack",
            PremiumAmount = 100,
            UsdPrice = 0.99f,
            BonusAmount = 0,
            Description = "100 Fighter Coins"
        };
        
        _currencyPrices["premium_medium"] = new CurrencyPrice
        {
            Id = "premium_medium",
            Name = "Fighter Coins - Medium Pack",
            PremiumAmount = 500,
            UsdPrice = 4.99f,
            BonusAmount = 50, // 10% bonus
            Description = "500 + 50 Bonus Fighter Coins"
        };
        
        _currencyPrices["premium_large"] = new CurrencyPrice
        {
            Id = "premium_large", 
            Name = "Fighter Coins - Large Pack",
            PremiumAmount = 1200,
            UsdPrice = 9.99f,
            BonusAmount = 200, // ~17% bonus
            Description = "1200 + 200 Bonus Fighter Coins"
        };
        
        _currencyPrices["premium_mega"] = new CurrencyPrice
        {
            Id = "premium_mega",
            Name = "Fighter Coins - Mega Pack",
            PremiumAmount = 2500,
            UsdPrice = 19.99f,
            BonusAmount = 600, // 24% bonus
            Description = "2500 + 600 Bonus Fighter Coins"
        };
        
        GD.Print("Currency prices initialized with transparent USD rates");
    }
    
    /// <summary>
    /// Get current soft currency balance
    /// </summary>
    public int GetSoftCurrency() => _playerWallet.SoftCurrency;
    
    /// <summary>
    /// Get current premium currency balance
    /// </summary>
    public int GetPremiumCurrency() => _playerWallet.PremiumCurrency;
    
    /// <summary>
    /// Award soft currency for gameplay activities
    /// </summary>
    public void AwardSoftCurrency(int amount, string reason = "")
    {
        if (amount <= 0) return;
        
        var oldAmount = _playerWallet.SoftCurrency;
        _playerWallet.SoftCurrency += amount;
        _playerWallet.SoftCurrencyEarned += amount;
        _playerWallet.LastUpdated = DateTime.UtcNow;
        
        // Log the award for transparency
        _playerWallet.TransactionHistory.Add(new CurrencyTransaction
        {
            Type = CurrencyType.Soft,
            Amount = amount,
            Reason = reason,
            Timestamp = DateTime.UtcNow,
            BalanceAfter = _playerWallet.SoftCurrency
        });
        
        SaveWalletData();
        EmitSignal(SignalName.CurrencyChanged, (int)CurrencyType.Soft, oldAmount, _playerWallet.SoftCurrency);
        
        GD.Print($"Awarded {amount} soft currency for: {reason}");
    }
    
    /// <summary>
    /// Award premium currency (typically from purchases)
    /// </summary>
    public void AwardPremiumCurrency(int amount, string reason = "")
    {
        if (amount <= 0) return;
        
        var oldAmount = _playerWallet.PremiumCurrency;
        _playerWallet.PremiumCurrency += amount;
        _playerWallet.PremiumCurrencyPurchased += amount;
        _playerWallet.LastUpdated = DateTime.UtcNow;
        
        // Log the award for transparency
        _playerWallet.TransactionHistory.Add(new CurrencyTransaction
        {
            Type = CurrencyType.Premium,
            Amount = amount,
            Reason = reason,
            Timestamp = DateTime.UtcNow,
            BalanceAfter = _playerWallet.PremiumCurrency
        });
        
        SaveWalletData();
        EmitSignal(SignalName.CurrencyChanged, (int)CurrencyType.Premium, oldAmount, _playerWallet.PremiumCurrency);
        
        GD.Print($"Awarded {amount} premium currency for: {reason}");
    }
    
    /// <summary>
    /// Attempt to spend currency (soft or premium)
    /// </summary>
    public bool SpendCurrency(CurrencyType currencyType, int amount, string reason = "")
    {
        if (amount <= 0) return false;
        
        var currentBalance = currencyType == CurrencyType.Soft ? _playerWallet.SoftCurrency : _playerWallet.PremiumCurrency;
        
        if (currentBalance < amount)
        {
            EmitSignal(SignalName.InsufficientFunds, (int)currencyType, amount, currentBalance);
            return false;
        }
        
        var oldAmount = currentBalance;
        
        if (currencyType == CurrencyType.Soft)
        {
            _playerWallet.SoftCurrency -= amount;
            _playerWallet.SoftCurrencySpent += amount;
        }
        else
        {
            _playerWallet.PremiumCurrency -= amount;
            _playerWallet.PremiumCurrencySpent += amount;
        }
        
        _playerWallet.LastUpdated = DateTime.UtcNow;
        
        // Log the spending for transparency
        _playerWallet.TransactionHistory.Add(new CurrencyTransaction
        {
            Type = currencyType,
            Amount = -amount, // Negative for spending
            Reason = reason,
            Timestamp = DateTime.UtcNow,
            BalanceAfter = currencyType == CurrencyType.Soft ? _playerWallet.SoftCurrency : _playerWallet.PremiumCurrency
        });
        
        SaveWalletData();
        var newAmount = currencyType == CurrencyType.Soft ? _playerWallet.SoftCurrency : _playerWallet.PremiumCurrency;
        EmitSignal(SignalName.CurrencyChanged, (int)currencyType, oldAmount, newAmount);
        
        GD.Print($"Spent {amount} {currencyType} currency for: {reason}");
        return true;
    }
    
    /// <summary>
    /// Check if player can afford an item
    /// </summary>
    public bool CanAfford(CurrencyType currencyType, int amount)
    {
        var currentBalance = currencyType == CurrencyType.Soft ? _playerWallet.SoftCurrency : _playerWallet.PremiumCurrency;
        return currentBalance >= amount;
    }
    
    /// <summary>
    /// Get USD equivalent for premium currency amount (transparent pricing)
    /// </summary>
    public float GetUsdEquivalent(int premiumAmount)
    {
        return premiumAmount * PREMIUM_CURRENCY_USD_RATE;
    }
    
    /// <summary>
    /// Get formatted price string with USD equivalent
    /// </summary>
    public string GetFormattedPrice(CurrencyType currencyType, int amount)
    {
        if (currencyType == CurrencyType.Soft)
        {
            return $"{amount:N0} Training Tokens";
        }
        else
        {
            var usdEquivalent = GetUsdEquivalent(amount);
            return $"{amount:N0} Fighter Coins (≈${usdEquivalent:F2})";
        }
    }
    
    /// <summary>
    /// Get available premium currency purchase options
    /// </summary>
    public List<CurrencyPrice> GetPremiumCurrencyPurchaseOptions()
    {
        return new List<CurrencyPrice>(_currencyPrices.Values);
    }
    
    /// <summary>
    /// Initiate premium currency purchase
    /// </summary>
    public void InitiatePremiumCurrencyPurchase(string priceId)
    {
        if (!_currencyPrices.ContainsKey(priceId))
        {
            GD.PrintErr($"Invalid price ID: {priceId}");
            return;
        }
        
        var price = _currencyPrices[priceId];
        
        // Create confirmation dialog with transparent pricing
        var dialog = new ConfirmationDialog();
        dialog.Title = "Confirm Purchase";
        dialog.DialogText = $"Purchase {price.Description}?\n\nPrice: ${price.UsdPrice:F2} USD\n\nThis will add {price.PremiumAmount + price.BonusAmount} Fighter Coins to your account.";
        
        dialog.Confirmed += () => {
            ProcessPremiumCurrencyPurchase(price);
        };
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }
    
    /// <summary>
    /// Process premium currency purchase (simulation for development)
    /// </summary>
    private void ProcessPremiumCurrencyPurchase(CurrencyPrice price)
    {
        // In production, this would integrate with Steam/platform payment APIs
        // For now, simulate successful purchase
        
        var totalAmount = price.PremiumAmount + price.BonusAmount;
        AwardPremiumCurrency(totalAmount, $"Purchased {price.Name}");
        
        // Record purchase for analytics
        _playerWallet.PurchaseHistory.Add(new CurrencyPurchase
        {
            PriceId = price.Id,
            UsdAmount = price.UsdPrice,
            PremiumAmount = totalAmount,
            Timestamp = DateTime.UtcNow
        });
        
        SaveWalletData();
        
        // Show success message
        var successDialog = new AcceptDialog();
        successDialog.Title = "Purchase Complete";
        successDialog.DialogText = $"Thank you for your purchase!\n\n{totalAmount} Fighter Coins have been added to your account.";
        
        GetTree().Root.AddChild(successDialog);
        successDialog.PopupCentered();
        
        GD.Print($"Premium currency purchase completed: {price.Name}");
    }
    
    /// <summary>
    /// Get player wallet analytics
    /// </summary>
    public CurrencyAnalytics GetWalletAnalytics()
    {
        return new CurrencyAnalytics
        {
            SoftCurrencyBalance = _playerWallet.SoftCurrency,
            PremiumCurrencyBalance = _playerWallet.PremiumCurrency,
            TotalSoftEarned = _playerWallet.SoftCurrencyEarned,
            TotalSoftSpent = _playerWallet.SoftCurrencySpent,
            TotalPremiumPurchased = _playerWallet.PremiumCurrencyPurchased,
            TotalPremiumSpent = _playerWallet.PremiumCurrencySpent,
            TotalUsdSpent = _playerWallet.PurchaseHistory.Sum(p => p.UsdAmount),
            TransactionCount = _playerWallet.TransactionHistory.Count,
            PurchaseCount = _playerWallet.PurchaseHistory.Count
        };
    }
    
    /// <summary>
    /// Save wallet data to file
    /// </summary>
    private void SaveWalletData()
    {
        try
        {
            using var file = FileAccess.Open(WALLET_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(_playerWallet, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save wallet data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load wallet data from file
    /// </summary>
    private void LoadWalletData()
    {
        try
        {
            if (FileAccess.FileExists(WALLET_FILE))
            {
                using var file = FileAccess.Open(WALLET_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                _playerWallet = JsonSerializer.Deserialize<CurrencyWallet>(jsonText) ?? new CurrencyWallet();
                GD.Print("Wallet data loaded");
            }
            else
            {
                // Initialize new player with starting soft currency
                AwardSoftCurrency(1000, "Welcome bonus");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load wallet data: {e.Message}");
            _playerWallet = new CurrencyWallet();
        }
    }
}

// Enums and data structures
public enum CurrencyType
{
    Soft,    // Training Tokens - earned via gameplay
    Premium  // Fighter Coins - purchased with real money
}

public class CurrencyWallet
{
    public int SoftCurrency { get; set; }
    public int PremiumCurrency { get; set; }
    public int SoftCurrencyEarned { get; set; }
    public int SoftCurrencySpent { get; set; }
    public int PremiumCurrencyPurchased { get; set; }
    public int PremiumCurrencySpent { get; set; }
    public DateTime LastUpdated { get; set; }
    public List<CurrencyTransaction> TransactionHistory { get; set; } = new();
    public List<CurrencyPurchase> PurchaseHistory { get; set; } = new();
}

public class CurrencyTransaction
{
    public CurrencyType Type { get; set; }
    public int Amount { get; set; }
    public string Reason { get; set; } = "";
    public DateTime Timestamp { get; set; }
    public int BalanceAfter { get; set; }
}

public class CurrencyPurchase
{
    public string PriceId { get; set; } = "";
    public float UsdAmount { get; set; }
    public int PremiumAmount { get; set; }
    public DateTime Timestamp { get; set; }
}

public class CurrencyPrice
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int PremiumAmount { get; set; }
    public float UsdPrice { get; set; }
    public int BonusAmount { get; set; }
    public string Description { get; set; } = "";
}

public class CurrencyAnalytics
{
    public int SoftCurrencyBalance { get; set; }
    public int PremiumCurrencyBalance { get; set; }
    public int TotalSoftEarned { get; set; }
    public int TotalSoftSpent { get; set; }
    public int TotalPremiumPurchased { get; set; }
    public int TotalPremiumSpent { get; set; }
    public float TotalUsdSpent { get; set; }
    public int TransactionCount { get; set; }
    public int PurchaseCount { get; set; }
}