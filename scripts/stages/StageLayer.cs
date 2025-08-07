using Godot;
using System;

/// <summary>
/// Individual stage layer component for Gothic 2.5D stages
/// Handles rendering, animation, and special effects
/// </summary>
public partial class StageLayer : Node2D
{
    public string LayerName { get; private set; }
    
    // Layer properties
    private LayerData _layerData;
    private Sprite2D _sprite;
    private ShaderMaterial _shaderMaterial;
    
    // Animation state
    private float _animationTime = 0f;
    private Vector2 _originalPosition;
    private Color _originalTint;
    private float _originalIntensity = 1.0f;
    
    // Effect state
    private bool _isGlowing = false;
    private Color _glowColor = Colors.White;
    private float _glowDuration = 0f;
    private float _glowTimer = 0f;
    private float _effectIntensity = 1.0f;
    
    public void Initialize(LayerData layerData)
    {
        _layerData = layerData;
        LayerName = layerData.Name;
        Name = $"StageLayer_{layerData.Name}";
        
        CreateSprite();
        SetupShader();
        SetupPosition();
        SetupAnimation();
        
        _originalPosition = Position;
        _originalTint = new Color(
            layerData.Tint[0], 
            layerData.Tint[1], 
            layerData.Tint[2], 
            layerData.Tint[3]
        );
    }
    
    private void CreateSprite()
    {
        _sprite = new Sprite2D();
        AddChild(_sprite);
        
        // Load texture
        if (!string.IsNullOrEmpty(_layerData.TexturePath))
        {
            // For now, create placeholder colored rectangles
            // In a full implementation, these would load actual texture assets
            var texture = CreatePlaceholderTexture();
            _sprite.Texture = texture;
        }
        
        // Set tint
        _sprite.Modulate = new Color(
            _layerData.Tint[0],
            _layerData.Tint[1], 
            _layerData.Tint[2],
            _layerData.Tint[3]
        );
        
        // Set scale
        _sprite.Scale = new Vector2(
            _layerData.Scale[0],
            _layerData.Scale[1]
        );
        
        // Set blend mode
        switch (_layerData.BlendMode?.ToLower())
        {
            case "add":
                _sprite.Material = new CanvasItemMaterial { BlendMode = CanvasItemMaterial.BlendModeEnum.Add };
                break;
            case "multiply":
                _sprite.Material = new CanvasItemMaterial { BlendMode = CanvasItemMaterial.BlendModeEnum.Mul };
                break;
            case "subtract":
                _sprite.Material = new CanvasItemMaterial { BlendMode = CanvasItemMaterial.BlendModeEnum.Sub };
                break;
            default:
                _sprite.Material = new CanvasItemMaterial { BlendMode = CanvasItemMaterial.BlendModeEnum.Mix };
                break;
        }
    }
    
    private ImageTexture CreatePlaceholderTexture()
    {
        // Create gothic-themed placeholder based on layer name
        var image = Image.CreateEmpty(1920, 1080, false, Image.Format.Rgb8);
        
        var baseColor = GetGothicColorForLayer();
        image.Fill(baseColor);
        
        // Add some simple pattern based on layer type
        AddGothicPatternToImage(image, baseColor);
        
        var texture = ImageTexture.CreateFromImage(image);
        return texture;
    }
    
    private Color GetGothicColorForLayer()
    {
        var layerName = _layerData.Name.ToLower();
        
        return layerName switch
        {
            var name when name.Contains("sky") => new Color(0.2f, 0.3f, 0.5f),
            var name when name.Contains("spire") || name.Contains("tower") => new Color(0.3f, 0.3f, 0.4f),
            var name when name.Contains("cathedral") || name.Contains("castle") => new Color(0.4f, 0.4f, 0.5f),
            var name when name.Contains("stained") || name.Contains("glass") => new Color(0.8f, 0.4f, 0.6f),
            var name when name.Contains("interior") || name.Contains("pillar") => new Color(0.3f, 0.3f, 0.4f),
            var name when name.Contains("floor") => new Color(0.4f, 0.4f, 0.5f),
            var name when name.Contains("candle") => new Color(1.0f, 0.8f, 0.4f),
            var name when name.Contains("crypt") || name.Contains("tomb") => new Color(0.2f, 0.2f, 0.3f),
            var name when name.Contains("vault") => new Color(0.25f, 0.25f, 0.35f),
            var name when name.Contains("symbol") => new Color(0.6f, 0.5f, 0.8f),
            _ => new Color(0.5f, 0.5f, 0.6f)
        };
    }
    
