using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;

/// <summary>
/// Manages esports integration, tournament monetization, and viewer engagement
/// </summary>
public partial class EsportsManager : Node
{
    public static EsportsManager Instance { get; private set; }
    
    private Dictionary<string, TournamentEvent> _activeTournaments = new();
    private Dictionary<string, ViewerReward> _viewerDrops = new();
    private Dictionary<string, float> _ticketedVODPrices = new();
    private const string ESPORTS_DATA_FILE = "user://esports_data.json";
    
    [Signal]
    public delegate void TournamentStartedEventHandler(string tournamentId);
    
    [Signal]
    public delegate void ViewerDropEarnedEventHandler(string rewardId);
    
    [Signal]
    public delegate void VODPurchasedEventHandler(string vodId, float price);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadEsportsData();
            InitializeEsportsContent();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize esports content and tournaments
    /// </summary>
    private void InitializeEsportsContent()
    {
        // Example tournament event
        _activeTournaments["world_championship_2024"] = new TournamentEvent
        {
            Id = "world_championship_2024",
            Name = "Fighting Game World Championship 2024",
            Description = "The ultimate test of fighting game skill",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(9),
            PrizePool = 100000.0f,
            MaxParticipants = 256,
            RegistrationFee = 25.0f,
            IsOfficial = true,
            HasViewerDrops = true,
            HasSeasonalCosmetics = true,
            StreamUrl = "https://twitch.tv/fightinggame_official",
            BracketUrl = "https://challonge.com/fgwc2024"
        };
        
        // Viewer drop rewards for tournament
        InitializeViewerDrops("world_championship_2024");
        
        // Tournament-exclusive cosmetics
        InitializeTournamentCosmetics("world_championship_2024");
        
        // Premium VOD content
        _ticketedVODPrices["wc2024_finals"] = 4.99f;
        _ticketedVODPrices["wc2024_semifinals"] = 2.99f;
        _ticketedVODPrices["wc2024_highlights"] = 1.99f;
    }
    
    /// <summary>
    /// Initialize viewer drop rewards for tournament viewing
    /// </summary>
    private void InitializeViewerDrops(string tournamentId)
    {
        var dropRewards = new[]
        {
            new ViewerReward
            {
                Id = $"{tournamentId}_drop_1",
                Name = "Championship Nameplate",
                Description = "Exclusive nameplate for tournament viewers",
                Type = ViewerRewardType.Cosmetic,
                CosmeticId = "championship_nameplate_2024",
                DropChance = 0.15f, // 15% chance per hour of viewing
                RequiredViewingMinutes = 60,
                TournamentId = tournamentId
            },
            new ViewerReward
            {
                Id = $"{tournamentId}_drop_2", 
                Name = "Esports Victory Theme",
                Description = "Epic victory music theme from the tournament",
                Type = ViewerRewardType.Music,
                CosmeticId = "esports_victory_theme",
                DropChance = 0.10f,
                RequiredViewingMinutes = 120,
                TournamentId = tournamentId
            },
            new ViewerReward
            {
                Id = $"{tournamentId}_drop_3",
                Name = "Tournament Badge",
                Description = "Special badge showing you watched the championship",
                Type = ViewerRewardType.Cosmetic,
                CosmeticId = "wc2024_viewer_badge",
                DropChance = 0.25f,
                RequiredViewingMinutes = 30,
                TournamentId = tournamentId
            }
        };
        
        foreach (var reward in dropRewards)
        {
            _viewerDrops[reward.Id] = reward;
        }
    }
    
    /// <summary>
    /// Initialize tournament-exclusive cosmetics
    /// </summary>
    private void InitializeTournamentCosmetics(string tournamentId)
    {
        // These would be added to CosmeticManager with special tournament tags
        var tournamentCosmetics = new[]
        {
            new CosmeticItem
            {
                Id = "championship_ryu_skin",
                Name = "Championship Ryu",
                Description = "Golden ceremonial gi worn by champions",
                Type = CosmeticType.FighterSkin,
                CharacterId = "ryu",
                Price = 8.99f,
                Rarity = CosmeticRarity.Legendary,
                Tags = new[] { "tournament", "championship", "exclusive", "2024" }
            },
            new CosmeticItem
            {
                Id = "victory_crown_effect",
                Name = "Victory Crown",
                Description = "Majestic crown effect for tournament victories",
                Type = CosmeticType.KOEffect,
                CharacterId = "any",
                Price = 5.99f,
                Rarity = CosmeticRarity.Epic,
                Tags = new[] { "tournament", "victory", "crown", "2024" }
            }
        };
        
        // Add these to the cosmetic manager
        foreach (var cosmetic in tournamentCosmetics)
        {
            CosmeticManager.Instance?._availableCosmetics?.Add(cosmetic.Id, cosmetic);
        }
    }
    
