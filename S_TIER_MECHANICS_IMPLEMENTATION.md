# S-Tier Fighting Game Mechanics Integration

This document explains how the newly implemented S-tier mechanics from Street Fighter III: 3rd Strike, Street Fighter II: Hyper Fighting/Super Turbo, and Guilty Gear XX/Xrd/Accent Core work together without overlap or redundancy.

## Core Architecture

All S-tier mechanics are implemented as independent autoloaded systems that integrate through the existing framework:

```csharp
// Enhanced Movement (Accent Core style)
EnhancedMovementSystem.Instance.TryGroundDash(character, forward);
EnhancedMovementSystem.Instance.TryAirDash(character, direction);

// Faultless Defense (Accent Core style)  
FaultlessDefenseSystem.Instance.ProcessFDAttempt(defender, attacker, holdingFD, frameWindow);

// Special Cancels (SFII/ST style)
SpecialCancelSystem.Instance.TryCancel(character, currentMove, targetMove, cancelWindow);

// Oki/Wake-up System (3rd Strike style)
OkiWakeupSystem.Instance.InitiateKnockdown(character, knockdownType, force);

// Precise Hitbox System (Universal)
PreciseHitboxSystem.Instance.ActivateHitbox(character, moveName, hitboxData, frame);

// Combo Scaling (Universal)
ComboScalingSystem.Instance.AddComboHit(playerId, damage, moveType);

// Unified Meter Coordination
UnifiedMeterSystem.Instance.HasMeterFor(playerId, "RomanCancel");
```

## 1. Core Neutral & Footsies Layer

### Enhanced Movement System (`EnhancedMovementSystem.cs`)
- **Ground Dashes**: Forward/backward movement with cooldowns
- **Air Dashes**: Multi-directional air mobility (max based on archetype)
- **Dash Cancels**: Cancel moves into dashes for pressure/safety
- **Burst Movement**: Emergency escape/approach tool
- **Instant Air Dash (IAD)**: Ground-to-air movement option

**Archetype Differences:**
- Rushdown: 2 air dashes, lower cooldowns
- Technical: 1 precise air dash, enhanced cancels
- Grappler: No air dash, powerful ground movement
- Zoner: 1 air dash, enhanced retreat options

### Precise Hitbox System (`PreciseHitboxSystem.cs`)
- **Frame-accurate collision detection**
- **Whiff punishment tracking** within 120f range
- **Spacing analysis** with optimal range per archetype
- **Counter hit detection** during startup/recovery frames
- **Hitbox visualization** for development and training

## 2. Parry / Defensive Expression

### Existing Parry System (Enhanced)
- **3rd Strike Parries**: Directional timing-based defense
- **Perfect Parries**: Frame 1 parries with maximum advantage
- **Just Defend**: Garou-style frame-perfect blocking

### Faultless Defense System (`FaultlessDefenseSystem.cs`)
- **Meter-based Enhanced Blocking**: Costs 2 meter per frame
- **Instant Block**: Frame-perfect FD activation with benefits
- **Enhanced Pushback**: 2.5x pushback for spacing control
- **Chip Damage Reduction**: 80% reduction when active
- **Push Block Extend**: Extended pushback on FD release

**No Overlap Design:**
- Parries: Free, high-risk/high-reward, frame advantage
- Faultless Defense: Meter cost, safe spacing tool, chip reduction

## 3. Combo & Cancel System

### Special Cancel System (`SpecialCancelSystem.cs`)
- **Normal-to-Special**: Free cancels for combo extension
- **Special-to-Super**: Free if meter available for super
- **Special-to-Special**: 25 meter cost for flexibility
- **Super Cancels**: 50 meter cost for maximum damage

### Roman Cancel System (Existing)
- **Red RC**: Cancel on hit/block for pressure
- **Blue RC**: Cancel on whiff for safety
- **Yellow RC**: Cancel during recovery
- **Purple RC**: Cancel after projectile

**No Overlap Design:**
- Special Cancels: Specific move transitions, combo-focused
- Roman Cancels: Universal canceling, momentum control
- Dash Cancels: Movement-focused, spacing tool

## 4. Oki / Wake-up Pressure

### Oki/Wake-up System (`OkiWakeupSystem.cs`)
- **Knockdown Types**: Standard, quick rise, delayed, tech roll
- **Wake-up Options**: 
  - Normal (25 frames, 4 invul frames)
  - Quick Rise (18 frames, 2 invul frames)
  - Delayed (35 frames, 6 invul frames)
  - Wake-up Attack (25 meter cost, 8 invul frames)
  - Tech Roll (15 meter cost, position change)

- **Oki Setup Analysis**:
  - Safe Jump: Timed to beat reversals
  - Throw Setup: Meaty grab timing
  - Mix-up Setup: High/low on wake-up
  - Frame Trap: Bait wake-up attacks
  - Cross-up Setup: Ambiguous side mix-up

## 5. Meter / Resource System

### Unified Meter System (`UnifiedMeterSystem.cs`)
Coordinates all meter usage without overlap:

**Super Meter (0-100):**
- Super Moves: 100 meter (full bar)
- EX Specials: 25 meter
- Roman Cancels: 50 meter
- Dash Cancels: 25 meter
- Faultless Defense: 2 meter per frame
- Special-to-Special Cancels: 25 meter
- Wake-up Attacks: 25 meter
- Instant Air Dash: 10 meter

