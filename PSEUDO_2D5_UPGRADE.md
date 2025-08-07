# Pseudo 2.5D Graphics Upgrade

## Overview

This document describes the enhanced pseudo 2.5D graphics system implemented for the Fighting Game Platform, inspired by the visual styles of BlazBlue and Skullgirls. The system creates a convincing 3D appearance using 2D assets while maintaining compatibility and performance.

## New Systems Added

### 1. Pseudo2D5Manager
**Location**: `scripts/graphics/Pseudo2D5Manager.cs`

Central manager for all pseudo 2.5D effects, handling:
- **Depth Layer Management**: Organizes sprites into depth layers with proper Z-ordering
- **Parallax Effects**: Multi-layer background scrolling for depth illusion
- **Pseudo Lighting**: Sprite-based lighting system that affects 2D characters realistically
- **Screen Distortion**: Impact effects that bend the screen for dramatic moments

**Key Features**:
```csharp
// Register a sprite for parallax depth
Pseudo2D5Manager.Instance.RegisterParallaxNode(sprite, -1.5f, DepthLayer.BackgroundMid);

// Create dynamic lighting
var light = Pseudo2D5Manager.Instance.CreatePseudoLight(position, Colors.Orange, 1.2f);

// Apply lighting to characters
Pseudo2D5Manager.Instance.ApplyPseudo2D5Lighting(character);
```

### 2. Enhanced2D5ParticleSystem  
**Location**: `scripts/graphics/Enhanced2D5ParticleSystem.cs`

Advanced particle system optimized for fighting game visuals:
- **Depth-Aware Particles**: Particles render at proper depth layers
- **Fighting Game Effects**: Specialized effects for impacts, combos, slashes, magic
- **Performance Optimized**: Efficient cleanup and memory management
- **Camera Integration**: Automatic screen shake and camera effects

**Particle Types**:
- Impact, Explosion, Energy, Sparks
- Lightning, Fire, Ice, Wind
- BloodSpray, MagicBurst, SwordSlash
- Shockwave, ComboHit

**Usage Examples**:
```csharp
// Create impact effect
Enhanced2D5ParticleSystem.Instance.CreateImpactEffect(
    position, power: 0.8f, Colors.Orange, ParticleType.Impact
);

// Create combo visualization
Enhanced2D5ParticleSystem.Instance.CreateComboEffect(
    position, comboCount: 15, Colors.Yellow
);

// Create sword slash trail
Enhanced2D5ParticleSystem.Instance.CreateSlashEffect(
    startPos, endPos, Colors.Cyan, width: 12.0f
);
```

### 3. CinematicCameraSystem
**Location**: `scripts/graphics/CinematicCameraSystem.cs`

Dynamic camera system for dramatic combat cinematography:
- **Player Tracking**: Automatically frames both players optimally
- **Cinematic Modes**: Preset camera angles (CloseUp, WideShot, DramaticAngle, etc.)
- **Screen Shake**: Impact-responsive camera shake
- **Smooth Transitions**: Tween-based camera movement
- **Dramatic Movements**: Bezier curve camera paths for special moves

**Cinematic Modes**:
```csharp
// Set dramatic camera angle
CinematicCameraSystem.Instance.SetCinematicMode(
    CinematicMode.DramaticAngle, transitionTime: 0.8f
);

// Add impact shake
CinematicCameraSystem.Instance.AddScreenShake(0.5f, 0.3f);

// Create dramatic arc movement
CinematicCameraSystem.Instance.CreateDramaticMovement(
    startPos, endPos, duration: 2.0f
);
```

## Enhanced Shaders

### 1. Pseudo2D5Character.gdshader
**Location**: `assets/shaders/combat/Pseudo2D5Character.gdshader`

Advanced character shader for pseudo 3D lighting:
- **Normal Map Simulation**: Creates pseudo normals from sprite data
- **BlazBlue-style Rim Lighting**: Enhanced character silhouettes
- **Dynamic Lighting Response**: Reacts to pseudo light sources
- **Energy Animation**: Pulsing energy effects for special states
- **Depth Shadows**: Subtle shadowing for 3D appearance

