# Comprehensive Fighting Game Archetype System

This document describes the enhanced archetype system implemented in the Fighting Game Test platform, providing 10 main archetypes with 3 specialized sub-styles each for strategic depth and competitive variety.

## Overview

The comprehensive archetype system is based on fighting game analysis and provides:

- **10 Main Archetypes**: Core fighting game character types with distinct strategies
- **3 Sub-styles Each**: Specialized variations that capture different strategic applications
- **30 Total Variations**: Comprehensive coverage of competitive fighting game character designs
- **Developer Integration**: Full integration with character data, balance system, and developer tools

## Complete Archetype Breakdown

### 1. Shoto (All-Rounder)
The "template" character. Solid tools in all phases.

**Sub-styles:**
- **Fundamentalist**: Focused on spacing, punishes, and textbook play
  - Examples: Ryu (SF), Ky Kiske (GG)
  - Design Intent: Teach fighting game fundamentals
  
- **Pressure Shoto**: Trades balance for offensive momentum
  - Examples: Ken (SF), Terry Bogard (KoF)
  - Design Intent: Offensive-minded shoto approach
  
- **Unorthodox Shoto**: Retains shoto shell but alters core functions
  - Examples: Kyo Kusanagi (KoF), Leo Whitefang (GG)
  - Design Intent: Familiar but different gameplay

### 2. Rushdown
Aggressive, high-tempo characters that excel in close-range offense.

**Sub-styles:**
- **Speedster**: Overwhelms with sheer movement and frame advantage
  - Examples: Chipp Zanuff (GG), Cammy (SF)
  - Design Intent: Pure speed and aggression
  
- **Brawler**: High priority normals, frame traps, and raw damage
  - Examples: Dudley (SF), Jago (KI)
  - Design Intent: Raw power in close range
  
- **Mix-up Demon**: Low/throw or left/right vortex-focused pressure
  - Examples: Millia Rage (GG), El Fuerte (SF)
  - Design Intent: Force constant guessing games

### 3. Grappler
Dominates close-range via command grabs and hard reads.

**Sub-styles:**
- **Classic Grappler**: Slow, tanky, with massive command grabs
  - Examples: Zangief (SF), Tager (BB)
  - Design Intent: High risk, high reward grab specialist
  
- **Mobile Grappler**: Gains access through dashes, rolls, or ranged grabs
  - Examples: Laura (SFV), King (Tekken)
  - Design Intent: Modern grappler with mobility
  
- **Strike-Grab Hybrid**: Mixes in strong normals for ambiguous approach
  - Examples: Clark (KoF), Alex (SF)
  - Design Intent: Grappler with strong strike game

### 4. Zoner
Controls space and tempo with projectiles or range tools.

**Sub-styles:**
- **Projectile Zoner**: Uses fireballs or traps to wall opponents out
  - Examples: Guile (SF), Peacock (SG)
  - Design Intent: Traditional zoning with projectiles
  
- **Disjoint Zoner**: Long-range normals or weapons for space control
  - Examples: Axl Low (GG), Dhalsim (SF)
  - Design Intent: Physical space control without projectiles
  
- **Trap/Setup Zoner**: Lays hazards that restrict movement
  - Examples: Venom (GG), Testament (GGST)
  - Design Intent: Strategic space control through setups

### 5. Mix-up
Forces constant guessing through ambiguous or layered offense.

**Sub-styles:**
- **50/50 Specialist**: Constant high/low or left/right threats
  - Examples: I-No (GG), Xiaoyu (Tekken)
  - Design Intent: Force binary defensive choices
  
- **Okizeme Master**: Threat multiplies after each knockdown
  - Examples: Akuma (SF), Viper (SF4)
  - Design Intent: Reward aggressive knockdown pursuit
  
- **Cross-up Machine**: Air mobility and fast jumps for left/right pressure
  - Examples: Marvel's Wolverine, Yosuke (P4A)
  - Design Intent: Air-based offensive specialist

### 6. Setplay
Controls the match by locking the opponent into a predetermined offensive sequence.

**Sub-styles:**
- **Summoner**: Uses minions or assists
  - Examples: Zato-1 (GG), Rosalina & Luma (Smash)
  - Design Intent: Puppet-like control with assists
  
- **Trap Layer**: Deploys objects or hazards to lock down options
  - Examples: Arakune (BB), Venom (GG)
  - Design Intent: Strategic battlefield control
  
- **Hard Knockdown Looper**: Loops pressure after each hit
  - Examples: Millia Rage (GG), Elphelt (GGXrd)
  - Design Intent: Perpetual pressure once established

### 7. Puppet
Controls two entities at once—indirect offense and multitasking.

