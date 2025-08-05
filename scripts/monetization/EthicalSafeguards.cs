using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Manages ethical safeguards for monetization including spending limits, parental controls,
/// and purchase confirmations to prevent exploitation and promote responsible spending
/// </summary>
public partial class EthicalSafeguards : Node
{
    public static EthicalSafeguards Instance { get; private set; }
    
    private SafeguardSettings _settings = new();
    private Dictionary<string, SpendingTracker> _playerSpending = new();
    private const string SAFEGUARDS_FILE = "user://ethical_safeguards.json";
    private const string SPENDING_DATA_FILE = "user://spending_tracker.json";
    
    // Default spending limits (can be customized by players)
    private const float DEFAULT_DAILY_LIMIT_USD = 20.0f;
    private const float DEFAULT_WEEKLY_LIMIT_USD = 50.0f;
    private const float DEFAULT_MONTHLY_LIMIT_USD = 100.0f;
    
    [Signal]
    public delegate void SpendingLimitReachedEventHandler(string playerId, string period, float limit);
    
    [Signal]
    public delegate void ParentalControlTriggeredEventHandler(string action, string playerId);
    
    [Signal]
    public delegate void PurchaseRequiresConfirmationEventHandler(string itemId, float usdAmount);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadSafeguardSettings();
            LoadSpendingData();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Check if a purchase is allowed under current safeguards
    /// </summary>
    public PurchaseValidationResult ValidatePurchase(string playerId, float usdAmount, string itemDescription = "")
    {
        var result = new PurchaseValidationResult { IsAllowed = true };
        
        // Check parental controls
        if (_settings.ParentalControlsEnabled)
        {
            var parentalResult = CheckParentalControls(playerId, usdAmount);
            if (!parentalResult.IsAllowed)
            {
                return parentalResult;
            }
        }
        
        // Check spending limits
        var spendingResult = CheckSpendingLimits(playerId, usdAmount);
        if (!spendingResult.IsAllowed)
        {
            return spendingResult;
        }
        
        // Check if purchase requires additional confirmation
        if (RequiresAdditionalConfirmation(playerId, usdAmount))
        {
            result.RequiresConfirmation = true;
            result.ConfirmationMessage = CreateConfirmationMessage(playerId, usdAmount, itemDescription);
        }
        
        return result;
    }
    
    /// <summary>
    /// Check parental controls
    /// </summary>
    private PurchaseValidationResult CheckParentalControls(string playerId, float usdAmount)
    {
        var result = new PurchaseValidationResult();
        
        // Check if purchase is allowed at all
        if (!_settings.AllowPurchases)
        {
            result.IsAllowed = false;
            result.ReasonCode = "PARENTAL_PURCHASES_DISABLED";
            result.UserMessage = "Purchases are disabled by parental controls.";
            EmitSignal(SignalName.ParentalControlTriggered, "purchase_blocked", playerId);
            return result;
        }
        
        // Check amount limits for minors
        if (_settings.IsMinorAccount && usdAmount > _settings.MinorPurchaseLimit)
        {
            result.IsAllowed = false;
            result.ReasonCode = "PARENTAL_AMOUNT_LIMIT";
            result.UserMessage = $"Purchase amount (${usdAmount:F2}) exceeds parental limit (${_settings.MinorPurchaseLimit:F2}).";
            EmitSignal(SignalName.ParentalControlTriggered, "amount_limit_exceeded", playerId);
            return result;
        }
        
        // Check if parental approval is required
        if (_settings.RequireParentalApproval && usdAmount >= _settings.ParentalApprovalThreshold)
        {
            result.IsAllowed = false;
            result.ReasonCode = "REQUIRES_PARENTAL_APPROVAL";
            result.UserMessage = $"This purchase requires parental approval. A notification has been sent to the parent/guardian.";
            
            // In a real implementation, this would send a notification to the parent
            SendParentalApprovalRequest(playerId, usdAmount);
            
            return result;
        }
        
        result.IsAllowed = true;
        return result;
    }
    
