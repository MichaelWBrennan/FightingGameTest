# Fighting Game Starter - Design Document

## 🎯 Vision Statement

Create a modern, live-service fighting game platform that prioritizes competitive depth, fair monetization, and community engagement. The game serves as an evolving platform for continuous content delivery without traditional sequel fragmentation.

## 🎮 Core Design Principles

### 1. Depth Over Complexity
- Easy to learn fundamentals with deep mechanical systems
- Clear visual feedback for all game states
- Intuitive control scheme that scales from casual to competitive

### 2. Fair Monetization
- **No loot boxes** - Direct character purchases only
- **No pay-to-win** - All characters competitively viable
- **No soft currencies** - Real money transactions only
- **Transparent pricing** - Clear value propositions

### 3. Platform Longevity
- Single evolving game instead of sequels
- Backward compatibility for all content
- Persistent player progression and unlocks
- Long-term competitive support

## 🥊 Combat System Design

### Inspired by Killer Instinct (2013)

#### Combo Structure
The combo system follows KI's three-tier structure:

1. **Openers**: Moves that start combos
   - Light attacks (safe, limited damage)
   - Heavy attacks (risky, high reward)
   - Special moves (context dependent)

2. **Linkers**: Moves that continue combos
   - Extend combo potential
   - Build meter and damage
   - Create mix-up opportunities

3. **Enders**: Moves that finish combos
   - Maximum damage output
   - Special effects (knockdown, meter drain)
   - Risk/reward decision points

#### Frame Data Philosophy
All moves include precise frame data:
- **Startup**: Frames before attack becomes active
- **Active**: Frames the attack can hit
- **Recovery**: Frames after attack ends
- **Advantage**: Frame difference on hit/block

This data is exposed to players for competitive depth.

#### Meter System
- **Meter Building**: Gained through attacks, taking damage, and combos
- **Meter Usage**: Super moves, enhanced specials, combo breakers
- **Strategic Resource**: Risk/reward decisions for meter spending

### Combo Breaker System
Following KI's innovative approach:
- **Timing-based breaks**: Predict opponent's combo timing
- **Lockout penalty**: Failed breaks leave you vulnerable
- **Mind games**: Creates psychological pressure in combos

## 🎨 Visual Design

### Art Direction
- **Stylized realism**: Appealing to both casual and competitive players
- **Clear readability**: Easy to parse during fast-paced action
- **Consistent theming**: Unified visual language across all content

### UI/UX Philosophy
- **Minimal HUD**: Focus on the action
- **Immediate feedback**: Clear hit confirmations and state changes
- **Accessibility**: Colorblind-friendly palettes and subtitle support

### Animation Principles
- **Clarity over flash**: Animations serve gameplay first
- **Consistent timing**: Animation frames match gameplay frames
- **Anticipation and recovery**: Clear startup and cooldown animations

## 🔧 Technical Architecture

### Engine Choice: Godot 4
**Reasons for selection:**
- Open source (aligns with project goals)
- Strong 2D performance
- Built-in networking support
- C# scripting support
- Cross-platform deployment
- Active development community

### Data-Driven Design

#### Character System
Characters are defined in JSON files containing:
```json
{
  "health": 1000,
  "walkSpeed": 150,
  "moves": {
    "normals": { ... },
    "specials": { ... },
    "supers": { ... }
  }
}
```

Benefits:
- **Hot-swappable**: Changes without code recompilation
- **Version control friendly**: Text-based diffs
- **Modding support**: Community can create characters
- **Balancing**: Rapid iteration on move properties

#### Modular Content Pipeline
- **Character DLC**: Drop-in JSON + asset packages
- **Stage DLC**: Plug-and-play stage definitions
- **Music DLC**: Separate audio content packages

### Netcode Architecture

#### Rollback Netcode (GGPO-style)
**Core Concepts:**
- **Deterministic simulation**: Identical inputs produce identical outputs
- **State serialization**: Save/load game states for rollback
- **Input prediction**: Predict remote player inputs
- **Lag compensation**: Roll back to correct states when predictions fail

**Implementation Strategy:**
1. **Deterministic game logic**: Fixed-point math, consistent physics
2. **Input buffering**: Store input history for rollback
3. **State management**: Lightweight state saving/loading
4. **Network synchronization**: Frame-locked input exchange

#### Network Architecture
```
Client A ←→ Game Server ←→ Client B
```
- **Peer-to-peer for matches**: Direct connection for lowest latency
- **Dedicated servers for matchmaking**: Centralized player matching
- **Relay servers for problematic connections**: Fallback for NAT issues

### Performance Targets
- **60 FPS**: Locked framerate for competitive consistency
- **Low latency**: <50ms total input lag (local + network)
- **Stable performance**: No frame drops during intense action
- **Memory efficiency**: Support for lower-end hardware

## 🎭 Character Design Framework

### Character Archetypes
Following fighting game conventions:

1. **Shoto** (Ryu-type): Balanced, fundamental-focused
2. **Grappler**: High damage, close-range specialist
3. **Zoner**: Long-range control, keep-away specialist
4. **Rushdown**: High-speed pressure, mix-up focused
5. **Technical**: Complex mechanics, high skill ceiling

