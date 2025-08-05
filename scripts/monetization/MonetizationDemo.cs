using Godot;
using System;

/// <summary>
/// Demonstration script to showcase the gacha-free monetization system
/// Shows integration between currency, cosmetics, store, battle pass, and ethical safeguards
/// </summary>
public partial class MonetizationDemo : Node
{
    private VBoxContainer _ui;
    private Label _currencyLabel;
    private Label _battlePassLabel;
    private Label _spendingLabel;
    
    public override void _Ready()
    {
        CreateDemoUI();
        
        // Connect to monetization system signals for updates
        if (CurrencyManager.Instance != null)
        {
            CurrencyManager.Instance.CurrencyChanged += OnCurrencyChanged;
        }
        
        if (BattlePassManager.Instance != null)
        {
            BattlePassManager.Instance.XpEarned += OnXpEarned;
            BattlePassManager.Instance.TierUnlocked += OnTierUnlocked;
        }
        
        // Update initial display
        UpdateUI();
    }
    
    /// <summary>
    /// Create simple demonstration UI
    /// </summary>
    private void CreateDemoUI()
    {
        _ui = new VBoxContainer();
        _ui.Position = new Vector2(50, 50);
        _ui.Size = new Vector2(400, 600);
        
        // Title
        var title = new Label();
        title.Text = "Gacha-Free Monetization Demo";
        title.AddThemeStyleboxOverride("normal", new StyleBoxFlat());
        _ui.AddChild(title);
        
        // Currency display
        _currencyLabel = new Label();
        _ui.AddChild(_currencyLabel);
        
        // Battle Pass display
        _battlePassLabel = new Label();
        _ui.AddChild(_battlePassLabel);
        
        // Spending display
        _spendingLabel = new Label();
        _ui.AddChild(_spendingLabel);
        
        // Demo buttons
        CreateDemoButtons();
        
        AddChild(_ui);
    }
    
    /// <summary>
    /// Create demo action buttons
    /// </summary>
    private void CreateDemoButtons()
    {
        // Gameplay rewards
        var gameplayButton = new Button();
        gameplayButton.Text = "Win Match (+500 XP, +200 Tokens)";
        gameplayButton.Pressed += () => SimulateGameplayRewards();
        _ui.AddChild(gameplayButton);
        
        // Purchase premium currency
        var currencyButton = new Button();
        currencyButton.Text = "Buy Fighter Coins ($4.99)";
        currencyButton.Pressed += () => PurchasePremiumCurrency();
        _ui.AddChild(currencyButton);
        
        // Purchase cosmetic
        var cosmeticButton = new Button();
        cosmeticButton.Text = "Buy Ryu Dark Hadou Skin (599 Coins)";
        cosmeticButton.Pressed += () => PurchaseCosmetic();
        _ui.AddChild(cosmeticButton);
        
        // Purchase battle pass
        var battlePassButton = new Button();
        battlePassButton.Text = "Buy Premium Battle Pass (999 Coins)";
        battlePassButton.Pressed += () => PurchaseBattlePass();
        _ui.AddChild(battlePassButton);
        
        // Show store
        var storeButton = new Button();
        storeButton.Text = "Open Store";
        storeButton.Pressed += () => ShowStore();
        _ui.AddChild(storeButton);
        
        // Configure safeguards
        var safeguardsButton = new Button();
        safeguardsButton.Text = "Configure Spending Limits";
        safeguardsButton.Pressed += () => ConfigureSafeguards();
        _ui.AddChild(safeguardsButton);
    }
    
    /// <summary>
    /// Simulate gameplay rewards
    /// </summary>
    private void SimulateGameplayRewards()
    {
        // Award soft currency for match win
        CurrencyManager.Instance?.AwardSoftCurrency(200, "Match victory");
        
        // Award battle pass XP
        BattlePassManager.Instance?.AwardXp("player1", 500, "Match victory");
        
        GD.Print("Simulated match victory rewards");
    }
    
    /// <summary>
    /// Purchase premium currency
    /// </summary>
    private void PurchasePremiumCurrency()
    {
        CurrencyManager.Instance?.InitiatePremiumCurrencyPurchase("premium_medium");
    }
    
    /// <summary>
    /// Purchase a cosmetic item
    /// </summary>
    private void PurchaseCosmetic()
    {
        CosmeticManager.Instance?.PurchaseCosmetic("ryu_dark_hadou");
    }
    
    /// <summary>
    /// Purchase battle pass
    /// </summary>
    private void PurchaseBattlePass()
    {
        BattlePassManager.Instance?.PurchasePremiumBattlePass("player1");
    }
    
