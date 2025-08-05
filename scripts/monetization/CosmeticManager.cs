using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Manages all cosmetic content: Fighter skins, animation packs, UI themes, and cosmetic sets
/// All cosmetics are direct purchase, fully previewable, and non-gameplay affecting
/// </summary>
public partial class CosmeticManager : Node
{
    public static CosmeticManager Instance { get; private set; }
    
    private Dictionary<string, CosmeticItem> _allCosmetics = new();
    private HashSet<string> _ownedCosmetics = new();
    private Dictionary<string, CosmeticSet> _cosmeticSets = new();
    private Dictionary<string, string> _equippedCosmetics = new(); // characterId -> cosmeticId
    private const string COSMETIC_OWNERSHIP_FILE = "user://cosmetic_ownership.json";
    private const string COSMETIC_LOADOUT_FILE = "user://cosmetic_loadouts.json";
    
    [Signal]
    public delegate void CosmeticPurchasedEventHandler(string cosmeticId);
    
    [Signal]
    public delegate void CosmeticEquippedEventHandler(string characterId, string cosmeticId);
    
    [Signal]
    public delegate void CosmeticPreviewRequestedEventHandler(string cosmeticId);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeCosmeticCatalog();
            LoadOwnershipData();
            LoadLoadoutData();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize the cosmetic catalog with all available items
    /// </summary>
    private void InitializeCosmeticCatalog()
    {
        // Initialize fighter skins
        InitializeFighterSkins();
        
        // Initialize animation packs
        InitializeAnimationPacks();
        
        // Initialize UI & announcer packs
        InitializeUIAndAnnouncerPacks();
        
        // Initialize themed cosmetic sets
        InitializeCosmeticSets();
        
        GD.Print($"Cosmetic catalog initialized with {_allCosmetics.Count} items and {_cosmeticSets.Count} sets");
    }
    
    /// <summary>
    /// Initialize fighter skins (Standard, Epic, Prestige tiers)
    /// </summary>
    private void InitializeFighterSkins()
    {
        // Ryu skins
        CreateFighterSkin("ryu_classic_white", "ryu", "Classic White Gi", CosmeticTier.Standard, 
            200, CurrencyType.Soft, "Traditional white karate gi with black belt");
        
        CreateFighterSkin("ryu_dark_hadou", "ryu", "Dark Hadou", CosmeticTier.Epic,
            599, CurrencyType.Premium, "Corrupted by dark energy with purple VFX");
        
        CreateFighterSkin("ryu_master_hermit", "ryu", "Master Hermit", CosmeticTier.Prestige,
            1299, CurrencyType.Premium, "Weathered master with unique voice lines and entrance");
        
        // Chun-Li skins  
        CreateFighterSkin("chunli_blue_qipao", "chun_li", "Traditional Blue Qipao", CosmeticTier.Standard,
            250, CurrencyType.Soft, "Classic blue dress with gold trim");
        
        CreateFighterSkin("chunli_street_cop", "chun_li", "Street Cop", CosmeticTier.Epic,
            699, CurrencyType.Premium, "ICPO uniform with special arrest animations");
        
        CreateFighterSkin("chunli_phoenix_dancer", "chun_li", "Phoenix Dancer", CosmeticTier.Prestige,
            1399, CurrencyType.Premium, "Elegant phoenix-themed outfit with fire VFX");
        
        // Ken skins
        CreateFighterSkin("ken_red_gi", "ken", "Red Tournament Gi", CosmeticTier.Standard,
            200, CurrencyType.Soft, "Bright red gi representing his flashy style");
        
        CreateFighterSkin("ken_street_wear", "ken", "Street Wear", CosmeticTier.Epic,
            649, CurrencyType.Premium, "Casual street clothes with flashy effects");
        
        // Zangief skins
        CreateFighterSkin("zangief_red_cyclone", "zangief", "Red Cyclone", CosmeticTier.Standard,
            300, CurrencyType.Soft, "Classic red wrestling attire");
        
        CreateFighterSkin("zangief_mech_wrestler", "zangief", "Mech Wrestler", CosmeticTier.Epic,
            799, CurrencyType.Premium, "Cybernetic enhancements with mechanical sounds");
    }
    