**Shader Parameters**:
- `ambient_color`: Base ambient lighting color
- `main_light_color`: Primary directional light color
- `rim_light_color`: Rim lighting color for character outline
- `lighting_intensity`: Overall lighting strength
- `rim_power`: Rim effect falloff control
- `enable_energy_pulse`: Animated energy effects

### 2. Pseudo2D5Background.gdshader
**Location**: `assets/shaders/combat/Pseudo2D5Background.gdshader`

Multi-layer background shader for depth effects:
- **Parallax Integration**: Shader-level parallax scrolling
- **Atmospheric Perspective**: Distance-based color and brightness changes
- **Depth Fog**: Fog effects for distant layers
- **Wind Animation**: Subtle movement for environmental elements
- **Heat Haze**: Distortion effects for dramatic stages

**Shader Parameters**:
- `depth_layer`: Layer depth for parallax calculation
- `parallax_strength`: Parallax effect intensity
- `enable_depth_fog`: Distance fog for far layers
- `enable_wind_animation`: Environmental movement
- `enable_heat_haze`: Heat distortion effects

### 3. Enhanced CharacterHighlight.gdshader
**Location**: `assets/shaders/combat/CharacterHighlight.gdshader`

Updated character highlight shader with pseudo 2.5D integration:
- **Pseudo Depth Integration**: Works with the depth lighting system
- **Enhanced Rim Effects**: More sophisticated character outlining
- **Dynamic Energy Flow**: Animated energy patterns
- **Shadow Integration**: Coordinated with pseudo lighting

## Integration with Existing Systems

### Graphics Manager Integration
The pseudo 2.5D systems integrate seamlessly with the existing `CuttingEdgeGraphicsManager`:

```csharp
// Enhanced impact effects with 2.5D
public void OnCombatImpact(Vector2 position, float power, string moveType)
{
    // Traditional effects
    _graphicsManager.ApplyImpactEffect(character, position, power);
    
    // Enhanced 2.5D effects
    Enhanced2D5ParticleSystem.Instance.CreateImpactEffect(
        position, power, Colors.Orange, ParticleType.Impact
    );
    
    // Camera response
    CinematicCameraSystem.Instance.AddScreenShake(power * 0.3f);
    
    // Screen distortion
    Pseudo2D5Manager.Instance.CreateDepthDistortion(position, power, 0.4f);
}
```

### Character System Integration
Characters automatically benefit from the pseudo 2.5D lighting:

```csharp
// In character update loop
public override void _Process(double delta)
{
    base._Process(delta);
    
    // Apply pseudo 2.5D lighting
    if (Pseudo2D5Manager.Instance != null)
    {
        Pseudo2D5Manager.Instance.ApplyPseudo2D5Lighting(this);
    }
}
```

## Performance Optimizations

### Depth Layer Management
- Sprites are organized into canvas layers by depth
- Efficient Z-ordering without performance cost
- Automatic layer assignment based on sprite type

### Particle Optimization
- Maximum particle limits prevent performance degradation
- Automatic cleanup of expired effects
- Efficient memory management with object pooling concepts
- LOD system for distant effects

### Shader Efficiency
- All shaders use efficient algorithms
- Conditional compilation for optional effects
- Optimized normal calculation from sprite data
- Minimal texture sampling for performance

## Visual Effects Showcase

### Combat Enhancement
The pseudo 2.5D system dramatically enhances combat visuals:

1. **Impact Effects**: Multi-layered particle explosions with screen distortion
2. **Character Lighting**: Dynamic lighting that follows characters and attacks
3. **Environmental Depth**: Parallax backgrounds that react to camera movement
4. **Cinematic Moments**: Automatic camera work for dramatic combat sequences

### BlazBlue/Skullgirls Style Elements
- **Rim Lighting**: Enhanced character silhouettes similar to BlazBlue
- **Dynamic Camera Work**: Cinematic angles like Skullgirls' dramatic moments
- **Particle Density**: Rich particle effects for high-impact combat
- **Screen Effects**: Distortion and shake effects for powerful moves

## Demo Scene
**Location**: `scenes/graphics_demo/Enhanced2D5Demo.tscn`
**Script**: `scripts/graphics/Enhanced2D5DemoScene.cs`