    /// <summary>
    /// Register for tournament participation
    /// </summary>
    public bool RegisterForTournament(string tournamentId, string playerId, float registrationFee)
    {
        if (!_activeTournaments.ContainsKey(tournamentId))
            return false;
            
        var tournament = _activeTournaments[tournamentId];
        
        // Verify registration fee
        if (Math.Abs(registrationFee - tournament.RegistrationFee) > 0.01f)
            return false;
            
        // Check if registration is still open
        if (DateTime.UtcNow > tournament.StartDate.AddDays(-1))
            return false;
            
        // Check capacity
        if (tournament.RegisteredPlayers.Count >= tournament.MaxParticipants)
            return false;
            
        // Register player
        tournament.RegisteredPlayers.Add(playerId);
        tournament.TotalRegistrationFees += registrationFee;
        
        SaveEsportsData();
        
        // Analytics
        TelemetryManager.Instance?.LogMonetizationEvent(new
        {
            Type = "tournament_registration",
            TournamentId = tournamentId,
            PlayerId = playerId,
            RegistrationFee = registrationFee,
            Timestamp = DateTime.UtcNow
        });
        
        return true;
    }
    
    /// <summary>
    /// Purchase premium tournament VOD access
    /// </summary>
    public bool PurchaseVOD(string vodId, float paidAmount, string userId)
    {
        if (!_ticketedVODPrices.ContainsKey(vodId))
            return false;
            
        float vodPrice = _ticketedVODPrices[vodId];
        
        if (Math.Abs(paidAmount - vodPrice) > 0.01f)
            return false;
            
        // Grant VOD access (would integrate with streaming platform)
        GrantVODAccess(userId, vodId);
        
        EmitSignal(SignalName.VODPurchased, vodId, vodPrice);
        
        // Analytics
        TelemetryManager.Instance?.LogMonetizationEvent(new
        {
            Type = "vod_purchase",
            VODId = vodId,
            Price = vodPrice,
            UserId = userId,
            Timestamp = DateTime.UtcNow
        });
        
        return true;
    }
    
    /// <summary>
    /// Check for viewer drop rewards based on viewing time
    /// </summary>
    public List<ViewerReward> CheckViewerDrops(string tournamentId, int viewingMinutes)
    {
        var earnedRewards = new List<ViewerReward>();
        
        foreach (var drop in _viewerDrops.Values)
        {
            if (drop.TournamentId != tournamentId)
                continue;
                
            if (viewingMinutes < drop.RequiredViewingMinutes)
                continue;
                
            // Roll for drop chance
            var random = new Random();
            if (random.NextDouble() < drop.DropChance)
            {
                earnedRewards.Add(drop);
                EmitSignal(SignalName.ViewerDropEarned, drop.Id);
                
                // Grant the reward
                GrantViewerReward(drop);
            }
        }
        
        return earnedRewards;
    }
    
    /// <summary>
    /// Start a tournament event
    /// </summary>
    public void StartTournament(string tournamentId)
    {
        if (!_activeTournaments.ContainsKey(tournamentId))
            return;
            
        var tournament = _activeTournaments[tournamentId];
        tournament.Status = TournamentStatus.InProgress;
        tournament.ActualStartDate = DateTime.UtcNow;
        
        SaveEsportsData();
        EmitSignal(SignalName.TournamentStarted, tournamentId);
        
        // Enable viewer drops for live viewers
        EnableViewerDrops(tournamentId);
    }
    
    /// <summary>
    /// Get active tournaments available for registration/viewing
    /// </summary>
    public List<TournamentEvent> GetActiveTournaments()
    {
        var activeTournaments = new List<TournamentEvent>();
        
        foreach (var tournament in _activeTournaments.Values)
        {
            if (tournament.Status == TournamentStatus.Upcoming || 
                tournament.Status == TournamentStatus.InProgress)
            {
                activeTournaments.Add(tournament);
            }
        }
        
        return activeTournaments.OrderBy(t => t.StartDate).ToList();
    }
    
