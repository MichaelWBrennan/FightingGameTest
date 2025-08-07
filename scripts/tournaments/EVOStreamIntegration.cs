using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// EVO Stream Integration System - Provides broadcast-ready overlays and spectator tools
/// Essential for EVO production value and tournament streaming
/// </summary>
public partial class EVOStreamIntegration : Node
{
    public static EVOStreamIntegration Instance { get; private set; }

    [Signal]
    public delegate void StreamOverlayUpdatedEventHandler(Variant overlayData);
    
    [Signal]
    public delegate void HighlightMomentEventHandler(Variant momentData);

    public enum OverlayType
    {
        PlayerNameplates,
        MatchStatistics,
        TournamentBracket,
        FrameData,
        ComboCounter,
        MeterDisplay,
        HealthBars,
        RoundTimer,
        SponsorsLogos,
        CommentaryBox
    }

    public class StreamOverlay
    {
        public OverlayType Type { get; set; }
        public Vector2 Position { get; set; }
        public Vector2 Size { get; set; }
        public bool IsVisible { get; set; } = true;
        public float Opacity { get; set; } = 1.0f;
        public Dictionary<string, object> Data { get; set; } = new Dictionary<string, object>();
    }

    public class PlayerStats
    {
        public string PlayerId { get; set; }
        public string PlayerName { get; set; }
        public string TeamName { get; set; }
        public string SponsorLogo { get; set; }
        public string CharacterName { get; set; }
        public string CountryFlag { get; set; }
        public int Ranking { get; set; }
        public int Health { get; set; }
        public int MaxHealth { get; set; }
        public float Meter { get; set; }
        public int Wins { get; set; }
        public int Losses { get; set; }
    }

    public class MatchStatistics
    {
        public int TotalDamage { get; set; }
        public int ComboCount { get; set; }
        public int MaxCombo { get; set; }
        public int ParryCount { get; set; }
        public int ClashWins { get; set; }
        public int RomanCancels { get; set; }
        public float AverageCombo { get; set; }
        public float DamagePerSecond { get; set; }
        public Dictionary<string, int> MoveUsage { get; set; } = new Dictionary<string, int>();
    }

    // Stream data
    private Dictionary<OverlayType, StreamOverlay> _overlays = new Dictionary<OverlayType, StreamOverlay>();
    private Dictionary<string, PlayerStats> _playerStats = new Dictionary<string, PlayerStats>();
    private Dictionary<string, MatchStatistics> _matchStats = new Dictionary<string, MatchStatistics>();
    
    // Tournament integration
    private string _currentTournamentName = "EVO 2024";
    private string _currentRound = "Winners Finals";
    private Dictionary<string, object> _sponsorLogos = new Dictionary<string, object>();
    
