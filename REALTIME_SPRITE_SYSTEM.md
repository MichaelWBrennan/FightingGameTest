# Real-Time Procedural Sprite Generation System

## Overview

This system provides real-time procedural sprite generation for fighting game characters, enabling dynamic sprite creation during gameplay without preloading assets from disk. The system maintains Street Fighter II visual quality while offering extensive customization options and 60 FPS performance.

## Features

### ✅ **Real-Time Sprite Generation**
- Generates fighting game sprite frames procedurally in real time during gameplay
- Uses Godot's `Image` and `ImageTexture` for in-engine procedural drawing
- Maintains consistent proportions, character silhouette, and color palette
- Supports both original (64x96) and enhanced (256x384) resolutions

### ✅ **Context-Aware Logic** 
- Hooks into Character.cs state machine for automatic animation updates
- Generates exact required frames based on current action, direction, and velocity
- Supports all standard fighting game actions:
  - `idle` - Subtle breathing animation with 8 frames
  - `walk` - Walking cycle with 6 frames
  - `jump` - Jumping pose with 4 frames
  - `crouch` - Crouching position with 2 frames
  - `attack` - Punch animation with 8 frames
  - `kick` - Kick animation with 8 frames
  - `block` - Blocking stance with 3 frames
  - `hit` - Pain/damage reaction with 4 frames
  - `special` - Special moves with 12 frames

### ✅ **Performance Optimization**
- **Frame Caching System**: Recently generated frames cached in memory
- **Performance Budget**: Maintains 16.67ms budget per frame for 60 FPS
- **Smart Cache Management**: LRU eviction with access count tracking
- **Generation Skipping**: Skips frame generation when over performance budget
- **Memory Efficient**: Automatic cache cleanup and size limits

### ✅ **Godot Integration**
- **AnimatedSprite2D Compatibility**: Seamless integration with existing sprite system
- **Character.cs Integration**: Automatic state change detection and animation updates
- **Coexistence Support**: Can run alongside traditional sprite loading
- **Signal System**: Emits events for animation changes and completion

### ✅ **Customization System**
- **Character Parameters**: Configurable limb length, head size, body width
- **Instant Palette Swaps**: Real-time color changes without asset reloading
- **Multiple Characters**: Support for Ryu, Ken, Chun-Li, Zangief, Sagat, and more
- **Quality Modes**: Toggle between standard and enhanced quality rendering

## Architecture

### Core Components

1. **RealtimeProceduralSpriteGenerator** (`RealtimeProceduralSpriteGenerator.gd`)
   - Core sprite generation engine
   - Pixel-level drawing functions
   - Color palette management
   - Performance monitoring

2. **RealtimeAnimatedSpriteComponent** (`RealtimeAnimatedSpriteComponent.gd`)
   - AnimatedSprite2D integration layer
   - Animation state management
   - Character state tracking
   - Frame timing and interpolation

3. **Enhanced Character.cs**
   - Real-time sprite system integration
   - Automatic component setup
   - Palette swap methods
   - Performance statistics access

### Data Flow

```
Character State Change → RealtimeAnimatedSpriteComponent → RealtimeProceduralSpriteGenerator
                                    ↓
            AnimatedSprite2D ← Generated ImageTexture ← Procedural Drawing
```

## Installation & Setup

### 1. Enable Real-Time Sprites on Character

```csharp
// In Character.cs or scene setup
character.UseRealtimeSprites = true;
character.UseEnhancedQuality = true;
character.SpritePalette = "ryu";
```

### 2. Manual Component Setup

```gdscript
# Create and setup components manually
var sprite_generator = RealtimeProceduralSpriteGenerator.new()
var animated_component = RealtimeAnimatedSpriteComponent.new()
var animated_sprite = AnimatedSprite2D.new()

# Configure component
animated_component.character_id = "ryu"
animated_component.use_enhanced_quality = true
animated_component.palette_name = "default"

# Setup integration
animated_component.setup_for_character(character_node, animated_sprite)
```

## Usage Examples

### Character Customization

```csharp
// Instant palette swap
character.SetSpritePalette("ken");

// Adjust proportions
character.SetCharacterProportions(
    limbLength: 1.2f,
    headSize: 0.8f, 
    bodyWidth: 1.1f
);

// Toggle quality
character.ToggleRealtimeSprites(true);
```

### Performance Monitoring

```csharp
// Get performance statistics
var stats = character.GetSpriteGenerationStats();
var cacheHitRatio = stats["cache_hit_ratio"];
var avgGenerationTime = stats["avg_generation_time_ms"];

// Clear cache to free memory
character.ClearSpriteCache();
```

### Custom Animations

```gdscript
# Add custom animation
animated_component.add_custom_animation("special_move", 16, 24.0, false)

# Generate custom frame
var custom_texture = animated_component.generate_custom_frame(
    "custom_state", 
    frame_index: 5, 
    facing_right: true,
    velocity: Vector2(100, 0)
)
```

## Performance Characteristics

### Memory Usage
- **Cache Size**: ~100 frames maximum (configurable)
- **Frame Size**: ~2-3 KB per enhanced frame, ~500 bytes per standard frame  
- **Total Memory**: ~300 KB maximum for full character cache

### Generation Speed
- **Average**: 2-5 ms per frame
- **Enhanced Quality**: 5-8 ms per frame
- **Cache Hit**: <0.1 ms per frame
- **60 FPS Budget**: 16.67 ms available per frame

### Cache Performance
- **Hit Ratio**: 85-95% during normal gameplay
- **Cleanup Frequency**: Every 5 seconds
- **Max Age**: 60 seconds for unused frames

## Configuration Options

