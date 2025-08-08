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
            MatchMode.TwoVOne => playerIndex < 2 ? 1 : 2, // First 2 players on team 1, last player on team 2
            MatchMode.ThreeVOne => playerIndex < 3 ? 1 : 2, // First 3 players on team 1, last player on team 2
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
            MatchMode.TwoVOne => "2v1 Asymmetric Character Select",
            MatchMode.ThreeVOne => "3v1 Asymmetric Character Select",
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
        
        // Define archetype-based roster with 3 variations each
        var archetypeRoster = GetArchetypeRoster();
        _availableCharacters = archetypeRoster.Select(f => f.FighterId).ToArray();
        
        foreach (var fighter in archetypeRoster)
        {
            CreateCharacterButton(fighter);
        }
    }
    
    private List<ArchetypeFighter> GetArchetypeRoster()
    {
        return new List<ArchetypeFighter>
        {
            // Balanced Archetype - All-rounders
            new("balanced_a", "Balanced", "Standard", "All-around fighter with no weaknesses", Colors.Blue),
            new("balanced_b", "Balanced", "Hybrid", "Adaptable with shifting fighting styles", Colors.CornflowerBlue),
            new("balanced_c", "Balanced", "Versatile", "Master of fundamentals", Colors.DodgerBlue),
            
            // Rushdown Archetype - Fast and aggressive
            new("rushdown_a", "Rushdown", "Pressure", "Relentless offense and mixups", Colors.Red),
            new("rushdown_b", "Rushdown", "Blitz", "Lightning-fast combo chains", Colors.Crimson),
            new("rushdown_c", "Rushdown", "Berserker", "All-out aggressive assault", Colors.OrangeRed),
            
            // Grappler Archetype - Command throws and power
            new("grappler_a", "Grappler", "Wrestler", "Classic command throw specialist", Colors.Green),
            new("grappler_b", "Grappler", "Bruiser", "Heavy hits with reach", Colors.DarkGreen),
            new("grappler_c", "Grappler", "Colossus", "Unstoppable powerhouse", Colors.ForestGreen),
            
            // Zoner Archetype - Projectiles and keep-away
            new("zoner_a", "Zoner", "Sniper", "Precise long-range attacks", Colors.Purple),
            new("zoner_b", "Zoner", "Trapper", "Area control specialist", Colors.MediumPurple),
            new("zoner_c", "Zoner", "Artillery", "Maximum screen control", Colors.DarkViolet),
            
            // Technical Archetype - Complex combos and execution
            new("technical_a", "Technical", "Combo", "Intricate combo sequences", Colors.Orange),
            new("technical_b", "Technical", "Setup", "Advanced combo setups", Colors.DarkOrange),
            new("technical_c", "Technical", "Master", "Ultimate execution challenge", Colors.Gold)
        };
    }
    
    private void CreateCharacterButton(ArchetypeFighter fighter)
    {
        var button = new Button();
        button.CustomMinimumSize = new Vector2(150, 150);
        
        // Create a colored rectangle as portrait background
        var colorRect = new ColorRect();
        colorRect.Color = fighter.Color;
        colorRect.AnchorLeft = 0;
        colorRect.AnchorTop = 0;
        colorRect.AnchorRight = 1;
        colorRect.AnchorBottom = 1;
        colorRect.OffsetLeft = 5;
        colorRect.OffsetTop = 5;
        colorRect.OffsetRight = -5;
        colorRect.OffsetBottom = -5;
        button.AddChild(colorRect);
        
        // Add archetype label (top)
        var archetypeLabel = new Label();
        archetypeLabel.Text = fighter.Archetype;
        archetypeLabel.HorizontalAlignment = HorizontalAlignment.Center;
        archetypeLabel.AnchorLeft = 0;
        archetypeLabel.AnchorRight = 1;
        archetypeLabel.AnchorTop = 0;
        archetypeLabel.AnchorBottom = 0;
        archetypeLabel.OffsetLeft = 0;
        archetypeLabel.OffsetRight = 0;
        archetypeLabel.OffsetTop = 10;
        archetypeLabel.OffsetBottom = 25;
        archetypeLabel.AddThemeColorOverride("font_color", Colors.White);
        archetypeLabel.AddThemeColorOverride("font_shadow_color", Colors.Black);
        archetypeLabel.AddThemeConstantOverride("shadow_offset_x", 1);
        archetypeLabel.AddThemeConstantOverride("shadow_offset_y", 1);
        button.AddChild(archetypeLabel);
        
        // Add variation label (center)
        var variationLabel = new Label();
        variationLabel.Text = fighter.Variation;
        variationLabel.HorizontalAlignment = HorizontalAlignment.Center;
        variationLabel.VerticalAlignment = VerticalAlignment.Center;
        variationLabel.AnchorLeft = 0;
        variationLabel.AnchorRight = 1;
        variationLabel.AnchorTop = 0;
        variationLabel.AnchorBottom = 1;
        variationLabel.OffsetLeft = 0;
        variationLabel.OffsetRight = 0;
        variationLabel.OffsetTop = 0;
        variationLabel.OffsetBottom = 0;
        variationLabel.AddThemeColorOverride("font_color", Colors.White);
        variationLabel.AddThemeColorOverride("font_shadow_color", Colors.Black);
        variationLabel.AddThemeConstantOverride("shadow_offset_x", 1);
        variationLabel.AddThemeConstantOverride("shadow_offset_y", 1);
        button.AddChild(variationLabel);
        
        // Check if character is already selected by another player
        bool isAlreadySelected = _playerSelections.Any(p => p.SelectedCharacter == fighter.FighterId && _playerSelections.IndexOf(p) != _currentPlayerIndex);
        if (isAlreadySelected)
        {
            button.Disabled = true;
            button.Modulate = new Color(0.5f, 0.5f, 0.5f, 1.0f);
        }
        
        button.Pressed += () => OnCharacterSelected(fighter.FighterId);
        _characterGrid.AddChild(button);
    }
    
    private Color GetCharacterColor(string characterId)
    {
        // Get color from archetype roster
        var archetypeRoster = GetArchetypeRoster();
        var fighter = archetypeRoster.FirstOrDefault(f => f.FighterId == characterId);
        return fighter?.Color ?? Colors.White;
    }
    
    private string GetDisplayName(string characterId)
    {
        // Get display name from archetype roster
        var archetypeRoster = GetArchetypeRoster();
        var fighter = archetypeRoster.FirstOrDefault(f => f.FighterId == characterId);
        if (fighter != null)
        {
            return $"{fighter.Archetype}\n{fighter.Variation}";
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
        // Extract archetype from fighter ID
        if (characterId.Contains("_"))
        {
            return characterId.Split('_')[0];
        }
        return "unknown";
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

/// <summary>
/// Represents a fighter with archetype classification and variation
/// </summary>
public class ArchetypeFighter
{
    public string FighterId { get; }
    public string Archetype { get; }
    public string Variation { get; }
    public string Description { get; }
    public Color Color { get; }
    
    public ArchetypeFighter(string fighterId, string archetype, string variation, string description, Color color)
    {
        FighterId = fighterId;
        Archetype = archetype;
        Variation = variation;
        Description = description;
        Color = color;
    }
}