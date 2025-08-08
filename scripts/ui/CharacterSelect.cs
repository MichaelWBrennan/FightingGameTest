using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Street Fighter 2 style character selection screen
/// </summary>
public partial class CharacterSelect : Control
{
    private GridContainer _characterGrid;
    private Button _confirmButton;
    private Button _backButton;
    private Label _titleLabel;
    private ColorRect _selectionCursor;
    
    // Player selection display elements
    private TextureRect _player1Portrait;
    private TextureRect _player2Portrait;
    private Label _player1Name;
    private Label _player2Name;
    private Label _vsLabel;
    
    // Selection state
    private int _currentPlayer = 1; // 1 or 2
    private int _cursorX = 0;
    private int _cursorY = 0;
    private string _player1Selection = "";
    private string _player2Selection = "";
    
    // Street Fighter 2 roster - 6 characters in 2x3 grid
    private readonly SF2Character[] _sf2Roster = new SF2Character[]
    {
        new("ryu", "RYU", "Japan"),
        new("ken", "KEN", "USA"),
        new("chun_li", "CHUN-LI", "China"),
        new("zangief", "ZANGIEF", "USSR"),
        new("sagat", "SAGAT", "Thailand"),
        new("lei_wulong", "LEI WULONG", "Hong Kong")
    };
    
    public override void _Ready()
    {
        SetupUI();
        LoadCharacterPortraits();
        UpdateCursorPosition();
    }
    
    private void SetupUI()
    {
        _characterGrid = GetNode<GridContainer>("CharacterGrid");
        _confirmButton = GetNode<Button>("ConfirmButton");
        _backButton = GetNode<Button>("BackButton");
        _titleLabel = GetNode<Label>("Title");
        _selectionCursor = GetNode<ColorRect>("SelectionCursor");
        
        _player1Portrait = GetNode<TextureRect>("Player1Selection/Player1Portrait");
        _player2Portrait = GetNode<TextureRect>("Player2Selection/Player2Portrait");
        _player1Name = GetNode<Label>("Player1Selection/Player1Name");
        _player2Name = GetNode<Label>("Player2Selection/Player2Name");
        _vsLabel = GetNode<Label>("VSLabel");
        
        _confirmButton.Pressed += OnConfirmPressed;
        _backButton.Pressed += OnBackPressed;
        
        // Initially hide VS label until both players select
        _vsLabel.Visible = false;
    }
    
    private void LoadCharacterPortraits()
    {
        // Clear existing children
        foreach (Node child in _characterGrid.GetChildren())
        {
            child.QueueFree();
        }
        
        foreach (var character in _sf2Roster)
        {
            CreateCharacterPortrait(character);
        }
    }
    
    private void CreateCharacterPortrait(SF2Character character)
    {
        var container = new VBoxContainer();
        container.CustomMinimumSize = new Vector2(200, 180);
        
        // Load character sprite as portrait
        var portrait = new TextureRect();
        portrait.CustomMinimumSize = new Vector2(200, 150);
        portrait.ExpandMode = TextureRect.ExpandModeEnum.FitWidthProportional;
        portrait.StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered;
        
        // Try to load the character's idle sprite
        string spritePath = $"res://assets/sprites/street_fighter_6/{character.Id}/sprites/{character.Id}_idle.png";
        var texture = GD.Load<Texture2D>(spritePath);
        if (texture != null)
        {
            portrait.Texture = texture;
        }
        else
        {
            GD.PrintErr($"Could not load sprite: {spritePath}");
            // Create a colored placeholder
            var colorRect = new ColorRect();
            colorRect.CustomMinimumSize = new Vector2(200, 150);
            colorRect.Color = GetCharacterColor(character.Id);
            container.AddChild(colorRect);
        }
        
        container.AddChild(portrait);
        
        // Add character name
        var nameLabel = new Label();
        nameLabel.Text = character.Name;
        nameLabel.HorizontalAlignment = HorizontalAlignment.Center;
        nameLabel.AddThemeColorOverride("font_color", Colors.White);
        nameLabel.AddThemeColorOverride("font_shadow_color", Colors.Black);
        nameLabel.AddThemeConstantOverride("shadow_offset_x", 1);
        nameLabel.AddThemeConstantOverride("shadow_offset_y", 1);
        nameLabel.AddThemeFontSizeOverride("font_size", 16);
        container.AddChild(nameLabel);
        
        _characterGrid.AddChild(container);
    }
    
