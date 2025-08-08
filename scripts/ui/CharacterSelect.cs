using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Multi-player character selection screen with team support
/// </summary>
public partial class CharacterSelect : Control
{
    private GridContainer _characterGrid;
    private Button _confirmButton;
    private Button _backButton;
    private VBoxContainer _playersContainer;
    private Label _titleLabel;
    
    private List<PlayerSelectionData> _playerSelections;
    private int _currentPlayerIndex = 0;
    private string[] _availableCharacters;
    
    public override void _Ready()
    {
        SetupUI();
        InitializePlayerSelections();
        LoadCharacters();
        
        // Connect to DLC manager updates for new fighters
        if (DLCManager.Instance != null)
        {
            DLCManager.Instance.Connect(DLCManager.SignalName.FighterUnlocked, new Callable(this, nameof(OnFighterUnlocked)));
        }
    }
    
    private void OnFighterUnlocked(string fighterId)
    {
        LoadCharacters(); // Refresh character list when new fighter is unlocked
    }
    
    private void SetupUI()
    {
        _characterGrid = GetNode<GridContainer>("CharacterGrid");
        _confirmButton = GetNode<Button>("ConfirmButton");
        _backButton = GetNode<Button>("BackButton");
        _playersContainer = GetNode<VBoxContainer>("PlayersContainer");
        _titleLabel = GetNode<Label>("Title");
        
        _confirmButton.Pressed += OnConfirmPressed;
        _backButton.Pressed += OnBackPressed;
        
        UpdateTitle();
    }
    
    private void InitializePlayerSelections()
    {
        _playerSelections = new List<PlayerSelectionData>();
        
        for (int i = 0; i < MatchConfiguration.PlayerCount; i++)
        {
            var playerData = new PlayerSelectionData
            {
                PlayerId = $"player{i + 1}",
                PlayerNumber = i + 1,
                SelectedCharacter = "",
                Team = GetTeamAssignment(i)
            };
            _playerSelections.Add(playerData);
        }
        
        CreatePlayerLabels();
        UpdatePlayerLabels();
    }
    
    private int GetTeamAssignment(int playerIndex)
    {
        return MatchConfiguration.Mode switch
        {
            MatchMode.OneVOne => playerIndex == 0 ? 1 : 2,
            MatchMode.TwoVTwo => playerIndex < 2 ? 1 : 2,
            MatchMode.ThreeVThree => playerIndex < 3 ? 1 : 2,
            MatchMode.FourVFour => playerIndex < 4 ? 1 : 2,
            MatchMode.FreeForAll => playerIndex + 1, // Each player is their own team
            _ => 1
        };
    }
    
    private void CreatePlayerLabels()
    {
        // Clear existing labels
        foreach (Node child in _playersContainer.GetChildren())
        {
            child.QueueFree();
        }
        
        foreach (var player in _playerSelections)
        {
            var label = new Label();
            label.Name = $"Player{player.PlayerNumber}Label";
            label.AddThemeStyleboxOverride("normal", new StyleBoxFlat());
            _playersContainer.AddChild(label);
        }
    }
    
    private void UpdateTitle()
    {
        string modeText = MatchConfiguration.Mode switch
        {
            MatchMode.OneVOne => "1v1 Character Select",
            MatchMode.TwoVTwo => "2v2 Team Character Select",
            MatchMode.ThreeVThree => "3v3 Team Character Select", 
            MatchMode.FourVFour => "4v4 Team Character Select",
            MatchMode.FreeForAll => "Free For All Character Select",
            _ => "Character Select"
        };
        _titleLabel.Text = modeText;
    }
    
    private void LoadCharacters()
    {
        // Clear existing children
        foreach (Node child in _characterGrid.GetChildren())
        {
            child.QueueFree();
        }
        
        // Get all available fighters from DLC manager
        var allCharacters = DLCManager.Instance?.GetAvailableFighters()?.Select(f => f.FighterId).ToList() ?? 
                           new List<string> { "fighter1", "fighter2", "fighter3", "fighter4", "fighter5", "fighter6", "fighter7", "fighter8", "fighter9", "fighter10", "fighter11", "fighter12", "fighter13", "fighter14", "fighter15", "fighter16" };
        
        _availableCharacters = allCharacters.ToArray();
        
        foreach (var characterId in _availableCharacters)
        {
            CreateCharacterButton(characterId);
        }
        
        // Add placeholders for future characters
        var totalSlots = 16;
        var currentCount = _availableCharacters.Length;
        for (int i = currentCount; i < totalSlots; i++)
        {
            var placeholder = new Button();
            placeholder.Text = "???";
            placeholder.CustomMinimumSize = new Vector2(150, 150);
            placeholder.Disabled = true;
            _characterGrid.AddChild(placeholder);
        }
    }
    
