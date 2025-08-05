using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;

/// <summary>
/// Manages ethical cosmetic content delivery and distribution (no character purchases)
/// All fighters are free through weekly rotation system
/// </summary>
public partial class DLCManager : Node
{
    public static DLCManager Instance { get; private set; }
    
    private Dictionary<string, bool> _ownedCharacters = new(); // Legacy - all fighters are now free
    private Dictionary<string, CosmeticContentPack> _availableContentPacks = new();
    private const string OWNERSHIP_FILE = "user://cosmetic_content_ownership.json";
    
    [Signal]
    public delegate void ContentPackPurchasedEventHandler(string packId);
    
    [Signal]
    public delegate void FighterUnlockedEventHandler(string characterId); // Through rotation
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadOwnershipData();
            InitializeDLCCatalog();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize cosmetic content packs (no character purchases)
    /// </summary>
    private void InitializeDLCCatalog()
    {
        // All base game characters are permanently available (no purchases needed)
        _ownedCharacters["ryu"] = true;
        _ownedCharacters["chun_li"] = true;
        _ownedCharacters["ken"] = true;
        _ownedCharacters["zangief"] = true;
        
        // Cosmetic content packs
        _availableContentPacks["season_1_cosmetics"] = new CosmeticContentPack
        {
            PackId = "season_1_cosmetics",
            Name = "Season 1 Cosmetic Collection",
            Description = "Premium cosmetic bundle featuring exclusive skins and effects",
            Price = 12.99f,
            ContentIds = new[] { "ryu_premium_gi", "chun_li_qipao", "ken_flame_effects", "stage_cherry_blossom" },
            PackType = ContentPackType.SeasonalBundle,
            IsLimitedTime = false,
            ReleaseDate = DateTime.UtcNow.AddDays(-30)
        };
        
        _availableContentPacks["accessibility_pack"] = new CosmeticContentPack
        {
            PackId = "accessibility_pack",
            Name = "Accessibility Enhancement Pack",
            Description = "UI themes and visual aids for accessibility (always free)",
            Price = 0.0f,
            ContentIds = new[] { "colorblind_ui", "high_contrast_theme", "large_text_ui" },
            PackType = ContentPackType.Accessibility,
            IsLimitedTime = false,
            ReleaseDate = DateTime.UtcNow
        };
        
        // Grant accessibility pack automatically
        _ownedCharacters["accessibility_pack"] = true;
        
        GD.Print($"Cosmetic content catalog initialized with {_availableContentPacks.Count} packages");
    }
    
    /// <summary>
    /// Check if player owns a specific character
    /// </summary>
    public bool IsCharacterOwned(string characterId)
    {
        return _ownedCharacters.GetValueOrDefault(characterId, false);
    }
    
    /// <summary>
    /// Check if player owns a specific character or has access via weekly rotation
    /// </summary>
    public bool CanPlayerAccessCharacter(string characterId, string playerId = "player1")
    {
        // Check direct ownership first
        if (IsCharacterOwned(characterId))
        {
            return true;
        }
        
        // Check weekly rotation access
        if (WeeklyRotationManager.Instance != null)
        {
            return WeeklyRotationManager.Instance.CanPlayerAccessCharacter(playerId, characterId);
        }
        
        return false;
    }
    
    /// <summary>
    /// Get player's current weekly free fighter
    /// </summary>
    public string GetWeeklyFreeFighter(string playerId = "player1")
    {
        if (WeeklyRotationManager.Instance != null)
        {
            return WeeklyRotationManager.Instance.GetPlayerWeeklyFighter(playerId);
        }
        
        return "";
    }
    
    /// <summary>
    /// Validate character ownership for match startup
    /// </summary>
    public bool ValidateCharacterForMatch(string characterId, int playerId)
    {
        bool isOwned = IsCharacterOwned(characterId);
        
        if (!isOwned)
        {
            GD.Print($"Player {playerId} does not own character: {characterId}");
            ShowPurchasePrompt(characterId);
        }
        
        EmitSignal(SignalName.DLCValidated, characterId, isOwned);
        return isOwned;
    }
    