    /// <summary>
    /// Get tournament-specific cosmetics
    /// </summary>
    public List<CosmeticItem> GetTournamentCosmetics(string tournamentId)
    {
        var tournamentCosmetics = new List<CosmeticItem>();
        
        if (CosmeticManager.Instance?._availableCosmetics != null)
        {
            foreach (var cosmetic in CosmeticManager.Instance._availableCosmetics.Values)
            {
                if (cosmetic.Tags.Contains("tournament") && cosmetic.Tags.Contains(tournamentId.Split('_').Last()))
                {
                    tournamentCosmetics.Add(cosmetic);
                }
            }
        }
        
        return tournamentCosmetics;
    }
    
    private void GrantVODAccess(string userId, string vodId)
    {
        // In production, this would integrate with streaming platform APIs
        // to grant access to premium content
        var vodAccessFile = $"user://vod_access_{userId}.json";
        
        try
        {
            var accessList = new List<string>();
            if (FileAccess.FileExists(vodAccessFile))
            {
                using var file = FileAccess.Open(vodAccessFile, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                accessList = JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
            }
            
            if (!accessList.Contains(vodId))
            {
                accessList.Add(vodId);
                
                using var writeFile = FileAccess.Open(vodAccessFile, FileAccess.ModeFlags.Write);
                var newJson = JsonSerializer.Serialize(accessList);
                writeFile.StoreString(newJson);
            }
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to grant VOD access: {ex.Message}");
        }
    }
    
    private void GrantViewerReward(ViewerReward reward)
    {
        switch (reward.Type)
        {
            case ViewerRewardType.Cosmetic:
                CosmeticManager.Instance?._ownedCosmetics?.Add(reward.CosmeticId, true);
                break;
                
            case ViewerRewardType.Music:
                MusicManager.Instance?.UnlockTrack(reward.CosmeticId);
                break;
                
            case ViewerRewardType.Currency:
                // Future implementation for tournament tokens/currency
                break;
        }
        
        GD.Print($"Granted viewer reward: {reward.Name}");
    }
    
    private void EnableViewerDrops(string tournamentId)
    {
        // In production, this would integrate with streaming platforms
        // to track viewer engagement and award drops
        GD.Print($"Viewer drops enabled for tournament: {tournamentId}");
    }
    
    private void LoadEsportsData()
    {
        try
        {
            if (FileAccess.FileExists(ESPORTS_DATA_FILE))
            {
                using var file = FileAccess.Open(ESPORTS_DATA_FILE, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                var data = JsonSerializer.Deserialize<EsportsData>(json);
                
                if (data != null)
                {
                    _activeTournaments = data.ActiveTournaments ?? new();
                    _viewerDrops = data.ViewerDrops ?? new();
                    _ticketedVODPrices = data.TicketedVODPrices ?? new();
                }
            }
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to load esports data: {ex.Message}");
        }
    }
    
    private void SaveEsportsData()
    {
        try
        {
            var data = new EsportsData
            {
                ActiveTournaments = _activeTournaments,
                ViewerDrops = _viewerDrops,
                TicketedVODPrices = _ticketedVODPrices
            };
            
            using var file = FileAccess.Open(ESPORTS_DATA_FILE, FileAccess.ModeFlags.Write);
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(json);
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to save esports data: {ex.Message}");
        }
    }
}

/// <summary>
/// Tournament event data
/// </summary>
public class TournamentEvent
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public float PrizePool { get; set; }
    public int MaxParticipants { get; set; }
    public float RegistrationFee { get; set; }
    public List<string> RegisteredPlayers { get; set; } = new();
    public float TotalRegistrationFees { get; set; }
    public bool IsOfficial { get; set; }
    public bool HasViewerDrops { get; set; }
    public bool HasSeasonalCosmetics { get; set; }
    public TournamentStatus Status { get; set; } = TournamentStatus.Upcoming;
    public string StreamUrl { get; set; } = "";
    public string BracketUrl { get; set; } = "";
}

/// <summary>
/// Viewer reward for tournament engagement
/// </summary>
public class ViewerReward
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public ViewerRewardType Type { get; set; }
    public string CosmeticId { get; set; } = "";
    public float DropChance { get; set; }
    public int RequiredViewingMinutes { get; set; }
    public string TournamentId { get; set; } = "";
}

/// <summary>
/// Esports data container for serialization
/// </summary>
public class EsportsData
{
    public Dictionary<string, TournamentEvent> ActiveTournaments { get; set; } = new();
    public Dictionary<string, ViewerReward> ViewerDrops { get; set; } = new();
    public Dictionary<string, float> TicketedVODPrices { get; set; } = new();
}

public enum TournamentStatus
{
    Upcoming,
    InProgress,
    Completed,
    Cancelled
}

public enum ViewerRewardType
{
    Cosmetic,
    Music,
    Currency,
    Title
}