    private void CreateCharacterButton(string characterId)
    {
        var button = new Button();
        button.CustomMinimumSize = new Vector2(150, 150);
        
        // Create a colored rectangle as portrait background
        var colorRect = new ColorRect();
        colorRect.Color = GetCharacterColor(characterId);
        colorRect.AnchorLeft = 0;
        colorRect.AnchorTop = 0;
        colorRect.AnchorRight = 1;
        colorRect.AnchorBottom = 1;
        colorRect.OffsetLeft = 5;
        colorRect.OffsetTop = 5;
        colorRect.OffsetRight = -5;
        colorRect.OffsetBottom = -5;
        button.AddChild(colorRect);
        
        // Add name label
        var nameLabel = new Label();
        nameLabel.Text = GetDisplayName(characterId);
        nameLabel.HorizontalAlignment = HorizontalAlignment.Center;
        nameLabel.VerticalAlignment = VerticalAlignment.Center;
        nameLabel.AnchorLeft = 0;
        nameLabel.AnchorRight = 1;
        nameLabel.AnchorTop = 0;
        nameLabel.AnchorBottom = 1;
        nameLabel.OffsetLeft = 0;
        nameLabel.OffsetRight = 0;
        nameLabel.OffsetTop = 0;
        nameLabel.OffsetBottom = 0;
        nameLabel.AddThemeColorOverride("font_color", Colors.White);
        nameLabel.AddThemeColorOverride("font_shadow_color", Colors.Black);
        nameLabel.AddThemeConstantOverride("shadow_offset_x", 1);
        nameLabel.AddThemeConstantOverride("shadow_offset_y", 1);
        nameLabel.AutowrapMode = TextServer.AutowrapMode.WordSmart;
        button.AddChild(nameLabel);
        
        // Check if character is already selected by another player
        bool isAlreadySelected = _playerSelections.Any(p => p.SelectedCharacter == characterId && _playerSelections.IndexOf(p) != _currentPlayerIndex);
        if (isAlreadySelected)
        {
            button.Disabled = true;
            button.Modulate = new Color(0.5f, 0.5f, 0.5f, 1.0f);
        }
        
        button.Pressed += () => OnCharacterSelected(characterId);
        _characterGrid.AddChild(button);
    }
    
    private Color GetCharacterColor(string characterId)
    {
        // Generate a unique color for each character based on hash
        var hash = characterId.GetHashCode();
        var random = new Random(hash);
        
        // Generate bright, distinguishable colors
        var hue = random.NextSingle();
        var saturation = 0.7f + (random.NextSingle() * 0.3f); // 0.7 - 1.0
        var value = 0.8f + (random.NextSingle() * 0.2f); // 0.8 - 1.0
        
        return Color.FromHsv(hue, saturation, value);
    }
    
    private string GetDisplayName(string characterId)
    {
        // Convert generic fighter IDs to display names
        if (characterId.StartsWith("fighter"))
        {
            var number = characterId.Replace("fighter", "");
            return $"Fighter {number}";
        }
        return characterId.Replace("_", " ").Capitalize();
    }
    
