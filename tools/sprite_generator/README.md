# Sprite Generator System Documentation

## Overview

The Sprite Generator System is a production-ready procedural sprite generator for 2D fighting game characters. It generates SF2-quality pixel art with configurable animations, palettes, and dimensions, fully compatible with Godot 4 and the existing Character.cs smart loading system.

## Features

- **Procedural Sprite Generation**: Creates recognizable fighting game characters with distinct visual characteristics
- **SF2-Quality Pixel Art**: Generates sprites that match Street Fighter 2 aesthetic standards
- **Configurable Parameters**: Customizable frame dimensions, color palettes, and character archetypes
- **Multi-Resolution Support**: Generates both original (64x96) and enhanced (256x384) resolution sprites
- **Batch Processing**: CLI tools for generating multiple characters at once
- **Godot Integration**: Seamless integration with existing Character.cs and AnimatedSprite2D systems
- **Smart Loading**: Compatible with the existing sprite loading fallback system
- **Error Handling**: Comprehensive error handling and validation

## Directory Structure

```
tools/sprite_generator/
├── sprite_generator.py      # Core sprite generation module
├── batch_generator.py       # Batch processing script
├── godot_integration.gd     # GDScript integration for Godot
└── README.md               # This documentation file
```

## Installation & Setup

### Prerequisites

- Python 3.8+
- PIL/Pillow library
- NumPy library
- Godot 4.4+

### Install Dependencies

```bash
pip install Pillow numpy
```

### Verify Installation

```bash
cd /path/to/FightingGameTest
python3 tools/sprite_generator/sprite_generator.py --help
```

## Core Components

### 1. Sprite Generator (`sprite_generator.py`)

The main sprite generation module that creates individual character sprites.

#### Key Classes:

- **`SpriteGenerator`**: Main sprite generation class
- **`ColorPalette`**: Manages character-specific color schemes
- **`FighterArchetype`**: Defines character body types and proportions
- **`SpriteConfig`**: Configuration settings for sprite generation

#### Supported Palettes:
- `ryu`: White gi with black belt
- `ken`: Red gi with blonde hair
- `chun_li`: Blue outfit with golden details
- `zangief`: Red outfit with muscular build
- `sagat`: Purple outfit with darker skin
- `lei_wulong`: White outfit with black trim

#### Supported Archetypes:
- `balanced`: Medium build, neutral stance
- `rushdown`: Lean build, forward stance
- `grappler`: Heavy build, wide stance
- `zoner`: Tall build, defensive stance
- `technical`: Medium build, precise stance

### 2. Batch Generator (`batch_generator.py`)

Handles mass generation of sprites for multiple characters.

#### Key Features:
- Auto-detects project structure
- Generates sprites for all existing characters
- Validates output against expected file structure
- Integrates with Godot asset directory structure

### 3. Godot Integration (`godot_integration.gd`)

GDScript integration for seamless use within Godot projects.

#### Key Classes:
- **`SpriteGeneratorIntegration`**: Static methods for sprite setup
- **`FighterAnimationController`**: Node-based animation controller
- **`AnimationConfig`**: Configuration for animation properties

## Usage Examples

### Generate Single Character

```bash
# Generate sprites for Ryu with default settings
python3 tools/sprite_generator/sprite_generator.py \
    --character ryu \
    --poses idle walk punch kick jump special

# Generate only enhanced resolution with custom palette
python3 tools/sprite_generator/sprite_generator.py \
    --character new_fighter \
    --palette ken \
    --archetype rushdown \
    --enhanced-only \
    --output-dir ./custom_sprites
```

### Batch Generation

```bash
# Generate for all existing characters
python3 tools/sprite_generator/batch_generator.py --all-existing

# Generate for specific characters with custom settings
python3 tools/sprite_generator/batch_generator.py \
    --characters ryu ken chun_li \
    --poses idle walk attack jump \
    --dithering

# Generate new characters not yet in project
python3 tools/sprite_generator/batch_generator.py \
    --new-characters akuma cammy guile \
    --enhanced-only
```

### Godot Integration

```gdscript
# Setup AnimatedSprite2D in GDScript
extends Node

func _ready():
    var animated_sprite = $AnimatedSprite2D
    
    # Setup with generated sprites
    SpriteGeneratorIntegration.setup_animated_sprite(
        animated_sprite, 
        "ryu", 
        true  # use enhanced quality
    )
    
    # Or create new AnimatedSprite2D
    var new_sprite = SpriteGeneratorIntegration.create_character_animated_sprite("ken")
    if new_sprite:
        add_child(new_sprite)
```

