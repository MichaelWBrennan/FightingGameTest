using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Cross-Platform Player Reputation System
/// Maintains high match quality and reduces toxicity in a global crossplay ecosystem
/// Tracks behavior across rage quits, toxicity, and positive interactions
/// </summary>
public partial class PlayerReputationSystem : Node
{
    public static PlayerReputationSystem Instance { get; private set; }
    
    // Reputation tracking
    private Dictionary<string, PlayerReputation> _playerReputations = new();
    private Dictionary<string, List<ReputationEvent>> _recentEvents = new();
    private Dictionary<string, ReportCooldown> _reportCooldowns = new();
    
    // Configuration
    private const float BASE_REPUTATION = 500.0f;
    private const float MAX_REPUTATION = 1000.0f;
    private const float MIN_REPUTATION = 0.0f;
    private const int PRESTIGE_THRESHOLD = 800;
    private const int LOW_REP_THRESHOLD = 200;
    private const int EVENTS_HISTORY_SIZE = 100;
    private const int REPORT_COOLDOWN_HOURS = 24;
    private const int MAX_REPORTS_PER_DAY = 5;
    
    // Reputation modifiers
    private readonly Dictionary<ReputationEventType, float> _eventModifiers = new()
    {
        [ReputationEventType.RageQuit] = -50.0f,
        [ReputationEventType.Toxicity] = -30.0f,
        [ReputationEventType.Cheating] = -100.0f,
        [ReputationEventType.AFK] = -15.0f,
        [ReputationEventType.PositiveInteraction] = 10.0f,
        [ReputationEventType.GoodSportsmanship] = 20.0f,
        [ReputationEventType.MatchCompleted] = 2.0f,
        [ReputationEventType.TimeoutViolation] = -25.0f,
        [ReputationEventType.CommunityContribution] = 30.0f
    };
    
    [Signal]
    public delegate void ReputationChangedEventHandler(string playerId, float newReputation, ReputationTier tier);
    
    [Signal]
    public delegate void PlayerReportedEventHandler(string reportedPlayerId, string reporterPlayerId, string reason);
    