**Sub-styles:**
- **True Puppet**: Full control of both units
  - Examples: Carl Clover (BB), Zato-1 (GG)
  - Design Intent: Master-level multitasking gameplay
  
- **Shadow Clone**: Duplicate mirrors attacks or adds pressure
  - Examples: Noob Saibot (MK11), Stand users (JoJo's)
  - Design Intent: Enhanced versions of main character
  
- **Interval Puppet**: Puppet acts on cooldown or automatic timer
  - Examples: Rosalina & Luma (Smash), Popo/Nana (Smash)
  - Design Intent: Accessible puppet gameplay

### 8. Counter
Punishes aggression with defensive triggers or reversal tools.

**Sub-styles:**
- **Reactive**: Strong anti-airs, punishes, and counters
  - Examples: Geese Howard (KoF), Gouken (SF)
  - Design Intent: Reward defensive mastery
  
- **Parry Master**: Parry system mastery defines skill ceiling
  - Examples: Third Strike Ken, Garou's Kain
  - Design Intent: Technical defensive gameplay
  
- **Bait & Punish**: Lures mistakes via fakeouts or stance cancels
  - Examples: Baiken (GG), Asuka (Tekken 8)
  - Design Intent: Psychological warfare specialist

### 9. Stance
Changes combat capabilities on the fly.

**Sub-styles:**
- **Dual Mode**: Two full movesets or forms
  - Examples: Gen (SF), Lei Wulong (Tekken)
  - Design Intent: Two characters in one
  
- **Combo Stance**: Changes stance mid-string for optimization
  - Examples: Jam Kuradoberi (GG), Maxi (SC)
  - Design Intent: Reward stance transition mastery
  
- **Utility Stance**: Switches to gain tools situationally
  - Examples: V-Trigger Chun-Li, Vega (SFV)
  - Design Intent: Tactical stance utilization

### 10. Big Body / Heavy
High risk–reward archetype. Large frame, massive damage.

**Sub-styles:**
- **Armored Powerhouse**: Super armor and unstoppable offense
  - Examples: Gigas (Tekken), Juggernaut (MvC2)
  - Design Intent: Unstoppable force gameplay
  
- **Wall of Pain**: Dominates neutral with huge normals
  - Examples: Abigail (SFV), Aganos (KI)
  - Design Intent: Neutral game domination through size
  
- **Glass Golem**: Slow but lacks defense, built around burst
  - Examples: Kanji (P4A), Nemesis (UMvC3)
  - Design Intent: High-risk, high-reward big body

## Developer Tools Integration

### Console Commands

Access the developer console with **F1** and use these commands:

```bash
# List all available archetypes
archetypes

# Get detailed archetype information
archetype [archetypeId]
# Example: archetype shoto

# Get sub-style details
substyle [archetypeId] [subStyleId] 
# Example: substyle rushdown speedster

# Analyze matchups between archetypes
matchup [archetype1] [archetype2]
# Example: matchup zoner grappler

# Generate balanced roster suggestions
roster [size]
# Example: roster 12
```

### Character Implementation

Characters can be assigned to archetypes and sub-styles in their JSON configuration:

```json
{
  "characterId": "ryu",
  "archetype": "shoto",
  "subArchetypes": [
    {
      "subArchetypeId": "fundamentalist",
      "name": "Fundamentalist",
      "description": "Focused on spacing, punishes, and textbook play.",
      "isDefault": true
    }
  ]
}
```

## Strategic Applications

### Roster Building

The archetype system supports:
- **Competitive Balance**: Even matchup distribution
- **Player Appeal**: Different playstyles for different preferences
- **Strategic Depth**: Counterplay and adaptation opportunities
- **Content Planning**: Systematic character development

### Matchup Analysis

The system provides basic matchup calculations:
- **Zoner > Grappler**: Space control advantage
- **Rushdown > Zoner**: Mobility overcomes projectiles
- **Grappler > Rushdown**: Raw damage and priority
- **Shoto = Balanced**: Even against most archetypes

### Development Guidelines

When creating new characters:
1. **Choose Primary Archetype**: Select from the 10 main types
2. **Select Sub-style**: Pick the most appropriate of 3 variations
3. **Design Around Intent**: Follow the archetype's design philosophy
4. **Balance Within Archetype**: Compare to similar characters
5. **Test Against Counters**: Verify intended matchup dynamics

## Technical Implementation

The system includes:
- **ArchetypeDefinitions.cs**: Complete archetype database
- **ArchetypeSystem.cs**: Query and analysis tools
- **SubArchetypeManager.cs**: Character modification system
- **DevConsole integration**: Testing and debugging commands
- **JSON character data**: Easy configuration and balancing

This comprehensive system provides the foundation for creating a diverse, balanced, and strategically deep fighting game roster with clear design intentions and competitive viability.