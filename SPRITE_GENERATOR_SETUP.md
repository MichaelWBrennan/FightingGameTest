# Sprite Generator System - Step-by-Step Setup

## Quick Start Guide

### Step 1: Install Dependencies

```bash
# Install Python dependencies
pip install Pillow numpy

# Verify installation
python3 -c "import PIL, numpy; print('Dependencies ready!')"
```

### Step 2: Generate Your First Sprites

```bash
# Navigate to project directory
cd /path/to/FightingGameTest

# Generate sprites for Ryu
tools/sprite_generator/generate.sh single ryu

# Generate for all existing characters  
tools/sprite_generator/generate.sh all
```

### Step 3: Integrate with Godot

In your Godot scene, add this GDScript:

```gdscript
extends Node

func _ready():
    # Setup AnimatedSprite2D with generated sprites
    var animated_sprite = $AnimatedSprite2D
    SpriteGeneratorIntegration.setup_animated_sprite(animated_sprite, "ryu", true)
    
    # Or use the animation controller
    var controller = FighterAnimationController.new()
    controller.character_id = "ken"
    add_child(controller)
```

### Step 4: Validate Setup

```bash
# Run validation to ensure everything works
python3 tools/sprite_generator/validate.py

# Run integration example
tools/sprite_generator/generate.sh example
```

## Advanced Usage

### Create New Characters

```bash
# Generate a new character with custom settings
tools/sprite_generator/generate.sh new akuma --palette sagat --archetype technical --dithering

# Batch create multiple new characters
tools/sprite_generator/generate.sh new cammy guile blanka --enhanced-only
```

### Customize Palettes

Edit `tools/sprite_generator/sprite_generator.py` and add to `ColorPalette.PALETTES`:

```python
"my_character": {
    "skin": [(255, 220, 177), (235, 200, 157), (215, 180, 137)],
    "hair": [(139, 69, 19), (160, 82, 45), (101, 67, 33)],
    "gi_primary": [(0, 255, 0), (0, 220, 0), (0, 180, 0)],  # Green gi
    "gi_secondary": [(255, 255, 255), (240, 240, 240), (220, 220, 220)],
    "belt": [(255, 215, 0), (255, 193, 37), (255, 165, 0)],
    "eyes": [(0, 100, 200), (0, 80, 180), (0, 60, 160)],
    "outline": [(0, 0, 0), (32, 32, 32), (64, 64, 64)]
}
```

### Build Pipeline Integration

Add to your build script:

```bash
#!/bin/bash
# Generate sprites before building game
tools/sprite_generator/generate.sh all --enhanced-only

# Validate sprites
python3 tools/sprite_generator/validate.py

# Continue with normal build process
# ... rest of build script
```

## Troubleshooting

### Common Issues

1. **"PIL not available"**
   ```bash
   pip install Pillow
   ```

2. **"Permission denied"**
   ```bash
   chmod +x tools/sprite_generator/generate.sh
   ```

3. **"Project root not found"**
   ```bash
   # Specify project root explicitly
   python3 tools/sprite_generator/batch_generator.py --project-root /path/to/project --all-existing
   ```

4. **"Sprites not loading in Godot"**
   - Check file paths match: `res://assets/sprites/street_fighter_6/{character}/sprites/`
   - Verify sprite dimensions: 64x96 (original) or 256x384 (enhanced)
   - Ensure PNG format with transparency

### Getting Help

- Check the full documentation: `tools/sprite_generator/README.md`
- Run validation script: `python3 tools/sprite_generator/validate.py`
- View examples: `python3 tools/sprite_generator/integration_example.py`

## System Requirements

- Python 3.8+
- PIL/Pillow library
- NumPy library  
- Godot 4.4+
- 50MB+ disk space for generated sprites

## File Structure After Setup

```
assets/sprites/street_fighter_6/
├── ryu/sprites/
│   ├── ryu_idle.png              # 64x96 original
│   ├── ryu_idle_enhanced.png     # 256x384 enhanced
│   ├── ryu_walk.png
│   ├── ryu_walk_enhanced.png
│   ├── ryu_attack.png
│   ├── ryu_attack_enhanced.png
│   ├── ryu_jump.png
│   └── ryu_jump_enhanced.png
└── [other_characters]/sprites/...

tools/sprite_generator/
├── sprite_generator.py    # Core generator
├── batch_generator.py     # Batch processing
├── godot_integration.gd   # GDScript integration  
├── generate.sh           # CLI wrapper
└── README.md             # Full documentation
```

The system is now ready for production use! 🎮