    /// <summary>
    /// Check spending limits
    /// </summary>
    private PurchaseValidationResult CheckSpendingLimits(string playerId, float usdAmount)
    {
        var result = new PurchaseValidationResult { IsAllowed = true };
        var tracker = GetSpendingTracker(playerId);
        var now = DateTime.UtcNow;
        
        // Check daily limit
        if (_settings.DailySpendingLimitEnabled)
        {
            var dailySpent = tracker.GetSpendingInPeriod(now.Date, now.Date.AddDays(1));
            if (dailySpent + usdAmount > _settings.DailySpendingLimit)
            {
                result.IsAllowed = false;
                result.ReasonCode = "DAILY_LIMIT_EXCEEDED";
                result.UserMessage = $"This purchase would exceed your daily spending limit of ${_settings.DailySpendingLimit:F2}. " +
                                   $"You have spent ${dailySpent:F2} today.";
                EmitSignal(SignalName.SpendingLimitReached, playerId, SpendingPeriod.Daily.ToString(), _settings.DailySpendingLimit);
                return result;
            }
        }
        
        // Check weekly limit
        if (_settings.WeeklySpendingLimitEnabled)
        {
            var weekStart = now.Date.AddDays(-(int)now.DayOfWeek);
            var weeklySpent = tracker.GetSpendingInPeriod(weekStart, weekStart.AddDays(7));
            if (weeklySpent + usdAmount > _settings.WeeklySpendingLimit)
            {
                result.IsAllowed = false;
                result.ReasonCode = "WEEKLY_LIMIT_EXCEEDED";
                result.UserMessage = $"This purchase would exceed your weekly spending limit of ${_settings.WeeklySpendingLimit:F2}. " +
                                   $"You have spent ${weeklySpent:F2} this week.";
                EmitSignal(SignalName.SpendingLimitReached, playerId, SpendingPeriod.Weekly.ToString(), _settings.WeeklySpendingLimit);
                return result;
            }
        }
        
        // Check monthly limit
        if (_settings.MonthlySpendingLimitEnabled)
        {
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var monthlySpent = tracker.GetSpendingInPeriod(monthStart, monthStart.AddMonths(1));
            if (monthlySpent + usdAmount > _settings.MonthlySpendingLimit)
            {
                result.IsAllowed = false;
                result.ReasonCode = "MONTHLY_LIMIT_EXCEEDED";
                result.UserMessage = $"This purchase would exceed your monthly spending limit of ${_settings.MonthlySpendingLimit:F2}. " +
                                   $"You have spent ${monthlySpent:F2} this month.";
                EmitSignal(SignalName.SpendingLimitReached, playerId, SpendingPeriod.Monthly.ToString(), _settings.MonthlySpendingLimit);
                return result;
            }
        }
        
        return result;
    }
    
    /// <summary>
    /// Check if purchase requires additional confirmation
    /// </summary>
    private bool RequiresAdditionalConfirmation(string playerId, float usdAmount)
    {
        // Large purchases always require confirmation
        if (usdAmount >= _settings.LargePurchaseThreshold)
        {
            return true;
        }
        
        // Frequent purchases in short time require confirmation
        var tracker = GetSpendingTracker(playerId);
        var recentPurchases = tracker.GetRecentPurchaseCount(TimeSpan.FromMinutes(30));
        if (recentPurchases >= 3) // 3 purchases in 30 minutes
        {
            return true;
        }
        
        return false;
    }
    
    /// <summary>
    /// Create confirmation message for purchase
    /// </summary>
    private string CreateConfirmationMessage(string playerId, float usdAmount, string itemDescription)
    {
        var tracker = GetSpendingTracker(playerId);
        var todaySpent = tracker.GetSpendingInPeriod(DateTime.UtcNow.Date, DateTime.UtcNow.Date.AddDays(1));
        
        var message = $"Confirm purchase of {itemDescription} for ${usdAmount:F2}?\n\n";
        message += $"You have spent ${todaySpent:F2} today.\n";
        message += $"This purchase will bring your daily total to ${todaySpent + usdAmount:F2}.\n\n";
        message += "This purchase is final and cannot be refunded unless required by law.";
        
        return message;
    }
    