    /// <summary>
    /// Initialize animation packs (intros, victories, taunts, KO effects)
    /// </summary>
    private void InitializeAnimationPacks()
    {
        // Victory poses
        CreateAnimationPack("victory_classic_pack", "Classic Victory Pack", CosmeticTier.Standard,
            150, CurrencyType.Soft, "Traditional victory poses for all characters", 
            CosmeticType.VictoryPose, "all");
        
        CreateAnimationPack("victory_taunting_pack", "Taunting Victory Pack", CosmeticTier.Epic,
            399, CurrencyType.Premium, "Cocky and show-off victory animations",
            CosmeticType.VictoryPose, "all");
        
        // Intros
        CreateAnimationPack("intro_dramatic_pack", "Dramatic Entrance Pack", CosmeticTier.Epic,
            499, CurrencyType.Premium, "Over-the-top character introductions",
            CosmeticType.Intro, "all");
        
        // Taunts
        CreateAnimationPack("taunt_respectful_pack", "Respectful Taunt Pack", CosmeticTier.Standard,
            100, CurrencyType.Soft, "Sportsmanlike competitive taunts",
            CosmeticType.Taunt, "all");
        
        CreateAnimationPack("taunt_silly_pack", "Silly Taunt Pack", CosmeticTier.Epic,
            349, CurrencyType.Premium, "Humorous and lighthearted taunts",
            CosmeticType.Taunt, "all");
        
        // KO effects
        CreateAnimationPack("ko_elemental_pack", "Elemental KO Pack", CosmeticTier.Epic,
            599, CurrencyType.Premium, "Fire, ice, and lightning KO effects",
            CosmeticType.KOEffect, "all");
    }
    
    /// <summary>
    /// Initialize UI and announcer packs
    /// </summary>
    private void InitializeUIAndAnnouncerPacks()
    {
        // UI themes
        CreateUITheme("ui_retro_arcade", "Retro Arcade Theme", CosmeticTier.Standard,
            300, CurrencyType.Soft, "Classic 90s arcade UI with pixel fonts");
        
        CreateUITheme("ui_cyber_neon", "Cyber Neon Theme", CosmeticTier.Epic,
            599, CurrencyType.Premium, "Futuristic neon UI with glitch effects");
        
        CreateUITheme("ui_elegant_gold", "Elegant Gold Theme", CosmeticTier.Prestige,
            999, CurrencyType.Premium, "Luxurious gold and marble UI theme");
        
        // Announcer packs
        CreateAnnouncerPack("announcer_hype", "Hype Announcer", CosmeticTier.Epic,
            499, CurrencyType.Premium, "High-energy sports commentator style");
        
        CreateAnnouncerPack("announcer_wise_master", "Wise Master", CosmeticTier.Prestige,
            799, CurrencyType.Premium, "Calm, philosophical martial arts master");
    }
    
    /// <summary>
    /// Initialize themed cosmetic sets
    /// </summary>
    private void InitializeCosmeticSets()
    {
        // Cyberpunk set
        var cyberpunkItems = new List<string>
        {
            "ryu_cyber_ninja", "chunli_neon_enforcer", "ken_tech_brawler",
            "ui_cyber_neon", "announcer_ai_system", "ko_digital_glitch_pack"
        };
        
        CreateCosmeticSet("cyberpunk_2084", "Cyberpunk 2084 Collection", cyberpunkItems,
            2999, 2499, CurrencyType.Premium, "Complete cyberpunk makeover for your fighters");
        
        // Classic masters set
        var classicItems = new List<string>
        {
            "ryu_master_hermit", "chunli_traditional_master", "ken_tournament_champion",
            "ui_traditional_dojo", "announcer_wise_master", "victory_respectful_pack"
        };
        
        CreateCosmeticSet("classic_masters", "Classic Masters Collection", classicItems,
            1999, 1599, CurrencyType.Premium, "Honor the traditions of martial arts");
    }
    
    /// <summary>
    /// Create a fighter skin cosmetic item
    /// </summary>
    private void CreateFighterSkin(string id, string characterId, string name, CosmeticTier tier,
        int price, CurrencyType currency, string description)
    {
        _allCosmetics[id] = new CosmeticItem
        {
            Id = id,
            Name = name,
            Type = CosmeticType.Skin,
            Tier = tier,
            Price = price,
            Currency = currency,
            Description = description,
            CharacterId = characterId,
            IsAvailable = true,
            PreviewPath = $"res://assets/cosmetics/skins/{id}_preview.png",
            AssetPath = $"res://assets/cosmetics/skins/{id}/"
        };
    }
    