    /// <summary>
    /// Show purchase prompt for unowned character
    /// </summary>
    private void ShowPurchasePrompt(string characterId)
    {
        if (_availableDLC.ContainsKey(characterId))
        {
            var dlc = _availableDLC[characterId];
            
            if (!dlc.IsAvailable)
            {
                ShowComingSoonDialog(dlc);
                return;
            }
            
            // Create purchase dialog
            var dialog = new AcceptDialog();
            dialog.Title = "Character Not Owned";
            dialog.DialogText = $"You don't own {dlc.Name}.\n\nWould you like to purchase it for ${dlc.Price:F2}?";
            
            // Add purchase button
            dialog.AddButton("Purchase", false, "purchase");
            dialog.AddButton("Try Character", false, "trial");
            
            dialog.CustomAction += (StringName action) => {
                switch (action.ToString())
                {
                    case "purchase":
                        InitiatePurchase(characterId);
                        break;
                    case "trial":
                        StartCharacterTrial(characterId);
                        break;
                }
            };
            
            GetTree().Root.AddChild(dialog);
            dialog.PopupCentered();
        }
    }
    
    /// <summary>
    /// Show coming soon dialog for unreleased content
    /// </summary>
    private void ShowComingSoonDialog(CosmeticContentPack pack)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Coming Soon";
        dialog.DialogText = $"{pack.Name}\n\nReleasing: {pack.ReleaseDate:MMMM dd, yyyy}\n\n{pack.Description}";
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }
    
    /// <summary>
    /// Initiate purchase through Steam or platform store
    /// </summary>
    private void InitiatePurchase(string characterId)
    {
        if (!_availableDLC.ContainsKey(characterId)) return;
        
        var dlc = _availableDLC[characterId];
        
        // In a real implementation, this would integrate with Steam API
        // For now, simulate purchase success
        GD.Print($"Initiating purchase for {dlc.Name} (${dlc.Price:F2})");
        
        // Simulate Steam purchase flow
        SimulatePurchaseFlow(characterId);
    }
    
    /// <summary>
    /// Simulate purchase flow for development
    /// </summary>
    private void SimulatePurchaseFlow(string characterId)
    {
        // In production, this would be handled by Steam/platform APIs
        var confirmDialog = new ConfirmationDialog();
        confirmDialog.Title = "Confirm Purchase";
        confirmDialog.DialogText = $"Simulate purchase of {_availableDLC[characterId].Name}?";
        
        confirmDialog.Confirmed += () => {
            CompletePurchase(characterId);
        };
        
        GetTree().Root.AddChild(confirmDialog);
        confirmDialog.PopupCentered();
    }
    
    /// <summary>
    /// Complete character purchase
    /// </summary>
    private void CompletePurchase(string characterId)
    {
        _ownedCharacters[characterId] = true;
        SaveOwnershipData();
        
        EmitSignal(SignalName.DLCPurchased, characterId);
        
        // Show success message
        var successDialog = new AcceptDialog();
        successDialog.Title = "Purchase Complete";
        successDialog.DialogText = $"Thank you for purchasing {_availableDLC[characterId].Name}!\n\nThe character is now available for play.";
        
        GetTree().Root.AddChild(successDialog);
        successDialog.PopupCentered();
        
        GD.Print($"Purchase completed for {characterId}");
    }
    
    /// <summary>
    /// Start character trial (limited time play)
    /// </summary>
    private void StartCharacterTrial(string characterId)
    {
        // Grant temporary access for trial
        const int TRIAL_DURATION_MINUTES = 10;
        
        var trialDialog = new AcceptDialog();
        trialDialog.Title = "Character Trial";
        trialDialog.DialogText = $"You can try this character for {TRIAL_DURATION_MINUTES} minutes.\n\nPurchase anytime to unlock permanently!";
        
        trialDialog.Confirmed += () => {
            GrantTrialAccess(characterId, TRIAL_DURATION_MINUTES);
        };
        
        GetTree().Root.AddChild(trialDialog);
        trialDialog.PopupCentered();
    }
    
    /// <summary>
    /// Grant temporary trial access
    /// </summary>
    private void GrantTrialAccess(string characterId, int durationMinutes)
    {
        // Temporarily allow character usage
        _ownedCharacters[characterId] = true;
        
        // Set up timer to revoke access
        var timer = new Timer();
        timer.WaitTime = durationMinutes * 60; // Convert to seconds
        timer.OneShot = true;
        timer.Timeout += () => {
            RevokeTrialAccess(characterId);
            timer.QueueFree();
        };
        
        AddChild(timer);
        timer.Start();
        
        GD.Print($"Trial access granted for {characterId} - {durationMinutes} minutes");
    }
    
    /// <summary>
    /// Revoke trial access
    /// </summary>
    private void RevokeTrialAccess(string characterId)
    {
        // Only revoke if not purchased during trial
        if (!IsCharacterPermanentlyOwned(characterId))
        {
            _ownedCharacters[characterId] = false;
            
            var expiredDialog = new AcceptDialog();
            expiredDialog.Title = "Trial Expired";
            expiredDialog.DialogText = $"Your trial for this character has expired.\n\nPurchase now to continue playing!";
            
            GetTree().Root.AddChild(expiredDialog);
            expiredDialog.PopupCentered();
            
            GD.Print($"Trial access revoked for {characterId}");
        }
    }
    
    /// <summary>
    /// Check if character is permanently owned (not trial)
    /// </summary>
    private bool IsCharacterPermanentlyOwned(string characterId)
    {
        // In a real implementation, this would check against platform ownership
        return _ownedCharacters.GetValueOrDefault(characterId, false);
    }
    
    /// <summary>
    /// Get list of available cosmetic content packs
    /// </summary>
    public List<CosmeticContentPack> GetAvailableContentPacks()
    {
        var available = new List<CosmeticContentPack>();
        
        foreach (var pack in _availableContentPacks.Values)
        {
            // For cosmetic content packs, all should be available for purchase
            available.Add(pack);
        }
        
        return available;
    }
    
    /// <summary>
    /// Save ownership data to file
    /// </summary>
    private void SaveOwnershipData()
    {
        try
        {
            var data = new OwnershipData
            {
                OwnedCharacters = _ownedCharacters,
                LastUpdated = DateTime.UtcNow
            };
            
            using var file = FileAccess.Open(OWNERSHIP_FILE, FileAccess.ModeFlags.Write);
            string jsonText = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(jsonText);
            
            GD.Print("Ownership data saved");
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to save ownership data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Load ownership data from file
    /// </summary>
    private void LoadOwnershipData()
    {
        try
        {
            if (FileAccess.FileExists(OWNERSHIP_FILE))
            {
                using var file = FileAccess.Open(OWNERSHIP_FILE, FileAccess.ModeFlags.Read);
                string jsonText = file.GetAsText();
                var data = JsonSerializer.Deserialize<OwnershipData>(jsonText);
                
                _ownedCharacters = data.OwnedCharacters ?? new();
                GD.Print("Ownership data loaded");
            }
        }
        catch (Exception e)
        {
            GD.PrintErr($"Failed to load ownership data: {e.Message}");
        }
    }
    
    /// <summary>
    /// Sync ownership with platform (Steam, etc.)
    /// </summary>
    public void SyncWithPlatform()
    {
        // In a real implementation, this would check Steam DLC ownership
        GD.Print("Syncing DLC ownership with platform...");
        
        // TODO: Implement Steam API integration
        // - Check owned DLC through Steam API
        // - Update local ownership based on platform data
        // - Handle refunds and ownership changes
    }
}

// Data structures for cosmetic content packs
public class CosmeticContentPack
{
    public string PackId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public float Price { get; set; }
    public string[] ContentIds { get; set; } = Array.Empty<string>();
    public ContentPackType PackType { get; set; }
    public bool IsLimitedTime { get; set; }
    public DateTime ReleaseDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public enum ContentPackType
{
    SeasonalBundle,
    CharacterCosmetics,
    StageThemes,
    Accessibility,
    Premium
}

public class OwnershipData
{
    public Dictionary<string, bool> OwnedCharacters { get; set; } = new();
    public Dictionary<string, bool> OwnedContentPacks { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}