    private void OnCharacterSelected(string characterId)
    {
        // Validate character access for current player
        string playerId = _playerSelections[_currentPlayerIndex].PlayerId;
        bool canAccess = DLCManager.Instance?.CanPlayerAccessCharacter(characterId, playerId) ?? true;
        
        if (!canAccess)
        {
            ShowAccessDeniedDialog(characterId, playerId);
            return;
        }
        
        // Track analytics for character selection
        var isAvailable = DLCManager.Instance?.IsFighterAvailable(characterId) ?? true;
        
        if (isAvailable)
        {
            // Track fighter mastery engagement
            if (FighterMasterySystem.Instance != null)
            {
                FighterMasterySystem.Instance.TrackFighterEvent(playerId, characterId, "character_selected");
            }
            
            // Track cosmetic analytics for character selection
            if (CosmeticAnalytics.Instance != null)
            {
                var archetype = GetCharacterArchetype(characterId);
                CosmeticAnalytics.Instance.TrackBattlePassEngagement("character_selected", new() { ["character"] = characterId, ["archetype"] = archetype });
            }
        }
        
        // Set selection for current player
        _playerSelections[_currentPlayerIndex].SelectedCharacter = characterId;
        
        // Move to next player or finish
        _currentPlayerIndex++;
        if (_currentPlayerIndex >= _playerSelections.Count)
        {
            _currentPlayerIndex = _playerSelections.Count - 1; // Stay on last player
        }
        
        UpdatePlayerLabels();
        RefreshCharacterButtons();
        
        // If all players have selected, enable confirm
        if (_playerSelections.All(p => !string.IsNullOrEmpty(p.SelectedCharacter)))
        {
            _confirmButton.Disabled = false;
        }
    }
    
    private void RefreshCharacterButtons()
    {
        // Refresh character buttons to show availability
        LoadCharacters();
    }
    
    private string GetCharacterArchetype(string characterId)
    {
        // Simple archetype mapping - assign archetypes to generic fighters
        var archetypeMap = new Dictionary<string, string>
        {
            ["fighter1"] = "balanced",
            ["fighter2"] = "rushdown", 
            ["fighter3"] = "rushdown",
            ["fighter4"] = "grappler",
            ["fighter5"] = "charge",
            ["fighter6"] = "rushdown",
            ["fighter7"] = "balanced",
            ["fighter8"] = "setup",
            ["fighter9"] = "zoner",
            ["fighter10"] = "mixup",
            ["fighter11"] = "technical",
            ["fighter12"] = "powerhouse",
            ["fighter13"] = "defensive",
            ["fighter14"] = "aggressive",
            ["fighter15"] = "versatile",
            ["fighter16"] = "specialist"
        };
        
        return archetypeMap.GetValueOrDefault(characterId, "unknown");
    }
    
    private void ShowAccessDeniedDialog(string characterId, string playerId)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Character Access";
        
        var isOwned = DLCManager.Instance?.IsCharacterOwned(characterId) ?? true;
        
        if (!isOwned)
        {
            dialog.DialogText = $"You don't have access to {characterId.Capitalize()}.\n\n" +
                              $"Purchase this character to unlock it.";
        }
        else
        {
            dialog.DialogText = $"Character access error for {characterId.Capitalize()}.";
        }
        
        GetTree().Root.AddChild(dialog);
        dialog.PopupCentered();
    }
    
    private void UpdatePlayerLabels()
    {
        for (int i = 0; i < _playerSelections.Count; i++)
        {
            var player = _playerSelections[i];
            var label = _playersContainer.GetNode<Label>($"Player{player.PlayerNumber}Label");
            
            string teamText = MatchConfiguration.Mode == MatchMode.FreeForAll ? "" : $" (Team {player.Team})";
            string selectionText = string.IsNullOrEmpty(player.SelectedCharacter) ? "Select Character" : GetDisplayName(player.SelectedCharacter);
            
            label.Text = $"Player {player.PlayerNumber}{teamText}: {selectionText}";
            
            // Highlight current player
            if (i == _currentPlayerIndex)
            {
                label.AddThemeColorOverride("font_color", Colors.Yellow);
            }
            else if (!string.IsNullOrEmpty(player.SelectedCharacter))
            {
                label.AddThemeColorOverride("font_color", Colors.Green);
            }
            else
            {
                label.AddThemeColorOverride("font_color", Colors.White);
            }
        }
    }
    
    private void OnConfirmPressed()
    {
        // Store selections for the gameplay scene
        GD.Print("Starting match with selections:");
        foreach (var player in _playerSelections)
        {
            GD.Print($"  {player.PlayerId} (Team {player.Team}): {player.SelectedCharacter}");
        }
        
        GameManager.Instance?.ChangeState(GameState.Gameplay);
    }
    
    private void OnBackPressed()
    {
        GameManager.Instance?.ChangeState(GameState.MatchSetup);
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("ui_cancel"))
        {
            OnBackPressed();
        }
    }
}

public class PlayerSelectionData
{
    public string PlayerId { get; set; }
    public int PlayerNumber { get; set; }
    public string SelectedCharacter { get; set; }
    public int Team { get; set; }
}