    /// <summary>
    /// Create an animation pack cosmetic item
    /// </summary>
    private void CreateAnimationPack(string id, string name, CosmeticTier tier,
        int price, CurrencyType currency, string description, CosmeticType type, string characterId)
    {
        _allCosmetics[id] = new CosmeticItem
        {
            Id = id,
            Name = name,
            Type = type,
            Tier = tier,
            Price = price,
            Currency = currency,
            Description = description,
            CharacterId = characterId,
            IsAvailable = true,
            PreviewPath = $"res://assets/cosmetics/animations/{id}_preview.gif",
            AssetPath = $"res://assets/cosmetics/animations/{id}/"
        };
    }
    
    /// <summary>
    /// Create a UI theme cosmetic item
    /// </summary>
    private void CreateUITheme(string id, string name, CosmeticTier tier,
        int price, CurrencyType currency, string description)
    {
        _allCosmetics[id] = new CosmeticItem
        {
            Id = id,
            Name = name,
            Type = CosmeticType.UITheme,
            Tier = tier,
            Price = price,
            Currency = currency,
            Description = description,
            CharacterId = "all",
            IsAvailable = true,
            PreviewPath = $"res://assets/cosmetics/ui/{id}_preview.png",
            AssetPath = $"res://assets/cosmetics/ui/{id}/"
        };
    }
    
    /// <summary>
    /// Create an announcer pack cosmetic item
    /// </summary>
    private void CreateAnnouncerPack(string id, string name, CosmeticTier tier,
        int price, CurrencyType currency, string description)
    {
        _allCosmetics[id] = new CosmeticItem
        {
            Id = id,
            Name = name,
            Type = CosmeticType.AnnouncerPack,
            Tier = tier,
            Price = price,
            Currency = currency,
            Description = description,
            CharacterId = "all",
            IsAvailable = true,
            PreviewPath = $"res://assets/cosmetics/announcers/{id}_preview.ogg",
            AssetPath = $"res://assets/cosmetics/announcers/{id}/"
        };
    }
    
    /// <summary>
    /// Create a cosmetic set with bundle pricing
    /// </summary>
    private void CreateCosmeticSet(string id, string name, List<string> itemIds,
        int individualPrice, int bundlePrice, CurrencyType currency, string description)
    {
        _cosmeticSets[id] = new CosmeticSet
        {
            Id = id,
            Name = name,
            Description = description,
            ItemIds = itemIds,
            IndividualPrice = individualPrice,
            BundlePrice = bundlePrice,
            Currency = currency,
            DiscountPercentage = (int)Math.Round((1f - (float)bundlePrice / individualPrice) * 100),
            IsAvailable = true
        };
    }
    
    /// <summary>
    /// Check if player owns a cosmetic item
    /// </summary>
    public bool IsItemOwned(string cosmeticId)
    {
        return _ownedCosmetics.Contains(cosmeticId);
    }
    
    /// <summary>
    /// Get all cosmetics for a specific character
    /// </summary>
    public List<CosmeticItem> GetCosmeticsForCharacter(string characterId)
    {
        return _allCosmetics.Values
            .Where(c => c.CharacterId == characterId || c.CharacterId == "all")
            .ToList();
    }
    
    /// <summary>
    /// Get cosmetics by type
    /// </summary>
    public List<CosmeticItem> GetCosmeticsByType(CosmeticType type)
    {
        return _allCosmetics.Values
            .Where(c => c.Type == type && c.IsAvailable)
            .ToList();
    }
    
    /// <summary>
    /// Get cosmetics by tier
    /// </summary>
    public List<CosmeticItem> GetCosmeticsByTier(CosmeticTier tier)
    {
        return _allCosmetics.Values
            .Where(c => c.Tier == tier && c.IsAvailable)
            .ToList();
    }
    
