using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

/// <summary>
/// Direct-purchase cosmetic storefront system
/// Implements transparent, real-currency pricing without gacha or FOMO mechanics
/// </summary>
public partial class CosmeticStorefront : Node
{
    public static CosmeticStorefront Instance { get; private set; }
    
    private Dictionary<string, CosmeticItem> _availableCosmetics = new();
    private Dictionary<string, bool> _ownedCosmetics = new();
    private Dictionary<string, CosmeticCategory> _categories = new();
    private const string COSMETIC_OWNERSHIP_FILE = "user://cosmetic_ownership.json";
    
    [Signal]
    public delegate void CosmeticPurchasedEventHandler(string cosmeticId);
    
    [Signal]
    public delegate void StorefrontUpdatedEventHandler();

    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeCosmeticCatalog();
            LoadOwnershipData();
        }
        else
        {
            QueueFree();
        }
    }

    /// <summary>
    /// Initialize cosmetic catalog with all available items
    /// </summary>
    private void InitializeCosmeticCatalog()
    {
        InitializeCategories();
        InitializeSkins();
        InitializeAnnouncerPacks();
        InitializeTaunts();
        InitializeIntros();
        InitializeKOEffects();
        InitializeLobbyEffects();
        InitializeProfileCustomizations();
        
        GD.Print($"Cosmetic catalog initialized with {_availableCosmetics.Count} items across {_categories.Count} categories");
    }

    private void InitializeCategories()
    {
        _categories["skins"] = new CosmeticCategory 
        { 
            Id = "skins", 
            Name = "Fighter Skins", 
            Description = "Complete visual overhauls for your fighters",
            SortOrder = 1 
        };
        
        _categories["effects"] = new CosmeticCategory 
        { 
            Id = "effects", 
            Name = "Special Effects", 
            Description = "Customize move effects and visual flair",
            SortOrder = 2 
        };
        
        _categories["audio"] = new CosmeticCategory 
        { 
            Id = "audio", 
            Name = "Audio Packs", 
            Description = "Announcer packs and sound customizations",
            SortOrder = 3 
        };
        
        _categories["animations"] = new CosmeticCategory 
        { 
            Id = "animations", 
            Name = "Animations", 
            Description = "Intros, taunts, win poses, and KO effects",
            SortOrder = 4 
        };
        
        _categories["profile"] = new CosmeticCategory 
        { 
            Id = "profile", 
            Name = "Profile", 
            Description = "Nameplates, avatars, and lobby customizations",
            SortOrder = 5 
        };
    }

    private void InitializeSkins()
    {
        // Ryu skins
        AddCosmetic(new CosmeticItem
        {
            Id = "ryu_classic",
            Name = "Ryu Classic White Gi",
            Description = "Traditional white karate gi with red headband",
            Price = 7.99m,
            CategoryId = "skins",
            CharacterId = "ryu",
            IsBundle = false,
            RarityTier = "common",
            PreviewImage = "res://assets/cosmetics/ryu_classic_preview.png"
        });

        AddCosmetic(new CosmeticItem
        {
            Id = "ryu_dark_hadou",
            Name = "Ryu Dark Hadou",
            Description = "Consumed by dark power, glowing purple effects",
            Price = 12.99m,
            CategoryId = "skins",
            CharacterId = "ryu",
            IsBundle = true,
            BundleContents = new() { "ryu_dark_skin", "dark_hadouken_effect", "dark_victory_pose" },
            RarityTier = "legendary",
            PreviewImage = "res://assets/cosmetics/ryu_dark_preview.png"
        });

        // Chun-Li skins
        AddCosmetic(new CosmeticItem
        {
            Id = "chunli_qipao",
            Name = "Chun-Li Traditional Qipao",
            Description = "Elegant traditional Chinese dress",
            Price = 8.99m,
            CategoryId = "skins",
            CharacterId = "chun_li",
            IsBundle = false,
            RarityTier = "uncommon",
            PreviewImage = "res://assets/cosmetics/chunli_qipao_preview.png"
        });
    }

    private void InitializeAnnouncerPacks()
    {
        AddCosmetic(new CosmeticItem
        {
            Id = "announcer_classic_fgc",
            Name = "Classic FGC Announcer",
            Description = "Legendary fighting game tournament commentary",
            Price = 4.99m,
            CategoryId = "audio",
            CharacterId = "", // Global cosmetic
            IsBundle = false,
            RarityTier = "uncommon"
        });

        AddCosmetic(new CosmeticItem
        {
            Id = "announcer_robotic",
            Name = "Cyber Tournament AI",
            Description = "Futuristic AI announcer with digital effects",
            Price = 6.99m,
            CategoryId = "audio",
            CharacterId = "",
            IsBundle = false,
            RarityTier = "rare"
        });
    }

    private void InitializeTaunts()
    {
        AddCosmetic(new CosmeticItem
        {
            Id = "ryu_respect_bow",
            Name = "Respectful Bow",
            Description = "Traditional martial arts respect gesture",
            Price = 2.99m,
            CategoryId = "animations",
            CharacterId = "ryu",
            IsBundle = false,
            RarityTier = "common"
        });
    }

    private void InitializeIntros()
    {
        AddCosmetic(new CosmeticItem
        {
            Id = "chunli_spinning_entrance",
            Name = "Spinning Bird Entrance",
            Description = "Dramatic entrance with signature spinning kick",
            Price = 3.99m,
            CategoryId = "animations",
            CharacterId = "chun_li",
            IsBundle = false,
            RarityTier = "uncommon"
        });
    }

    private void InitializeKOEffects()
    {
        AddCosmetic(new CosmeticItem
        {
            Id = "lightning_ko_effect",
            Name = "Lightning Strike KO",
            Description = "Electrifying finishing effect",
            Price = 5.99m,
            CategoryId = "effects",
            CharacterId = "", // Global effect
            IsBundle = false,
            RarityTier = "rare"
        });
    }

    private void InitializeLobbyEffects()
    {
        AddCosmetic(new CosmeticItem
        {
            Id = "sakura_petals_lobby",
            Name = "Sakura Petals",
            Description = "Beautiful cherry blossom petals in your lobby",
            Price = 3.99m,
            CategoryId = "profile",
            CharacterId = "",
            IsBundle = false,
            RarityTier = "uncommon"
        });
    }

    private void InitializeProfileCustomizations()
    {
        AddCosmetic(new CosmeticItem
        {
            Id = "nameplate_gold_frame",
            Name = "Gold Championship Frame",
            Description = "Prestigious golden nameplate border",
            Price = 4.99m,
            CategoryId = "profile",
            CharacterId = "",
            IsBundle = false,
            RarityTier = "rare"
        });
    }

    private void AddCosmetic(CosmeticItem cosmetic)
    {
        _availableCosmetics[cosmetic.Id] = cosmetic;
    }

    /// <summary>
    /// Get all cosmetics in a specific category
    /// </summary>
    public List<CosmeticItem> GetCosmeticsByCategory(string categoryId)
    {
        return _availableCosmetics.Values
            .Where(c => c.CategoryId == categoryId)
            .OrderBy(c => c.RarityTier)
            .ThenBy(c => c.Price)
            .ToList();
    }

    /// <summary>
    /// Get all cosmetics for a specific character
    /// </summary>
    public List<CosmeticItem> GetCosmeticsForCharacter(string characterId)
    {
        return _availableCosmetics.Values
            .Where(c => c.CharacterId == characterId || string.IsNullOrEmpty(c.CharacterId))
            .ToList();
    }

    /// <summary>
    /// Check if player owns a cosmetic
    /// </summary>
    public bool IsCosmeticOwned(string cosmeticId)
    {
        return _ownedCosmetics.GetValueOrDefault(cosmeticId, false);
    }

    /// <summary>
    /// Purchase a cosmetic with real currency
    /// </summary>
    public void PurchaseCosmetic(string cosmeticId)
    {
        if (!_availableCosmetics.ContainsKey(cosmeticId))
        {
            GD.PrintErr($"Cosmetic not found: {cosmeticId}");
            return;
        }

        if (IsCosmeticOwned(cosmeticId))
        {
            ShowAlreadyOwnedDialog(cosmeticId);
            return;
        }

        var cosmetic = _availableCosmetics[cosmeticId];
        ShowPurchaseConfirmation(cosmetic);
    }

    private void ShowPurchaseConfirmation(CosmeticItem cosmetic)
    {
        var dialog = new ConfirmationDialog();
        dialog.Title = "Confirm Purchase";
        
        var description = $"{cosmetic.Name}\n\n{cosmetic.Description}\n\nPrice: ${cosmetic.Price:F2}";
        if (cosmetic.IsBundle && cosmetic.BundleContents.Count > 0)
        {
            description += $"\n\nBundle includes {cosmetic.BundleContents.Count} items";
        }
        
        dialog.DialogText = description;
        
        dialog.Confirmed += () => {
            ProcessPurchase(cosmetic);
        };
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ProcessPurchase(CosmeticItem cosmetic)
    {
        // In production, integrate with platform payment systems
        // For now, simulate successful purchase
        _ownedCosmetics[cosmetic.Id] = true;
        
        // If it's a bundle, grant all bundle contents
        if (cosmetic.IsBundle)
        {
            foreach (var bundleItem in cosmetic.BundleContents)
            {
                _ownedCosmetics[bundleItem] = true;
            }
        }
        
        SaveOwnershipData();
        EmitSignal(SignalName.CosmeticPurchased, cosmetic.Id);
        
        ShowPurchaseSuccessDialog(cosmetic);
        
        // Track analytics
        if (CosmeticAnalytics.Instance != null)
        {
            CosmeticAnalytics.Instance.TrackPurchase(cosmetic.Id, cosmetic.Price, cosmetic.CategoryId);
        }
        
        GD.Print($"Cosmetic purchased: {cosmetic.Name} (${cosmetic.Price:F2})");
    }

    private void ShowPurchaseSuccessDialog(CosmeticItem cosmetic)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Purchase Complete";
        dialog.DialogText = $"Thank you for purchasing {cosmetic.Name}!\n\nYour new cosmetic is now available for use.";
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void ShowAlreadyOwnedDialog(string cosmeticId)
    {
        var cosmetic = _availableCosmetics[cosmeticId];
        var dialog = new AcceptDialog();
        dialog.Title = "Already Owned";
        dialog.DialogText = $"You already own {cosmetic.Name}.";
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    /// <summary>
    /// Get all available categories
    /// </summary>
    public List<CosmeticCategory> GetCategories()
    {
        return _categories.Values.OrderBy(c => c.SortOrder).ToList();
    }

    /// <summary>
    /// Get cosmetic by ID
    /// </summary>
    public CosmeticItem GetCosmetic(string cosmeticId)
    {
        return _availableCosmetics.GetValueOrDefault(cosmeticId);
    }

    /// <summary>
    /// Preview cosmetic before purchase
    /// </summary>
    public void PreviewCosmetic(string cosmeticId)
    {
        if (!_availableCosmetics.ContainsKey(cosmeticId))
            return;
            
        var cosmetic = _availableCosmetics[cosmeticId];
        
        // In a real implementation, this would show 3D preview
        var dialog = new AcceptDialog();
        dialog.Title = $"Preview: {cosmetic.Name}";
        dialog.DialogText = $"{cosmetic.Description}\n\nPrice: ${cosmetic.Price:F2}\n\n[Preview functionality would show 3D model here]";
        
        dialog.AddButton("Purchase", false, "purchase");
        dialog.CustomAction += (StringName action) => {
            if (action == "purchase")
            {
                PurchaseCosmetic(cosmeticId);
            }
        };
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }

    private void SaveOwnershipData()
    {
        try
        {
            var data = new CosmeticOwnershipData
            {
                OwnedCosmetics = _ownedCosmetics,
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

    private void LoadOwnershipData()
    {
        try
        {
            if (FileAccess.FileExists(COSMETIC_OWNERSHIP_FILE))
            {
                using var file = FileAccess.Open(COSMETIC_OWNERSHIP_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<CosmeticOwnershipData>(jsonText);
                
                _ownedCosmetics = data.OwnedCosmetics ?? new();
                GD.Print($"Loaded ownership data for {_ownedCosmetics.Count} cosmetics");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load cosmetic ownership: {e.Message}");
        }
    }
}

// Data structures
public class CosmeticItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string CategoryId { get; set; } = "";
    public string CharacterId { get; set; } = ""; // Empty for global cosmetics
    public bool IsBundle { get; set; }
    public List<string> BundleContents { get; set; } = new();
    public string RarityTier { get; set; } = "common"; // common, uncommon, rare, legendary
    public string PreviewImage { get; set; } = "";
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class CosmeticCategory
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int SortOrder { get; set; }
}

public class CosmeticOwnershipData
{
    public Dictionary<string, bool> OwnedCosmetics { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}