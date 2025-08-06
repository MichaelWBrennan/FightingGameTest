using Godot;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Communication system for in-game chat, quick commands, and emotes
/// Provides industry-standard communication features for fighting games
/// </summary>
public partial class CommunicationSystem : Node
{
    public static CommunicationSystem Instance { get; private set; }
    
    [Signal]
    public delegate void MessageReceivedEventHandler(string playerId, string playerName, string text, int messageType);
    
    [Signal]
    public delegate void QuickCommandUsedEventHandler(string playerId, QuickCommandType commandType);
    
    [Signal]
    public delegate void EmoteUsedEventHandler(string playerId, EmoteType emoteType);
    
    // Communication Settings
    public bool ChatEnabled { get; private set; } = true;
    public bool QuickCommandsEnabled { get; private set; } = true;
    public bool EmotesEnabled { get; private set; } = true;
    public bool ProfanityFilterEnabled { get; private set; } = true;
    public bool AllowSpectatorChat { get; private set; } = true;
    
    // Chat State
    public bool IsChatOpen { get; private set; } = false;
    private List<ChatMessage> _chatHistory = new();
    private const int MaxChatHistory = 100;
    
    // UI Elements
    private CanvasLayer _communicationUI;
    private Control _chatPanel;
    private RichTextLabel _chatDisplay;
    private LineEdit _chatInput;
    private Control _quickCommandPanel;
    private Control _emotePanel;
    private Control _quickCommandWheel;
    
    // Quick Commands
    private Dictionary<QuickCommandType, string> _quickCommands = new()
    {
        { QuickCommandType.GoodFight, "Good fight!" },
        { QuickCommandType.GoodLuck, "Good luck!" },
        { QuickCommandType.NiceCombo, "Nice combo!" },
        { QuickCommandType.WellPlayed, "Well played!" },
        { QuickCommandType.Respect, "Respect!" },
        { QuickCommandType.OneMoreGame, "One more game?" },
        { QuickCommandType.ThanksForGame, "Thanks for the game!" },
        { QuickCommandType.SorryLag, "Sorry about the lag" }
    };
    
    // Emotes
    private Dictionary<EmoteType, EmoteData> _availableEmotes = new()
    {
        { EmoteType.Thumbsup, new EmoteData { Name = "👍", Description = "Thumbs Up", Duration = 2.0f } },
        { EmoteType.Clap, new EmoteData { Name = "👏", Description = "Clap", Duration = 2.0f } },
        { EmoteType.Wave, new EmoteData { Name = "👋", Description = "Wave", Duration = 2.0f } },
        { EmoteType.Facepalm, new EmoteData { Name = "🤦", Description = "Facepalm", Duration = 2.0f } },
        { EmoteType.Thinking, new EmoteData { Name = "🤔", Description = "Thinking", Duration = 3.0f } },
        { EmoteType.Fire, new EmoteData { Name = "🔥", Description = "Fire", Duration = 2.5f } },
        { EmoteType.Heart, new EmoteData { Name = "❤️", Description = "Heart", Duration = 2.0f } },
        { EmoteType.Laugh, new EmoteData { Name = "😂", Description = "Laugh", Duration = 2.5f } }
    };
    
    // Profanity Filter
    private HashSet<string> _profanityWords = new()
    {
        // Basic profanity filter - would be more comprehensive in real implementation
        "damn", "hell", "crap", "stupid", "idiot", "noob", "scrub"
    };
    