**Drive Gauge (0-6 stocks) - Existing System:**
- Drive Rush: 3 stocks
- Drive Parry: 1 stock
- Drive Impact: 1 stock
- Drive Reversal: 2 stocks
- Overdrive Art: 3 stocks + 100 super meter

**Burst Meter (0-100):**
- Burst Movement: 50 burst meter
- Defensive Burst: 100 burst meter (full bar)

**Meter Building:**
- Offensive actions: +0.8 super, +1.2 tension per frame
- Defensive actions: +1.2 super, +0.3 burst per frame
- Taking damage: +0.5 super, +0.6 burst per damage point
- Successful parries: +25 (perfect), +15 (normal), +10 (just defend)

## 6. Execution & Risk-Reward Design

### Combo Scaling System (`ComboScalingSystem.cs`)
- **Scaling starts after 3rd hit**: Maintains early combo damage
- **Ground combos**: 85% scaling per hit (max 15 hits)
- **Air combos**: 80% scaling per hit (max 12 hits) 
- **Wall combos**: 75% scaling per hit (max 8 hits)
- **Counter hit combos**: 90% scaling (reduced scaling bonus)
- **Juggle gravity increase**: Prevents infinite air combos

### Frame Data Integration
- **Frame advantage tracking** through PreciseHitboxSystem
- **Pushback calculation** based on move strength and FD state
- **Counter hit detection** during vulnerable frames
- **Whiff punishment windows** with range-based analysis

## 7. Minimal Overlap Design

Each S-tier mechanic serves distinct strategic purposes:

| Mechanic | Purpose | Resource | Timing | Strategic Use |
|----------|---------|----------|---------|---------------|
| **Parries** | Frame advantage gain | Free | Frame-perfect | High risk/reward defense |
| **Faultless Defense** | Spacing control | Super meter | Hold input | Safe defensive spacing |
| **Roman Cancels** | Momentum control | Super meter | Any time | Universal pressure/safety |
| **Special Cancels** | Combo extension | Free/meter | Specific moves | Combo optimization |
| **Dash Cancels** | Movement mixups | Super meter | Cancel windows | Pressure/escape tool |
| **Drive Actions** | Tactical options | Drive stocks | State-specific | Resource management |
| **Burst Movement** | Emergency mobility | Burst meter | Any time | Last resort escape |

## 8. Testing & Balancing Integration

### Automated Tracking
- **Frame data logging** through PreciseHitboxSystem
- **Meter usage analytics** through UnifiedMeterSystem
- **Combo statistics** through ComboScalingSystem
- **Movement pattern analysis** through EnhancedMovementSystem
- **Oki setup success rates** through OkiWakeupSystem

### Balance Hooks
All systems integrate with the existing `BalanceManager` for:
- **Real-time adjustments** to costs and effectiveness
- **Per-character modifications** to system properties
- **Tournament mode toggles** for specific mechanics
- **Telemetry integration** for data-driven balancing

### AI Integration
- **System availability checking** for AI decision making
- **Optimal usage patterns** for training mode
- **Counter-strategy development** for different playstyles

## 9. Code Integration Summary

### New Files Added:
1. `scripts/mechanics/EnhancedMovementSystem.cs` - Accent Core mobility
2. `scripts/mechanics/FaultlessDefenseSystem.cs` - Accent Core defense  
3. `scripts/mechanics/SpecialCancelSystem.cs` - SFII/ST cancels
4. `scripts/mechanics/OkiWakeupSystem.cs` - 3rd Strike oki
5. `scripts/mechanics/PreciseHitboxSystem.cs` - Frame-accurate collision
6. `scripts/mechanics/ComboScalingSystem.cs` - Universal scaling
7. `scripts/mechanics/UnifiedMeterSystem.cs` - Resource coordination

### Extended Files:
- `scripts/characters/CharacterData.cs` - Added movement properties
- `scripts/characters/Character.cs` - Integrated new input processing
- `scripts/core/BalanceManager.cs` - Added new system configs
- `project.godot` - Added new autoload systems

### Architecture Preserved:
- **Singleton pattern** maintained for all systems
- **Signal-based communication** for loose coupling
- **Balance system integration** for live adjustments
- **Telemetry hooks** for analytics
- **Modular design** allows selective enabling/disabling

## Strategic Depth Matrix

The implemented mechanics create a deep strategic game with clear decision trees:

**Offensive Options:**
- Roman Cancel → Pressure continuation (50 meter)
- Dash Cancel → Movement mixup (25 meter)  
- Special Cancel → Combo extension (free/25 meter)
- Drive Rush → Enhanced approach (3 drive stocks)

**Defensive Options:**
- Parry → Frame advantage (free, high risk)
- Faultless Defense → Spacing control (2 meter/frame)
- Burst Movement → Emergency escape (50 burst meter)
- Drive Parry → Enhanced defense (1 drive stock)

**Resource Management:**
- Super meter: Universal currency for most mechanics
- Drive gauge: Tactical burst resources
- Burst meter: Defensive-focused resource
- Tension meter: Future expansion hook

This implementation achieves the goal of merging all S-tier mechanics into a cohesive, non-overlapping system suitable for high-level competitive play while maintaining clarity and strategic depth.