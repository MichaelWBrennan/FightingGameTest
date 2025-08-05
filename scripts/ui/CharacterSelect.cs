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
        // For now, just create a button for Ryu
        var ryuButton = new Button();
        ryuButton.Text = "Ryu";
        ryuButton.CustomMinimumSize = new Vector2(150, 150);
        ryuButton.Pressed += () => OnCharacterSelected("ryu");
        _characterGrid.AddChild(ryuButton);
        
        // Placeholder for more characters
        for (int i = 0; i < 7; i++)
        {
            var placeholder = new Button();
            placeholder.Text = "???";
            placeholder.CustomMinimumSize = new Vector2(150, 150);
            placeholder.Disabled = true;
            _characterGrid.AddChild(placeholder);
        }
    }
    
    private void OnCharacterSelected(string characterId)
    {
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