    /// <summary>
    /// Record a successful purchase
    /// </summary>
    public void RecordPurchase(string playerId, float usdAmount, string itemId, string description = "")
    {
        var tracker = GetSpendingTracker(playerId);
        tracker.RecordPurchase(usdAmount, itemId, description);
        SaveSpendingData();
        
        // Check if we should send spending summary
        CheckForSpendingSummary(playerId, tracker);
    }
    
    /// <summary>
    /// Check if we should send a spending summary to the player
    /// </summary>
    private void CheckForSpendingSummary(string playerId, SpendingTracker tracker)
    {
        var now = DateTime.UtcNow;
        
        // Send weekly spending summary on Sundays
        if (now.DayOfWeek == DayOfWeek.Sunday && tracker.LastSummaryDate.Date < now.Date)
        {
            SendSpendingSummary(playerId, tracker);
            tracker.LastSummaryDate = now;
            SaveSpendingData();
        }
    }
    
    /// <summary>
    /// Send spending summary to player
    /// </summary>
    private void SendSpendingSummary(string playerId, SpendingTracker tracker)
    {
        var now = DateTime.UtcNow;
        var weekStart = now.Date.AddDays(-(int)now.DayOfWeek);
        var weeklySpent = tracker.GetSpendingInPeriod(weekStart, weekStart.AddDays(7));
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var monthlySpent = tracker.GetSpendingInPeriod(monthStart, monthStart.AddMonths(1));
        
        var dialog = new AcceptDialog();
        dialog.Title = "Weekly Spending Summary";
        dialog.DialogText = $"Your spending summary:\n\n" +
                           $"This week: ${weeklySpent:F2}\n" +
                           $"This month: ${monthlySpent:F2}\n\n" +
                           $"Remember to spend responsibly and within your means.\n" +
                           $"You can adjust your spending limits in Settings.";
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
        
        GD.Print($"Sent spending summary to {playerId}: Week=${weeklySpent:F2}, Month=${monthlySpent:F2}");
    }
    
    /// <summary>
    /// Configure spending limits for a player
    /// </summary>
    public void ConfigureSpendingLimits(float? dailyLimit = null, float? weeklyLimit = null, float? monthlyLimit = null)
    {
        if (dailyLimit.HasValue)
        {
            _settings.DailySpendingLimit = dailyLimit.Value;
            _settings.DailySpendingLimitEnabled = dailyLimit.Value > 0;
        }
        
        if (weeklyLimit.HasValue)
        {
            _settings.WeeklySpendingLimit = weeklyLimit.Value;
            _settings.WeeklySpendingLimitEnabled = weeklyLimit.Value > 0;
        }
        
        if (monthlyLimit.HasValue)
        {
            _settings.MonthlySpendingLimit = monthlyLimit.Value;
            _settings.MonthlySpendingLimitEnabled = monthlyLimit.Value > 0;
        }
        
        SaveSafeguardSettings();
        GD.Print("Spending limits updated");
    }
    
    /// <summary>
    /// Configure parental controls
    /// </summary>
    public void ConfigureParentalControls(bool enabled, bool isMinorAccount = false, 
        float minorPurchaseLimit = 10.0f, bool requireApproval = true, float approvalThreshold = 25.0f)
    {
        _settings.ParentalControlsEnabled = enabled;
        _settings.IsMinorAccount = isMinorAccount;
        _settings.MinorPurchaseLimit = minorPurchaseLimit;
        _settings.RequireParentalApproval = requireApproval;
        _settings.ParentalApprovalThreshold = approvalThreshold;
        _settings.AllowPurchases = enabled; // Can be overridden separately
        
        SaveSafeguardSettings();
        GD.Print($"Parental controls configured: Enabled={enabled}, Minor={isMinorAccount}");
    }
    
