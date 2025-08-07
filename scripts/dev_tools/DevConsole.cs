using Godot;
using System;
using System.Collections.Generic;

/// <summary>
/// Developer console with debugging tools and frame data display
/// </summary>
public partial class DevConsole : Control
{
    public static DevConsole Instance { get; private set; }
    
    private VBoxContainer _consoleContainer;
    private LineEdit _commandInput;
    private RichTextLabel _outputLog;
    private bool _isVisible = false;
    
    // Debug display options
    private bool _showHitboxes = false;
    private bool _showFrameData = false;
    private bool _showInputDisplay = false;
    private bool _frameStep = false;
    
    private Dictionary<string, Action<string[]>> _commands;
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            SetupUI();
            InitializeCommands();
            Visible = false;
        }
        else
        {
            QueueFree();
        }
    }
    
    public override void _Input(InputEvent @event)
    {
        // Toggle console with F1
        if (@event is InputEventKey keyEvent && keyEvent.Pressed)
        {
            if (keyEvent.Keycode == Key.F1)
            {
                ToggleConsole();
                GetViewport().SetInputAsHandled();
            }
            
            // Frame step with F2 when enabled
            if (keyEvent.Keycode == Key.F2 && _frameStep)
            {
                AdvanceOneFrame();
                GetViewport().SetInputAsHandled();
            }
        }
    }
    
    private void SetupUI()
    {
        // Main container
        _consoleContainer = new VBoxContainer();
        _consoleContainer.AnchorLeft = 0;
        _consoleContainer.AnchorTop = 0;
        _consoleContainer.AnchorRight = 1;
        _consoleContainer.AnchorBottom = 1;
        _consoleContainer.OffsetLeft = 0;
        _consoleContainer.OffsetTop = 0;
        _consoleContainer.OffsetRight = 0;
        _consoleContainer.OffsetBottom = 0;
        _consoleContainer.AddThemeStyleboxOverride("panel", new StyleBoxFlat());
        
        // Output log
        _outputLog = new RichTextLabel();
        _outputLog.CustomMinimumSize = new Vector2(0, 300);
        _outputLog.BbcodeEnabled = true;
        _outputLog.ScrollFollowing = true;
        
        // Command input
        _commandInput = new LineEdit();
        _commandInput.PlaceholderText = "Enter command...";
        _commandInput.TextSubmitted += OnCommandSubmitted;
        
        // Add to container
        _consoleContainer.AddChild(_outputLog);
        _consoleContainer.AddChild(_commandInput);
        
        AddChild(_consoleContainer);
        
        // Style
        var bg = new StyleBoxFlat();
        bg.BgColor = new Color(0, 0, 0, 0.8f);
        _consoleContainer.AddThemeStyleboxOverride("panel", bg);
    }
    
    private void InitializeCommands()
    {
        _commands = new Dictionary<string, Action<string[]>>
        {
            { "help", ShowHelp },
            { "clear", ClearLog },
            { "hitboxes", ToggleHitboxes },
            { "framedata", ToggleFrameData },
            { "input", ToggleInputDisplay },
            { "framestep", ToggleFrameStep },
            { "advance", AdvanceFrame },
            { "balance", BalanceCommand },
            { "telemetry", TelemetryCommand },
            { "spawn", SpawnCommand },
            { "health", HealthCommand },
            { "meter", MeterCommand },
            { "state", StateCommand },
            { "reload", ReloadCommand },
            { "subarchetypes", SubArchetypeCommand },
            { "setsubarchetype", SetSubArchetypeCommand },
            { "testsubarchetypes", TestSubArchetypesCommand },
            { "archetypes", ArchetypesCommand },
            { "archetype", ArchetypeInfoCommand },
            { "substyle", SubStyleInfoCommand },
            { "matchup", MatchupCommand },
            { "roster", RosterSuggestionCommand }
        };
        
        LogMessage("[color=yellow]Developer Console Initialized[/color]");
        LogMessage("Type 'help' for available commands");
    }
    
    private void ToggleConsole()
    {
        _isVisible = !_isVisible;
        Visible = _isVisible;
        
        if (_isVisible)
        {
            _commandInput.GrabFocus();
        }
    }
    
    private void OnCommandSubmitted(string command)
    {
        if (string.IsNullOrWhiteSpace(command)) return;
        
        LogMessage($"[color=green]> {command}[/color]");
        ExecuteCommand(command);
        _commandInput.Clear();
    }
    
    private void ExecuteCommand(string input)
    {
        var parts = input.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return;
        
        string command = parts[0].ToLower();
        string[] args = parts.Length > 1 ? parts[1..] : Array.Empty<string>();
        
        if (_commands.ContainsKey(command))
        {
            try
            {
                _commands[command](args);
            }
            catch (Exception e)
            {
                LogError($"Command error: {e.Message}");
            }
        }
        else
        {
            LogError($"Unknown command: {command}");
        }
    }
    
    private void ShowHelp(string[] args)
    {
        LogMessage("[color=cyan]Available Commands:[/color]");
        LogMessage("help - Show this help");
        LogMessage("clear - Clear console log");
        LogMessage("hitboxes [on/off] - Toggle hitbox visualization");
        LogMessage("framedata [on/off] - Toggle frame data display");
        LogMessage("input [on/off] - Toggle input display");
        LogMessage("framestep [on/off] - Toggle frame stepping mode");
        LogMessage("advance - Advance one frame (in frame step mode)");
        LogMessage("balance [reload/status] - Balance system commands");
        LogMessage("telemetry [export/clear] - Telemetry commands");
        LogMessage("spawn [character] - Spawn character for testing");
        LogMessage("health [p1/p2] [amount] - Set player health");
        LogMessage("meter [p1/p2] [amount] - Set player meter");
        LogMessage("state [p1/p2] [state] - Set player state");
        LogMessage("reload [character] - Reload character data");
        LogMessage("subarchetypes [character] - List available sub-archetypes");
        LogMessage("setsubarchetype [character] [subArchetypeId] - Apply sub-archetype");
        LogMessage("testsubarchetypes - Test all character sub-archetypes");
        LogMessage("archetypes - List all available archetypes");
        LogMessage("archetype [archetypeId] - Show detailed archetype information");
        LogMessage("substyle [archetypeId] [subStyleId] - Show sub-style details");
        LogMessage("matchup [archetype1] [archetype2] - Show archetype matchup");
        LogMessage("roster [size] - Generate balanced roster suggestion");
    }
    
    private void ClearLog(string[] args)
    {
        _outputLog.Clear();
        LogMessage("Console cleared");
    }
    
    private void ToggleHitboxes(string[] args)
    {
        if (args.Length > 0)
        {
            _showHitboxes = args[0].ToLower() == "on";
        }
        else
        {
            _showHitboxes = !_showHitboxes;
        }
        
        LogMessage($"Hitbox visualization: {(_showHitboxes ? "ON" : "OFF")}");
        // In real implementation, this would enable/disable hitbox rendering
    }
    
    private void ToggleFrameData(string[] args)
    {
        if (args.Length > 0)
        {
            _showFrameData = args[0].ToLower() == "on";
        }
        else
        {
            _showFrameData = !_showFrameData;
        }
        
        LogMessage($"Frame data display: {(_showFrameData ? "ON" : "OFF")}");
    }
    
    private void ToggleInputDisplay(string[] args)
    {
        if (args.Length > 0)
        {
            _showInputDisplay = args[0].ToLower() == "on";
        }
        else
        {
            _showInputDisplay = !_showInputDisplay;
        }
        
        LogMessage($"Input display: {(_showInputDisplay ? "ON" : "OFF")}");
    }
    
    private void ToggleFrameStep(string[] args)
    {
        if (args.Length > 0)
        {
            _frameStep = args[0].ToLower() == "on";
        }
        else
        {
            _frameStep = !_frameStep;
        }
        
        if (_frameStep)
        {
            Engine.TimeScale = 0.0f;
            LogMessage("Frame step mode: ON (Press F2 to advance frames)");
        }
        else
        {
            Engine.TimeScale = 1.0f;
            LogMessage("Frame step mode: OFF");
        }
    }
    
    private void AdvanceFrame(string[] args)
    {
        AdvanceOneFrame();
    }
    
    private async void AdvanceOneFrame()
    {
        if (_frameStep)
        {
            // Advance one frame
            Engine.TimeScale = 1.0f;
            await ToSignal(GetTree(), SceneTree.SignalName.ProcessFrame);
            Engine.TimeScale = 0.0f;
            LogMessage("Advanced one frame");
        }
        else
        {
            LogMessage("Frame step mode not enabled");
        }
    }
    
    private void BalanceCommand(string[] args)
    {
        if (args.Length == 0)
        {
            LogMessage("Usage: balance [reload/status]");
            return;
        }
        
        switch (args[0].ToLower())
        {
            case "reload":
                BalanceManager.Instance?.LoadBalanceConfig();
                LogMessage("Balance configuration reloaded");
                break;
                
            case "status":
                if (BalanceManager.Instance != null)
                {
                    var config = BalanceManager.Instance.GetCurrentConfig();
                    LogMessage($"Balance version: {config.Version}");
                    LogMessage($"Last updated: {config.LastUpdated}");
                    LogMessage($"Hotfix enabled: {config.HotfixEnabled}");
                }
                break;
                
            default:
                LogMessage("Unknown balance command");
                break;
        }
    }
    
    private void TelemetryCommand(string[] args)
    {
        if (args.Length == 0)
        {
            LogMessage("Usage: telemetry [export/clear]");
            return;
        }
        
        switch (args[0].ToLower())
        {
            case "export":
                TelemetryManager.Instance?.ExportTelemetryData("user://telemetry_export.json");
                LogMessage("Telemetry data exported");
                break;
                
            case "clear":
                // Would clear telemetry data
                LogMessage("Telemetry data cleared");
                break;
                
            default:
                LogMessage("Unknown telemetry command");
                break;
        }
    }
    
    private void SpawnCommand(string[] args)
    {
        if (args.Length == 0)
        {
            LogMessage("Usage: spawn [character_id]");
            return;
        }
        
        string characterId = args[0];
        LogMessage($"Spawning character: {characterId}");
        // In real implementation, this would spawn a character for testing
    }
    
    private void HealthCommand(string[] args)
    {
        if (args.Length < 2)
        {
            LogMessage("Usage: health [p1/p2] [amount]");
            return;
        }
        
        string player = args[0].ToLower();
        if (int.TryParse(args[1], out int amount))
        {
            LogMessage($"Setting {player} health to {amount}");
            // In real implementation, this would set player health
        }
        else
        {
            LogMessage("Invalid health amount");
        }
    }
    
    private void MeterCommand(string[] args)
    {
        if (args.Length < 2)
        {
            LogMessage("Usage: meter [p1/p2] [amount]");
            return;
        }
        
        string player = args[0].ToLower();
        if (int.TryParse(args[1], out int amount))
        {
            LogMessage($"Setting {player} meter to {amount}");
            // In real implementation, this would set player meter
        }
        else
        {
            LogMessage("Invalid meter amount");
        }
    }
    
    private void StateCommand(string[] args)
    {
        if (args.Length < 2)
        {
            LogMessage("Usage: state [p1/p2] [state]");
            return;
        }
        
        string player = args[0].ToLower();
        string state = args[1];
        LogMessage($"Setting {player} state to {state}");
        // In real implementation, this would set character state
    }
    
    private void ReloadCommand(string[] args)
    {
        if (args.Length == 0)
        {
            LogMessage("Usage: reload [character_id]");
            return;
        }
        
        string characterId = args[0];
        LogMessage($"Reloading character data: {characterId}");
        // In real implementation, this would reload character JSON data
    }
    
    private void SubArchetypeCommand(string[] args)
    {
        if (args.Length == 0)
        {
            LogMessage("Usage: subarchetypes [character_id]");
            return;
        }
        
        string characterId = args[0];
        var subArchetypes = Character.GetAvailableSubArchetypes(characterId);
        
        if (subArchetypes.Count == 0)
        {
            LogMessage($"No sub-archetypes found for character: {characterId}");
            return;
        }
        
        LogMessage($"[color=cyan]Sub-archetypes for {characterId}:[/color]");
        foreach (var subArchetype in subArchetypes)
        {
            string defaultTag = subArchetype.IsDefault ? " [DEFAULT]" : "";
            LogMessage($"  {subArchetype.SubArchetypeId}: {subArchetype.Name}{defaultTag}");
            LogMessage($"    Description: {subArchetype.Description}");
        }
    }
    
    private void SetSubArchetypeCommand(string[] args)
    {
        if (args.Length < 2)
        {
            LogMessage("Usage: setsubarchetype [character_id] [subArchetypeId]");
            return;
        }
        
        string characterId = args[0];
        string subArchetypeId = args[1];
        
        var subArchetypes = Character.GetAvailableSubArchetypes(characterId);
        var targetSubArchetype = subArchetypes.Find(sa => sa.SubArchetypeId == subArchetypeId);
        
        if (targetSubArchetype == null)
        {
            LogMessage($"[color=red]Sub-archetype '{subArchetypeId}' not found for character '{characterId}'[/color]");
            return;
        }
        
        LogMessage($"[color=green]Applied sub-archetype '{targetSubArchetype.Name}' to {characterId}[/color]");
        LogMessage($"Description: {targetSubArchetype.Description}");
        
        // In a real implementation, this would find and update active characters
        // For now, we just demonstrate that the sub-archetype exists
    }
    
    private void TestSubArchetypesCommand(string[] args)
    {
        LogMessage("[color=yellow]=== Testing Sub-Archetype System ===[/color]");
        
        string[] characters = { "ryu", "chun_li", "zangief", "sagat", "lei_wulong", "ken" };
        
        foreach (var characterId in characters)
        {
            var subArchetypes = Character.GetAvailableSubArchetypes(characterId);
            LogMessage($"\n[color=cyan]{characterId}:[/color] {subArchetypes.Count} sub-archetypes");
            
            foreach (var subArchetype in subArchetypes)
            {
                string defaultTag = subArchetype.IsDefault ? " [DEFAULT]" : "";
                LogMessage($"  - {subArchetype.Name}{defaultTag}");
            }
        }
        
        LogMessage("\n[color=green]Sub-archetype test complete![/color]");
    }
    
    private void ArchetypesCommand(string[] args)
    {
        LogMessage("[color=cyan]Available Fighting Game Archetypes:[/color]");
        
        var archetypes = ArchetypeSystem.Instance.GetAllArchetypes();
        foreach (var archetypePair in archetypes)
        {
            var id = archetypePair.Key;
            var definition = archetypePair.Value;
            LogMessage($"[color=yellow]{id}[/color]: {definition.Name}");
            LogMessage($"  {definition.Description}");
            LogMessage($"  Sub-styles: {definition.SubStyles.Count}");
            LogMessage("");
        }
    }
    
    private void ArchetypeInfoCommand(string[] args)
    {
        if (args.Length == 0)
        {
            LogError("Usage: archetype [archetypeId]");
            LogMessage("Available archetypes: shoto, rushdown, grappler, zoner, mixup, setplay, puppet, counter, stance, big_body");
            return;
        }
        
        string archetypeId = args[0];
        var info = ArchetypeSystem.Instance.GetArchetypeInfo(archetypeId);
        
        if (info == null)
        {
            LogError($"Unknown archetype: {archetypeId}");
            return;
        }
        
        LogMessage($"[color=cyan]Archetype: {info.Name}[/color]");
        LogMessage($"Description: {info.Description}");
        LogMessage($"Sub-styles ({info.SubStyleCount}):");
        
        for (int i = 0; i < info.SubStyleIds.Count; i++)
        {
            LogMessage($"  [color=yellow]{info.SubStyleIds[i]}[/color]: {info.SubStyleNames[i]}");
        }
    }
    
    private void SubStyleInfoCommand(string[] args)
    {
        if (args.Length < 2)
        {
            LogError("Usage: substyle [archetypeId] [subStyleId]");
            return;
        }
        
        string archetypeId = args[0];
        string subStyleId = args[1];
        
        var info = ArchetypeSystem.Instance.GetSubStyleInfo(archetypeId, subStyleId);
        
        if (info == null)
        {
            LogError($"Unknown sub-style: {subStyleId} for archetype {archetypeId}");
            return;
        }
        
        LogMessage($"[color=cyan]{info.Name}[/color]");
        LogMessage($"Archetype: {archetypeId}");
        LogMessage($"Description: {info.Description}");
        LogMessage($"Play Style: {info.PlayStyle}");
        LogMessage($"Strength Focus: {info.StrengthFocus}");
        LogMessage($"Weakness Focus: {info.WeaknessFocus}");
        LogMessage($"Design Intent: {info.DesignIntent}");
        
        if (info.Examples.Count > 0)
        {
            LogMessage($"Examples: {string.Join(", ", info.Examples)}");
        }
    }
    
    private void MatchupCommand(string[] args)
    {
        if (args.Length < 2)
        {
            LogError("Usage: matchup [archetype1] [archetype2]");
            return;
        }
        
        string archetype1 = args[0];
        string archetype2 = args[1];
        
        var matchup = ArchetypeSystem.Instance.GetArchetypeMatchup(archetype1, archetype2);
        
        if (matchup == null)
        {
            LogError($"Could not calculate matchup between {archetype1} and {archetype2}");
            return;
        }
        
        LogMessage($"[color=cyan]Archetype Matchup Analysis[/color]");
        LogMessage($"{matchup.Archetype1} vs {matchup.Archetype2}");
        
        string advantageText;
        if (matchup.Advantage > 0.55f)
            advantageText = $"[color=green]{matchup.Archetype1} advantage[/color]";
        else if (matchup.Advantage < 0.45f)
            advantageText = $"[color=red]{matchup.Archetype2} advantage[/color]";
        else
            advantageText = "[color=yellow]Even matchup[/color]";
            
        LogMessage($"Advantage: {advantageText} ({matchup.Advantage:F2})");
        LogMessage($"Notes: {matchup.Notes}");
    }
    
    private void RosterSuggestionCommand(string[] args)
    {
        int targetSize = 12;
        
        if (args.Length > 0 && int.TryParse(args[0], out int size))
        {
            targetSize = Math.Max(4, Math.Min(20, size)); // Clamp between 4 and 20
        }
        
        var suggestions = ArchetypeSystem.Instance.SuggestBalancedRoster(targetSize);
        
        LogMessage($"[color=cyan]Balanced Roster Suggestion ({targetSize} characters)[/color]");
        LogMessage("");
        
        foreach (var suggestion in suggestions)
        {
            var info = ArchetypeSystem.Instance.GetArchetypeInfo(suggestion.ArchetypeId);
            string priorityColor = suggestion.Priority == "High" ? "green" : suggestion.Priority == "Medium" ? "yellow" : "gray";
            
            LogMessage($"[color={priorityColor}]{suggestion.Priority} Priority[/color]: {info?.Name ?? suggestion.ArchetypeId}");
            LogMessage($"  Reason: {suggestion.Reason}");
            LogMessage("");
        }
    }
    
    private void LogMessage(string message)
    {
        _outputLog.AppendText($"{message}\n");
    }
    
    private void LogError(string message)
    {
        _outputLog.AppendText($"[color=red]{message}[/color]\n");
    }
    
    // Public getters for debug state
    public bool ShowHitboxes => _showHitboxes;
    public bool ShowFrameData => _showFrameData;
    public bool ShowInputDisplay => _showInputDisplay;
    public bool IsFrameStep => _frameStep;
}