# 2D-HD Rendering Engine Documentation

## Overview

The 2D-HD Rendering Engine provides production-grade sprite rendering and pseudo-3D effects for fighting games in Godot 4. This system achieves high-quality visuals while maintaining 60 FPS performance at 1080p.

## Quick Start

### 1. Basic Setup

```gdscript
# Add to your character scene
var sprite_controller = preload("res://engine/actors/DynamicSpriteController.gd").new()
add_child(sprite_controller)

# Configure for your character
sprite_controller.set_action("idle", {"character_id": "ryu"})
sprite_controller.set_quality("MED")
```

### 2. Stage Setup

```gdscript
# Add pseudo-3D stage
var stage = preload("res://engine/stage/Stage2_5D.tscn").instantiate()
add_child(stage)
stage.stage_id = "dojo"
```

### 3. Render Profile Configuration

```gdscript
# Load and modify render settings
var profile = load("res://engine/render/render_profile.tres") as RenderProfile
profile.apply_quality_preset(RenderProfile.QualityLevel.HIGH)
```

## Core Systems

### Render Profile System

The `RenderProfile` resource controls all visual quality settings:

- **Quality Presets**: LOW, MED, HIGH, ULTRA
- **Performance Targets**: 30-120+ FPS depending on preset
- **Memory Management**: Configurable cache sizes and LOD thresholds
- **Feature Toggles**: Enable/disable individual rendering features

```gdscript
# Example: Configure custom profile
var profile = RenderProfile.new()
profile.quality_level = RenderProfile.QualityLevel.HIGH
profile.enable_hd_sprites = true
profile.enable_parallax = true
profile.parallax_layers = 7
profile.target_fps = 90
```

### Dynamic Sprite Controller

Intelligently chooses the best rendering method for each situation:

- **Sprite2D**: Single frame sprites (fastest)
- **AnimatedSprite2D**: Frame-based animation
- **Skeletal2D**: Bone-based animation (highest quality)

```gdscript
# API Usage
sprite_controller.set_action("punch", {"character_id": "chun_li", "frame": 0})
sprite_controller.set_palette(custom_palette_lut)
sprite_controller.set_quality("ULTRA")

# Get performance info
var stats = sprite_controller.get_performance_stats()
print("Render mode: ", stats["current_render_mode"])
```

### Texture Streaming

Efficient memory management for high-resolution assets:

```gdscript
# Preload textures for upcoming actions
TextureStreamer.preload_action_textures("ryu", ["punch", "kick", "special"])

# Manual texture loading
var texture = TextureStreamer.load_texture("res://assets/characters/ryu/ryu_atlas.tres")

# Cache management
var stats = TextureStreamer.get_cache_stats()
print("Cache usage: ", stats["cache_size_mb"], "MB")
```

## Shader Library

### sprite_lit.gdshader

Advanced 2D sprite lighting with:
- Normal and specular map support
- Real-time palette swapping via LUT
- Rim lighting effects
- BRDF-based lighting model

**Parameters:**
- `albedo_texture`: Main sprite texture
- `normal_texture`: Normal map for lighting
- `specular_texture`: Specular highlights
- `palette_lut`: Color palette lookup table
- `rim_intensity`: Rim lighting strength (0.0-5.0)

### mode7_floor.gdshader

Mode-7 style perspective floor rendering:
- Perspective warping based on screen Y position
- Heightmap support for elevation effects
- Shadow receiver for character shadows
- UV scrolling for animated floors

**Parameters:**
- `horizon_y`: Horizon line position (0.0-1.0)
- `perspective_strength`: Perspective effect intensity
- `floor_texture`: Main floor texture
- `heightmap_texture`: Height displacement map

### billboard_prop.gdshader

Depth-scaled billboard props:
- Y-position based scaling (closer = bigger)
- Soft distance fading for occlusion
- Optional normal mapping for detailed props
- Efficient batching support

**Parameters:**
- `depth_scale_factor`: How much Y position affects scale
- `fade_distance`: Distance for soft fade effect
- `prop_texture`: Billboard texture

### Post-Processing Shaders

- **post_bloom.gdshader**: Multi-quality bloom with lens dirt
- **post_dof_fake.gdshader**: Fake depth of field without Z-buffer
- **post_color_lut.gdshader**: Professional color grading with 3D LUTs

## Performance Guidelines

### Quality Presets

| Preset | Target FPS | Features | Use Case |
|--------|------------|----------|----------|
| LOW | 30 | Basic sprites, 4 parallax layers | Mobile, low-end |
| MED | 60 | HD sprites, bloom, 6 layers | Standard PC |
| HIGH | 90 | All effects, normal maps | High-end PC |
| ULTRA | 120+ | Maximum quality | Enthusiast |

### Memory Usage

- **LOW**: ~128MB texture cache
- **MED**: ~256MB texture cache (default)
- **HIGH**: ~512MB texture cache
- **ULTRA**: ~1GB texture cache

### Performance Tuning

1. **Reduce Parallax Layers**: Lower `parallax_layers` (4-7 recommended)
2. **Disable Heavy Effects**: Turn off DOF, motion blur for better performance
3. **Adjust Shadow Quality**: Lower `shadow_quality` (0-3)
4. **Reduce Light Count**: Limit `max_light_nodes` (4-12)
5. **Texture Streaming**: Enable `enable_texture_streaming` for memory efficiency

