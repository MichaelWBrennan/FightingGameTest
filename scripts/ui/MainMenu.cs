using Godot;

/// <summary>
/// Main menu controller
/// </summary>
public partial class MainMenu : Control
{
    private VBoxContainer _menuContainer;
    private Button _startGameButton;
    private Button _trainingButton;
    private Button _optionsButton;
    private Button _exitButton;
    
    public override void _Ready()
    {
        SetupUI();
        ConnectSignals();
        
        // Set initial focus
        _startGameButton?.GrabFocus();
    }
    
    private void SetupUI()
    {
        _menuContainer = GetNode<VBoxContainer>("MenuContainer");
        _startGameButton = GetNode<Button>("MenuContainer/StartGameButton");
        _trainingButton = GetNode<Button>("MenuContainer/TrainingButton");
        _optionsButton = GetNode<Button>("MenuContainer/OptionsButton");
        _exitButton = GetNode<Button>("MenuContainer/ExitButton");
    }
    
    private void ConnectSignals()
    {
        _startGameButton.Pressed += OnStartGamePressed;
        _trainingButton.Pressed += OnTrainingPressed;
        _optionsButton.Pressed += OnOptionsPressed;
        _exitButton.Pressed += OnExitPressed;
    }
    
    private void OnStartGamePressed()
    {
        GD.Print("Start Game pressed");
        GameManager.Instance?.ChangeState(GameState.CharacterSelect);
    }
    
    private void OnTrainingPressed()
    {
        GD.Print("Training pressed");
        GameManager.Instance?.ChangeState(GameState.Training);
    }
    
    private void OnOptionsPressed()
    {
        GD.Print("Options pressed");
        GameManager.Instance?.ChangeState(GameState.Options);
    }
    
    private void OnExitPressed()
    {
        GD.Print("Exit pressed");
        GetTree().Quit();
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("ui_cancel"))
        {
            GetTree().Quit();
        }
    }
}