    // Rate Limiting
    private Dictionary<string, float> _lastMessageTime = new();
    private const float MessageCooldown = 1.0f; // 1 second between messages
    private const int MaxMessagesPerMinute = 10;
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeCommunicationSystem();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("CommunicationSystem initialized");
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event.IsActionPressed("chat_toggle"))
        {
            ToggleChat();
        }
        else if (@event.IsActionPressed("quick_commands"))
        {
            ShowQuickCommands();
        }
        else if (@event.IsActionPressed("emote_wheel"))
        {
            ShowEmoteWheel();
        }
        else if (IsChatOpen && @event.IsActionPressed("ui_accept"))
        {
            SendChatMessage();
        }
        else if (IsChatOpen && @event.IsActionPressed("ui_cancel"))
        {
            CloseChat();
        }
        
        // Quick command shortcuts
        HandleQuickCommandShortcuts(@event);
    }
    
    private void InitializeCommunicationSystem()
    {
        CreateCommunicationUI();
        LoadCommunicationSettings();
        
        // Connect to game events
        if (GameManager.Instance != null)
        {
            GameManager.Instance.GameStateChanged += OnGameStateChanged;
        }
    }
    
    private void CreateCommunicationUI()
    {
        _communicationUI = new CanvasLayer();
        _communicationUI.Layer = 700; // Above replay UI
        AddChild(_communicationUI);
        
        CreateChatPanel();
        CreateQuickCommandPanel();
        CreateEmotePanel();
    }
    
    private void CreateChatPanel()
    {
        _chatPanel = new Panel();
        _chatPanel.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.BottomWide);
        _chatPanel.Position = new Vector2(20, -200);
        _chatPanel.Size = new Vector2(-40, 180);
        _chatPanel.Visible = false;
        
        var style = new StyleBoxFlat();
        style.BgColor = new Color(0, 0, 0, 0.8f);
        style.BorderColor = Colors.Gray;
        style.BorderWidthLeft = style.BorderWidthRight = style.BorderWidthTop = style.BorderWidthBottom = 1;
        style.CornerRadiusTopLeft = style.CornerRadiusTopRight = 5;
        _chatPanel.AddThemeStyleboxOverride("panel", style);
        
        var vbox = new VBoxContainer();
        vbox.SetAnchorsAndOffsetsPreset(Control.PresetMode.FullRect);
        vbox.AddThemeConstantOverride("separation", 5);
        _chatPanel.AddChild(vbox);
        
        // Chat title
        var titleHBox = new HBoxContainer();
        vbox.AddChild(titleHBox);
        
        var titleLabel = new Label();
        titleLabel.Text = "Chat";
        titleLabel.AddThemeColorOverride("font_color", Colors.Yellow);
        titleLabel.AddThemeFontSizeOverride("font_size", 16);
        titleHBox.AddChild(titleLabel);
        
        // Chat display
        _chatDisplay = new RichTextLabel();
        _chatDisplay.CustomMinimumSize = new Vector2(0, 120);
        _chatDisplay.BbcodeEnabled = true;
        _chatDisplay.ScrollFollowing = true;
        _chatDisplay.SelectionEnabled = true;
        vbox.AddChild(_chatDisplay);
        
        // Chat input
        var inputHBox = new HBoxContainer();
        vbox.AddChild(inputHBox);
        
        _chatInput = new LineEdit();
        _chatInput.PlaceholderText = "Type your message...";
        _chatInput.TextSubmitted += OnChatTextSubmitted;
        inputHBox.AddChild(_chatInput);
        
        var sendButton = new Button();
        sendButton.Text = "Send";
        sendButton.Pressed += SendChatMessage;
        inputHBox.AddChild(sendButton);
        
        _communicationUI.AddChild(_chatPanel);
    }
    
    private void CreateQuickCommandPanel()
    {
        _quickCommandPanel = new Panel();
        _quickCommandPanel.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.CenterLeft);
        _quickCommandPanel.Position = new Vector2(20, -150);
        _quickCommandPanel.Size = new Vector2(200, 300);
        _quickCommandPanel.Visible = false;
        
        var style = new StyleBoxFlat();
        style.BgColor = new Color(0.1f, 0.1f, 0.1f, 0.9f);
        style.BorderColor = Colors.Blue;
        style.BorderWidthLeft = style.BorderWidthRight = style.BorderWidthTop = style.BorderWidthBottom = 2;
        style.CornerRadiusTopLeft = style.CornerRadiusTopRight = 
        style.CornerRadiusBottomLeft = style.CornerRadiusBottomRight = 8;
        _quickCommandPanel.AddThemeStyleboxOverride("panel", style);
        
        var vbox = new VBoxContainer();
        vbox.SetAnchorsAndOffsetsPreset(Control.PresetMode.FullRect);
        vbox.AddThemeConstantOverride("separation", 5);
        _quickCommandPanel.AddChild(vbox);
        
        var titleLabel = new Label();
        titleLabel.Text = "Quick Commands";
        titleLabel.HorizontalAlignment = HorizontalAlignment.Center;
        titleLabel.AddThemeColorOverride("font_color", Colors.Cyan);
        titleLabel.AddThemeFontSizeOverride("font_size", 16);
        vbox.AddChild(titleLabel);
        
        var separator = new HSeparator();
        vbox.AddChild(separator);
        
        // Create buttons for each quick command
        foreach (var command in _quickCommands)
        {
            CreateQuickCommandButton(vbox, command.Key, command.Value);
        }
        
        _communicationUI.AddChild(_quickCommandPanel);
    }
    
    private void CreateQuickCommandButton(Container parent, QuickCommandType commandType, string text)
    {
        var button = new Button();
        button.Text = text;
        button.SizeFlagsHorizontal = Control.SizeFlags.ExpandFill;
        button.Pressed += () => UseQuickCommand(commandType);
        parent.AddChild(button);
    }
    
    private void CreateEmotePanel()
    {
        _emotePanel = new Panel();
        _emotePanel.SetAnchorsAndOffsetsPreset(Control.PresetModeEnum.CenterRight);
        _emotePanel.Position = new Vector2(-220, -120);
        _emotePanel.Size = new Vector2(200, 240);
        _emotePanel.Visible = false;
        
        var style = new StyleBoxFlat();
        style.BgColor = new Color(0.1f, 0.1f, 0.1f, 0.9f);
        style.BorderColor = Colors.Purple;
        style.BorderWidthLeft = style.BorderWidthRight = style.BorderWidthTop = style.BorderWidthBottom = 2;
        style.CornerRadiusTopLeft = style.CornerRadiusTopRight = 
        style.CornerRadiusBottomLeft = style.CornerRadiusBottomRight = 8;
        _emotePanel.AddThemeStyleboxOverride("panel", style);
        
        var vbox = new VBoxContainer();
        vbox.SetAnchorsAndOffsetsPreset(Control.PresetMode.FullRect);
        vbox.AddThemeConstantOverride("separation", 5);
        _emotePanel.AddChild(vbox);
        
        var titleLabel = new Label();
        titleLabel.Text = "Emotes";
        titleLabel.HorizontalAlignment = HorizontalAlignment.Center;
        titleLabel.AddThemeColorOverride("font_color", Colors.Pink);
        titleLabel.AddThemeFontSizeOverride("font_size", 16);
        vbox.AddChild(titleLabel);
        
        var separator = new HSeparator();
        vbox.AddChild(separator);
        
        // Create emote grid
        var gridContainer = new GridContainer();
        gridContainer.Columns = 4;
        gridContainer.AddThemeConstantOverride("h_separation", 5);
        gridContainer.AddThemeConstantOverride("v_separation", 5);
        vbox.AddChild(gridContainer);
        
        foreach (var emote in _availableEmotes)
        {
            CreateEmoteButton(gridContainer, emote.Key, emote.Value);
        }
        
        _communicationUI.AddChild(_emotePanel);
    }
    
    private void CreateEmoteButton(Container parent, EmoteType emoteType, EmoteData emoteData)
    {
        var button = new Button();
        button.Text = emoteData.Name;
        button.CustomMinimumSize = new Vector2(40, 40);
        button.TooltipText = emoteData.Description;
        button.Pressed += () => UseEmote(emoteType);
        parent.AddChild(button);
    }
    
    public void ToggleChat()
    {
        if (!ChatEnabled) return;
        
        IsChatOpen = !IsChatOpen;
        _chatPanel.Visible = IsChatOpen;
        
        if (IsChatOpen)
        {
            _chatInput.GrabFocus();
            _chatInput.Text = "";
        }
        else
        {
            _chatInput.ReleaseFocus();
        }
        
        GD.Print($"Chat {(IsChatOpen ? "opened" : "closed")}");
    }
    
    public void CloseChat()
    {
        if (IsChatOpen)
        {
            ToggleChat();
        }
    }
    
    public void ShowQuickCommands()
    {
        if (!QuickCommandsEnabled) return;
        
        _quickCommandPanel.Visible = !_quickCommandPanel.Visible;
        
        // Auto-hide after 5 seconds
        if (_quickCommandPanel.Visible)
        {
            var timer = GetTree().CreateTimer(5.0f);
            timer.Timeout += () => _quickCommandPanel.Visible = false;
        }
    }
    
    public void ShowEmoteWheel()
    {
        if (!EmotesEnabled) return;
        
        _emotePanel.Visible = !_emotePanel.Visible;
        
        // Auto-hide after 3 seconds
        if (_emotePanel.Visible)
        {
            var timer = GetTree().CreateTimer(3.0f);
            timer.Timeout += () => _emotePanel.Visible = false;
        }
    }
    
    private void HandleQuickCommandShortcuts(InputEvent @event)
    {
        if (@event.IsActionPressed("quick_command_1"))
            UseQuickCommand(QuickCommandType.GoodFight);
        else if (@event.IsActionPressed("quick_command_2"))
            UseQuickCommand(QuickCommandType.GoodLuck);
        else if (@event.IsActionPressed("quick_command_3"))
            UseQuickCommand(QuickCommandType.NiceCombo);
        else if (@event.IsActionPressed("quick_command_4"))
            UseQuickCommand(QuickCommandType.WellPlayed);
    }
    
    public void SendChatMessage()
    {
        var message = _chatInput.Text.Trim();
        if (string.IsNullOrEmpty(message)) return;
        
        string playerId = GetLocalPlayerId();
        
        // Check rate limiting
        if (!IsMessageAllowed(playerId))
        {
            ShowRateLimitWarning();
            return;
        }
        
        // Apply profanity filter
        if (ProfanityFilterEnabled)
        {
            message = FilterProfanity(message);
        }
        
        var chatMessage = new ChatMessage
        {
            PlayerId = playerId,
            PlayerName = GetPlayerName(playerId),
            Text = message,
            MessageType = ChatMessageType.Player,
            Timestamp = Time.GetDatetimeStringFromSystem()
        };
        
        ProcessChatMessage(chatMessage);
        _chatInput.Text = "";
        
        // Update rate limiting
        _lastMessageTime[playerId] = Time.GetTimeMsec() / 1000.0f;
    }
    
    private void OnChatTextSubmitted(string text)
    {
        SendChatMessage();
    }
    
    public void UseQuickCommand(QuickCommandType commandType)
    {
        if (!QuickCommandsEnabled) return;
        
        string playerId = GetLocalPlayerId();
        
        if (!IsMessageAllowed(playerId))
        {
            ShowRateLimitWarning();
            return;
        }
        
        string commandText = _quickCommands[commandType];
        
        var chatMessage = new ChatMessage
        {
            PlayerId = playerId,
            PlayerName = GetPlayerName(playerId),
            Text = commandText,
            MessageType = ChatMessageType.QuickCommand,
            Timestamp = Time.GetDatetimeStringFromSystem()
        };
        
        ProcessChatMessage(chatMessage);
        _quickCommandPanel.Visible = false;
        
        EmitSignal(SignalName.QuickCommandUsed, playerId, (int)commandType);
        
        // Update rate limiting
        _lastMessageTime[playerId] = Time.GetTimeMsec() / 1000.0f;
    }
    
    public void UseEmote(EmoteType emoteType)
    {
        if (!EmotesEnabled) return;
        
        string playerId = GetLocalPlayerId();
        var emoteData = _availableEmotes[emoteType];
        
        // Show emote visually in game
        ShowEmoteInGame(playerId, emoteData);
        
        // Add to chat
        var chatMessage = new ChatMessage
        {
            PlayerId = playerId,
            PlayerName = GetPlayerName(playerId),
            Text = $"used emote: {emoteData.Name} {emoteData.Description}",
            MessageType = ChatMessageType.Emote,
            Timestamp = Time.GetDatetimeStringFromSystem()
        };
        
        ProcessChatMessage(chatMessage);
        _emotePanel.Visible = false;
        
        EmitSignal(SignalName.EmoteUsed, playerId, (int)emoteType);
    }
    
    private void ProcessChatMessage(ChatMessage message)
    {
        // Add to chat history
        _chatHistory.Add(message);
        
        // Maintain chat history size
        if (_chatHistory.Count > MaxChatHistory)
        {
            _chatHistory.RemoveAt(0);
        }
        
        // Update chat display
        UpdateChatDisplay();
        
        // Broadcast message
        EmitSignal(SignalName.MessageReceived, message.PlayerId, message.PlayerName, message.Text, (int)message.MessageType);
        
        GD.Print($"[{message.MessageType}] {message.PlayerName}: {message.Text}");
    }
    
    private void UpdateChatDisplay()
    {
        var displayText = "";
        
        foreach (var message in _chatHistory.TakeLast(20)) // Show last 20 messages
        {
            var color = GetMessageColor(message.MessageType);
            var timeStamp = message.Timestamp.Split(' ')[1]; // Just time, not date
            
            displayText += $"[color={color}][{timeStamp}] {message.PlayerName}: {message.Text}[/color]\n";
        }
        
        _chatDisplay.Text = displayText;
    }
    
    private string GetMessageColor(ChatMessageType messageType)
    {
        return messageType switch
        {
            ChatMessageType.Player => "white",
            ChatMessageType.QuickCommand => "cyan",
            ChatMessageType.Emote => "pink",
            ChatMessageType.System => "yellow",
            ChatMessageType.Moderator => "red",
            _ => "white"
        };
    }
    
    private void ShowEmoteInGame(string playerId, EmoteData emoteData)
    {
        // Find player character and show emote above them
        var players = GetTree().GetNodesInGroup("players");
        
        foreach (Node player in players)
        {
            if (player.Get("player_id").AsString() == playerId)
            {
                CreateFloatingEmote(player as Node2D, emoteData);
                break;
            }
        }
    }
    
    private void CreateFloatingEmote(Node2D playerNode, EmoteData emoteData)
    {
        if (playerNode == null) return;
        
        var emoteLabel = new Label();
        emoteLabel.Text = emoteData.Name;
        emoteLabel.AddThemeFontSizeOverride("font_size", 32);
        emoteLabel.Position = new Vector2(-16, -120); // Above player head
        emoteLabel.ZIndex = 100;
        
        playerNode.AddChild(emoteLabel);
        
        // Animate emote
        var tween = CreateTween();
        tween.SetParallel(true);
        
        // Float up
        tween.TweenProperty(emoteLabel, "position", emoteLabel.Position + new Vector2(0, -30), emoteData.Duration);
        
        // Fade out
        tween.TweenProperty(emoteLabel, "modulate:a", 0.0f, emoteData.Duration * 0.5f).SetDelay(emoteData.Duration * 0.5f);
        
        // Remove after animation
        tween.TweenCallback(Callable.From(() => emoteLabel.QueueFree())).SetDelay(emoteData.Duration);
    }
    
    private bool IsMessageAllowed(string playerId)
    {
        float currentTime = Time.GetTicksMsec() / 1000.0f;
        
        if (_lastMessageTime.ContainsKey(playerId))
        {
            float timeSinceLastMessage = currentTime - _lastMessageTime[playerId];
            if (timeSinceLastMessage < MessageCooldown)
            {
                return false;
            }
        }
        
        return true;
    }
    
    private void ShowRateLimitWarning()
    {
        var warningMessage = new ChatMessage
        {
            PlayerId = "system",
            PlayerName = "System",
            Text = "Please wait before sending another message.",
            MessageType = ChatMessageType.System,
            Timestamp = Time.GetDatetimeStringFromSystem()
        };
        
        ProcessChatMessage(warningMessage);
    }
    
    private string FilterProfanity(string message)
    {
        var words = message.Split(' ');
        
        for (int i = 0; i < words.Length; i++)
        {
            string word = words[i].ToLower().Trim(".,!?;:");
            
            if (_profanityWords.Contains(word))
            {
                words[i] = new string('*', words[i].Length);
            }
        }
        
        return string.Join(" ", words);
    }
    
    private string GetLocalPlayerId()
    {
        // Get local player ID from game manager
        return "player_1"; // Simplified for example
    }
    
    private string GetPlayerName(string playerId)
    {
        // Get player name from player data
        return playerId == "player_1" ? "Local Player" : "Remote Player";
    }
    
    private void LoadCommunicationSettings()
    {
        var config = new ConfigFile();
        if (config.Load("user://communication_settings.cfg") != Error.Ok)
        {
            return; // Use defaults
        }
        
        ChatEnabled = (bool)config.GetValue("communication", "chat_enabled", true);
        QuickCommandsEnabled = (bool)config.GetValue("communication", "quick_commands_enabled", true);
        EmotesEnabled = (bool)config.GetValue("communication", "emotes_enabled", true);
        ProfanityFilterEnabled = (bool)config.GetValue("communication", "profanity_filter_enabled", true);
        AllowSpectatorChat = (bool)config.GetValue("communication", "allow_spectator_chat", true);
    }
    
    public void SaveCommunicationSettings()
    {
        var config = new ConfigFile();
        
        config.SetValue("communication", "chat_enabled", ChatEnabled);
        config.SetValue("communication", "quick_commands_enabled", QuickCommandsEnabled);
        config.SetValue("communication", "emotes_enabled", EmotesEnabled);
        config.SetValue("communication", "profanity_filter_enabled", ProfanityFilterEnabled);
        config.SetValue("communication", "allow_spectator_chat", AllowSpectatorChat);
        
        config.Save("user://communication_settings.cfg");
    }
    
    public void SetChatEnabled(bool enabled)
    {
        ChatEnabled = enabled;
        if (!enabled && IsChatOpen)
        {
            CloseChat();
        }
        SaveCommunicationSettings();
    }
    
    public void SetQuickCommandsEnabled(bool enabled)
    {
        QuickCommandsEnabled = enabled;
        SaveCommunicationSettings();
    }
    
    public void SetEmotesEnabled(bool enabled)
    {
        EmotesEnabled = enabled;
        SaveCommunicationSettings();
    }
    
    public void SetProfanityFilterEnabled(bool enabled)
    {
        ProfanityFilterEnabled = enabled;
        SaveCommunicationSettings();
    }
    
    private void OnGameStateChanged()
    {
        // Handle game state changes
        var gameState = GameManager.Instance?.CurrentState;
        
        switch (gameState)
        {
            case GameState.MainMenu:
                CloseChat();
                break;
            case GameState.InMatch:
                // Chat might be limited during matches
                break;
        }
    }
    
    public List<ChatMessage> GetChatHistory()
    {
        return new List<ChatMessage>(_chatHistory);
    }
    
    public void ClearChatHistory()
    {
        _chatHistory.Clear();
        UpdateChatDisplay();
    }
}

public enum QuickCommandType
{
    GoodFight,
    GoodLuck,
    NiceCombo,
    WellPlayed,
    Respect,
    OneMoreGame,
    ThanksForGame,
    SorryLag
}

public enum EmoteType
{
    Thumbsup,
    Clap,
    Wave,
    Facepalm,
    Thinking,
    Fire,
    Heart,
    Laugh
}

public enum ChatMessageType
{
    Player,
    QuickCommand,
    Emote,
    System,
    Moderator
}

public class ChatMessage
{
    public string PlayerId { get; set; }
    public string PlayerName { get; set; }
    public string Text { get; set; }
    public ChatMessageType MessageType { get; set; }
    public string Timestamp { get; set; }
}

public class EmoteData
{
    public string Name { get; set; }
    public string Description { get; set; }
    public float Duration { get; set; }
}