    /// <summary>
    /// Show store interface
    /// </summary>
    private void ShowStore()
    {
        var dailyDeals = StorefrontManager.Instance?.GetDailyDeals();
        var weeklyDeals = StorefrontManager.Instance?.GetWeeklyDeals();
        var recommendations = StorefrontManager.Instance?.GetPersonalizedRecommendations("player1");
        
        var storeInfo = "=== STORE ===\n\n";
        
        if (dailyDeals?.Count > 0)
        {
            storeInfo += $"Daily Deals ({dailyDeals.Count}):\n";
            foreach (var deal in dailyDeals)
            {
                storeInfo += $"- {deal.Name}: {deal.Price} {deal.Currency} ({deal.DiscountPercentage}% off)\n";
            }
            storeInfo += "\n";
        }
        
        if (weeklyDeals?.Count > 0)
        {
            storeInfo += $"Weekly Deals ({weeklyDeals.Count}):\n";
            foreach (var deal in weeklyDeals)
            {
                storeInfo += $"- {deal.Name}: {deal.Price} {deal.Currency} ({deal.DiscountPercentage}% off)\n";
            }
            storeInfo += "\n";
        }
        
        if (recommendations?.Count > 0)
        {
            storeInfo += $"Recommended for You ({recommendations.Count}):\n";
            foreach (var item in recommendations)
            {
                storeInfo += $"- {item.Name}: {item.Price} {item.Currency}\n";
            }
        }
        
        ShowInfoDialog("Store", storeInfo);
    }
    
    /// <summary>
    /// Configure ethical safeguards
    /// </summary>
    private void ConfigureSafeguards()
    {
        // Set reasonable spending limits
        EthicalSafeguards.Instance?.ConfigureSpendingLimits(
            dailyLimit: 15.0f,   // $15 per day
            weeklyLimit: 40.0f,  // $40 per week
            monthlyLimit: 80.0f  // $80 per month
        );
        
        var analytics = EthicalSafeguards.Instance?.GetSpendingAnalytics("player1");
        
        var safeguardsInfo = "=== ETHICAL SAFEGUARDS ===\n\n";
        safeguardsInfo += "Spending Limits Configured:\n";
        safeguardsInfo += "- Daily: $15.00\n";
        safeguardsInfo += "- Weekly: $40.00\n";
        safeguardsInfo += "- Monthly: $80.00\n\n";
        
        if (analytics != null)
        {
            safeguardsInfo += "Your Spending:\n";
            safeguardsInfo += $"- Today: ${analytics.DailySpent:F2}\n";
            safeguardsInfo += $"- This Week: ${analytics.WeeklySpent:F2}\n";
            safeguardsInfo += $"- This Month: ${analytics.MonthlySpent:F2}\n";
            safeguardsInfo += $"- Total: ${analytics.TotalSpent:F2}\n";
        }
        
        ShowInfoDialog("Ethical Safeguards", safeguardsInfo);
    }
    
    /// <summary>
    /// Update UI display
    /// </summary>
    private void UpdateUI()
    {
        // Update currency display
        var softCurrency = CurrencyManager.Instance?.GetSoftCurrency() ?? 0;
        var premiumCurrency = CurrencyManager.Instance?.GetPremiumCurrency() ?? 0;
        _currencyLabel.Text = $"Currency: {softCurrency:N0} Training Tokens | {premiumCurrency:N0} Fighter Coins";
        
        // Update battle pass display
        var battlePass = BattlePassManager.Instance?.GetCurrentBattlePass();
        var progress = BattlePassManager.Instance?.GetPlayerProgress("player1");
        if (battlePass != null && progress != null)
        {
            _battlePassLabel.Text = $"Battle Pass: {battlePass.Name} | Tier {progress.CurrentSeasonTier}/100 | XP: {progress.CurrentSeasonXp:N0}";
        }
        else
        {
            _battlePassLabel.Text = "Battle Pass: Not Available";
        }
        
        // Update spending display
        var analytics = EthicalSafeguards.Instance?.GetSpendingAnalytics("player1");
        if (analytics != null)
        {
            _spendingLabel.Text = $"Spending: Today ${analytics.DailySpent:F2} | Week ${analytics.WeeklySpent:F2} | Month ${analytics.MonthlySpent:F2}";
        }
        else
        {
            _spendingLabel.Text = "Spending: $0.00 | $0.00 | $0.00";
        }
    }
    
    /// <summary>
    /// Show information dialog
    /// </summary>
    private void ShowInfoDialog(string title, string message)
    {
        var dialog = new AcceptDialog();
        dialog.Title = title;
        dialog.DialogText = message;
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }
    
    /// <summary>
    /// Handle currency changes
    /// </summary>
    private void OnCurrencyChanged(CurrencyType currencyType, int oldAmount, int newAmount)
    {
        UpdateUI();
        GD.Print($"Currency changed: {currencyType} {oldAmount} -> {newAmount}");
    }
    
    /// <summary>
    /// Handle XP earned
    /// </summary>
    private void OnXpEarned(string playerId, int xpGained, string source)
    {
        UpdateUI();
        GD.Print($"XP earned: +{xpGained} from {source}");
    }
    
    /// <summary>
    /// Handle tier unlocked
    /// </summary>
    private void OnTierUnlocked(string playerId, int tier, string rewardId)
    {
        UpdateUI();
        ShowInfoDialog("Battle Pass", $"Congratulations!\n\nYou reached Tier {tier}!\nReward: {rewardId}");
    }
    
    public override void _ExitTree()
    {
        // Disconnect signals to prevent memory leaks
        if (CurrencyManager.Instance != null)
        {
            CurrencyManager.Instance.CurrencyChanged -= OnCurrencyChanged;
        }
        
        if (BattlePassManager.Instance != null)
        {
            BattlePassManager.Instance.XpEarned -= OnXpEarned;
            BattlePassManager.Instance.TierUnlocked -= OnTierUnlocked;
        }
    }
}