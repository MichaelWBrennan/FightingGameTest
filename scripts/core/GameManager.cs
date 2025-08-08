using Godot;

/// <summary>
/// Main game manager that handles core game flow and state management
/// </summary>
public partial class GameManager : Node
{
    public static GameManager Instance { get; private set; }
    
    [Signal]
    public delegate void GameStateChangedEventHandler();
    
    private GameState _currentState = GameState.MainMenu;
    
    public GameState CurrentState 
    { 
        get => _currentState;
        private set
        {
            if (_currentState != value)
            {
                var oldState = _currentState;
                _currentState = value;
                OnGameStateChanged(oldState, value);
                EmitSignal(SignalName.GameStateChanged, (int)value);
            }
        }
    }
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("GameManager initialized");
    }
    
    public void ChangeState(GameState newState)
    {
        CurrentState = newState;
    }
    
    private void OnGameStateChanged(GameState oldState, GameState newState)
    {
        GD.Print($"Game state changed from {oldState} to {newState}");
        
        switch (newState)
        {
            case GameState.MainMenu:
                HandleMainMenuState();
                break;
            case GameState.MatchSetup:
                HandleMatchSetupState();
                break;
            case GameState.CharacterSelect:
                HandleCharacterSelectState();
                break;
            case GameState.Gameplay:
                HandleGameplayState();
                break;
            case GameState.Training:
                HandleTrainingState();
                break;
            case GameState.Options:
                HandleOptionsState();
                break;
        }
    }
    
    private void HandleMainMenuState()
    {
        GetTree().ChangeSceneToFile("res://scenes/main_menu/MainMenu.tscn");
    }
    
    private void HandleMatchSetupState()
    {
        GetTree().ChangeSceneToFile("res://scenes/match_setup/MatchSetup.tscn");
    }
    
    private void HandleCharacterSelectState()
    {
        GetTree().ChangeSceneToFile("res://scenes/character_select/CharacterSelect.tscn");
    }
    
    private void HandleGameplayState()
    {
        GetTree().ChangeSceneToFile("res://scenes/gameplay/GameplayScene.tscn");
    }
    
    private void HandleTrainingState()
    {
        GetTree().ChangeSceneToFile("res://scenes/training/TrainingScene.tscn");
    }
    
    private void HandleOptionsState()
    {
        // Options can be a popup overlay, handle accordingly
        GD.Print("Options state - implement overlay");
    }
}

public enum GameState
{
    MainMenu,
    MatchSetup,
    CharacterSelect,
    Gameplay,
    Training,
    Options,
    Paused
}