    private void AddGothicPatternToImage(Image image, Color baseColor)
    {
        var layerName = _layerData.Name.ToLower();
        var width = image.GetWidth();
        var height = image.GetHeight();
        
        // Add simple gothic patterns
        if (layerName.Contains("cathedral") || layerName.Contains("castle"))
        {
            // Add vertical lines to simulate gothic architecture
            var accentColor = baseColor.Lightened(0.2f);
            for (int x = 0; x < width; x += 120)
            {
                for (int y = 0; y < height; y++)
                {
                    if (x < width) image.SetPixel(x, y, accentColor);
                    if (x + 1 < width) image.SetPixel(x + 1, y, accentColor);
                }
            }
        }
        else if (layerName.Contains("stained") || layerName.Contains("glass"))
        {
            // Add colorful stained glass pattern
            var colors = new[]
            {
                new Color(1.0f, 0.2f, 0.2f, 0.8f),
                new Color(0.2f, 0.2f, 1.0f, 0.8f),
                new Color(1.0f, 1.0f, 0.2f, 0.8f),
                new Color(0.2f, 1.0f, 0.2f, 0.8f)
            };
            
            for (int i = 0; i < 20; i++)
            {
                var centerX = (int)(GD.Randf() * width);
                var centerY = (int)(GD.Randf() * height);
                var radius = (int)(GD.Randf() * 100) + 30;
                var color = colors[i % colors.Length];
                
                DrawCircleOnImage(image, centerX, centerY, radius, color);
            }
        }
        else if (layerName.Contains("floor") || layerName.Contains("stone"))
        {
            // Add stone tile pattern
            var darkColor = baseColor.Darkened(0.3f);
            for (int x = 0; x < width; x += 80)
            {
                for (int y = 0; y < height; y += 80)
                {
                    // Draw tile borders
                    DrawLineOnImage(image, x, y, x + 80, y, darkColor);
                    DrawLineOnImage(image, x, y, x, y + 80, darkColor);
                }
            }
        }
    }
    
    private void DrawCircleOnImage(Image image, int centerX, int centerY, int radius, Color color)
    {
        var radiusSquared = radius * radius;
        for (int x = centerX - radius; x <= centerX + radius; x++)
        {
            for (int y = centerY - radius; y <= centerY + radius; y++)
            {
                if (x >= 0 && x < image.GetWidth() && y >= 0 && y < image.GetHeight())
                {
                    var distanceSquared = (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY);
                    if (distanceSquared <= radiusSquared)
                    {
                        var existingColor = image.GetPixel(x, y);
                        var blendedColor = existingColor.Lerp(color, color.A);
                        image.SetPixel(x, y, blendedColor);
                    }
                }
            }
        }
    }
    
    private void DrawLineOnImage(Image image, int x1, int y1, int x2, int y2, Color color)
    {
        var dx = Math.Abs(x2 - x1);
        var dy = Math.Abs(y2 - y1);
        var sx = x1 < x2 ? 1 : -1;
        var sy = y1 < y2 ? 1 : -1;
        var err = dx - dy;
        
        while (true)
        {
            if (x1 >= 0 && x1 < image.GetWidth() && y1 >= 0 && y1 < image.GetHeight())
            {
                image.SetPixel(x1, y1, color);
            }
            
            if (x1 == x2 && y1 == y2) break;
            
            var e2 = 2 * err;
            if (e2 > -dy)
            {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx)
            {
                err += dx;
                y1 += sy;
            }
        }
    }
    
    private void SetupShader()
    {
        if (string.IsNullOrEmpty(_layerData.Shader)) return;
        
        // Load shader if specified
        // For now, we'll create basic shader materials for common effects
        if (_layerData.EnableAnimatedLighting || _layerData.LightingAnimation != null)
        {
            CreateAnimatedLightingShader();
        }
    }
    
    private void CreateAnimatedLightingShader()
    {
        // Create a simple animated lighting shader material
        var shaderCode = @"
shader_type canvas_item;

uniform float time : hint_range(0.0, 10.0) = 0.0;
uniform float intensity : hint_range(0.0, 2.0) = 1.0;
uniform vec4 base_color : hint_color = vec4(1.0);
uniform bool enable_flicker = false;
uniform bool enable_pulse = false;

void fragment() {
    vec4 tex_color = texture(TEXTURE, UV);
    float effect = 1.0;
    
    if (enable_flicker) {
        effect *= 0.8 + 0.4 * sin(time * 8.0 + UV.x * 10.0);
    }
    
    if (enable_pulse) {
        effect *= 0.7 + 0.3 * sin(time * 2.0);
    }
    
    COLOR = tex_color * base_color * intensity * effect;
}";
        
        var shader = new Shader();
        shader.Code = shaderCode;
        
        _shaderMaterial = new ShaderMaterial();
        _shaderMaterial.Shader = shader;
        _shaderMaterial.SetShaderParameter("base_color", _originalTint);
        _shaderMaterial.SetShaderParameter("intensity", 1.0f);
        
        if (_layerData.LightingAnimation != null)
        {
            _shaderMaterial.SetShaderParameter("enable_flicker", _layerData.LightingAnimation.Flicker);
            _shaderMaterial.SetShaderParameter("enable_pulse", _layerData.LightingAnimation.IntensityPulse);
        }
        
        _sprite.Material = _shaderMaterial;
    }
    