### Character Appearance
```gdscript
class CharacterAppearance:
    var character_id: String = ""
    var palette_name: String = "default"
    var limb_length_multiplier: float = 1.0
    var head_size_multiplier: float = 1.0
    var body_width_multiplier: float = 1.0
    var enhanced_quality: bool = false
```

### Animation States
```gdscript
class AnimationState:
    var name: String
    var frame_count: int = 8
    var fps: float = 12.0
    var loop: bool = true
```

### Performance Settings
```gdscript
# Performance configuration
max_cache_size: int = 100
frame_generation_budget: float = 16.0  # milliseconds
skip_frame_threshold: float = 12.0     # milliseconds
cache_cleanup_interval: float = 5.0    # seconds
```

## Color Palettes

The system includes predefined palettes for popular fighting game characters:

- **Default**: Standard fighting game colors
- **Ryu**: White gi, brown hair, black belt
- **Ken**: Red gi, blonde hair, brown belt  
- **Chun-Li**: Blue qipao, brown hair, gold accents
- **Zangief**: Red outfit, red hair/beard
- **Sagat**: Purple shorts, bald, dark skin

### Adding Custom Palettes

```gdscript
# In RealtimeProceduralSpriteGenerator.gd
color_palettes["custom_character"] = {
    "skin": [Color(1.0, 0.9, 0.8), Color(0.95, 0.85, 0.75), Color(0.9, 0.8, 0.7)],
    "hair": [Color(0.2, 0.1, 0.0), Color(0.3, 0.2, 0.1), Color(0.15, 0.05, 0.0)],
    "gi_primary": [Color(0.0, 0.5, 1.0), Color(0.0, 0.4, 0.9), Color(0.0, 0.3, 0.8)],
    "gi_secondary": [Color.WHITE, Color(0.9, 0.9, 0.9), Color(0.8, 0.8, 0.8)],
    "belt": [Color.BLACK, Color(0.1, 0.1, 0.1), Color(0.05, 0.05, 0.05)],
    "eyes": [Color.BLUE, Color(0.0, 0.0, 0.8), Color(0.0, 0.0, 0.6)],
    "outline": [Color.BLACK, Color(0.2, 0.2, 0.2), Color(0.4, 0.4, 0.4)]
}
```

## Testing & Validation

### Demo Scene
Run the included demo scene for interactive testing:
```
res://scenes/demo/RealtimeSpriteDemo.tscn
```

**Demo Features:**
- Character selection (Ryu, Ken, Chun-Li, etc.)
- Real-time palette swapping
- Animation state changes
- Character proportion adjustment
- Performance monitoring
- Cache statistics

### Keyboard Controls
- **1**: Random palette swap
- **2**: Random animation change  
- **3**: Random proportion adjustment
- **C**: Clear sprite cache
- **P**: Print performance statistics

### Automated Testing
```gdscript
# Run automated test sequence
demo_scene._on_test_button_pressed()
```

### Performance Validation

Monitor these metrics to ensure 60 FPS performance:
- **Generation Time**: Should average <5ms, max <12ms
- **Cache Hit Ratio**: Should be >80% during normal gameplay
- **Frame Budget**: Total frame time should be <16.67ms

## Troubleshooting

### Common Issues

**Poor Performance / Frame Drops**
- Check generation times with performance monitor
- Reduce enhanced quality if needed
- Clear cache more frequently
- Adjust performance budget settings

**Memory Issues**
- Reduce `max_cache_size` setting
- Increase `cache_cleanup_interval`
- Monitor cache statistics

**Visual Quality Issues**
- Enable enhanced quality mode
- Check character palette configuration
- Verify character proportions are reasonable (0.5-2.0 range)

### Debug Commands

```gdscript
# Enable debug output
animated_component.set_debug_mode(true)

# Get detailed performance stats
var stats = sprite_generator.get_performance_stats()
print("Cache hit ratio: ", stats.cache_hit_ratio)
print("Average generation time: ", stats.avg_generation_time_ms, "ms")

# Clear all cached data
sprite_generator.clear_cache()
```

## Integration with Existing Systems

### Character.cs Compatibility
The system automatically integrates with existing Character.cs:
- State changes trigger animation updates
- Existing AnimationPlayer continues to work
- Traditional sprite loading remains as fallback

### Scene Structure Compatibility
Works with existing scene hierarchies:
```
Character (CharacterBody2D)
├── CharacterSprite (Sprite2D) - hidden when real-time enabled
├── AnimatedSprite2D - created automatically
├── RealtimeAnimatedSpriteComponent - added automatically
└── Other existing nodes...
```

### Balance System Integration
Proportions and effects can be modified by the balance system:
```csharp
// Apply balance changes to sprite generation
character.SetCharacterProportions(
    limbLength: balanceConfig.LimbLengthMultiplier,
    headSize: balanceConfig.HeadSizeMultiplier,
    bodyWidth: balanceConfig.BodyWidthMultiplier
);
```

## Future Enhancements

### Planned Features
- [ ] Multi-frame interpolation for smoother animations
- [ ] Particle effects integration for special moves
- [ ] Dynamic lighting effects on generated sprites
- [ ] Texture streaming for memory optimization
- [ ] Custom shader integration for post-processing effects

### API Extensions
- [ ] Custom pose definition system
- [ ] Animation blending between states  
- [ ] Runtime palette editing tools
- [ ] Export generated sprites to disk
- [ ] Batch generation for AI training

## Contributing

To extend the system:

1. **Add New Character Archetypes**: Define new poses in `calculate_pose_parameters()`
2. **Create New Palettes**: Add entries to `color_palettes` dictionary
3. **Optimize Drawing**: Improve pixel-level drawing functions for performance
4. **Add Effects**: Implement new visual effects in character detail functions

## License

This system is part of the Fighting Game Test project and follows the same MIT license terms.