```gdscript
# Use FighterAnimationController for complex animation logic
extends Node

func _ready():
    var controller = FighterAnimationController.new()
    controller.character_id = "ryu"
    controller.use_enhanced_sprites = true
    add_child(controller)
    
    # Connect to animation events
    controller.animation_changed.connect(_on_animation_changed)
    
func perform_attack():
    var controller = $FighterAnimationController
    controller.change_state("attack")
    controller.queue_state("idle")  # Return to idle after attack
```

## Configuration Options

### Sprite Dimensions

| Parameter | Default | Enhanced | Description |
|-----------|---------|----------|-------------|
| `width` | 64 | 256 | Sprite width in pixels |
| `height` | 96 | 384 | Sprite height in pixels |
| `frames_per_animation` | 1 | 1 | Frames per animation (expandable) |

### Command Line Options

#### Single Character Generation
```bash
--character CHAR_ID          # Required: Character identifier
--poses POSE [POSE ...]      # Poses to generate (idle, walk, punch, kick, jump, special)
--palette PALETTE            # Color palette to use
--archetype ARCHETYPE        # Character archetype
--output-dir DIR             # Output directory
--width WIDTH                # Original sprite width (default: 64)
--height HEIGHT              # Original sprite height (default: 96)  
--enhanced-width WIDTH       # Enhanced sprite width (default: 256)
--enhanced-height HEIGHT     # Enhanced sprite height (default: 384)
--dithering                  # Apply retro dithering
--enhanced-only              # Generate only enhanced resolution
```

#### Batch Generation
```bash
--characters CHAR [CHAR ...] # Specific characters to generate
--all-existing               # Generate for all existing characters
--new-characters CHAR [...]  # Generate for new characters
--poses POSE [POSE ...]      # Poses to generate
--project-root PATH          # Project root path (auto-detected)
--dithering                  # Apply retro dithering
--enhanced-only              # Generate only enhanced resolution
```

## Integration with Existing System

### Character.cs Compatibility

The generated sprites are fully compatible with the existing Character.cs smart loading system:

```csharp
// Character.cs automatically loads generated sprites
private void LoadSpriteForState(CharacterState state)
{
    string spriteFileName = $"{CharacterId}_{state.ToString().ToLower()}.png";
    
    // Try enhanced version first, fallback to original
    string enhancedSpritePath = $"res://assets/sprites/street_fighter_6/{CharacterId}/sprites/{spriteFileName.Replace(".png", "_enhanced.png")}";
    string originalSpritePath = $"res://assets/sprites/street_fighter_6/{CharacterId}/sprites/{spriteFileName}";
    
    string spritePath = ResourceLoader.Exists(enhancedSpritePath) ? enhancedSpritePath : originalSpritePath;
    // ... rest of loading logic
}
```

### File Structure Integration

Generated sprites follow the existing project structure:
```
assets/sprites/street_fighter_6/
├── ryu/sprites/
│   ├── ryu_idle.png              # Generated original (64x96)
│   ├── ryu_idle_enhanced.png     # Generated enhanced (256x384)
│   ├── ryu_walk.png
│   ├── ryu_walk_enhanced.png
│   ├── ryu_attack.png
│   ├── ryu_attack_enhanced.png
│   ├── ryu_jump.png
│   └── ryu_jump_enhanced.png
└── [other_characters]/sprites/...
```

## Color Palette Customization

### Creating Custom Palettes

Add new palettes to the `ColorPalette.PALETTES` dictionary:

```python
"my_character": {
    "skin": [(255, 220, 177), (235, 200, 157), (215, 180, 137)],
    "hair": [(139, 69, 19), (160, 82, 45), (101, 67, 33)],
    "gi_primary": [(0, 255, 0), (0, 220, 0), (0, 180, 0)],  # Green gi
    "gi_secondary": [(255, 255, 255), (240, 240, 240), (220, 220, 220)],
    "belt": [(255, 215, 0), (255, 193, 37), (255, 165, 0)],  # Gold belt
    "eyes": [(0, 100, 200), (0, 80, 180), (0, 60, 160)],
    "outline": [(0, 0, 0), (32, 32, 32), (64, 64, 64)]
}
```

### Palette Color Meanings

| Color Key | Purpose | Example Usage |
|-----------|---------|---------------|
| `skin` | Character skin tones | Face, hands, exposed body parts |
| `hair` | Hair and facial hair | Hair, eyebrows, mustache/beard |
| `gi_primary` | Main clothing color | Gi, uniform, shirt |
| `gi_secondary` | Secondary clothing color | Trim, details, belt ties |
| `belt` | Belt and accessories | Belt, wristbands, shoes |
| `eyes` | Eye color | Eyes, sometimes special effects |
| `outline` | Outline and shadows | Black outlines, shadow details |

## Advanced Usage

### Custom Archetype Creation

Define new character archetypes in `FighterArchetype.ARCHETYPES`:

```python
"my_archetype": {
    "body_type": "custom",
    "stance": "unique",  
    "proportions": {"head": 0.15, "torso": 0.40, "legs": 0.45},
    "muscle_definition": "high"
}
```