    /// <summary>
    /// Purchase a cosmetic item
    /// </summary>
    public bool PurchaseCosmetic(string cosmeticId)
    {
        if (!_allCosmetics.ContainsKey(cosmeticId))
        {
            GD.PrintErr($"Cosmetic not found: {cosmeticId}");
            return false;
        }
        
        if (IsItemOwned(cosmeticId))
        {
            GD.Print($"Cosmetic already owned: {cosmeticId}");
            return false;
        }
        
        var cosmetic = _allCosmetics[cosmeticId];
        
        if (!cosmetic.IsAvailable)
        {
            GD.Print($"Cosmetic not available: {cosmeticId}");
            return false;
        }
        
        // Check and spend currency
        if (CurrencyManager.Instance.SpendCurrency(cosmetic.Currency, cosmetic.Price, $"Purchased {cosmetic.Name}"))
        {
            _ownedCosmetics.Add(cosmeticId);
            SaveOwnershipData();
            
            EmitSignal(SignalName.CosmeticPurchased, cosmeticId);
            GD.Print($"Purchased cosmetic: {cosmetic.Name}");
            return true;
        }
        
        return false;
    }
    
    /// <summary>
    /// Purchase a cosmetic set (bundle)
    /// </summary>
    public bool PurchaseCosmeticSet(string setId)
    {
        if (!_cosmeticSets.ContainsKey(setId))
        {
            GD.PrintErr($"Cosmetic set not found: {setId}");
            return false;
        }
        
        var cosmeticSet = _cosmeticSets[setId];
        
        // Check if all items are available and not owned
        var unownedItems = cosmeticSet.ItemIds.Where(id => !IsItemOwned(id)).ToList();
        
        if (unownedItems.Count == 0)
        {
            GD.Print($"All items in set already owned: {setId}");
            return false;
        }
        
        // Calculate price for unowned items only
        var adjustedPrice = CalculateAdjustedSetPrice(cosmeticSet, unownedItems);
        
        // Check and spend currency
        if (CurrencyManager.Instance.SpendCurrency(cosmeticSet.Currency, adjustedPrice, $"Purchased {cosmeticSet.Name} set"))
        {
            // Grant all unowned items
            foreach (var itemId in unownedItems)
            {
                _ownedCosmetics.Add(itemId);
            }
            
            SaveOwnershipData();
            
            GD.Print($"Purchased cosmetic set: {cosmeticSet.Name} ({unownedItems.Count} items)");
            return true;
        }
        
        return false;
    }
    
    /// <summary>
    /// Calculate adjusted price for set based on owned items
    /// </summary>
    private int CalculateAdjustedSetPrice(CosmeticSet set, List<string> unownedItems)
    {
        if (unownedItems.Count == set.ItemIds.Count)
        {
            return set.BundlePrice; // Full bundle price
        }
        
        // Pro-rate based on unowned items
        var ratio = (float)unownedItems.Count / set.ItemIds.Count;
        return (int)(set.BundlePrice * ratio);
    }
    
    /// <summary>
    /// Equip a cosmetic item for a character
    /// </summary>
    public bool EquipCosmetic(string characterId, string cosmeticId)
    {
        if (!IsItemOwned(cosmeticId))
        {
            GD.PrintErr($"Cannot equip unowned cosmetic: {cosmeticId}");
            return false;
        }
        
        if (!_allCosmetics.ContainsKey(cosmeticId))
        {
            GD.PrintErr($"Cosmetic not found: {cosmeticId}");
            return false;
        }
        
        var cosmetic = _allCosmetics[cosmeticId];
        
        // Check if cosmetic is compatible with character
        if (cosmetic.CharacterId != characterId && cosmetic.CharacterId != "all")
        {
            GD.PrintErr($"Cosmetic {cosmeticId} not compatible with character {characterId}");
            return false;
        }
        
        _equippedCosmetics[characterId] = cosmeticId;
        SaveLoadoutData();
        
        EmitSignal(SignalName.CosmeticEquipped, characterId, cosmeticId);
        GD.Print($"Equipped {cosmetic.Name} for {characterId}");
        return true;
    }
    
    /// <summary>
    /// Get equipped cosmetic for character
    /// </summary>
    public string GetEquippedCosmetic(string characterId)
    {
        return _equippedCosmetics.GetValueOrDefault(characterId, "");
    }
    
