using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;

/// <summary>
/// Manages ethical cosmetic-only monetization system
/// </summary>
public partial class CosmeticManager : Node
{
    public static CosmeticManager Instance { get; private set; }
    
    private Dictionary<string, CosmeticItem> _availableCosmetics = new();
    private Dictionary<string, bool> _ownedCosmetics = new();
    private Dictionary<string, CosmeticBundle> _availableBundles = new();
    private const string COSMETIC_OWNERSHIP_FILE = "user://cosmetic_ownership.json";
    
    [Signal]
    public delegate void CosmeticPurchasedEventHandler(string cosmeticId);
    
    [Signal]
    public delegate void CosmeticEquippedEventHandler(string characterId, string cosmeticType, string cosmeticId);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadCosmeticOwnership();
            InitializeCosmeticCatalog();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize the cosmetic catalog with available content
    /// </summary>
    private void InitializeCosmeticCatalog()
    {
        // Fighter skins
        _availableCosmetics["ryu_classic"] = new CosmeticItem
        {
            Id = "ryu_classic",
            Name = "Classic Ryu Gi",
            Description = "Traditional white karate gi with red headband",
            Type = CosmeticType.FighterSkin,
            CharacterId = "ryu",
            Price = 5.99f,
            Rarity = CosmeticRarity.Epic,
            Tags = new[] { "classic", "traditional", "karate" }
        };
        
        _availableCosmetics["ryu_shadow"] = new CosmeticItem
        {
            Id = "ryu_shadow",
            Name = "Shadow Warrior",
            Description = "Dark ninja-inspired outfit with glowing effects",
            Type = CosmeticType.FighterSkin,
            CharacterId = "ryu",
            Price = 7.99f,
            Rarity = CosmeticRarity.Legendary,
            Tags = new[] { "ninja", "dark", "effects" }
        };
        
        // KO Effects
        _availableCosmetics["fire_explosion"] = new CosmeticItem
        {
            Id = "fire_explosion",
            Name = "Blazing Victory",
            Description = "Explosive fire effects on knockout",
            Type = CosmeticType.KOEffect,
            CharacterId = "any",
            Price = 2.99f,
            Rarity = CosmeticRarity.Rare,
            Tags = new[] { "fire", "explosion", "dramatic" }
        };
        
        // Intro animations
        _availableCosmetics["meditation_intro"] = new CosmeticItem
        {
            Id = "meditation_intro",
            Name = "Zen Master Entry",
            Description = "Peaceful meditation pose before battle",
            Type = CosmeticType.IntroAnimation,
            CharacterId = "ryu",
            Price = 3.99f,
            Rarity = CosmeticRarity.Rare,
            Tags = new[] { "peaceful", "meditation", "spiritual" }
        };
        
        // Accessibility cosmetics (always free)
        _availableCosmetics["colorblind_friendly_ui"] = new CosmeticItem
        {
            Id = "colorblind_friendly_ui",
            Name = "Colorblind Accessibility UI",
            Description = "High contrast UI theme for colorblind players",
            Type = CosmeticType.UITheme,
            CharacterId = "any",
            Price = 0.0f,
            Rarity = CosmeticRarity.Common,
            Tags = new[] { "accessibility", "colorblind", "ui" },
            IsAccessibility = true
        };
        
        // Mark accessibility items as owned by default
        if (_availableCosmetics["colorblind_friendly_ui"].IsAccessibility)
        {
            _ownedCosmetics["colorblind_friendly_ui"] = true;
        }
    }
    
    /// <summary>
    /// Purchase a cosmetic item with real money
    /// </summary>
    public bool PurchaseCosmetic(string cosmeticId, float paidAmount)
    {
        if (!_availableCosmetics.ContainsKey(cosmeticId))
            return false;
            
        var cosmetic = _availableCosmetics[cosmeticId];
        
        // Verify payment amount matches price
        if (Math.Abs(paidAmount - cosmetic.Price) > 0.01f)
            return false;
            
        // Grant ownership
        _ownedCosmetics[cosmeticId] = true;
        SaveCosmeticOwnership();
        
        EmitSignal(SignalName.CosmeticPurchased, cosmeticId);
        
        // Analytics for ethical monetization tracking
        TelemetryManager.Instance?.RecordCosmeticPurchase(cosmetic);
        
        return true;
    }
    
    /// <summary>
    /// Check if player owns a specific cosmetic
    /// </summary>
    public bool OwnsCosmetic(string cosmeticId)
    {
        return _ownedCosmetics.GetValueOrDefault(cosmeticId, false);
    }
    
    /// <summary>
    /// Get all owned cosmetics for a character
    /// </summary>
    public List<CosmeticItem> GetOwnedCosmetics(string characterId = "any")
    {
        var ownedCosmetics = new List<CosmeticItem>();
        
        foreach (var kvp in _availableCosmetics)
        {
            if (OwnsCosmetic(kvp.Key) && 
                (kvp.Value.CharacterId == characterId || kvp.Value.CharacterId == "any"))
            {
                ownedCosmetics.Add(kvp.Value);
            }
        }
        
        return ownedCosmetics;
    }
    
    /// <summary>
    /// Get available cosmetics for purchase
    /// </summary>
    public List<CosmeticItem> GetAvailableCosmetics(CosmeticType? type = null, string characterId = null)
    {
        var available = new List<CosmeticItem>();
        
        foreach (var cosmetic in _availableCosmetics.Values)
        {
            if (OwnsCosmetic(cosmetic.Id))
                continue;
                
            if (type.HasValue && cosmetic.Type != type.Value)
                continue;
                
            if (!string.IsNullOrEmpty(characterId) && 
                cosmetic.CharacterId != characterId && 
                cosmetic.CharacterId != "any")
                continue;
                
            available.Add(cosmetic);
        }
        
        return available;
    }
    
    private void LoadCosmeticOwnership()
    {
        try
        {
            if (FileAccess.FileExists(COSMETIC_OWNERSHIP_FILE))
            {
                using var file = FileAccess.Open(COSMETIC_OWNERSHIP_FILE, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                _ownedCosmetics = JsonSerializer.Deserialize<Dictionary<string, bool>>(json) ?? new();
            }
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to load cosmetic ownership: {ex.Message}");
        }
    }
    
    private void SaveCosmeticOwnership()
    {
        try
        {
            using var file = FileAccess.Open(COSMETIC_OWNERSHIP_FILE, FileAccess.ModeFlags.Write);
            var json = JsonSerializer.Serialize(_ownedCosmetics, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(json);
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to save cosmetic ownership: {ex.Message}");
        }
    }
}

/// <summary>
/// Represents a cosmetic item in the store
/// </summary>
public class CosmeticItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public CosmeticType Type { get; set; }
    public string CharacterId { get; set; } = "any";
    public float Price { get; set; }
    public CosmeticRarity Rarity { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public bool IsAccessibility { get; set; } = false;
    public bool IsUGC { get; set; } = false;
    public string CreatorId { get; set; } = "";
}

/// <summary>
/// Bundle of cosmetics at discounted price
/// </summary>
public class CosmeticBundle
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string[] CosmeticIds { get; set; } = Array.Empty<string>();
    public float OriginalPrice { get; set; }
    public float BundlePrice { get; set; }
    public float DiscountPercentage => (OriginalPrice - BundlePrice) / OriginalPrice * 100f;
}

public enum CosmeticType
{
    FighterSkin,
    IntroAnimation,
    OutroAnimation,
    KOEffect,
    Emote,
    UITheme,
    MusicTrack,
    VoicePack
}

public enum CosmeticRarity
{
    Common,
    Rare,
    Epic,
    Legendary,
    UGC
}