    /// <summary>
    /// Get spending tracker for player
    /// </summary>
    private SpendingTracker GetSpendingTracker(string playerId)
    {
        if (!_playerSpending.ContainsKey(playerId))
        {
            _playerSpending[playerId] = new SpendingTracker { PlayerId = playerId };
        }
        
        return _playerSpending[playerId];
    }
    
    /// <summary>
    /// Get player's spending history
    /// </summary>
    public List<PurchaseRecord> GetSpendingHistory(string playerId, int daysPast = 30)
    {
        var tracker = GetSpendingTracker(playerId);
        var cutoffDate = DateTime.UtcNow.AddDays(-daysPast);
        
        return tracker.Purchases.FindAll(p => p.Timestamp >= cutoffDate);
    }
    
    /// <summary>
    /// Get spending analytics for player
    /// </summary>
    public SpendingAnalytics GetSpendingAnalytics(string playerId)
    {
        var tracker = GetSpendingTracker(playerId);
        var now = DateTime.UtcNow;
        
        return new SpendingAnalytics
        {
            PlayerId = playerId,
            TotalSpent = tracker.Purchases.Sum(p => p.UsdAmount),
            DailySpent = tracker.GetSpendingInPeriod(now.Date, now.Date.AddDays(1)),
            WeeklySpent = tracker.GetSpendingInPeriod(now.Date.AddDays(-(int)now.DayOfWeek), now.Date.AddDays(7 - (int)now.DayOfWeek)),
            MonthlySpent = tracker.GetSpendingInPeriod(new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, 1).AddMonths(1)),
            TotalPurchases = tracker.Purchases.Count,
            AveragePurchaseAmount = tracker.Purchases.Count > 0 ? tracker.Purchases.Average(p => p.UsdAmount) : 0,
            DailyLimitRemaining = _settings.DailySpendingLimitEnabled ? Math.Max(0, _settings.DailySpendingLimit - tracker.GetSpendingInPeriod(now.Date, now.Date.AddDays(1))) : float.MaxValue,
            WeeklyLimitRemaining = _settings.WeeklySpendingLimitEnabled ? Math.Max(0, _settings.WeeklySpendingLimit - tracker.GetSpendingInPeriod(now.Date.AddDays(-(int)now.DayOfWeek), now.Date.AddDays(7 - (int)now.DayOfWeek))) : float.MaxValue,
            MonthlyLimitRemaining = _settings.MonthlySpendingLimitEnabled ? Math.Max(0, _settings.MonthlySpendingLimit - tracker.GetSpendingInPeriod(new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, 1).AddMonths(1))) : float.MaxValue
        };
    }
    
    /// <summary>
    /// Send parental approval request (placeholder)
    /// </summary>
    private void SendParentalApprovalRequest(string playerId, float usdAmount)
    {
        // In a real implementation, this would:
        // 1. Send email/notification to registered parent/guardian
        // 2. Create a pending approval request
        // 3. Provide parent with secure link to approve/deny
        
        GD.Print($"Parental approval request sent for player {playerId}, amount ${usdAmount:F2}");
    }
    
    /// <summary>
    /// Save safeguard settings
    /// </summary>
    private void SaveSafeguardSettings()
    {
        try
        {
            using var file = FileAccess.Open(SAFEGUARDS_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(_settings, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save safeguard settings: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load safeguard settings
    /// </summary>
    private void LoadSafeguardSettings()
    {
        try
        {
            if (FileAccess.FileExists(SAFEGUARDS_FILE))
            {
                using var file = FileAccess.Open(SAFEGUARDS_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                _settings = JsonSerializer.Deserialize<SafeguardSettings>(jsonText) ?? new SafeguardSettings();
            }
            else
            {
                // Initialize with default settings
                _settings = new SafeguardSettings
                {
                    DailySpendingLimit = DEFAULT_DAILY_LIMIT_USD,
                    WeeklySpendingLimit = DEFAULT_WEEKLY_LIMIT_USD,
                    MonthlySpendingLimit = DEFAULT_MONTHLY_LIMIT_USD,
                    DailySpendingLimitEnabled = true,
                    WeeklySpendingLimitEnabled = true,
                    MonthlySpendingLimitEnabled = true
                };
                SaveSafeguardSettings();
            }
            
            GD.Print("Safeguard settings loaded");
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load safeguard settings: {e.Message}");
            _settings = new SafeguardSettings();
        }
    }
    
    /// <summary>
    /// Save spending data
    /// </summary>
    private void SaveSpendingData()
    {
        try
        {
            using var file = FileAccess.Open(SPENDING_DATA_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(_playerSpending, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save spending data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load spending data
    /// </summary>
    private void LoadSpendingData()
    {
        try
        {
            if (FileAccess.FileExists(SPENDING_DATA_FILE))
            {
                using var file = FileAccess.Open(SPENDING_DATA_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                _playerSpending = JsonSerializer.Deserialize<Dictionary<string, SpendingTracker>>(jsonText) ?? new();
                
                GD.Print($"Spending data loaded for {_playerSpending.Count} players");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load spending data: {e.Message}");
        }
    }
}

// Enums and data structures
public enum SpendingPeriod
{
    Daily,
    Weekly,
    Monthly
}

public class PurchaseValidationResult
{
    public bool IsAllowed { get; set; } = true;
    public bool RequiresConfirmation { get; set; } = false;
    public string ReasonCode { get; set; } = "";
    public string UserMessage { get; set; } = "";
    public string ConfirmationMessage { get; set; } = "";
}

public class SafeguardSettings
{
    public bool DailySpendingLimitEnabled { get; set; } = true;
    public float DailySpendingLimit { get; set; } = 20.0f;
    public bool WeeklySpendingLimitEnabled { get; set; } = true;
    public float WeeklySpendingLimit { get; set; } = 50.0f;
    public bool MonthlySpendingLimitEnabled { get; set; } = true;
    public float MonthlySpendingLimit { get; set; } = 100.0f;
    public bool ParentalControlsEnabled { get; set; } = false;
    public bool IsMinorAccount { get; set; } = false;
    public float MinorPurchaseLimit { get; set; } = 10.0f;
    public bool RequireParentalApproval { get; set; } = true;
    public float ParentalApprovalThreshold { get; set; } = 25.0f;
    public bool AllowPurchases { get; set; } = true;
    public float LargePurchaseThreshold { get; set; } = 50.0f;
}

public class SpendingTracker
{
    public string PlayerId { get; set; } = "";
    public List<PurchaseRecord> Purchases { get; set; } = new();
    public DateTime LastSummaryDate { get; set; } = DateTime.MinValue;
    
    public void RecordPurchase(float usdAmount, string itemId, string description = "")
    {
        Purchases.Add(new PurchaseRecord
        {
            UsdAmount = usdAmount,
            ItemId = itemId,
            Description = description,
            Timestamp = DateTime.UtcNow
        });
    }
    
    public float GetSpendingInPeriod(DateTime start, DateTime end)
    {
        return Purchases
            .Where(p => p.Timestamp >= start && p.Timestamp < end)
            .Sum(p => p.UsdAmount);
    }
    
    public int GetRecentPurchaseCount(TimeSpan timespan)
    {
        var cutoff = DateTime.UtcNow - timespan;
        return Purchases.Count(p => p.Timestamp >= cutoff);
    }
}

public class SpendingAnalytics
{
    public string PlayerId { get; set; } = "";
    public float TotalSpent { get; set; }
    public float DailySpent { get; set; }
    public float WeeklySpent { get; set; }
    public float MonthlySpent { get; set; }
    public int TotalPurchases { get; set; }
    public float AveragePurchaseAmount { get; set; }
    public float DailyLimitRemaining { get; set; }
    public float WeeklyLimitRemaining { get; set; }
    public float MonthlyLimitRemaining { get; set; }
}