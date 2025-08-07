# Sub-Archetype System

The Fighting Game Test now includes a comprehensive sub-archetype system that allows every character to switch between 3 different versions of their archetype, providing strategic depth and variety.

## Overview

Each character now has 3 sub-archetypes that modify their playstyle while maintaining their core archetype identity:

- **Default Variation**: The classic version of the character
- **Aggressive/Pressure Variation**: More offensive-focused gameplay
- **Technical/Specialized Variation**: Complex mechanics for advanced players

## Character Sub-Archetypes

### Ryu (Shoto)
- **Traditional**: Balanced fundamentals-focused playstyle
- **Aggressive**: Faster, more offensive with enhanced pressure tools
- **Technical**: Complex execution with advanced techniques and new moves

### Chun-Li (Rushdown)  
- **Pressure**: Frame advantage focused rushdown
- **Mix-up**: High-low mix-up specialist with overhead attacks
- **Mobile**: Enhanced movement with air dashes and mobility specials

### Zangief (Grappler)
- **Pure**: Maximum grappling power with enhanced command grabs
- **Strike**: Enhanced normal attacks and strike-grab mixups  
- **Technical**: Complex command grab setups and mix-up options

### Sagat (Zoner)
- **Pure**: Maximum projectile effectiveness and keep-away
- **Trap**: Setup-focused zoning with delayed attacks
- **Mobile**: Movement-based zoning with enhanced mobility

### Lei Wulong (Technical)
- **Stance**: Maximum stance variety and transition options
- **Setup**: Trap and okizeme specialist with enhanced knockdown advantage
- **Evasive**: Enhanced defensive options with superior evasion tools

### Ken (Balanced)
- **Fundamental**: Well-rounded classic Ken approach
- **Aggressive**: Rushdown-focused with enhanced pressure tools
- **Technical**: Complex combo routes and advanced techniques

## System Features

### Stat Modifications
Sub-archetypes can modify base character stats:
- Health multipliers (0.9x - 1.1x)
- Movement speed adjustments
- Jump height modifications
- Weight changes affecting combos

### Move Modifications
Individual moves can be enhanced or altered:
- Damage multipliers
- Frame data adjustments (startup/recovery)
- Block/hit advantage changes
- Property additions/removals

### Additional Moves
Some sub-archetypes gain exclusive new moves:
- Technical Ryu gains Focus Attack
- Mix-up Chun-Li gains Overhead Axe Kick
- Mobile variants gain movement specials
- Technical variants gain advanced techniques

## Developer Console Commands

Test the sub-archetype system using these commands (press F1 to open console):

```
testsubarchetypes              # Test all character sub-archetypes
subarchetypes ryu              # List Ryu's available sub-archetypes  
setsubarchetype ryu aggressive # Apply Aggressive Shoto to Ryu
```

## Technical Implementation

The system uses:
- **JSON-based configuration** for easy balance adjustments
- **Data-driven modifications** applied at runtime
- **Deep copy preservation** of original character data  
- **Modular sub-archetype manager** for clean code organization

## Balance Philosophy

Sub-archetypes maintain competitive balance by:
- Keeping total power level equivalent across variations
- Trading strengths for weaknesses (e.g., speed for health)
- Providing different viable strategies rather than strict upgrades
- Maintaining archetype identity while adding variety

## Usage in Character Selection

Characters can be selected with their desired sub-archetype:
```csharp
character.SetSubArchetype("aggressive");  // Apply sub-archetype
character.LoadCharacterData();           // Reload with modifications
```

The system is fully backward compatible - existing characters work unchanged with their default sub-archetype automatically applied.