    [Signal]
    public delegate void ModerationActionEventHandler(string playerId, ModerationType action, int duration);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadReputationData();
            StartMaintenanceTimer();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("PlayerReputationSystem initialized");
    }
    
    public string GetOrCreatePlayerId(string platformId, Platform platform)
    {
        // Create a cross-platform unified player ID
        return $"{platform}_{platformId}";
    }
    
    public PlayerReputation GetPlayerReputation(string playerId)
    {
        if (!_playerReputations.ContainsKey(playerId))
        {
            _playerReputations[playerId] = new PlayerReputation(playerId);
        }
        
        return _playerReputations[playerId];
    }
    
    public void RecordReputationEvent(string playerId, ReputationEventType eventType, string context = "", string reporterPlayerId = "")
    {
        var reputation = GetPlayerReputation(playerId);
        var events = GetOrCreateEventHistory(playerId);
        
        // Validate report if it's a negative event from another player
        if (!string.IsNullOrEmpty(reporterPlayerId) && IsNegativeEvent(eventType))
        {
            if (!ValidateReport(reporterPlayerId, playerId))
            {
                GD.Print($"Report rejected: validation failed for {reporterPlayerId} reporting {playerId}");
                return;
            }
        }
        
        // Create reputation event
        var reputationEvent = new ReputationEvent
        {
            EventType = eventType,
            Timestamp = DateTime.UtcNow,
            Context = context,
            ReporterPlayerId = reporterPlayerId,
            Value = _eventModifiers.GetValueOrDefault(eventType, 0)
        };
        
        // Apply temporal decay to the event value
        float decayedValue = ApplyTemporalDecay(reputationEvent.Value);
        
        // Record the event
        events.Add(reputationEvent);
        if (events.Count > EVENTS_HISTORY_SIZE)
        {
            events.RemoveAt(0);
        }
        
        // Update reputation score
        float oldReputation = reputation.CurrentScore;
        reputation.CurrentScore = Mathf.Clamp(reputation.CurrentScore + decayedValue, MIN_REPUTATION, MAX_REPUTATION);
        
        // Update reputation tier
        var oldTier = reputation.Tier;
        reputation.Tier = CalculateReputationTier(reputation.CurrentScore);
        
        // Update statistics
        UpdateReputationStats(reputation, eventType);
        
        // Check for tier changes
        if (oldTier != reputation.Tier)
        {
            HandleTierChange(playerId, reputation, oldTier);
        }
        
        // Emit signal for reputation change
        if (Math.Abs(reputation.CurrentScore - oldReputation) > 0.1f)
        {
            EmitSignal(SignalName.ReputationChanged, playerId, reputation.CurrentScore, (int)reputation.Tier);
        }
        
        // Handle automated moderation
        CheckAutomatedModeration(playerId, reputation, eventType);
        
        // Save updated data
        SaveReputationData();
        
        GD.Print($"Reputation event recorded for {playerId}: {eventType} ({decayedValue:+0.0;-0.0;+0.0}) -> {reputation.CurrentScore:F1}");
    }
    
    private bool ValidateReport(string reporterPlayerId, string reportedPlayerId)
    {
        // Prevent self-reporting
        if (reporterPlayerId == reportedPlayerId)
            return false;
        
        // Check report cooldown
        if (_reportCooldowns.ContainsKey(reporterPlayerId))
        {
            var cooldown = _reportCooldowns[reporterPlayerId];
            if (cooldown.LastReportTime.AddHours(REPORT_COOLDOWN_HOURS) > DateTime.UtcNow)
            {
                return false;
            }
            
            if (cooldown.ReportsToday >= MAX_REPORTS_PER_DAY &&
                cooldown.LastReportTime.Date == DateTime.UtcNow.Date)
            {
                return false;
            }
        }
        else
        {
            _reportCooldowns[reporterPlayerId] = new ReportCooldown();
        }
        
        // Check reporter's own reputation (low rep players have limited reporting power)
        var reporterRep = GetPlayerReputation(reporterPlayerId);
        if (reporterRep.CurrentScore < LOW_REP_THRESHOLD)
        {
            return false;
        }
        
        // Update cooldown
        var reportCooldown = _reportCooldowns[reporterPlayerId];
        if (reportCooldown.LastReportTime.Date != DateTime.UtcNow.Date)
        {
            reportCooldown.ReportsToday = 0;
        }
        
        reportCooldown.LastReportTime = DateTime.UtcNow;
        reportCooldown.ReportsToday++;
        
        return true;
    }
    
    private bool IsNegativeEvent(ReputationEventType eventType)
    {
        return _eventModifiers.GetValueOrDefault(eventType, 0) < 0;
    }
    
    private float ApplyTemporalDecay(float value)
    {
        // Reduce impact of very old events by applying a small random decay
        // This prevents reputation from being permanently damaged by isolated incidents
        float decayFactor = 1.0f - (GD.Randf() * 0.1f); // 0-10% reduction
        return value * decayFactor;
    }
    
    private ReputationTier CalculateReputationTier(float score)
    {
        if (score >= PRESTIGE_THRESHOLD) return ReputationTier.Prestigious;
        if (score >= 600) return ReputationTier.Good;
        if (score >= 400) return ReputationTier.Average;
        if (score >= LOW_REP_THRESHOLD) return ReputationTier.Poor;
        return ReputationTier.Toxic;
    }
    
    private void UpdateReputationStats(PlayerReputation reputation, ReputationEventType eventType)
    {
        switch (eventType)
        {
            case ReputationEventType.RageQuit:
                reputation.RageQuitCount++;
                break;
            case ReputationEventType.MatchCompleted:
                reputation.MatchesCompleted++;
                break;
            case ReputationEventType.PositiveInteraction:
            case ReputationEventType.GoodSportsmanship:
                reputation.PositiveInteractions++;
                break;
            case ReputationEventType.Toxicity:
                reputation.ToxicityReports++;
                break;
        }
        
        reputation.LastActivity = DateTime.UtcNow;
    }
    
    private void HandleTierChange(string playerId, PlayerReputation reputation, ReputationTier oldTier)
    {
        GD.Print($"Player {playerId} reputation tier changed: {oldTier} -> {reputation.Tier}");
        
        // Award or remove privileges based on tier change
        switch (reputation.Tier)
        {
            case ReputationTier.Prestigious:
                if (oldTier < ReputationTier.Prestigious)
                {
                    GrantPrestigeRewards(playerId);
                }
                break;
                
            case ReputationTier.Toxic:
                if (oldTier > ReputationTier.Toxic)
                {
                    ApplyLowReputationRestrictions(playerId);
                }
                break;
        }
    }
    
    private void CheckAutomatedModeration(string playerId, PlayerReputation reputation, ReputationEventType eventType)
    {
        // Apply automated moderation for severe behavior
        if (eventType == ReputationEventType.Cheating)
        {
            ApplyModeration(playerId, ModerationType.Suspension, 7 * 24); // 7 days
        }
        else if (reputation.Tier == ReputationTier.Toxic && reputation.RageQuitCount > 10)
        {
            ApplyModeration(playerId, ModerationType.MatchmakingRestriction, 24); // 24 hours
        }
        else if (reputation.ToxicityReports > 5)
        {
            ApplyModeration(playerId, ModerationType.ChatRestriction, 48); // 48 hours
        }
    }
    
    private void ApplyModeration(string playerId, ModerationType moderationType, int durationHours)
    {
        var reputation = GetPlayerReputation(playerId);
        
        var moderation = new ModerationAction
        {
            Type = moderationType,
            StartTime = DateTime.UtcNow,
            EndTime = DateTime.UtcNow.AddHours(durationHours),
            Reason = "Automated moderation based on reputation system"
        };
        
        reputation.ActiveModerations.Add(moderation);
        EmitSignal(SignalName.ModerationAction, playerId, (int)moderationType, durationHours);
        
        GD.Print($"Applied moderation to {playerId}: {moderationType} for {durationHours} hours");
    }
    
    private void GrantPrestigeRewards(string playerId)
    {
        GD.Print($"Granted prestige rewards to {playerId}");
        // In a full implementation: unlock exclusive cosmetics, priority matchmaking, etc.
    }
    
    private void ApplyLowReputationRestrictions(string playerId)
    {
        GD.Print($"Applied low reputation restrictions to {playerId}");
        // In a full implementation: limited matchmaking pool, chat restrictions, etc.
    }
    
    public bool CanPlayerJoinMatch(string playerId, MatchmakingTier matchTier)
    {
        var reputation = GetPlayerReputation(playerId);
        
        // Check for active suspensions
        if (HasActiveSuspension(playerId))
            return false;
        
        // Low reputation players are restricted to low-tier matches
        if (reputation.Tier == ReputationTier.Toxic && matchTier != MatchmakingTier.LowReputation)
            return false;
        
        // High reputation players get priority access
        if (reputation.Tier == ReputationTier.Prestigious && matchTier == MatchmakingTier.Premium)
            return true;
        
        return true;
    }
    
    public bool HasActiveSuspension(string playerId)
    {
        var reputation = GetPlayerReputation(playerId);
        var now = DateTime.UtcNow;
        
        return reputation.ActiveModerations.Any(m => 
            m.Type == ModerationType.Suspension && 
            m.EndTime > now);
    }
    
    public List<string> GetMatchmakingPool(MatchmakingTier tier, List<string> allPlayers)
    {
        var filteredPlayers = new List<string>();
        
        foreach (var playerId in allPlayers)
        {
            if (CanPlayerJoinMatch(playerId, tier))
            {
                var reputation = GetPlayerReputation(playerId);
                
                // Sort players into appropriate tiers
                switch (tier)
                {
                    case MatchmakingTier.Premium:
                        if (reputation.Tier >= ReputationTier.Good)
                            filteredPlayers.Add(playerId);
                        break;
                        
                    case MatchmakingTier.Standard:
                        if (reputation.Tier >= ReputationTier.Poor)
                            filteredPlayers.Add(playerId);
                        break;
                        
                    case MatchmakingTier.LowReputation:
                        if (reputation.Tier == ReputationTier.Toxic)
                            filteredPlayers.Add(playerId);
                        break;
                }
            }
        }
        
        return filteredPlayers;
    }
    
    private List<ReputationEvent> GetOrCreateEventHistory(string playerId)
    {
        if (!_recentEvents.ContainsKey(playerId))
        {
            _recentEvents[playerId] = new List<ReputationEvent>();
        }
        
        return _recentEvents[playerId];
    }
    
    private void StartMaintenanceTimer()
    {
        // Run maintenance every hour
        var timer = new Timer();
        timer.WaitTime = 3600.0; // 1 hour
        timer.Timeout += PerformMaintenance;
        timer.Autostart = true;
        AddChild(timer);
    }
    
    private void PerformMaintenance()
    {
        var now = DateTime.UtcNow;
        
        // Clean up expired moderations
        foreach (var reputation in _playerReputations.Values)
        {
            reputation.ActiveModerations.RemoveAll(m => m.EndTime < now);
        }
        
        // Apply slow reputation recovery for inactive players
        foreach (var kvp in _playerReputations)
        {
            var reputation = kvp.Value;
            var daysSinceActivity = (now - reputation.LastActivity).TotalDays;
            
            if (daysSinceActivity > 30 && reputation.CurrentScore < BASE_REPUTATION)
            {
                // Slowly heal reputation for reformed players
                float recovery = Math.Min(5.0f, BASE_REPUTATION - reputation.CurrentScore);
                reputation.CurrentScore += recovery;
                
                GD.Print($"Applied reputation recovery to {kvp.Key}: +{recovery:F1}");
            }
        }
        
        SaveReputationData();
        GD.Print("Reputation system maintenance completed");
    }
    
    private void SaveReputationData()
    {
        var configFile = new ConfigFile();
        
        foreach (var kvp in _playerReputations)
        {
            var playerId = kvp.Key;
            var reputation = kvp.Value;
            var section = $"reputation_{playerId}";
            
            configFile.SetValue(section, "current_score", reputation.CurrentScore);
            configFile.SetValue(section, "tier", (int)reputation.Tier);
            configFile.SetValue(section, "matches_completed", reputation.MatchesCompleted);
            configFile.SetValue(section, "rage_quit_count", reputation.RageQuitCount);
            configFile.SetValue(section, "positive_interactions", reputation.PositiveInteractions);
            configFile.SetValue(section, "toxicity_reports", reputation.ToxicityReports);
            configFile.SetValue(section, "last_activity", reputation.LastActivity.ToString("yyyy-MM-dd HH:mm:ss"));
        }
        
        configFile.Save("user://player_reputations.cfg");
    }
    
    private void LoadReputationData()
    {
        var configFile = new ConfigFile();
        var err = configFile.Load("user://player_reputations.cfg");
        
        if (err != Error.Ok)
            return;
        
        var sections = configFile.GetSections();
        
        foreach (string section in sections)
        {
            if (section.StartsWith("reputation_"))
            {
                var playerId = section.Substring(11); // Remove "reputation_" prefix
                var reputation = new PlayerReputation(playerId);
                
                reputation.CurrentScore = configFile.GetValue(section, "current_score", BASE_REPUTATION).AsSingle();
                reputation.Tier = (ReputationTier)configFile.GetValue(section, "tier", 2).AsInt32();
                reputation.MatchesCompleted = configFile.GetValue(section, "matches_completed", 0).AsInt32();
                reputation.RageQuitCount = configFile.GetValue(section, "rage_quit_count", 0).AsInt32();
                reputation.PositiveInteractions = configFile.GetValue(section, "positive_interactions", 0).AsInt32();
                reputation.ToxicityReports = configFile.GetValue(section, "toxicity_reports", 0).AsInt32();
                
                var lastActivityStr = configFile.GetValue(section, "last_activity", "").AsString();
                if (DateTime.TryParse(lastActivityStr, out DateTime lastActivity))
                    reputation.LastActivity = lastActivity;
                
                _playerReputations[playerId] = reputation;
            }
        }
        
        GD.Print($"Loaded reputation data for {_playerReputations.Count} players");
    }
}