## Integration Guide

### Replacing Existing Character System

```csharp
// In Character.cs _Ready() method
private void SetupComponents()
{
    // ... existing code ...
    
    // Add dynamic sprite controller
    var spriteControllerScene = GD.Load<PackedScene>("res://engine/actors/DynamicSpriteController.gd");
    var spriteController = spriteControllerScene.Instantiate();
    AddChild(spriteController);
    
    // Configure for this character
    spriteController.Call("set_action", "idle", new Godot.Collections.Dictionary {
        {"character_id", CharacterId}
    });
}
```

### Stage Integration

```gdscript
# Replace basic background with pseudo-3D stage
extends Node2D

@onready var stage_2_5d = preload("res://engine/stage/Stage2_5D.tscn").instantiate()

func _ready():
    add_child(stage_2_5d)
    stage_2_5d.load_stage("dojo")
    stage_2_5d.set_camera(camera_2d)
```

## Troubleshooting

### Common Issues

**Shader Compilation Errors:**
- Ensure Godot 4.4+ with Forward Plus renderer
- Check shader syntax for platform compatibility
- Verify texture format support (prefer PNG with alpha)

**Performance Issues:**
- Use lower quality preset: `RenderProfile.QualityLevel.LOW`
- Disable heavy effects: `enable_fake_dof = false`
- Reduce cache sizes: `texture_cache_size_mb = 128`

**Memory Issues:**
- Monitor cache usage: `TextureStreamer.get_cache_stats()`
- Force cleanup: `TextureStreamer.clear_cache()`
- Reduce maximum texture resolution: `max_sprite_resolution = 1024`

**Sprite Loading Issues:**
- Verify file paths in sprite directory structure
- Check fallback to original sprites: Look for `_enhanced` suffix
- Enable verbose logging: Check console for load errors

### Debug Mode

Enable debug visualizations in shaders:

```gdscript
# In mode7_floor.gdshader, uncomment debug lines:
# COLOR = vec4(vec3(depth_factor * 0.1), 1.0);  # Show depth

# In sprite_lit.gdshader:
# COLOR = vec4(normal_sample.rgb, albedo_sample.a);  # Show normals
```

## Advanced Features

### Custom Palettes

```gdscript
# Create palette LUT texture
var palette_image = Image.create(256, 1, false, Image.FORMAT_RGB8)
# ... fill with color data ...
var palette_texture = ImageTexture.new()
palette_texture.create_from_image(palette_image)

# Apply to sprite controller
sprite_controller.set_palette(palette_texture)
```

### Skeletal Animation

```gdscript
# Load character rig
var rig = preload("res://engine/actors/CharacterRig2D.tscn").instantiate()
add_child(rig)

# Set poses
rig.set_pose("idle", 0.5)  # 0.5 second blend time
rig.play_punch_animation()

# Custom bone manipulation
rig.set_bone_transform("RightUpperArm", Transform2D(deg_to_rad(-90), Vector2(20, -20)))
```

### Lighting Setup

```gdscript
# Add dynamic lights to stage
stage_2_5d.add_dynamic_light("SpotLight", Vector2(100, -50), Color.YELLOW, 2.0)
stage_2_5d.add_dynamic_light("FillLight", Vector2(-100, 0), Color.CYAN, 1.0)

# Configure light properties via render profile
render_profile.max_light_nodes = 12
render_profile.light_shadow_resolution = 2048
```

## File Structure

```
engine/
├── render/
│   ├── render_profile.gd          # Quality settings and presets
│   ├── render_profile.tres        # Default configuration
│   └── shaders/
│       ├── sprite_lit.gdshader    # 2D-HD sprite lighting
│       ├── mode7_floor.gdshader   # Perspective floor effect
│       ├── billboard_prop.gdshader # Depth-scaled props
│       ├── post_bloom.gdshader    # High-quality bloom
│       ├── post_dof_fake.gdshader # Fake depth of field
│       └── post_color_lut.gdshader # 3D LUT color grading
├── actors/
│   ├── DynamicSpriteController.gd # Smart sprite rendering
│   ├── CharacterRig2D.gd         # Skeletal animation
│   └── CharacterRig2D.tscn       # Bone hierarchy
└── stage/
    ├── Stage2_5D.gd              # Pseudo-3D environment
    └── Stage2_5D.tscn            # Stage scene template

tools/SpriteBaker/                # Editor plugin for sprite processing
utils/texture_streamer.gd         # Async texture loading and caching
```

## Command Line Usage

```bash
# Set render quality from command line
--render_profile=LOW     # 30 FPS, basic effects
--render_profile=MED     # 60 FPS, standard quality (default)
--render_profile=HIGH    # 90 FPS, advanced effects
--render_profile=ULTRA   # 120+ FPS, maximum quality
```

## Best Practices

1. **Start with MED quality**: Good balance of performance and visuals
2. **Use texture streaming**: Enable for large sprite collections
3. **Profile regularly**: Monitor FPS and memory usage
4. **Batch sprite processing**: Use SpriteBaker for bulk operations
5. **Test on target hardware**: Validate performance on minimum spec
6. **Maintain backwards compatibility**: Always provide fallback paths

## Support

For issues or questions:
1. Check console output for error messages
2. Verify render profile settings match your hardware
3. Test with lower quality presets to isolate performance issues
4. Use debug modes in shaders to visualize rendering data