    /// <summary>
    /// Request preview of cosmetic item
    /// </summary>
    public void RequestCosmeticPreview(string cosmeticId)
    {
        if (!_allCosmetics.ContainsKey(cosmeticId))
        {
            GD.PrintErr($"Cannot preview unknown cosmetic: {cosmeticId}");
            return;
        }
        
        EmitSignal(SignalName.CosmeticPreviewRequested, cosmeticId);
        GD.Print($"Requesting preview for cosmetic: {cosmeticId}");
    }
    
    /// <summary>
    /// Get cosmetic item details
    /// </summary>
    public CosmeticItem GetCosmeticItem(string cosmeticId)
    {
        return _allCosmetics.GetValueOrDefault(cosmeticId, null);
    }
    
    /// <summary>
    /// Get cosmetic set details
    /// </summary>
    public CosmeticSet GetCosmeticSet(string setId)
    {
        return _cosmeticSets.GetValueOrDefault(setId, null);
    }
    
    /// <summary>
    /// Get all available cosmetic sets
    /// </summary>
    public List<CosmeticSet> GetAvailableCosmeticSets()
    {
        return _cosmeticSets.Values.Where(s => s.IsAvailable).ToList();
    }
    
    /// <summary>
    /// Save ownership data
    /// </summary>
    private void SaveOwnershipData()
    {
        try
        {
            var data = new CosmeticOwnership
            {
                OwnedCosmetics = _ownedCosmetics.ToList(),
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(COSMETIC_OWNERSHIP_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save cosmetic ownership: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load ownership data
    /// </summary>
    private void LoadOwnershipData()
    {
        try
        {
            if (FileAccess.FileExists(COSMETIC_OWNERSHIP_FILE))
            {
                using var file = FileAccess.Open(COSMETIC_OWNERSHIP_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<CosmeticOwnership>(jsonText);
                
                _ownedCosmetics = new HashSet<string>(data.OwnedCosmetics ?? new List<string>());
                GD.Print($"Loaded {_ownedCosmetics.Count} owned cosmetics");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load cosmetic ownership: {e.Message}");
        }
    }
    
    /// <summary>
    /// Save loadout data
    /// </summary>
    private void SaveLoadoutData()
    {
        try
        {
            var data = new CosmeticLoadout
            {
                EquippedCosmetics = _equippedCosmetics,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(COSMETIC_LOADOUT_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save cosmetic loadouts: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load loadout data
    /// </summary>
    private void LoadLoadoutData()
    {
        try
        {
            if (FileAccess.FileExists(COSMETIC_LOADOUT_FILE))
            {
                using var file = FileAccess.Open(COSMETIC_LOADOUT_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<CosmeticLoadout>(jsonText);
                
                _equippedCosmetics = data.EquippedCosmetics ?? new Dictionary<string, string>();
                GD.Print($"Loaded cosmetic loadouts for {_equippedCosmetics.Count} characters");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load cosmetic loadouts: {e.Message}");
        }
    }
}

// Enums and data structures
public enum CosmeticType
{
    Skin,
    VictoryPose,
    Intro,
    Taunt,
    KOEffect,
    UITheme,
    AnnouncerPack
}

public enum CosmeticTier
{
    Standard,    // Basic cosmetics, palette swaps, simple changes
    Epic,        // Custom VFX, animations, moderate complexity
    Prestige     // Full thematic overhauls, unique audio, premium quality
}

public class CosmeticItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public CosmeticType Type { get; set; }
    public CosmeticTier Tier { get; set; }
    public int Price { get; set; }
    public CurrencyType Currency { get; set; }
    public string Description { get; set; } = "";
    public string CharacterId { get; set; } = ""; // "all" for universal cosmetics
    public bool IsAvailable { get; set; } = true;
    public string PreviewPath { get; set; } = "";
    public string AssetPath { get; set; } = "";
    public DateTime ReleaseDate { get; set; } = DateTime.UtcNow;
}

public class CosmeticSet
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public List<string> ItemIds { get; set; } = new();
    public int IndividualPrice { get; set; }
    public int BundlePrice { get; set; }
    public CurrencyType Currency { get; set; }
    public int DiscountPercentage { get; set; }
    public bool IsAvailable { get; set; } = true;
}

public class CosmeticOwnership
{
    public List<string> OwnedCosmetics { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class CosmeticLoadout
{
    public Dictionary<string, string> EquippedCosmetics { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}