    private void UpdateCursorPosition()
    {
        if (_characterGrid.GetChildCount() == 0) return;
        
        // Calculate cursor position based on grid
        int gridColumns = 3;
        int index = _cursorY * gridColumns + _cursorX;
        
        if (index >= _characterGrid.GetChildCount())
        {
            index = _characterGrid.GetChildCount() - 1;
            _cursorY = index / gridColumns;
            _cursorX = index % gridColumns;
        }
        
        var selectedChild = _characterGrid.GetChild(index) as Control;
        if (selectedChild != null)
        {
            var globalRect = selectedChild.GetGlobalRect();
            _selectionCursor.Position = globalRect.Position - new Vector2(5, 5);
            _selectionCursor.Size = globalRect.Size + new Vector2(10, 10);
            _selectionCursor.Visible = true;
        }
    }
    
    private SF2Character GetSelectedCharacter()
    {
        int gridColumns = 3;
        int index = _cursorY * gridColumns + _cursorX;
        
        if (index >= 0 && index < _sf2Roster.Length)
        {
            return _sf2Roster[index];
        }
        
        return _sf2Roster[0]; // Default to Ryu
    }
    
    private void SelectCharacter()
    {
        var selectedCharacter = GetSelectedCharacter();
        
        if (_currentPlayer == 1)
        {
            _player1Selection = selectedCharacter.Id;
            UpdatePlayerDisplay(1, selectedCharacter);
            _currentPlayer = 2; // Switch to player 2
        }
        else if (_currentPlayer == 2)
        {
            _player2Selection = selectedCharacter.Id;
            UpdatePlayerDisplay(2, selectedCharacter);
        }
        
        // Check if both players have selected
        if (!string.IsNullOrEmpty(_player1Selection) && !string.IsNullOrEmpty(_player2Selection))
        {
            _confirmButton.Disabled = false;
            _vsLabel.Visible = true;
        }
    }
    
    private void UpdatePlayerDisplay(int player, SF2Character character)
    {
        TextureRect portrait = player == 1 ? _player1Portrait : _player2Portrait;
        Label nameLabel = player == 1 ? _player1Name : _player2Name;
        
        // Load character portrait
        string spritePath = $"res://assets/sprites/street_fighter_6/{character.Id}/sprites/{character.Id}_idle.png";
        var texture = GD.Load<Texture2D>(spritePath);
        if (texture != null)
        {
            portrait.Texture = texture;
            portrait.ExpandMode = TextureRect.ExpandModeEnum.FitWidthProportional;
            portrait.StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered;
        }
        
        nameLabel.Text = character.Name;
    }
    
    private Color GetCharacterColor(string characterId)
    {
        return characterId switch
        {
            "ryu" => Colors.White,
            "ken" => Colors.Yellow,
            "chun_li" => Colors.Blue,
            "zangief" => Colors.Red,
            "sagat" => Colors.Orange,
            "lei_wulong" => Colors.Purple,
            _ => Colors.Gray
        };
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("ui_left"))
        {
            _cursorX = Math.Max(0, _cursorX - 1);
            UpdateCursorPosition();
        }
        else if (@event.IsActionPressed("ui_right"))
        {
            _cursorX = Math.Min(2, _cursorX + 1); // 3 columns max
            UpdateCursorPosition();
        }
        else if (@event.IsActionPressed("ui_up"))
        {
            _cursorY = Math.Max(0, _cursorY - 1);
            UpdateCursorPosition();
        }
        else if (@event.IsActionPressed("ui_down"))
        {
            _cursorY = Math.Min(1, _cursorY + 1); // 2 rows max
            UpdateCursorPosition();
        }
        else if (@event.IsActionPressed("ui_accept"))
        {
            SelectCharacter();
        }
        else if (@event.IsActionPressed("ui_cancel"))
        {
            if (_currentPlayer == 2 && !string.IsNullOrEmpty(_player1Selection))
            {
                // Allow going back to player 1 selection
                _currentPlayer = 1;
                _player1Selection = "";
                _player1Portrait.Texture = null;
                _player1Name.Text = "";
                _confirmButton.Disabled = true;
                _vsLabel.Visible = false;
            }
            else
            {
                OnBackPressed();
            }
        }
    }
    
    private void OnConfirmPressed()
    {
        if (string.IsNullOrEmpty(_player1Selection) || string.IsNullOrEmpty(_player2Selection))
            return;
            
        GD.Print($"Fight! Player 1: {_player1Selection} vs Player 2: {_player2Selection}");
        
        // Store selections for gameplay
        // This would integrate with the existing game state management
        GameManager.Instance?.ChangeState(GameState.Gameplay);
    }
    
    private void OnBackPressed()
    {
        GameManager.Instance?.ChangeState(GameState.MatchSetup);
    }
}

/// <summary>
/// Represents a Street Fighter 2 character
/// </summary>
public class SF2Character
{
    public string Id { get; }
    public string Name { get; }
    public string Country { get; }
    
    public SF2Character(string id, string name, string country)
    {
        Id = id;
        Name = name;
        Country = country;
    }
}