### Character Uniqueness
Each character should have:
- **Unique mechanics**: Special systems or properties
- **Clear gameplan**: Distinct approach to winning
- **Matchup variety**: Interesting interactions with all archetypes
- **Visual identity**: Memorable design and animations

### Balance Philosophy
- **Viable diversity**: Multiple viable strategies
- **Risk/reward consistency**: High reward requires high risk
- **Counterplay options**: Every strategy has answers
- **Skill expression**: Reward player improvement and adaptation

## 💰 Monetization Strategy

### Ethical Cosmetic-Only Model
**Core Principles:**
- **No character purchases**: All fighters accessible through weekly rotation
- **No in-game currency**: Direct real-money transactions only
- **No loot boxes/gacha**: Transparent à la carte cosmetic pricing
- **No pay-to-win**: Pure cosmetic monetization maintains competitive integrity

**Weekly Fighter Rotation:**
- **One fighter free per week**: Randomized per user (League-style)
- **Universal access**: All competitive content remains free
- **Rotation analytics**: Prevent repeat characters within 5-week cooldown
- **Archetype balancing**: Ensure diverse playstyle representation

### Cosmetic Monetization
**À La Carte Cosmetics:**
- **Fighter skins**: Visual character variants ($3-8)
- **Animations**: Custom intro/outro sequences ($2-5)
- **KO effects**: Victory screen customizations ($1-3)
- **Emotes**: In-match expression tools ($1-2)
- **UI themes**: Personalized interface styling ($2-4)

**Battle Pass System:**
- **Seasonal cosmetic tracks**: Non-predatory progression
- **Meaningful rewards**: No filler content
- **FOMO mitigation**: Previous pass items occasionally available
- **Free tier included**: Accessible rewards for all players

### User-Generated Content
**Creator Economy:**
- **UGC cosmetics**: Community-created skins and effects
- **Revenue sharing**: 70% creator, 30% platform split
- **Quality curation**: Approved content maintains game integrity
- **Creator tools**: Sandboxed modding environment

### Music & Audio Monetization
**Licensed Content:**
- **Artist partnerships**: Official music collaborations
- **OST sales**: Standalone soundtrack purchases
- **Rhythm cosmetics**: Music-reactive visual effects
- **Dynamic music**: Adaptive soundtrack systems

### Creator & Esports Integration
**Influencer Monetization:**
- **Affiliate skin codes**: Creator-branded cosmetics
- **Stream integration**: Viewer engagement rewards
- **Tournament cosmetics**: Event-specific collectibles
- **VOD monetization**: Ticketed premium tournament content

### No Exploitative Practices
**Explicitly avoided:**
- Character/gameplay purchases
- Loot boxes or gacha mechanics
- Artificial scarcity (FOMO tactics)
- Predatory pricing targeting vulnerable users
- Pay-to-win advantages of any kind
- Cross-IP licensing dependencies

## 🏟️ Competitive Design

### Tournament Viability
- **Stage legality**: Competitively balanced stages
- **Character balance**: Regular balance updates
- **Input lag consistency**: Standardized hardware support
- **Spectator features**: Match viewing and replay tools

### Ranked System
- **Skill-based matching**: ELO-style rating system
- **Seasonal resets**: Regular competitive cycles
- **Rank rewards**: Cosmetic unlocks for achievement
- **Anti-smurf measures**: New account restrictions

### Training Tools
- **Frame data display**: In-game frame information
- **Hitbox visualization**: Show attack and hurt zones
- **Recording/playback**: Practice against recorded sequences
- **Combo challenges**: Structured learning content

## 🔄 Live Service Model

### Content Delivery
- **Regular updates**: Monthly balance patches
- **Seasonal content**: Quarterly major content drops
- **Community events**: Limited-time tournaments and challenges
- **Player feedback integration**: Community-driven improvements

### Platform Evolution
- **Feature additions**: New modes and systems over time
- **Quality of life**: UI/UX improvements based on feedback
- **Performance optimization**: Ongoing technical improvements
- **Platform expansion**: New platform support as viable

## 🛡️ Player Retention Strategy

### Progression Systems
- **Character mastery**: Per-character progression tracks
- **Global player level**: Overall account progression
- **Achievement system**: Skill-based unlock goals
- **Replay collection**: Save and share favorite matches

### Community Features
- **Player profiles**: Showcase achievements and stats
- **Friend systems**: Easy connections with other players
- **Tournament integration**: Built-in tournament organization
- **Content sharing**: Replay and combo sharing tools

## 📊 Success Metrics

### Core KPIs
- **Daily Active Users (DAU)**: Player engagement consistency
- **Monthly Active Users (MAU)**: Player retention over time
- **Average Session Length**: Depth of engagement per session
- **DLC Conversion Rate**: Character purchase success

### Competitive Health
- **Character usage distribution**: Balance across roster
- **Match completion rate**: Players finishing matches
- **Ranked participation**: Competitive mode engagement
- **Tournament participation**: Community event attendance

### Technical Performance
- **Average input lag**: Network performance quality
- **Frame drop incidents**: Performance stability
- **Connection success rate**: Network reliability
- **Crash/bug reports**: Technical quality metrics

---

This design document serves as the foundation for all development decisions. Regular updates ensure alignment with player feedback and competitive meta evolution.