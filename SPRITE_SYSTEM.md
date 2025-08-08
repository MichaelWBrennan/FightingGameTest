# Fighter Sprites System

This document describes the basic 2D humanoid sprites created for the fighting game.

## Overview

Basic 2D humanoid sprites have been created for all 6 fighters in the game. Each fighter has distinct visual characteristics and 4 different poses to represent different actions.

## Characters

### Ryu
- **Visual Style**: Traditional karate fighter in white gi with red headband and belt
- **Archetype**: Shoto (balanced fundamental fighter)

### Ken  
- **Visual Style**: American fighter in yellow gi with blonde spiky hair
- **Archetype**: Shoto variant with aggressive tendencies

### Chun-Li
- **Visual Style**: Chinese fighter in blue qipao with distinctive hair buns (odango)
- **Archetype**: Speed/technical fighter with unique mechanics

### Zangief
- **Visual Style**: Large Russian wrestler with red shorts, chest hair, and wrestling belt
- **Archetype**: Grappler with increased size and strength

### Lei Wulong
- **Visual Style**: Police officer in dark purple outfit with gold badge and tie
- **Archetype**: Technical fighter with multiple stances

### Sagat
- **Visual Style**: Tall Muay Thai fighter with orange shorts, eye patch, and chest scar
- **Archetype**: Zoner with increased height and reach

## Sprite Poses

Each character has 4 basic poses:

1. **Idle**: Standing neutral position
2. **Walk**: Walking/movement animation frame
3. **Attack**: Attacking pose with extended arm (punch)
4. **Jump**: Jumping pose with raised arms and bent legs

## Technical Implementation

### File Structure
```
assets/sprites/street_fighter_6/[character]/sprites/
├── [character]_idle.png
├── [character]_walk.png
├── [character]_attack.png
└── [character]_jump.png
```

### Character.cs Integration
- **LoadCharacterSprite()**: Loads the appropriate sprite based on CharacterId
- **LoadSpriteForState()**: Dynamically switches sprites based on character state
- **CharacterSprite**: Sprite2D component reference for displaying character

### Scene Structure
- Updated `Character.tscn` to use `Sprite2D` instead of `ColorRect`
- Sprite is positioned and scaled appropriately for the character collision boxes
- Supports dynamic sprite switching during gameplay

## Sprite Specifications

- **Format**: PNG with transparency
- **Dimensions**: 64x96 pixels
- **Style**: Basic geometric humanoid forms with distinguishing colors and details
- **Rendering**: Pixel-perfect rendering suitable for 2D fighting game

## Testing

- All 24 sprites (6 characters × 4 poses) have been created and validated
- Sprite loading system integrated with existing Character class
- Test scene created to showcase all character sprites
- Build verification confirms no compilation errors

## Future Enhancements

Potential improvements for the sprite system:
- Animation frames for smooth movement transitions
- Additional poses (crouch, block, special moves)
- Higher resolution artwork
- Character-specific special move sprites
- Damage/hit reaction sprites