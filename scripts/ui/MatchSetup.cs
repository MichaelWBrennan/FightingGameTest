using Godot;

/// <summary>
/// Match setup screen for configuring player count and match types
/// </summary>
public partial class MatchSetup : Control
{
    // UI Elements
    private Button _twoPlayerButton;
    private Button _threePlayerButton;
    private Button _fourPlayerButton;
    
    private Button _oneVOneButton;
    private Button _twoVTwoButton;
    private Button _twoVOneButton;
    private Button _threeVOneButton;
    private Button _freeForAllButton;
    
    private Button _proceedButton;
    private Button _backButton;
    private Label _statusLabel;
    
    // State
    private int _playerCount = 0;
    private MatchMode _matchMode = MatchMode.None;
    
    public override void _Ready()
    {
        SetupUI();
    }
    
    private void SetupUI()
    {
        // Get player count buttons
        _twoPlayerButton = GetNode<Button>("PlayerCountSection/PlayerCountButtons/TwoPlayerButton");
        _threePlayerButton = GetNode<Button>("PlayerCountSection/PlayerCountButtons/ThreePlayerButton");
        _fourPlayerButton = GetNode<Button>("PlayerCountSection/PlayerCountButtons/FourPlayerButton");
        
        // Get match mode buttons
        _oneVOneButton = GetNode<Button>("MatchModeSection/MatchModeButtons/OneVOneButton");
        _twoVTwoButton = GetNode<Button>("MatchModeSection/MatchModeButtons/TwoVTwoButton");
        _twoVOneButton = GetNode<Button>("MatchModeSection/MatchModeButtons/TwoVOneButton");
        _threeVOneButton = GetNode<Button>("MatchModeSection/MatchModeButtons/ThreeVOneButton");
        _freeForAllButton = GetNode<Button>("MatchModeSection/MatchModeButtons/FreeForAllButton");
        
        // Get control buttons
        _proceedButton = GetNode<Button>("ProceedButton");
        _backButton = GetNode<Button>("BackButton");
        _statusLabel = GetNode<Label>("StatusLabel");
        
        // Connect player count buttons
        _twoPlayerButton.Pressed += () => OnPlayerCountSelected(2);
        _threePlayerButton.Pressed += () => OnPlayerCountSelected(3);
        _fourPlayerButton.Pressed += () => OnPlayerCountSelected(4);
        
        // Connect match mode buttons
        _oneVOneButton.Pressed += () => OnMatchModeSelected(MatchMode.OneVOne);
        _twoVTwoButton.Pressed += () => OnMatchModeSelected(MatchMode.TwoVTwo);
        _twoVOneButton.Pressed += () => OnMatchModeSelected(MatchMode.TwoVOne);
        _threeVOneButton.Pressed += () => OnMatchModeSelected(MatchMode.ThreeVOne);
        _freeForAllButton.Pressed += () => OnMatchModeSelected(MatchMode.FreeForAll);
        
        // Connect control buttons
        _proceedButton.Pressed += OnProceedPressed;
        _backButton.Pressed += OnBackPressed;
        
        UpdateUI();
    }
    
    private void OnPlayerCountSelected(int playerCount)
    {
        _playerCount = playerCount;
        UpdateMatchModeAvailability();
        UpdateUI();
    }
    
    private void OnMatchModeSelected(MatchMode matchMode)
    {
        _matchMode = matchMode;
        UpdateUI();
    }
    
    private void UpdateMatchModeAvailability()
    {
        // Enable/disable match modes based on player count
        _oneVOneButton.Disabled = _playerCount != 2;
        _twoVTwoButton.Disabled = _playerCount != 4;
        _twoVOneButton.Disabled = _playerCount != 3; // 2v1 needs 3 players
        _threeVOneButton.Disabled = _playerCount != 4; // 3v1 needs 4 players
        _freeForAllButton.Disabled = _playerCount < 3;
        
        // Reset match mode if it becomes invalid
        if ((_matchMode == MatchMode.OneVOne && _playerCount != 2) ||
            (_matchMode == MatchMode.TwoVTwo && _playerCount != 4) ||
            (_matchMode == MatchMode.TwoVOne && _playerCount != 3) ||
            (_matchMode == MatchMode.ThreeVOne && _playerCount != 4) ||
            (_matchMode == MatchMode.FreeForAll && _playerCount < 3))
        {
            _matchMode = MatchMode.None;
        }
    }
    
    private void UpdateUI()
    {
        // Update player count button states
        _twoPlayerButton.ButtonPressed = _playerCount == 2;
        _threePlayerButton.ButtonPressed = _playerCount == 3;
        _fourPlayerButton.ButtonPressed = _playerCount == 4;
        
        // Update match mode button states
        _oneVOneButton.ButtonPressed = _matchMode == MatchMode.OneVOne;
        _twoVTwoButton.ButtonPressed = _matchMode == MatchMode.TwoVTwo;
        _twoVOneButton.ButtonPressed = _matchMode == MatchMode.TwoVOne;
        _threeVOneButton.ButtonPressed = _matchMode == MatchMode.ThreeVOne;
        _freeForAllButton.ButtonPressed = _matchMode == MatchMode.FreeForAll;
        
        // Update status and proceed button
        bool canProceed = _playerCount > 0 && _matchMode != MatchMode.None;
        _proceedButton.Disabled = !canProceed;
        
        if (!canProceed)
        {
            if (_playerCount == 0)
                _statusLabel.Text = "Select number of players";
            else
                _statusLabel.Text = "Select match type";
        }
        else
        {
            string modeText = _matchMode switch
            {
                MatchMode.OneVOne => "1v1",
                MatchMode.TwoVTwo => "2v2 Team Battle",
                MatchMode.TwoVOne => "2v1 Asymmetric",
                MatchMode.ThreeVOne => "3v1 Asymmetric",
                MatchMode.FreeForAll => "Free For All",
                _ => "Unknown"
            };
            _statusLabel.Text = $"Ready: {_playerCount} players, {modeText}";
        }
    }
    
    private void OnProceedPressed()
    {
        // Store match configuration for character select
        MatchConfiguration.PlayerCount = _playerCount;
        MatchConfiguration.Mode = _matchMode;
        
        GD.Print($"Match Setup: {_playerCount} players, {_matchMode}");
        GameManager.Instance?.ChangeState(GameState.CharacterSelect);
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

public enum MatchMode
{
    None,
    OneVOne,
    TwoVTwo,
    TwoVOne,
    ThreeVOne,
    FreeForAll
}

/// <summary>
/// Static class to store match configuration between scenes
/// </summary>
public static class MatchConfiguration
{
    public static int PlayerCount { get; set; } = 2;
    public static MatchMode Mode { get; set; } = MatchMode.OneVOne;
}