// Data structures for the reputation system
public class PlayerReputation
{
    public string PlayerId { get; private set; }
    public float CurrentScore { get; set; } = 500.0f;
    public ReputationTier Tier { get; set; } = ReputationTier.Average;
    public int MatchesCompleted { get; set; }
    public int RageQuitCount { get; set; }
    public int PositiveInteractions { get; set; }
    public int ToxicityReports { get; set; }
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;
    public List<ModerationAction> ActiveModerations { get; set; } = new();
    
    public PlayerReputation(string playerId)
    {
        PlayerId = playerId;
    }
}

public struct ReputationEvent
{
    public ReputationEventType EventType;
    public DateTime Timestamp;
    public string Context;
    public string ReporterPlayerId;
    public float Value;
}

public struct ModerationAction
{
    public ModerationType Type;
    public DateTime StartTime;
    public DateTime EndTime;
    public string Reason;
}

public struct ReportCooldown
{
    public DateTime LastReportTime;
    public int ReportsToday;
}

public enum ReputationEventType
{
    RageQuit,
    Toxicity,
    Cheating,
    AFK,
    PositiveInteraction,
    GoodSportsmanship,
    MatchCompleted,
    TimeoutViolation,
    CommunityContribution
}

public enum ReputationTier
{
    Toxic = 0,
    Poor = 1,
    Average = 2,
    Good = 3,
    Prestigious = 4
}

public enum ModerationType
{
    Warning,
    ChatRestriction,
    MatchmakingRestriction,
    Suspension,
    Ban
}

public enum MatchmakingTier
{
    LowReputation,
    Standard,
    Premium
}

public enum Platform
{
    Steam,
    PlayStation,
    Xbox,
    Nintendo,
    Epic,
    Mobile
}