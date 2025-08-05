using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Handles input for all players with support for keyboard, gamepad, and fightstick
/// Provides deterministic input state for rollback netcode
/// </summary>
public partial class InputManager : Node
{
    public static InputManager Instance { get; private set; }
    
    private Dictionary<int, PlayerInputState> _playerInputStates = new();
    private Dictionary<int, List<InputEvent>> _inputBuffer = new();
    private const int BUFFER_SIZE = 60; // 1 second at 60fps
    
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
        
        // Initialize input states for 2 players
        for (int i = 0; i < 2; i++)
        {
            _playerInputStates[i] = new PlayerInputState();
            _inputBuffer[i] = new List<InputEvent>();
        }
        
        GD.Print("InputManager initialized");
    }
    
    public override void _Process(double delta)
    {
        UpdateInputStates();
    }
    
    private void UpdateInputStates()
    {
        for (int playerId = 0; playerId < 2; playerId++)
        {
            var inputState = _playerInputStates[playerId];
            string prefix = playerId == 0 ? "p1_" : "p2_";
            
            // Movement inputs
            inputState.Left = Input.IsActionPressed(prefix + "left");
            inputState.Right = Input.IsActionPressed(prefix + "right");
            inputState.Up = Input.IsActionPressed(prefix + "up");
            inputState.Down = Input.IsActionPressed(prefix + "down");
            
            // Attack inputs
            inputState.LightPunch = Input.IsActionPressed(prefix + "light_punch");
            inputState.MediumPunch = Input.IsActionPressed(prefix + "medium_punch");
            inputState.HeavyPunch = Input.IsActionPressed(prefix + "heavy_punch");
            inputState.LightKick = Input.IsActionPressed(prefix + "light_kick");
            inputState.MediumKick = Input.IsActionPressed(prefix + "medium_kick");
            inputState.HeavyKick = Input.IsActionPressed(prefix + "heavy_kick");
            
            // Calculate derived inputs
            inputState.AnyPunch = inputState.LightPunch || inputState.MediumPunch || inputState.HeavyPunch;
            inputState.AnyKick = inputState.LightKick || inputState.MediumKick || inputState.HeavyKick;
            inputState.AnyButton = inputState.AnyPunch || inputState.AnyKick;
            
            // Update directional input
            UpdateDirectionalInput(inputState);
        }
    }
    
    private void UpdateDirectionalInput(PlayerInputState inputState)
    {
        // Convert directional inputs to fighting game notation (numpad notation)
        if (inputState.Down && inputState.Left)
            inputState.Direction = Direction.DownLeft; // 1
        else if (inputState.Down && !inputState.Left && !inputState.Right)
            inputState.Direction = Direction.Down; // 2
        else if (inputState.Down && inputState.Right)
            inputState.Direction = Direction.DownRight; // 3
        else if (inputState.Left && !inputState.Up && !inputState.Down)
            inputState.Direction = Direction.Left; // 4
        else if (!inputState.Left && !inputState.Right && !inputState.Up && !inputState.Down)
            inputState.Direction = Direction.Neutral; // 5
        else if (inputState.Right && !inputState.Up && !inputState.Down)
            inputState.Direction = Direction.Right; // 6
        else if (inputState.Up && inputState.Left)
            inputState.Direction = Direction.UpLeft; // 7
        else if (inputState.Up && !inputState.Left && !inputState.Right)
            inputState.Direction = Direction.Up; // 8
        else if (inputState.Up && inputState.Right)
            inputState.Direction = Direction.UpRight; // 9
        else
            inputState.Direction = Direction.Neutral; // Default to neutral
    }
    
    public PlayerInputState GetPlayerInput(int playerId)
    {
        return _playerInputStates.GetValueOrDefault(playerId, new PlayerInputState());
    }
    
    public bool IsInputJustPressed(int playerId, string action)
    {
        string prefix = playerId == 0 ? "p1_" : "p2_";
        return Input.IsActionJustPressed(prefix + action);
    }
    
    public bool IsInputJustReleased(int playerId, string action)
    {
        string prefix = playerId == 0 ? "p1_" : "p2_";
        return Input.IsActionJustReleased(prefix + action);
    }
    
    /// <summary>
    /// Gets input state for a specific frame (used for rollback)
    /// </summary>
    public PlayerInputState GetInputForFrame(int playerId, int frame)
    {
        // This would be implemented for rollback netcode
        // For now, return current input
        return GetPlayerInput(playerId);
    }
}

public class PlayerInputState
{
    // Raw directional inputs
    public bool Left { get; set; }
    public bool Right { get; set; }
    public bool Up { get; set; }
    public bool Down { get; set; }
    
    // Attack buttons
    public bool LightPunch { get; set; }
    public bool MediumPunch { get; set; }
    public bool HeavyPunch { get; set; }
    public bool LightKick { get; set; }
    public bool MediumKick { get; set; }
    public bool HeavyKick { get; set; }
    
    // Derived inputs
    public bool AnyPunch { get; set; }
    public bool AnyKick { get; set; }
    public bool AnyButton { get; set; }
    public Direction Direction { get; set; } = Direction.Neutral;
    
    public PlayerInputState Clone()
    {
        return new PlayerInputState
        {
            Left = Left,
            Right = Right,
            Up = Up,
            Down = Down,
            LightPunch = LightPunch,
            MediumPunch = MediumPunch,
            HeavyPunch = HeavyPunch,
            LightKick = LightKick,
            MediumKick = MediumKick,
            HeavyKick = HeavyKick,
            AnyPunch = AnyPunch,
            AnyKick = AnyKick,
            AnyButton = AnyButton,
            Direction = Direction
        };
    }
}

public enum Direction
{
    Neutral = 5,
    DownLeft = 1,
    Down = 2,
    DownRight = 3,
    Left = 4,
    Right = 6,
    UpLeft = 7,
    Up = 8,
    UpRight = 9
}