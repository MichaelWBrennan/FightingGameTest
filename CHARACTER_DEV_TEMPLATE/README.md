# Character Development Template

This template provides a complete starting point for creating new characters in the Fighting Game Platform.

## Quick Start

1. **Copy this template folder** and rename it to your character's ID (e.g., `my_character`)
2. **Edit `character_config.json`** with your character's data
3. **Add animations** to the `animations/` folder
4. **Add sound effects** to the `sounds/` folder
5. **Customize behavior** in the `scripts/` folder if needed
6. **Test your character** using the developer console

## File Structure

```
CHARACTER_DEV_TEMPLATE/
├── character_config.json     # Main character data (REQUIRED)
├── animations/               # Character animations
│   ├── idle.tres            # Idle animation
│   ├── walk_forward.tres    # Walking animations
│   ├── attacks/             # Attack animations
│   └── specials/            # Special move animations
├── sounds/                  # Sound effects
│   ├── voice/               # Voice clips
│   ├── attacks/             # Attack sound effects
│   └── specials/            # Special move sounds
├── scripts/                 # Custom character scripts (optional)
│   └── character_behavior.cs
└── README.md               # This file
```

## Configuration Guide

### Basic Information
- `characterId`: Unique identifier (lowercase, no spaces)
- `name`: Display name for the character
- `archetype`: Character archetype (shoto, rushdown, grappler, zoner, technical)
- `complexity`: Difficulty level (easy, medium, hard, expert)

### Archetype Guidelines

**Shoto (Fundamentals-focused)**
- Balanced stats
- Fireball + Anti-air special
- Good for teaching fundamentals

**Rushdown (Pressure-focused)**
- High speed, lower health
- Fast moves with good frame advantage
- Mix-up heavy gameplay

**Grappler (Command grab-focused)**
- High health, slow movement
- Powerful command grabs
- Armor moves and high damage

**Zoner (Keep-away focused)**
- Multiple projectiles
- Strong normals at range
- Weak up close

**Technical (Complex mechanics)**
- Unique systems and mechanics
- High execution requirements
- Rewarding but difficult

### Frame Data Guidelines

**Startup Frames**: How long before the attack becomes active
- Light attacks: 3-5 frames
- Medium attacks: 6-10 frames  
- Heavy attacks: 10-15 frames
- Specials: 8-20 frames

**Recovery Frames**: How long after the attack ends
- Should balance risk vs reward
- Safer moves = less reward
- Higher damage = more recovery

**Frame Advantage**: Advantage/disadvantage on hit/block
- Light attacks: +1 to +4 on hit, -1 to +2 on block
- Medium attacks: +2 to +5 on hit, -3 to 0 on block
- Heavy attacks: Varies widely, often negative on block

### Move Properties

Common properties:
- `cancelable`: Can be canceled into specials/supers
- `launcher`: Launches opponent for juggle combos
- `low`: Must be blocked low
- `overhead`: Must be blocked high
- `projectile`: Ranged attack
- `invincible`: Has invincibility frames
- `armor`: Can absorb hits

### Combo Types

- `opener`: Starts combos, usually light attacks
- `linker`: Continues combos, medium attacks
- `ender`: Finishes combos, heavy attacks and specials

## Animation Requirements

### Required Animations
- `idle`: Character's neutral pose
- `walk_forward`: Moving forward
- `walk_backward`: Moving backward
- `jump`: Jumping motion
- `crouch`: Crouching pose
- `block`: Standing block
- `crouch_block`: Crouching block
- `hit`: Getting hit reaction
- `knockdown`: Being knocked down

### Attack Animations
Create separate animations for each move in your moveset:
- All normal attacks (light/medium/heavy punch/kick)
- All special moves
- All super moves

## Sound Guidelines

### Voice Clips
- Attack calls (for each special move)
- Hit reactions
- Victory quotes
- Selection quote

### Sound Effects
- Impact sounds for each attack
- Projectile launch/travel sounds
- Special move audio cues
- Super move dramatic audio

## Testing Your Character

1. **Copy to data/characters/**: Copy your `character_config.json` to the main characters folder
2. **Use Dev Console**: Press F1 and use `spawn [your_character_id]`
3. **Test Frame Data**: Use `framedata on` to verify your frame data
4. **Test Hitboxes**: Use `hitboxes on` to visualize collision boxes
5. **Balance Check**: Monitor telemetry data for balance issues

## Common Pitfalls

### Frame Data Issues
- **Too fast startup**: Makes moves too safe
- **Too much advantage**: Creates infinite pressure
- **Inconsistent scaling**: Breaks game balance

### Hitbox Problems
- **Overlapping boxes**: Can cause double hits
- **Missing frames**: Creates gaps in coverage
- **Wrong positioning**: Moves don't connect properly

### Balance Concerns
- **Too much damage**: Makes character overpowered
- **Too safe options**: Reduces risk/reward
- **No weaknesses**: Character has no counterplay

## Advanced Features

### Custom Mechanics
Create unique character mechanics by adding custom scripts:

```csharp
public partial class MyCharacterBehavior : CharacterBehavior
{
    public override void ProcessSpecialMechanic()
    {
        // Custom character logic here
    }
}
```

### Conditional Moves
Some moves can have different properties based on conditions:
- Counter hits
- Meter usage
- Health thresholds
- Opponent state

### Resource Management
Characters can have custom resource systems:
- Charge meters
- Install modes
- Stance systems
- Custom gauges

## Submission Guidelines

When your character is ready:

1. **Test thoroughly** with multiple players
2. **Document unique mechanics** in comments
3. **Provide balance justification** for unusual properties
4. **Include placeholder art** if final art isn't ready
5. **Submit for review** through the development pipeline

## Support

For questions about character development:
- Check the main DESIGN_DOC.md for system details
- Use the developer console for testing
- Review existing characters for examples
- Ask on the development Discord

Happy character creation!