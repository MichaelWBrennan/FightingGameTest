using Godot;
using System.Collections.Generic;

/// <summary>
/// Manages accessibility features for the fighting game
/// Includes colorblind support, UI scaling, text-to-speech, and other accessibility options
/// </summary>
public partial class AccessibilityManager : Node
{
    public static AccessibilityManager Instance { get; private set; }
    
    [Signal]
    public delegate void AccessibilitySettingsChangedEventHandler();
    
    // Accessibility Settings
    public float UIScale { get; private set; } = 1.0f;
    public bool ColorblindMode { get; private set; } = false;
    public ColorblindType ColorblindType { get; private set; } = ColorblindType.None;
    public bool HighContrastMode { get; private set; } = false;
    public bool ReducedMotion { get; private set; } = false;
    public bool TextToSpeechEnabled { get; private set; } = false;
    public float AudioCueVolume { get; private set; } = 1.0f;
    public bool ShowInputHistory { get; private set; } = false;
    public bool LargeText { get; private set; } = false;
    
    // Colorblind filter materials
    private Material _protanopiaFilter;
    private Material _deuteranopiaFilter; 
    private Material _tritanopiaFilter;
    
    private CanvasLayer _accessibilityOverlay;
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeAccessibility();
            LoadAccessibilitySettings();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("AccessibilityManager initialized");
    }
    
    private void InitializeAccessibility()
    {
        // Create accessibility overlay
        _accessibilityOverlay = new CanvasLayer();
        _accessibilityOverlay.Layer = 1000; // Top layer
        AddChild(_accessibilityOverlay);
        
        // Initialize colorblind filters (simplified - would need proper shaders)
        SetupColorblindFilters();
    }
    
    private void SetupColorblindFilters()
    {
        // These would be proper colorblind correction shaders in a real implementation
        // For now, we'll create placeholder materials
        _protanopiaFilter = new CanvasItemMaterial();
        _deuteranopiaFilter = new CanvasItemMaterial();
        _tritanopiaFilter = new CanvasItemMaterial();
    }
    
    public void SetUIScale(float scale)
    {
        UIScale = Mathf.Clamp(scale, 0.75f, 2.0f);
        ApplyUIScale();
        SaveAccessibilitySettings();
        EmitSignal(SignalName.AccessibilitySettingsChanged);
    }
    
    public void SetColorblindMode(bool enabled, ColorblindType type = ColorblindType.Protanopia)
    {
        ColorblindMode = enabled;
        ColorblindType = type;
        ApplyColorblindFilter();
        SaveAccessibilitySettings();
        EmitSignal(SignalName.AccessibilitySettingsChanged);
    }
    
    public void SetHighContrastMode(bool enabled)
    {
        HighContrastMode = enabled;
        ApplyHighContrastMode();
        SaveAccessibilitySettings();
        EmitSignal(SignalName.AccessibilitySettingsChanged);
    }
    
    public void SetReducedMotion(bool enabled)
    {
        ReducedMotion = enabled;
        SaveAccessibilitySettings();
        EmitSignal(SignalName.AccessibilitySettingsChanged);
    }
    
    public void SetTextToSpeech(bool enabled)
    {
        TextToSpeechEnabled = enabled;
        SaveAccessibilitySettings();
        EmitSignal(SignalName.AccessibilitySettingsChanged);
    }
    
    public void SetAudioCueVolume(float volume)
    {
        AudioCueVolume = Mathf.Clamp(volume, 0.0f, 2.0f);
        SaveAccessibilitySettings();
        EmitSignal(SignalName.AccessibilitySettingsChanged);
    }
    
    public void SetShowInputHistory(bool enabled)
    {
        ShowInputHistory = enabled;
        SaveAccessibilitySettings();
        EmitSignal(SignalName.AccessibilitySettingsChanged);
    }
    
    public void SetLargeText(bool enabled)
    {
        LargeText = enabled;
        ApplyTextSizeChanges();
        SaveAccessibilitySettings();
        EmitSignal(SignalName.AccessibilitySettingsChanged);
    }
    
    private void ApplyUIScale()
    {
        var tree = GetTree();
        if (tree?.CurrentScene != null)
        {
            // Apply scaling to UI elements
            var uiNodes = tree.GetNodesInGroup("ui_scalable");
            foreach (Control uiNode in uiNodes)
            {
                if (uiNode != null)
                {
                    uiNode.Scale = Vector2.One * UIScale;
                }
            }
        }
    }
    
    private void ApplyColorblindFilter()
    {
        if (!ColorblindMode)
        {
            // Remove any active filters
            if (_accessibilityOverlay.GetChildCount() > 0)
            {
                foreach (Node child in _accessibilityOverlay.GetChildren())
                {
                    if (child.Name == "ColorblindFilter")
                    {
                        child.QueueFree();
                    }
                }
            }
            return;
        }
        
        // Apply appropriate colorblind filter
        var filterRect = new ColorRect();
        filterRect.Name = "ColorblindFilter";
        // UI positioning would be handled in scene files in a real implementation
        // This is a simplified version to demonstrate the system structure
        var style = new StyleBoxFlat();
        {
            ColorblindType.Protanopia => _protanopiaFilter,
            ColorblindType.Deuteranopia => _deuteranopiaFilter,
            ColorblindType.Tritanopia => _tritanopiaFilter,
            _ => null
        };
        
        if (filterMaterial != null)
        {
            filterRect.Material = filterMaterial;
            _accessibilityOverlay.AddChild(filterRect);
        }
    }
    
    private void ApplyHighContrastMode()
    {
        // Adjust UI colors for high contrast
        // Note: In Godot 4, theme management is different
        // This is a simplified version that would need proper implementation
        var currentTheme = DisplayServer.GetSystemTheme();
        GD.Print($"High contrast mode {(HighContrastMode ? "enabled" : "disabled")}");
    }
    
    private void ApplyTextSizeChanges()
    {
        var tree = GetTree();
        if (tree?.CurrentScene != null)
        {
            var textNodes = tree.GetNodesInGroup("text_scalable");
            float sizeMultiplier = LargeText ? 1.25f : 1.0f;
            
            foreach (Control textNode in textNodes)
            {
                if (textNode is Label label && label.HasThemeStyleboxOverride("normal"))
                {
                    var font = label.GetThemeFont("font");
                    if (font != null)
                    {
                        var newSize = (int)(label.GetThemeFontSize("font_size") * sizeMultiplier);
                        label.AddThemeFontSizeOverride("font_size", newSize);
                    }
                }
            }
        }
    }
    
    public void AnnounceText(string text)
    {
        if (TextToSpeechEnabled)
        {
            // In a real implementation, this would use platform-specific TTS
            GD.Print($"[TTS] {text}");
            DisplayVisualAnnouncement(text);
        }
    }
    
    private void DisplayVisualAnnouncement(string text)
    {
        // Create a temporary visual announcement for accessibility
        var announcement = new Label();
        announcement.Text = text;
        announcement.Position = new Vector2(50, 50);
        announcement.AddThemeStyleboxOverride("normal", new StyleBoxFlat());
        
        _accessibilityOverlay.AddChild(announcement);
        
        // Auto-remove after 3 seconds
        var timer = GetTree().CreateTimer(3.0f);
        timer.Timeout += () => announcement.QueueFree();
    }
    
    public void PlayAudioCue(AudioCueType cueType)
    {
        if (AudioCueVolume > 0.0f)
        {
            // Play accessibility audio cues
            string cueName = cueType switch
            {
                AudioCueType.MenuNavigate => "menu_navigate",
                AudioCueType.MenuSelect => "menu_select",
                AudioCueType.HitConfirm => "hit_confirm",
                AudioCueType.BlockSuccess => "block_success",
                AudioCueType.ComboBreak => "combo_break",
                AudioCueType.SuperActivate => "super_activate",
                _ => ""
            };
            
            // In a real implementation, this would play actual audio
            GD.Print($"[Audio Cue] {cueName} at volume {AudioCueVolume}");
        }
    }
    
    private void SaveAccessibilitySettings()
    {
        var config = new ConfigFile();
        
        config.SetValue("accessibility", "ui_scale", UIScale);
        config.SetValue("accessibility", "colorblind_mode", ColorblindMode);
        config.SetValue("accessibility", "colorblind_type", (int)ColorblindType);
        config.SetValue("accessibility", "high_contrast", HighContrastMode);
        config.SetValue("accessibility", "reduced_motion", ReducedMotion);
        config.SetValue("accessibility", "text_to_speech", TextToSpeechEnabled);
        config.SetValue("accessibility", "audio_cue_volume", AudioCueVolume);
        config.SetValue("accessibility", "show_input_history", ShowInputHistory);
        config.SetValue("accessibility", "large_text", LargeText);
        
        config.Save("user://accessibility_settings.cfg");
    }
    
    private void LoadAccessibilitySettings()
    {
        var config = new ConfigFile();
        if (config.Load("user://accessibility_settings.cfg") != Error.Ok)
        {
            return; // No saved settings, use defaults
        }
        
        UIScale = (float)config.GetValue("accessibility", "ui_scale", 1.0f);
        ColorblindMode = (bool)config.GetValue("accessibility", "colorblind_mode", false);
        ColorblindType = (ColorblindType)(int)config.GetValue("accessibility", "colorblind_type", 0);
        HighContrastMode = (bool)config.GetValue("accessibility", "high_contrast", false);
        ReducedMotion = (bool)config.GetValue("accessibility", "reduced_motion", false);
        TextToSpeechEnabled = (bool)config.GetValue("accessibility", "text_to_speech", false);
        AudioCueVolume = (float)config.GetValue("accessibility", "audio_cue_volume", 1.0f);
        ShowInputHistory = (bool)config.GetValue("accessibility", "show_input_history", false);
        LargeText = (bool)config.GetValue("accessibility", "large_text", false);
        
        // Apply loaded settings
        ApplyUIScale();
        ApplyColorblindFilter();
        ApplyHighContrastMode();
        ApplyTextSizeChanges();
    }
}

public enum ColorblindType
{
    None,
    Protanopia,    // Red-blind
    Deuteranopia,  // Green-blind
    Tritanopia     // Blue-blind
}

public enum AudioCueType
{
    MenuNavigate,
    MenuSelect,
    HitConfirm,
    BlockSuccess,
    ComboBreak,
    SuperActivate
}