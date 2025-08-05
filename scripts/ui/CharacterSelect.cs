using Godot;

/// <summary>
/// Character selection screen
/// </summary>
public partial class CharacterSelect : Control
{
    private GridContainer _characterGrid;
    private Button _confirmButton;
    private Button _backButton;
    private Label _player1SelectLabel;
    private Label _player2SelectLabel;
    
    private string _player1Selection = "";
    private string _player2Selection = "";
    private int _currentPlayer = 1;
    
    public override void _Ready()
    {
        SetupUI();
        LoadCharacters();
        
        // Connect to rotation updates
        if (WeeklyRotationManager.Instance != null)
        {
            WeeklyRotationManager.Instance.RotationUpdated += OnRotationUpdated;
        }
    }
    
    private void OnRotationUpdated()
    {
        LoadCharacters(); // Refresh character list when rotation updates
    }
    
    private void SetupUI()
    {
        _characterGrid = GetNode<GridContainer>("CharacterGrid");
        _confirmButton = GetNode<Button>("ConfirmButton");
        _backButton = GetNode<Button>("BackButton");
        _player1SelectLabel = GetNode<Label>("Player1Select");
        _player2SelectLabel = GetNode<Label>("Player2Select");
        
        _confirmButton.Pressed += OnConfirmPressed;
        _backButton.Pressed += OnBackPressed;
        
        UpdatePlayerLabels();
    }
    
    private void LoadCharacters()
    {
        // Clear existing children
        foreach (Node child in _characterGrid.GetChildren())
        {
            child.QueueFree();
        }
        
        // Get all available characters from rotation manager
        var allCharacters = WeeklyRotationManager.Instance?.GetAllCharacterIds() ?? new List<string> { "ryu" };
        
        foreach (var characterId in allCharacters)
        {
            CreateCharacterButton(characterId);
        }
        
        // Add placeholders for future characters
        var totalSlots = 8;
        var currentCount = allCharacters.Count;
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
        
        // Create vertical layout for character info
        var vbox = new VBoxContainer();
        var nameLabel = new Label();
        var statusLabel = new Label();
        
        nameLabel.Text = characterId.Capitalize();
        nameLabel.HorizontalAlignment = HorizontalAlignment.Center;
        
        // Check access status
        var isOwned = DLCManager.Instance?.IsCharacterOwned(characterId) ?? false;
        var weeklyFighterP1 = DLCManager.Instance?.GetWeeklyFreeFighter("player1") ?? "";
        var weeklyFighterP2 = DLCManager.Instance?.GetWeeklyFreeFighter("player2") ?? "";
        
        string statusText = "";
        Color statusColor = Colors.White;
        
        if (isOwned)
        {
            statusText = "OWNED";
            statusColor = Colors.Green;
        }
        else if (weeklyFighterP1 == characterId)
        {
            statusText = "FREE (P1)";
            statusColor = Colors.Cyan;
        }
        else if (weeklyFighterP2 == characterId)
        {
            statusText = "FREE (P2)";
            statusColor = Colors.Cyan;
        }
        else
        {
            statusText = "LOCKED";
            statusColor = Colors.Red;
            button.Disabled = true;
        }
        
        statusLabel.Text = statusText;
        statusLabel.HorizontalAlignment = HorizontalAlignment.Center;
        statusLabel.AddThemeColorOverride("font_color", statusColor);
        
        vbox.AddChild(nameLabel);
        vbox.AddChild(statusLabel);
        button.AddChild(vbox);
        
        button.Pressed += () => OnCharacterSelected(characterId);
        _characterGrid.AddChild(button);
    }
    
    private void OnCharacterSelected(string characterId)
    {
        // Validate character access for current player
        string playerId = _currentPlayer == 1 ? "player1" : "player2";
        bool canAccess = DLCManager.Instance?.CanPlayerAccessCharacter(characterId, playerId) ?? false;
        
        if (!canAccess)
        {
            ShowAccessDeniedDialog(characterId, playerId);
            return;
        }
        
        // Track analytics for character selection
        var weeklyFighter = DLCManager.Instance?.GetWeeklyFreeFighter(playerId) ?? "";
        var isWeeklySelection = weeklyFighter == characterId;
        
        if (isWeeklySelection)
        {
            RotationAnalytics.Instance?.TrackWeeklyFighterAccess(playerId, characterId);
            
            // Track archetype engagement
            var archetype = GetCharacterArchetype(characterId);
            var engagementData = new Dictionary<string, object>
            {
                ["archetype"] = archetype,
                ["character"] = characterId
            };
            RotationAnalytics.Instance?.TrackEngagement(playerId, "weekly_character_selected", engagementData);
        }
        
        if (_currentPlayer == 1)
        {
            _player1Selection = characterId;
            _currentPlayer = 2;
        }
        else
        {
            _player2Selection = characterId;
        }
        
        UpdatePlayerLabels();
        
        // If both players have selected, enable confirm
        if (!string.IsNullOrEmpty(_player1Selection) && !string.IsNullOrEmpty(_player2Selection))
        {
            _confirmButton.Disabled = false;
        }
    }
    
    private string GetCharacterArchetype(string characterId)
    {
        // Simple archetype mapping - in a real implementation this would come from character data
        var archetypeMap = new Dictionary<string, string>
        {
            ["ryu"] = "shoto",
            ["chun_li"] = "rushdown", 
            ["ken"] = "rushdown",
            ["zangief"] = "grappler"
        };
        
        return archetypeMap.GetValueOrDefault(characterId, "unknown");
    }
    
    private void ShowAccessDeniedDialog(string characterId, string playerId)
    {
        var dialog = new AcceptDialog();
        dialog.Title = "Character Access";
        
        var isOwned = DLCManager.Instance?.IsCharacterOwned(characterId) ?? false;
        var weeklyFighter = DLCManager.Instance?.GetWeeklyFreeFighter(playerId) ?? "";
        
        if (!isOwned && weeklyFighter != characterId)
        {
            dialog.DialogText = $"You don't have access to {characterId.Capitalize()}.\n\n" +
                              $"Purchase this character or wait for it to appear in your weekly rotation.\n" +
                              $"Your current free fighter: {(weeklyFighter.Length > 0 ? weeklyFighter.Capitalize() : "None")}";
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
        _player1SelectLabel.Text = $"Player 1: {(_player1Selection.Length > 0 ? _player1Selection : "Select Character")}";
        _player2SelectLabel.Text = $"Player 2: {(_player2Selection.Length > 0 ? _player2Selection : "Select Character")}";
        
        if (_currentPlayer == 1)
        {
            _player1SelectLabel.AddThemeColorOverride("font_color", Colors.Yellow);
            _player2SelectLabel.AddThemeColorOverride("font_color", Colors.White);
        }
        else
        {
            _player1SelectLabel.AddThemeColorOverride("font_color", Colors.White);
            _player2SelectLabel.AddThemeColorOverride("font_color", Colors.Yellow);
        }
    }
    
    private void OnConfirmPressed()
    {
        // Store selections for the gameplay scene
        // This would be better handled through a proper data manager
        GD.Print($"Starting match: {_player1Selection} vs {_player2Selection}");
        GameManager.Instance?.ChangeState(GameState.Gameplay);
    }
    
    private void OnBackPressed()
    {
        GameManager.Instance?.ChangeState(GameState.MainMenu);
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("ui_cancel"))
        {
            OnBackPressed();
        }
    }
}