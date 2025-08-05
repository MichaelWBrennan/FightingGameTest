using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;

/// <summary>
/// Manages DLC character ownership and license validation
/// </summary>
public partial class DLCManager : Node
{
    public static DLCManager Instance { get; private set; }
    
    private Dictionary<string, bool> _ownedCharacters = new();
    private Dictionary<string, DLCPackage> _availableDLC = new();
    private const string OWNERSHIP_FILE = "user://character_ownership.json";
    
    [Signal]
    public delegate void DLCPurchasedEventHandler(string characterId);
    
    [Signal]
    public delegate void DLCValidatedEventHandler(string characterId, bool isOwned);
    
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
    /// Initialize the DLC catalog with available content
    /// </summary>
    private void InitializeDLCCatalog()
    {
        // Base game characters (always owned)
        _ownedCharacters["ryu"] = true;
        
        // DLC characters
        _availableDLC["chun_li"] = new DLCPackage
        {
            CharacterId = "chun_li",
            Name = "Chun-Li Character Pack",
            Price = 5.99f,
            Description = "The strongest woman in the world joins the fight!",
            SteamAppId = "2234567", // Would be actual Steam DLC ID
            ReleaseDate = DateTime.Parse("2024-08-05"),
            IsAvailable = true
        };
        
        // Add more DLC packages as they become available
        _availableDLC["ken"] = new DLCPackage
        {
            CharacterId = "ken",
            Name = "Ken Masters Character Pack", 
            Price = 5.99f,
            Description = "Ryu's best friend and rival brings flashy combos!",
            SteamAppId = "2234568",
            ReleaseDate = DateTime.Parse("2024-09-01"),
            IsAvailable = false // Not yet released
        };
        
        GD.Print($"DLC Catalog initialized with {_availableDLC.Count} packages");
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
    private void ShowComingSoonDialog(DLCPackage dlc)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Coming Soon";
        dialog.DialogText = $"{dlc.Name}\n\nReleasing: {dlc.ReleaseDate:MMMM dd, yyyy}\n\n{dlc.Description}";
        
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
        
        // Check ethical safeguards first
        var validation = EthicalSafeguards.Instance?.ValidatePurchase("player1", dlc.Price, dlc.Name);
        if (validation != null && !validation.IsAllowed)
        {
            ShowPurchaseBlockedDialog(validation.UserMessage);
            return;
        }
        
        // Show confirmation if required
        if (validation?.RequiresConfirmation == true)
        {
            ShowPurchaseConfirmationDialog(characterId, validation.ConfirmationMessage);
            return;
        }
        
        // In a real implementation, this would integrate with Steam API
        // For now, simulate purchase success
        GD.Print($"Initiating purchase for {dlc.Name} (${dlc.Price:F2})");
        
        // Simulate Steam purchase flow
        SimulatePurchaseFlow(characterId);
    }
    
    /// <summary>
    /// Show purchase blocked dialog
    /// </summary>
    private void ShowPurchaseBlockedDialog(string message)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Purchase Not Allowed";
        dialog.DialogText = message;
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }
    
    /// <summary>
    /// Show purchase confirmation dialog
    /// </summary>
    private void ShowPurchaseConfirmationDialog(string characterId, string confirmationMessage)
    {
        var dialog = new ConfirmationDialog();
        dialog.Title = "Confirm Purchase";
        dialog.DialogText = confirmationMessage;
        
        dialog.Confirmed += () => {
            CompletePurchase(characterId);
        };
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
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
        var dlc = _availableDLC[characterId];
        
        _ownedCharacters[characterId] = true;
        SaveOwnershipData();
        
        // Record purchase in ethical safeguards
        EthicalSafeguards.Instance?.RecordPurchase("player1", dlc.Price, characterId, dlc.Name);
        
        // Award some soft currency as bonus for character purchase
        CurrencyManager.Instance?.AwardSoftCurrency(500, $"Welcome bonus for {dlc.Name}");
        
        EmitSignal(SignalName.DLCPurchased, characterId);
        
        // Show success message
        var successDialog = new AcceptDialog();
        successDialog.Title = "Purchase Complete";
        successDialog.DialogText = $"Thank you for purchasing {dlc.Name}!\n\nThe character is now available for play.\n\nBonus: You received 500 Training Tokens!";
        
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
    /// Get list of available DLC packages
    /// </summary>
    public List<DLCPackage> GetAvailableDLC()
    {
        var available = new List<DLCPackage>();
        
        foreach (var dlc in _availableDLC.Values)
        {
            if (dlc.IsAvailable && !IsCharacterOwned(dlc.CharacterId))
            {
                available.Add(dlc);
            }
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

// Data structures
public class DLCPackage
{
    public string CharacterId { get; set; } = "";
    public string Name { get; set; } = "";
    public float Price { get; set; }
    public string Description { get; set; } = "";
    public string SteamAppId { get; set; } = "";
    public DateTime ReleaseDate { get; set; }
    public bool IsAvailable { get; set; }
}

public class OwnershipData
{
    public Dictionary<string, bool> OwnedCharacters { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}