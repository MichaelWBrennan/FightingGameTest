# Open Source Animation Resources

This document outlines the open source animation resources that can be used for the new characters in the Fighting Game Platform.

## Animation Sources

### Primary Sources
1. **OpenGameArt.org** - Community-driven open source game assets
2. **Mixamo** - Adobe's free character animation service (CC0 license for personal/commercial use)
3. **Kenney.nl** - High-quality game assets with generous licensing
4. **FreeSVG.org** - Vector animations that can be adapted for 2D fighters
5. **LPC (Liberated Pixel Cup)** - Community art project with fighting-compatible sprites

## Character-Specific Animation Plans

### Sagat (Zoner Archetype)
**Animation Style**: Muay Thai inspired, tall imposing stance
**Sources**:
- Base idle stance: Mixamo "Idle" animation adapted for 2D
- Tiger Shot animations: Custom projectile animations using OpenGameArt fire/energy effects
- Walking animations: Modified Mixamo walking cycles
- Muay Thai strikes: Combination of Mixamo martial arts pack + custom keyframes

**Required Animations**:
- `sagat_idle_muay_thai_stance` - Standing guard position
- `sagat_walk_forward_measured` - Slow, deliberate forward movement
- `sagat_tiger_shot_high` - High projectile throwing motion
- `sagat_tiger_shot_low` - Low projectile throwing motion
- `sagat_tiger_uppercut` - Rising uppercut with knee movement
- `sagat_tiger_knee` - Forward advancing knee strike

### Lei Wulong (Technical Archetype)
**Animation Style**: Fluid martial arts with animal-inspired movements
**Sources**:
- Base animations: Mixamo martial arts collection
- Animal stance inspirations: Reference videos + custom animation
- Transition animations: Morph targets between stances
- Complex combo animations: Frame-by-frame custom work

**Required Animations**:
- `lei_idle_neutral_stance` - Balanced ready position
- `lei_dragon_stance` - Powerful, rooted stance
- `lei_snake_stance` - Low, evasive position
- `lei_crane_stance` - One-legged balance pose
- `lei_tiger_stance` - Aggressive forward-leaning pose
- `lei_leopard_stance` - Quick, mobile stance
- `lei_stance_transition_*` - Fluid transitions between stances

## Animation Licensing

### Mixamo Content
- **License**: Free for commercial use
- **Attribution**: Not required but appreciated
- **Modifications**: Freely allowed
- **Usage**: Perfect for base movements that can be adapted for 2D

### OpenGameArt.org
- **License**: Varies (CC0, CC BY, CC BY-SA)
- **Attribution**: Check individual asset requirements
- **Quality**: Community-submitted, varies
- **Usage**: Great for effects, projectiles, and sprite bases

### Custom Animation Guidelines
For animations not available from open sources:
1. **Reference-based creation**: Use video references of real martial arts
2. **Sprite sheet format**: 24-frame animations at 60fps (4-frame intervals)
3. **Consistent style**: Match existing character art style
4. **Frame data alignment**: Animation frames must match gameplay frame data

## Technical Implementation

### Animation Format
- **File Type**: `.tres` (Godot AnimationPlayer resources)
- **Frame Rate**: 60 FPS base, downsampled as needed
- **Sprite Size**: 128x128 base resolution for characters
- **Color Depth**: 32-bit RGBA for maximum quality

### Animation Naming Convention
```
[character]_[move_type]_[specific_name]
Examples:
- sagat_special_tiger_shot
- lei_stance_dragon_enter
- sagat_normal_heavy_punch
```

### Frame Data Integration
Each animation file includes metadata for:
- Startup frames (before hit detection)
- Active frames (hit detection active)
- Recovery frames (after hit detection)
- Hitbox positions and sizes
- Sound effect trigger points

## Asset Creation Pipeline

### For New Characters
1. **Concept Art**: Create reference sheets for each character
2. **Base Sprites**: Design idle pose and basic proportions
3. **Animation Planning**: Map out required animations per character
4. **Source Gathering**: Collect appropriate open source resources
5. **Adaptation**: Modify source animations to fit game style
6. **Integration**: Convert to Godot format with proper frame data
7. **Testing**: Verify animations in game with hitbox visualization

### Quality Standards
- **Smoothness**: Minimum 12 frames for basic moves, 24+ for complex moves
- **Consistency**: All characters should have similar animation quality
- **Readability**: Animations must be clear and readable at game speed
- **Performance**: Optimized for 60 FPS gameplay without frame drops

## Future Animation Expansion

### Community Contributions
- **Animation Contest**: Host contests for community-created animations
- **Mod Support**: Allow players to import custom animations
- **Style Variations**: Multiple animation styles per character
- **Seasonal Content**: Special animations for events and updates

### Technical Upgrades
- **Bone-based Animation**: Transition from sprite sheets to bone animation
- **Physics Integration**: Add cloth and hair physics to animations
- **Dynamic Lighting**: Shadows and lighting effects on characters
- **High-Resolution**: 4K character sprites for competitive displays

## Legal Considerations

### Asset Usage Rights
- All animations must be compatible with MIT license
- No proprietary content from commercial games
- Proper attribution maintained in credits
- Regular license compliance audits

### Community Contributions
- Contributors retain copyright while granting broad usage rights
- Contributor recognition in game credits
- Revenue sharing for significant contributions
- Open source spirit maintained throughout

This animation framework ensures that all characters can be implemented with high-quality, legally-compliant animations while maintaining the open source nature of the project.