### Pose Animation Mapping

The system maps poses to the existing animation naming:

| Generator Pose | Godot Animation | File Name |
|----------------|-----------------|-----------|
| `idle` | `idle` | `character_idle.png` |
| `walk` | `walk` | `character_walk.png` |
| `punch` | `attack` | `character_attack.png` |
| `kick` | `attack` | `character_attack.png` |
| `jump` | `jump` | `character_jump.png` |
| `special` | `attack` | `character_attack.png` |

### Multi-Frame Animation Support

While currently generating single-frame sprites, the system is designed for multi-frame expansion:

```python
# Future: Multi-frame generation
config = SpriteConfig(
    frames_per_animation=8,  # 8 frames per animation
    # ... other settings
)
```

## Error Handling

### Common Issues and Solutions

1. **Missing Dependencies**
   ```bash
   # Error: ModuleNotFoundError: No module named 'PIL'
   pip install Pillow numpy
   ```

2. **Permission Issues**
   ```bash
   # Ensure write permissions to output directory
   chmod 755 /path/to/output/directory
   ```

3. **Invalid Character ID**
   ```bash
   # Use valid character identifiers (letters, numbers, underscores)
   python3 tools/sprite_generator/sprite_generator.py --character valid_char_name
   ```

4. **Project Structure Detection**
   ```bash
   # Specify project root if auto-detection fails
   python3 tools/sprite_generator/batch_generator.py --project-root /path/to/project
   ```

### Validation and Testing

Use the built-in validation system:

```bash
# Generate and validate
python3 tools/sprite_generator/batch_generator.py --all-existing

# Check validation results
# Look for validation output in the console
```

## Build Pipeline Integration

### Automated Generation

Add sprite generation to your build pipeline:

```bash
#!/bin/bash
# build_sprites.sh

echo "Generating fighting game sprites..."

# Generate sprites for all characters
python3 tools/sprite_generator/batch_generator.py --all-existing

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Sprite generation successful"
else
    echo "❌ Sprite generation failed"
    exit 1
fi

echo "Sprites ready for Godot import"
```

### CI/CD Integration

```yaml
# .github/workflows/sprites.yml
name: Generate Sprites
on: 
  push:
    paths: ['tools/sprite_generator/**']

jobs:
  generate-sprites:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install Pillow numpy
      - run: python3 tools/sprite_generator/batch_generator.py --all-existing
      - uses: actions/upload-artifact@v3
        with:
          name: generated-sprites
          path: assets/sprites/
```

## Performance Considerations

### Memory Usage
- Original sprites: ~500 bytes each
- Enhanced sprites: ~2-3 KB each
- Total for 6 characters (4 poses each): ~60 KB enhanced, ~12 KB original

### Generation Speed
- Single character (4 poses): ~1-2 seconds
- Batch generation (6 characters): ~5-10 seconds
- Enhanced vs original: No significant speed difference

### Runtime Performance
- Sprites are optimized PNG files
- Compatible with Godot's texture streaming
- No impact on game FPS or loading times

## Troubleshooting

### Debug Mode

Enable verbose output for debugging:

```python
# Add to sprite_generator.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Common Error Messages

| Error | Cause | Solution |
|-------|--------|----------|
| "PIL not available" | Missing Pillow library | `pip install Pillow` |
| "Character data file not found" | Missing character JSON | Use existing character IDs |
| "Failed to load texture" | Invalid sprite file | Regenerate sprites |
| "Sprite file not found" | Missing sprite directory | Run batch generator first |

## Contributing

### Adding New Features

1. **New Character Archetypes**: Add to `FighterArchetype.ARCHETYPES`
2. **New Color Palettes**: Add to `ColorPalette.PALETTES`  
3. **New Poses**: Add to pose mapping in batch generator
4. **Animation Improvements**: Enhance drawing methods in `SpriteGenerator`

### Code Style

- Follow PEP 8 for Python code
- Use type hints for function parameters and returns
- Add comprehensive docstrings for all public methods
- Include error handling for all file operations

## Future Enhancements

### Planned Features
- Multi-frame animation generation
- Custom character template system
- Advanced shading and effects
- Sprite sheet format support
- Character customization GUI
- Animation timeline export

### Integration Roadmap
- Frame-by-frame animation system
- Special move sprite generation
- Victory pose animations
- Battle damage visual effects
- Character-specific particle effects

## License

This sprite generator system is released under the same license as the main project (MIT). Generated sprites can be used freely in commercial and non-commercial projects.

## Support

For issues and questions:
1. Check this documentation first
2. Look for existing GitHub issues
3. Create a new issue with reproduction steps
4. Include error messages and system information

The sprite generator system is designed to be robust and user-friendly while maintaining high-quality output suitable for professional fighting game development.