    // Real-time statistics
    private DateTime _matchStartTime;
    private bool _isMatchActive = false;
    private Timer _updateTimer;

    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            InitializeStreamOverlays();
            SetupUpdateTimer();
            GD.Print("EVO Stream Integration System initialized");
        }
        else
        {
            QueueFree();
        }
    }

    /// <summary>
    /// Initialize default stream overlays for EVO broadcast
    /// </summary>
    private void InitializeStreamOverlays()
    {
        // Player 1 nameplate (bottom left)
        _overlays[OverlayType.PlayerNameplates] = new StreamOverlay
        {
            Type = OverlayType.PlayerNameplates,
            Position = new Vector2(50, 900),
            Size = new Vector2(400, 120),
            Data = new Dictionary<string, object>
            {
                ["ShowSponsor"] = true,
                ["ShowCountry"] = true,
                ["ShowRanking"] = true
            }
        };

        // Match statistics (top center)
        _overlays[OverlayType.MatchStatistics] = new StreamOverlay
        {
            Type = OverlayType.MatchStatistics,
            Position = new Vector2(760, 20),
            Size = new Vector2(400, 100),
            Data = new Dictionary<string, object>
            {
                ["ShowComboCount"] = true,
                ["ShowDamage"] = true,
                ["ShowParries"] = true
            }
        };

        // Tournament bracket info (top left)
        _overlays[OverlayType.TournamentBracket] = new StreamOverlay
        {
            Type = OverlayType.TournamentBracket,
            Position = new Vector2(20, 20),
            Size = new Vector2(300, 80),
            Data = new Dictionary<string, object>
            {
                ["TournamentName"] = _currentTournamentName,
                ["Round"] = _currentRound
            }
        };

        // Frame data display (toggleable)
        _overlays[OverlayType.FrameData] = new StreamOverlay
        {
            Type = OverlayType.FrameData,
            Position = new Vector2(1400, 300),
            Size = new Vector2(300, 400),
            IsVisible = false // Hidden by default
        };

        // Sponsor logos (bottom right)
        _overlays[OverlayType.SponsorsLogos] = new StreamOverlay
        {
            Type = OverlayType.SponsorsLogos,
            Position = new Vector2(1470, 900),
            Size = new Vector2(400, 120)
        };
    }

    /// <summary>
    /// Setup real-time update timer for statistics
    /// </summary>
    private void SetupUpdateTimer()
    {
        _updateTimer = new Timer();
        _updateTimer.WaitTime = 0.1f; // 10 FPS updates for smooth overlays
        _updateTimer.Timeout += OnUpdateOverlays;
        AddChild(_updateTimer);
        _updateTimer.Start();
    }

    /// <summary>
    /// Start match tracking for stream statistics
    /// </summary>
    public void StartMatchTracking(string player1Id, string player2Id, string tournament = null, string round = null)
    {
        _isMatchActive = true;
        _matchStartTime = DateTime.Now;
        
        if (!string.IsNullOrEmpty(tournament))
            _currentTournamentName = tournament;
        if (!string.IsNullOrEmpty(round))
            _currentRound = round;

        // Initialize player stats
        _playerStats[player1Id] = new PlayerStats { PlayerId = player1Id };
        _playerStats[player2Id] = new PlayerStats { PlayerId = player2Id };
        
        // Initialize match statistics
        _matchStats[player1Id] = new MatchStatistics();
        _matchStats[player2Id] = new MatchStatistics();

        // Update tournament overlay
        _overlays[OverlayType.TournamentBracket].Data["TournamentName"] = _currentTournamentName;
        _overlays[OverlayType.TournamentBracket].Data["Round"] = _currentRound;

        GD.Print($"Stream tracking started: {tournament} - {round}");
    }

    /// <summary>
    /// Update player information for nameplates
    /// </summary>
    public void UpdatePlayerInfo(string playerId, string playerName, string characterName, 
                               string teamName = null, string sponsorLogo = null, string countryFlag = null, int ranking = 0)
    {
        if (!_playerStats.ContainsKey(playerId))
            _playerStats[playerId] = new PlayerStats { PlayerId = playerId };

        var player = _playerStats[playerId];
        player.PlayerName = playerName;
        player.CharacterName = characterName;
        player.TeamName = teamName;
        player.SponsorLogo = sponsorLogo;
        player.CountryFlag = countryFlag;
        player.Ranking = ranking;

        GD.Print($"Updated stream info for {playerName} ({characterName})");
    }

    /// <summary>
    /// Update real-time match statistics
    /// </summary>
    public void UpdateMatchStats(string playerId, string statType, object value)
    {
        if (!_matchStats.ContainsKey(playerId))
            return;

        var stats = _matchStats[playerId];
        
        switch (statType.ToLower())
        {
            case "damage":
                stats.TotalDamage += (int)value;
                break;
            case "combo":
                stats.ComboCount++;
                var combo = (int)value;
                if (combo > stats.MaxCombo)
                    stats.MaxCombo = combo;
                stats.AverageCombo = (stats.AverageCombo * (stats.ComboCount - 1) + combo) / stats.ComboCount;
                break;
            case "parry":
                stats.ParryCount++;
                break;
            case "clash":
                stats.ClashWins++;
                break;
            case "romancanel":
                stats.RomanCancels++;
                break;
            case "move":
                var moveName = value.ToString();
                if (!stats.MoveUsage.ContainsKey(moveName))
                    stats.MoveUsage[moveName] = 0;
                stats.MoveUsage[moveName]++;
                break;
        }

        // Calculate DPS
        var matchDuration = (DateTime.Now - _matchStartTime).TotalSeconds;
        if (matchDuration > 0)
            stats.DamagePerSecond = (float)(stats.TotalDamage / matchDuration);
    }

    /// <summary>
    /// Update health and meter for HUD
    /// </summary>
    public void UpdatePlayerVitals(string playerId, int health, int maxHealth, float meter)
    {
        if (!_playerStats.ContainsKey(playerId))
            return;

        var player = _playerStats[playerId];
        player.Health = health;
        player.MaxHealth = maxHealth;
        player.Meter = meter;
    }

    /// <summary>
    /// Handle EVO Moment for stream highlights
    /// </summary>
    public void RegisterStreamMoment(string playerId, string momentType, Dictionary<string, object> momentData)
    {
        var highlightData = new Dictionary<string, object>
        {
            ["player"] = _playerStats.ContainsKey(playerId) ? _playerStats[playerId].PlayerName : playerId,
            ["character"] = _playerStats.ContainsKey(playerId) ? _playerStats[playerId].CharacterName : "Unknown",
            ["moment_type"] = momentType,
            ["timestamp"] = DateTime.Now,
            ["tournament"] = _currentTournamentName,
            ["round"] = _currentRound,
            ["moment_data"] = momentData
        };

        EmitSignal(SignalName.HighlightMoment, Variant.From(highlightData));
        
        // Flash overlay for dramatic effect
        FlashOverlay(OverlayType.MatchStatistics, 0.5f);
        
        GD.Print($"🎬 Stream highlight registered: {momentType} by {highlightData["player"]}");
    }

    /// <summary>
    /// Flash overlay for dramatic moments
    /// </summary>
    private void FlashOverlay(OverlayType overlayType, float duration)
    {
        if (!_overlays.ContainsKey(overlayType))
            return;

        // Create flash animation manually since we can't use Tween on custom classes
        // In a real implementation, this would be handled by the UI system
        if (!_overlays.ContainsKey(overlayType))
            return;

        var overlay = _overlays[overlayType];
        var originalOpacity = overlay.Opacity;
        
        // Simple flash effect
        overlay.Opacity = 0.3f;
        
        // Use a timer to restore opacity
        var timer = new Timer();
        timer.WaitTime = duration;
        timer.OneShot = true;
        timer.Timeout += () => {
            overlay.Opacity = originalOpacity;
            timer.QueueFree();
        };
        AddChild(timer);
        timer.Start();
    }

    /// <summary>
    /// Toggle overlay visibility for production control
    /// </summary>
    public void ToggleOverlay(OverlayType overlayType, bool visible = true)
    {
        if (_overlays.ContainsKey(overlayType))
        {
            _overlays[overlayType].IsVisible = visible;
            GD.Print($"Overlay {overlayType} visibility: {visible}");
        }
    }

    /// <summary>
    /// Set sponsor information for tournament
    /// </summary>
    public void SetSponsorInfo(Dictionary<string, object> sponsors)
    {
        _sponsorLogos = sponsors;
        _overlays[OverlayType.SponsorsLogos].Data["Sponsors"] = sponsors;
    }

    /// <summary>
    /// Get current stream overlay data for rendering
    /// </summary>
    public Dictionary<string, object> GetStreamOverlayData()
    {
        var overlayData = new Dictionary<string, object>
        {
            ["overlays"] = _overlays.ToDictionary(
                kvp => kvp.Key.ToString(),
                kvp => new Dictionary<string, object>
                {
                    ["position"] = kvp.Value.Position,
                    ["size"] = kvp.Value.Size,
                    ["visible"] = kvp.Value.IsVisible,
                    ["opacity"] = kvp.Value.Opacity,
                    ["data"] = kvp.Value.Data
                }
            ),
            ["players"] = _playerStats,
            ["match_stats"] = _matchStats,
            ["tournament_info"] = new Dictionary<string, object>
            {
                ["name"] = _currentTournamentName,
                ["round"] = _currentRound,
                ["match_active"] = _isMatchActive
            }
        };

        return overlayData;
    }

    /// <summary>
    /// Export match data for post-match analysis
    /// </summary>
    public Dictionary<string, object> ExportMatchData()
    {
        var matchDuration = (DateTime.Now - _matchStartTime).TotalSeconds;
        
        return new Dictionary<string, object>
        {
            ["tournament"] = _currentTournamentName,
            ["round"] = _currentRound,
            ["duration"] = matchDuration,
            ["players"] = _playerStats,
            ["statistics"] = _matchStats,
            ["timestamp"] = _matchStartTime,
            ["sponsors"] = _sponsorLogos
        };
    }

    /// <summary>
    /// Generate instant replay data for broadcast
    /// </summary>
    public Dictionary<string, object> GenerateInstantReplay(float startTime, float endTime, string description)
    {
        return new Dictionary<string, object>
        {
            ["start_time"] = startTime,
            ["end_time"] = endTime,
            ["duration"] = endTime - startTime,
            ["description"] = description,
            ["tournament"] = _currentTournamentName,
            ["round"] = _currentRound,
            ["players"] = _playerStats.Values.Select(p => new { p.PlayerName, p.CharacterName }).ToList(),
            ["timestamp"] = DateTime.Now
        };
    }

    /// <summary>
    /// Update overlays in real-time
    /// </summary>
    private void OnUpdateOverlays()
    {
        if (!_isMatchActive) return;

        var overlayData = GetStreamOverlayData();
        EmitSignal(SignalName.StreamOverlayUpdated, Variant.From(overlayData));
    }

    /// <summary>
    /// Configure overlay for different tournament formats
    /// </summary>
    public void SetTournamentFormat(string format)
    {
        switch (format.ToLower())
        {
            case "evo_mainstage":
                // Full production overlays
                _overlays[OverlayType.PlayerNameplates].IsVisible = true;
                _overlays[OverlayType.MatchStatistics].IsVisible = true;
                _overlays[OverlayType.TournamentBracket].IsVisible = true;
                _overlays[OverlayType.SponsorsLogos].IsVisible = true;
                break;
                
            case "local_tournament":
                // Minimal overlays
                _overlays[OverlayType.PlayerNameplates].IsVisible = true;
                _overlays[OverlayType.MatchStatistics].IsVisible = false;
                _overlays[OverlayType.SponsorsLogos].IsVisible = false;
                break;
                
            case "practice":
                // Training mode overlays
                _overlays[OverlayType.FrameData].IsVisible = true;
                _overlays[OverlayType.PlayerNameplates].IsVisible = false;
                break;
        }
        
        GD.Print($"Stream format configured for: {format}");
    }

    /// <summary>
    /// End match tracking and generate summary
    /// </summary>
    public Dictionary<string, object> EndMatchTracking(string winnerId)
    {
        _isMatchActive = false;
        
        var matchSummary = new Dictionary<string, object>
        {
            ["winner"] = winnerId,
            ["winner_name"] = _playerStats.ContainsKey(winnerId) ? _playerStats[winnerId].PlayerName : winnerId,
            ["match_data"] = ExportMatchData(),
            ["highlights"] = GetMatchHighlights()
        };

        GD.Print($"Match tracking ended. Winner: {matchSummary["winner_name"]}");
        return matchSummary;
    }

    /// <summary>
    /// Get match highlights for content creation
    /// </summary>
    private List<Dictionary<string, object>> GetMatchHighlights()
    {
        var highlights = new List<Dictionary<string, object>>();
        
        // Add statistical highlights
        foreach (var player in _playerStats)
        {
            var stats = _matchStats[player.Key];
            
            if (stats.MaxCombo >= 10)
            {
                highlights.Add(new Dictionary<string, object>
                {
                    ["type"] = "big_combo",
                    ["player"] = player.Value.PlayerName,
                    ["value"] = stats.MaxCombo
                });
            }
            
            if (stats.ParryCount >= 3)
            {
                highlights.Add(new Dictionary<string, object>
                {
                    ["type"] = "parry_sequence", 
                    ["player"] = player.Value.PlayerName,
                    ["value"] = stats.ParryCount
                });
            }
        }

        return highlights;
    }
}