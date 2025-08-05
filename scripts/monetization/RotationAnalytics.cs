using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;

/// <summary>
/// Analytics manager for weekly rotation system
/// Tracks usage patterns, conversion metrics, and player engagement
/// </summary>
public partial class RotationAnalytics : Node
{
    public static RotationAnalytics Instance { get; private set; }
    
    private Dictionary<string, PlayerAnalyticsData> _playerData = new();
    private const string ANALYTICS_FILE = "user://rotation_analytics.json";
    
    [Signal]
    public delegate void AnalyticsEventEventHandler();
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadAnalyticsData();
            
            // Connect to rotation manager events
            if (WeeklyRotationManager.Instance != null)
            {
                WeeklyRotationManager.Instance.RotationUpdated += OnRotationUpdated;
                WeeklyRotationManager.Instance.WeeklyReset += OnWeeklyReset;
            }
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Track when a player accesses their weekly fighter
    /// </summary>
    public void TrackWeeklyFighterAccess(string playerId, string characterId)
    {
        EnsurePlayerData(playerId);
        var playerData = _playerData[playerId];
        
        playerData.WeeklyAccessCount++;
        playerData.LastAccessTime = DateTime.UtcNow;
        
        var eventData = new Dictionary<string, object>
        {
            ["playerId"] = playerId,
            ["characterId"] = characterId,
            ["accessType"] = "weekly_rotation",
            ["timestamp"] = DateTime.UtcNow
        };
        
        EmitSignal(SignalName.AnalyticsEvent);
        SaveAnalyticsData();
    }
    
    /// <summary>
    /// Track conversion from rotation to purchase
    /// </summary>
    public void TrackRotationToPurchase(string playerId, string characterId)
    {
        EnsurePlayerData(playerId);
        var playerData = _playerData[playerId];
        
        playerData.ConversionEvents.Add(new ConversionEvent
        {
            CharacterId = characterId,
            ConversionType = "rotation_to_purchase",
            Timestamp = DateTime.UtcNow
        });
        
        var eventData = new Dictionary<string, object>
        {
            ["playerId"] = playerId,
            ["characterId"] = characterId,
            ["conversionType"] = "rotation_to_purchase",
            ["timestamp"] = DateTime.UtcNow
        };
        
        EmitSignal(SignalName.AnalyticsEvent);
        SaveAnalyticsData();
    }
    
    /// <summary>
    /// Track player engagement with rotation system
    /// </summary>
    public void TrackEngagement(string playerId, string engagementType, Dictionary<string, object> additionalData = null)
    {
        EnsurePlayerData(playerId);
        var playerData = _playerData[playerId];
        
        playerData.EngagementEvents.Add(new EngagementEvent
        {
            Type = engagementType,
            Timestamp = DateTime.UtcNow,
            Data = additionalData ?? new()
        });
        
        var eventData = new Dictionary<string, object>
        {
            ["playerId"] = playerId,
            ["engagementType"] = engagementType,
            ["timestamp"] = DateTime.UtcNow
        };
        
        if (additionalData != null)
        {
            foreach (var kvp in additionalData)
            {
                eventData[kvp.Key] = kvp.Value;
            }
        }
        
        EmitSignal(SignalName.AnalyticsEvent);
        SaveAnalyticsData();
    }
    
    /// <summary>
    /// Get aggregated analytics for all players
    /// </summary>
    public RotationAnalyticsSummary GetAnalyticsSummary()
    {
        var summary = new RotationAnalyticsSummary
        {
            TotalPlayers = _playerData.Count,
            GeneratedDate = DateTime.UtcNow
        };
        
        foreach (var playerData in _playerData.Values)
        {
            summary.TotalWeeklyAccesses += playerData.WeeklyAccessCount;
            summary.TotalConversions += playerData.ConversionEvents.Count;
            summary.TotalEngagements += playerData.EngagementEvents.Count;
            
            // Track archetype preferences
            foreach (var engagement in playerData.EngagementEvents)
            {
                if (engagement.Data.ContainsKey("archetype"))
                {
                    var archetype = engagement.Data["archetype"].ToString();
                    summary.ArchetypePopularity[archetype] = summary.ArchetypePopularity.GetValueOrDefault(archetype, 0) + 1;
                }
            }
        }
        
        // Calculate conversion rate
        if (summary.TotalWeeklyAccesses > 0)
        {
            summary.ConversionRate = (double)summary.TotalConversions / summary.TotalWeeklyAccesses;
        }
        
        return summary;
    }
    
    /// <summary>
    /// Get analytics for specific player
    /// </summary>
    public PlayerAnalyticsData GetPlayerAnalytics(string playerId)
    {
        return _playerData.GetValueOrDefault(playerId, new PlayerAnalyticsData { PlayerId = playerId });
    }
    
    private void EnsurePlayerData(string playerId)
    {
        if (!_playerData.ContainsKey(playerId))
        {
            _playerData[playerId] = new PlayerAnalyticsData
            {
                PlayerId = playerId,
                FirstSeen = DateTime.UtcNow
            };
        }
    }
    
    private void OnRotationUpdated()
    {
        TrackEngagement("system", "rotation_updated");
    }
    
    private void OnWeeklyReset()
    {
        TrackEngagement("system", "weekly_reset");
    }
    
    private void SaveAnalyticsData()
    {
        try
        {
            var data = new AnalyticsSaveData
            {
                PlayerData = _playerData,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(ANALYTICS_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save analytics data: {e.Message}");
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
                var data = JsonSerializer.Deserialize<AnalyticsSaveData>(jsonText);
                
                _playerData = data.PlayerData ?? new();
                GD.Print($"Loaded analytics data for {_playerData.Count} players");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load analytics data: {e.Message}");
        }
    }
}

// Analytics data structures
public class PlayerAnalyticsData
{
    public string PlayerId { get; set; } = "";
    public DateTime FirstSeen { get; set; }
    public DateTime LastAccessTime { get; set; }
    public int WeeklyAccessCount { get; set; }
    public List<ConversionEvent> ConversionEvents { get; set; } = new();
    public List<EngagementEvent> EngagementEvents { get; set; } = new();
}

public class ConversionEvent
{
    public string CharacterId { get; set; } = "";
    public string ConversionType { get; set; } = "";
    public DateTime Timestamp { get; set; }
}

public class EngagementEvent
{
    public string Type { get; set; } = "";
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object> Data { get; set; } = new();
}

public class AnalyticsSaveData
{
    public Dictionary<string, PlayerAnalyticsData> PlayerData { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class RotationAnalyticsSummary
{
    public int TotalPlayers { get; set; }
    public int TotalWeeklyAccesses { get; set; }
    public int TotalConversions { get; set; }
    public int TotalEngagements { get; set; }
    public double ConversionRate { get; set; }
    public Dictionary<string, int> ArchetypePopularity { get; set; } = new();
    public DateTime GeneratedDate { get; set; }
}