The demo scene showcases all pseudo 2.5D features:
1. **Parallax Depth Demo**: Shows background layer separation
2. **Character Lighting Demo**: Dynamic lighting on characters
3. **Impact Effects Demo**: Various particle impact effects
4. **Slash Effects Demo**: Sword trail visualizations
5. **Magic Burst Demo**: Magical explosion effects
6. **Combo System Demo**: Escalating combo visual feedback
7. **Camera Cinematics Demo**: Dynamic camera movements and modes

**Controls**:
- `SPACE`: Next demo
- `ESC`: Return to main menu
- `ENTER`: Toggle effects on/off

## Usage Guidelines

### Setting Up Pseudo 2.5D Characters
```csharp
// 1. Apply the pseudo 2.5D character shader
var shader = GD.Load<Shader>("res://assets/shaders/combat/Pseudo2D5Character.gdshader");
var material = new ShaderMaterial { Shader = shader };
characterSprite.Material = material;

// 2. Configure shader parameters
material.SetShaderParameter("main_light_color", Colors.White);
material.SetShaderParameter("rim_light_color", characterColor.Lerp(Colors.White, 0.5f));
material.SetShaderParameter("lighting_intensity", 1.2f);

// 3. Add to players group for camera tracking
character.AddToGroup("players");
```

### Creating Layered Backgrounds
```csharp
// 1. Create background sprites with depth layers
var farBG = CreateBackgroundSprite("FarBackground", ...);
var midBG = CreateBackgroundSprite("MidBackground", ...);
var nearBG = CreateBackgroundSprite("NearBackground", ...);

// 2. Register for parallax effects
Pseudo2D5Manager.Instance.RegisterParallaxNode(farBG, -2.0f, DepthLayer.BackgroundFar);
Pseudo2D5Manager.Instance.RegisterParallaxNode(midBG, -1.0f, DepthLayer.BackgroundMid);
Pseudo2D5Manager.Instance.RegisterParallaxNode(nearBG, -0.3f, DepthLayer.BackgroundNear);

// 3. Apply background shader for atmospheric effects
var bgShader = GD.Load<Shader>("res://assets/shaders/combat/Pseudo2D5Background.gdshader");
// Apply to each background layer with appropriate depth settings
```

### Best Practices

1. **Layer Organization**: Use the depth layer system to organize visual elements
2. **Performance Monitoring**: Watch particle counts in intensive scenes
3. **Shader Parameters**: Adjust lighting parameters per character for visual variety
4. **Camera Settings**: Configure camera bounds to prevent unwanted movement
5. **Effect Intensity**: Scale particle and effect intensity based on hardware performance

## Technical Requirements

### Godot Version
- Godot 4.4+ with Forward Plus renderer
- C# scripting support required
- Shader compilation support for advanced effects

### Performance Profile
- **CPU Impact**: Low to moderate (efficient algorithms)
- **GPU Impact**: Moderate (shader-heavy effects)
- **Memory Usage**: Controlled (automatic cleanup systems)
- **Scalability**: Multiple quality presets available

### Compatibility
- **Platform**: All Godot-supported platforms
- **License**: 100% MIT licensed (commercial-friendly)
- **Dependencies**: No external libraries required
- **Integration**: Compatible with existing project systems

## Future Enhancements

Potential areas for expansion:
1. **3D Character Integration**: Support for 3D models in the pseudo 2.5D pipeline
2. **Advanced Post-Processing**: Screen-space effects and filters
3. **Texture Streaming**: High-resolution asset loading for detailed backgrounds
4. **Real-time Lighting**: Hardware-accelerated lighting when available
5. **VR Support**: Stereoscopic pseudo 2.5D for VR platforms

## Conclusion

The pseudo 2.5D graphics upgrade transforms the Fighting Game Platform into a visually stunning experience that rivals commercial fighting games. The system achieves the dramatic visual impact of games like BlazBlue and Skullgirls while maintaining:

- **2D Asset Compatibility**: Works with traditional 2D sprites
- **Performance Efficiency**: Optimized for smooth 60 FPS gameplay
- **Easy Integration**: Simple APIs for existing systems
- **Commercial Viability**: MIT licensed for commercial use
- **Extensibility**: Modular design for future enhancements

The result is a professional-quality graphics system that elevates the fighting game experience to industry standards while remaining accessible to developers and performant on a wide range of hardware.