    private void SetupPosition()
    {
        Position = new Vector2(_layerData.Position[0], _layerData.Position[1]);
        ZIndex = (int)(_layerData.Depth * 100); // Convert depth to Z-index
    }
    
    private void SetupAnimation()
    {
        if (_layerData.Animation == null) return;
        
        // Animation will be handled in _Process
    }
    
    public override void _Process(double delta)
    {
        _animationTime += (float)delta;
        
        UpdateAnimation(delta);
        UpdateLightingAnimation(delta);
        UpdateEffects(delta);
    }
    
    private void UpdateAnimation(double delta)
    {
        if (_layerData.Animation == null) return;
        
        var animation = _layerData.Animation;
        var effectIntensity = _effectIntensity;
        
        switch (animation.Type.ToLower())
        {
            case "float":
                Position = _originalPosition + new Vector2(
                    0, 
                    Mathf.Sin(_animationTime * animation.Speed) * animation.Amplitude * effectIntensity
                );
                break;
                
            case "sway":
                Position = _originalPosition + new Vector2(
                    Mathf.Sin(_animationTime * animation.Speed) * animation.Amplitude * effectIntensity,
                    0
                );
                break;
                
            case "subtle_sway":
                Position = _originalPosition + new Vector2(
                    Mathf.Sin(_animationTime * animation.Speed * 0.5f) * animation.Amplitude * effectIntensity,
                    Mathf.Cos(_animationTime * animation.Speed * 0.7f) * animation.Amplitude * 0.5f * effectIntensity
                );
                break;
                
            case "scroll":
                Position = _originalPosition + new Vector2(
                    animation.Direction[0] * _animationTime * animation.Speed,
                    animation.Direction[1] * _animationTime * animation.Speed
                );
                break;
                
            case "pulse_glow":
                var pulse = 0.5f + 0.5f * Mathf.Sin(_animationTime * animation.Speed);
                _sprite.Modulate = _originalTint * (1.0f + pulse * animation.Amplitude * effectIntensity);
                break;
                
            case "gentle_sway":
                Position = _originalPosition + new Vector2(
                    Mathf.Sin(_animationTime * animation.Speed) * animation.Amplitude * effectIntensity * 0.3f,
                    Mathf.Cos(_animationTime * animation.Speed * 1.3f) * animation.Amplitude * effectIntensity * 0.2f
                );
                break;
        }
    }
    
    private void UpdateLightingAnimation(double delta)
    {
        if (_layerData.LightingAnimation == null || _shaderMaterial == null) return;
        
        _shaderMaterial.SetShaderParameter("time", _animationTime);
        
        var lighting = _layerData.LightingAnimation;
        if (lighting.IntensityPulse)
        {
            var pulseIntensity = Mathf.Lerp(
                lighting.Intensity[0], 
                lighting.Intensity[1],
                0.5f + 0.5f * Mathf.Sin(_animationTime * lighting.Speed)
            );
            _shaderMaterial.SetShaderParameter("intensity", pulseIntensity * _effectIntensity);
        }
    }
    
    private void UpdateEffects(double delta)
    {
        if (_isGlowing)
        {
            _glowTimer += (float)delta;
            if (_glowTimer >= _glowDuration)
            {
                _isGlowing = false;
                _sprite.Modulate = _originalTint;
            }
            else
            {
                var progress = _glowTimer / _glowDuration;
                var glowIntensity = 1.0f - progress; // Fade out
                var currentColor = _originalTint.Lerp(_glowColor, glowIntensity);
                _sprite.Modulate = currentColor;
            }
        }
    }
    
    // Public effect methods
    public void ApplyGlowEffect(Color glowColor, float duration)
    {
        _isGlowing = true;
        _glowColor = glowColor;
        _glowDuration = duration;
        _glowTimer = 0f;
    }
    
    public void CreateLightFlare(Color flareColor, float duration, float intensity)
    {
        // Create a temporary bright flash effect
        var originalModulate = _sprite.Modulate;
        _sprite.Modulate = flareColor * intensity;
        
        var tween = CreateTween();
        tween.TweenProperty(_sprite, "modulate", originalModulate, duration);
    }
    
    public void ActivateSymbolGlow(float intensity, float duration)
    {
        if (_layerData.Name.ToLower().Contains("symbol"))
        {
            var glowColor = new Color(0.8f, 0.6f, 1.0f, 0.8f);
            ApplyGlowEffect(glowColor * intensity, duration);
        }
    }
    
    public void SetEffectIntensity(float intensity)
    {
        _effectIntensity = Mathf.Clamp(intensity, 0.0f, 2.0f);
    }
    
    public void SetLayerVisible(bool visible)
    {
        Visible = visible;
    }
    
    public void SetLayerAlpha(float alpha)
    {
        var color = _sprite.Modulate;
        color.A = alpha;
        _sprite.Modulate = color;
    }
}