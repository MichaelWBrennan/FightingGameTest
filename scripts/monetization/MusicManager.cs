using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;

/// <summary>
/// Manages music monetization, licensed content, and dynamic audio systems
/// </summary>
public partial class MusicManager : Node
{
    public static MusicManager Instance { get; private set; }
    
    private Dictionary<string, MusicTrack> _availableTracks = new();
    private Dictionary<string, bool> _ownedTracks = new();
    private Dictionary<string, MusicArtist> _featuredArtists = new();
    private MusicTrack _currentTrack;
    private AudioStreamPlayer _musicPlayer;
    private const string MUSIC_OWNERSHIP_FILE = "user://music_ownership.json";
    
    [Signal]
    public delegate void TrackPurchasedEventHandler(string trackId);
    
    [Signal]
    public delegate void TrackUnlockedEventHandler(string trackId);
    
    [Signal]
    public delegate void PlaylistUpdatedEventHandler();
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            SetupAudioPlayer();
            LoadMusicOwnership();
            InitializeMusicCatalog();
        }
        else
        {
            QueueFree();
        }
    }
    
    private void SetupAudioPlayer()
    {
        _musicPlayer = new AudioStreamPlayer();
        AddChild(_musicPlayer);
        _musicPlayer.Bus = "Music";
    }
    
    /// <summary>
    /// Initialize the music catalog with licensed and original content
    /// </summary>
    private void InitializeMusicCatalog()
    {
        // Original game soundtrack (always owned)
        _availableTracks["ost_main_theme"] = new MusicTrack
        {
            Id = "ost_main_theme",
            Title = "Fighter's Spirit",
            Artist = "Game Audio Team",
            Album = "Fighting Game OST",
            Duration = 180,
            Price = 0.0f, // Free with game
            Type = MusicType.GameOST,
            Genre = "Orchestral",
            IsOwned = true,
            AudioPath = "res://assets/audio/music/main_theme.ogg",
            PreviewPath = "res://assets/audio/music/previews/main_theme_preview.ogg",
            CoverArtPath = "res://assets/audio/covers/main_theme.png"
        };
        
        _ownedTracks["ost_main_theme"] = true;
        
        // Licensed artist content
        _availableTracks["licensed_battle_anthem"] = new MusicTrack
        {
            Id = "licensed_battle_anthem",
            Title = "Digital Warrior",
            Artist = "SynthFighters",
            Album = "Arcade Legends",
            Duration = 195,
            Price = 1.99f,
            Type = MusicType.LicensedContent,
            Genre = "Electronic",
            IsOwned = false,
            AudioPath = "res://assets/audio/music/licensed/digital_warrior.ogg",
            PreviewPath = "res://assets/audio/music/previews/digital_warrior_preview.ogg",
            CoverArtPath = "res://assets/audio/covers/digital_warrior.png",
            LicenseInfo = "Licensed from SynthFighters Records"
        };
        
        // Rhythm-reactive cosmetic track
        _availableTracks["reactive_neon_beats"] = new MusicTrack
        {
            Id = "reactive_neon_beats",
            Title = "Neon Beats",
            Artist = "CyberSound Collective",
            Album = "Digital Arena",
            Duration = 210,
            Price = 2.99f,
            Type = MusicType.RhythmReactive,
            Genre = "Synthwave",
            IsOwned = false,
            AudioPath = "res://assets/audio/music/reactive/neon_beats.ogg",
            PreviewPath = "res://assets/audio/music/previews/neon_beats_preview.ogg",
            CoverArtPath = "res://assets/audio/covers/neon_beats.png",
            HasVisualEffects = true,
            EffectIntensity = 0.8f
        };
        
        // Artist partnership content
        InitializeFeaturedArtists();
    }
    
    private void InitializeFeaturedArtists()
    {
        _featuredArtists["synthfighters"] = new MusicArtist
        {
            Id = "synthfighters",
            Name = "SynthFighters",
            Genre = "Electronic/Synthwave",
            Bio = "Electronic music duo specializing in fighting game soundtracks",
            Website = "https://synthfighters.music",
            TrackIds = new[] { "licensed_battle_anthem" },
            RevenueShare = 0.60f, // 60% to artist, 40% to platform
            IsVerified = true
        };
        
        _featuredArtists["cybersound"] = new MusicArtist
        {
            Id = "cybersound",
            Name = "CyberSound Collective",
            Genre = "Synthwave/Ambient",
            Bio = "Collective of artists creating immersive electronic soundscapes",
            Website = "https://cybersound.net",
            TrackIds = new[] { "reactive_neon_beats" },
            RevenueShare = 0.65f,
            IsVerified = true
        };
    }
    
    /// <summary>
    /// Purchase a music track
    /// </summary>
    public bool PurchaseTrack(string trackId, float paidAmount)
    {
        if (!_availableTracks.ContainsKey(trackId))
            return false;
            
        var track = _availableTracks[trackId];
        
        if (track.IsOwned || _ownedTracks.GetValueOrDefault(trackId, false))
            return false; // Already owned
            
        // Verify payment amount
        if (Math.Abs(paidAmount - track.Price) > 0.01f)
            return false;
            
        // Grant ownership
        _ownedTracks[trackId] = true;
        track.IsOwned = true;
        
        SaveMusicOwnership();
        EmitSignal(SignalName.TrackPurchased, trackId);
        
        // Handle artist revenue sharing
        DistributeArtistRevenue(track, paidAmount);
        
        // Analytics
        TelemetryManager.Instance?.RecordMusicPurchase(track);
        
        return true;
    }
    
    /// <summary>
    /// Unlock track through Battle Pass or other means
    /// </summary>
    public void UnlockTrack(string trackId)
    {
        if (_availableTracks.ContainsKey(trackId))
        {
            _ownedTracks[trackId] = true;
            _availableTracks[trackId].IsOwned = true;
            SaveMusicOwnership();
            EmitSignal(SignalName.TrackUnlocked, trackId);
        }
    }
    
    /// <summary>
    /// Play a music track
    /// </summary>
    public void PlayTrack(string trackId, bool loop = true)
    {
        if (!_availableTracks.ContainsKey(trackId))
            return;
            
        var track = _availableTracks[trackId];
        
        // Check ownership (except for previews)
        if (!track.IsOwned && !_ownedTracks.GetValueOrDefault(trackId, false))
        {
            // Play preview instead
            PlayPreview(trackId);
            return;
        }
        
        var audioStream = GD.Load<AudioStream>(track.AudioPath);
        if (audioStream != null)
        {
            _musicPlayer.Stream = audioStream;
            _musicPlayer.Play();
            _currentTrack = track;
            
            // Enable rhythm-reactive effects if available
            if (track.HasVisualEffects)
            {
                EnableRhythmEffects(track);
            }
        }
    }
    
    /// <summary>
    /// Play a 30-second preview of a track
    /// </summary>
    public void PlayPreview(string trackId)
    {
        if (!_availableTracks.ContainsKey(trackId))
            return;
            
        var track = _availableTracks[trackId];
        var previewStream = GD.Load<AudioStream>(track.PreviewPath);
        
        if (previewStream != null)
        {
            _musicPlayer.Stream = previewStream;
            _musicPlayer.Play();
            
            // Stop preview after 30 seconds
            GetTree().CreateTimer(30.0).Timeout += StopPreview;
        }
    }
    
    private void StopPreview()
    {
        if (_musicPlayer.Playing && _currentTrack == null)
        {
            _musicPlayer.Stop();
        }
    }
    
    /// <summary>
    /// Get owned music tracks
    /// </summary>
    public List<MusicTrack> GetOwnedTracks(MusicType? type = null)
    {
        var ownedTracks = new List<MusicTrack>();
        
        foreach (var track in _availableTracks.Values)
        {
            if ((track.IsOwned || _ownedTracks.GetValueOrDefault(track.Id, false)) &&
                (!type.HasValue || track.Type == type.Value))
            {
                ownedTracks.Add(track);
            }
        }
        
        return ownedTracks;
    }
    
    /// <summary>
    /// Get available tracks for purchase
    /// </summary>
    public List<MusicTrack> GetAvailableTracks(MusicType? type = null)
    {
        var available = new List<MusicTrack>();
        
        foreach (var track in _availableTracks.Values)
        {
            if (!track.IsOwned && !_ownedTracks.GetValueOrDefault(track.Id, false) &&
                (!type.HasValue || track.Type == type.Value))
            {
                available.Add(track);
            }
        }
        
        return available;
    }
    
    /// <summary>
    /// Enable rhythm-reactive visual effects for a track
    /// </summary>
    private void EnableRhythmEffects(MusicTrack track)
    {
        // This would integrate with the visual effects system
        // to sync lighting, particle effects, etc. with the music beat
        
        if (track.HasVisualEffects)
        {
            // Signal to effects system
            var effectsManager = GetNode<Node>("/root/EffectsManager");
            effectsManager?.Call("enable_rhythm_effects", track.EffectIntensity);
        }
    }
    
    /// <summary>
    /// Distribute revenue to artists based on their contracts
    /// </summary>
    private void DistributeArtistRevenue(MusicTrack track, float totalRevenue)
    {
        if (track.Type == MusicType.LicensedContent || track.Type == MusicType.RhythmReactive)
        {
            // Find the artist
            MusicArtist artist = null;
            foreach (var a in _featuredArtists.Values)
            {
                if (Array.Exists(a.TrackIds, id => id == track.Id))
                {
                    artist = a;
                    break;
                }
            }
            
            if (artist != null)
            {
                float artistShare = totalRevenue * artist.RevenueShare;
                float platformShare = totalRevenue - artistShare;
                
                // Track earnings for artist payouts
                TrackArtistEarnings(artist.Id, artistShare);
                
                GD.Print($"Revenue distributed - Artist: ${artistShare:F2}, Platform: ${platformShare:F2}");
            }
        }
    }
    
    private void TrackArtistEarnings(string artistId, float earnings)
    {
        // In production, this would integrate with payment systems
        // for monthly artist payouts
        var earningsFile = $"user://artist_earnings_{artistId}.json";
        
        try
        {
            float currentEarnings = 0.0f;
            if (FileAccess.FileExists(earningsFile))
            {
                using var file = FileAccess.Open(earningsFile, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                currentEarnings = JsonSerializer.Deserialize<float>(json);
            }
            
            currentEarnings += earnings;
            
            using var writeFile = FileAccess.Open(earningsFile, FileAccess.ModeFlags.Write);
            var newJson = JsonSerializer.Serialize(currentEarnings);
            writeFile.StoreString(newJson);
            
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to track artist earnings: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Create dynamic playlist based on current game state
    /// </summary>
    public void CreateDynamicPlaylist(MusicGameState gameState, string characterId = null)
    {
        var playlist = new List<MusicTrack>();
        
        // Add owned tracks based on context
        var ownedTracks = GetOwnedTracks();
        
        foreach (var track in ownedTracks)
        {
            bool shouldInclude = gameState switch
            {
                MusicGameState.MainMenu => track.Type == MusicType.GameOST,
                MusicGameState.CharacterSelect => track.Genre.Contains("Electronic") || track.Type == MusicType.GameOST,
                MusicGameState.Battle => track.Type != MusicType.Ambient,
                MusicGameState.Victory => track.HasVisualEffects || track.Type == MusicType.RhythmReactive,
                _ => true
            };
            
            if (shouldInclude)
                playlist.Add(track);
        }
        
        // Shuffle and play first track
        if (playlist.Count > 0)
        {
            var random = new Random();
            var shuffledPlaylist = playlist.OrderBy(x => random.Next()).ToList();
            PlayTrack(shuffledPlaylist[0].Id);
        }
        
        EmitSignal(SignalName.PlaylistUpdated);
    }
    
    private void LoadMusicOwnership()
    {
        try
        {
            if (FileAccess.FileExists(MUSIC_OWNERSHIP_FILE))
            {
                using var file = FileAccess.Open(MUSIC_OWNERSHIP_FILE, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                _ownedTracks = JsonSerializer.Deserialize<Dictionary<string, bool>>(json) ?? new();
            }
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to load music ownership: {ex.Message}");
        }
    }
    
    private void SaveMusicOwnership()
    {
        try
        {
            using var file = FileAccess.Open(MUSIC_OWNERSHIP_FILE, FileAccess.ModeFlags.Write);
            var json = JsonSerializer.Serialize(_ownedTracks, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(json);
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to save music ownership: {ex.Message}");
        }
    }
}

/// <summary>
/// Music track definition
/// </summary>
public class MusicTrack
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Artist { get; set; } = "";
    public string Album { get; set; } = "";
    public int Duration { get; set; } // in seconds
    public float Price { get; set; }
    public MusicType Type { get; set; }
    public string Genre { get; set; } = "";
    public bool IsOwned { get; set; }
    public string AudioPath { get; set; } = "";
    public string PreviewPath { get; set; } = "";
    public string CoverArtPath { get; set; } = "";
    public string LicenseInfo { get; set; } = "";
    public bool HasVisualEffects { get; set; }
    public float EffectIntensity { get; set; } = 1.0f;
}

/// <summary>
/// Featured music artist information
/// </summary>
public class MusicArtist
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Genre { get; set; } = "";
    public string Bio { get; set; } = "";
    public string Website { get; set; } = "";
    public string[] TrackIds { get; set; } = Array.Empty<string>();
    public float RevenueShare { get; set; } = 0.50f;
    public bool IsVerified { get; set; }
}

public enum MusicType
{
    GameOST,
    LicensedContent,
    RhythmReactive,
    Ambient,
    UGC
}

public enum MusicGameState
{
    MainMenu,
    CharacterSelect,
    Battle,
    Victory,
    Training
}