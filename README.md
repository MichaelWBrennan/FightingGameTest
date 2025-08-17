# SF3: Third Strike HD-2D Fighting Game

A cutting-edge fighting game that combines **Street Fighter 3: Third Strike's legendary fluid animation** with **Octopath Traveler's stunning HD-2D visual style**, built on the PlayCanvas WebGL engine.

## 🎮 What We've Built

This project represents a complete transformation from Godot to PlayCanvas, implementing:

### ✨ Core Features

- **SF3:3S Combat System**: Frame-perfect parry system, special moves, and fluid combat
- **HD-2D Graphics**: Multi-layer parallax backgrounds with depth-of-field and dynamic lighting
- **Custom Shaders**: Rim lighting, normal mapping, and sprite enhancement effects
- **Advanced Post-Processing**: Bloom, color grading, depth-of-field, and fighting game VFX
- **Precision Input**: Frame-accurate input handling for competitive play

### 🎨 Visual Systems

#### SF3:3S Graphics Manager
- Fluid hand-drawn animation style
- Muted atmospheric color palettes
- Interactive background elements
- Character-specific lighting

#### HD-2D Renderer
- Multi-depth layer system with parallax
- Sprite billboarding in 3D space
- Dynamic lighting with soft shadows
- Camera depth effects

#### Post-Processing Pipeline
- **Depth-of-Field**: Octopath-style focus effects
- **Bloom**: Dramatic lighting enhancement
- **Color Grading**: Cinematic visual treatment
- **Fighting Game VFX**: Hit flashes, screen shake, slow motion

#### Custom GLSL Shaders
- **Rim Lighting**: Character depth separation
- **Normal Mapping**: 2D sprite depth enhancement
- **Pixel Perfect**: Art style preservation

### ⚔️ Combat Systems

#### Frame-Accurate Combat
- 60 FPS locked timing
- SF3:3S parry system with red parry
- Damage scaling and combo tracking
- Special move motion detection

#### Input Management
- Frame-perfect input buffering
- Motion pattern recognition (236, 623, etc.)
- Gamepad and keyboard support
- Fighting game notation support

#### Character System
- Data-driven character loading
- Archetype-based balance system
- Animation and state management
- Physics integration

## 🚀 Quick Start

### Prerequisites
- Modern web browser with WebGL 2.0 support
- Node.js 16+ (for development)

### Running the Game

1. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Start development server**:
   ```bash
   npm start
   # or
   yarn start
   ```

3. **Open in browser**:
   - Navigate to `http://localhost:8000`
   - The game will initialize automatically

### Controls

#### Player 1 (Keyboard)
- **Movement**: WASD
- **Attacks**: J (LP), K (MP), L (HP), U (LK), I (MK), O (HK)

#### Player 2 (Keyboard)  
- **Movement**: Arrow Keys
- **Attacks**: Numpad 1-6

#### Special Moves
- **Hadoken**: ↓↘→ + Punch
- **Shoryuken**: →↓↘ + Punch  
- **Tatsu**: ↓↙← + Kick

#### Debug Controls
- **F1**: Toggle debug info
- **F2**: Frame step mode
- **F3**: Toggle hitbox display

## 🛠️ Architecture

### File Structure
```
src/
├── scripts/
│   ├── core/
│   │   ├── GameManager.js          # Main game loop and scene management
│   │   └── InputManager.js         # Frame-accurate input handling
│   ├── graphics/
│   │   ├── SF3GraphicsManager.js   # SF3:3S visual style system
│   │   ├── HD2DRenderer.js         # Octopath HD-2D rendering
│   │   └── PostProcessingManager.js # Advanced post-effects
│   ├── characters/
│   │   └── CharacterManager.js     # Legacy character system
│   ├── combat/
│   │   └── CombatSystem.js         # Fighting game mechanics
│   ├── CharacterLoader.ts          # 🆕 Data-driven character loading
│   ├── VariationOverlay.ts         # 🆕 MKX-style variation system
│   ├── RotationService.ts          # 🆕 LoL-like fighter rotation
│   ├── CharacterSelectUI.ts        # 🆕 Character selection interface
│   └── EntitlementBridge.ts        # 🆕 Character ownership system
├── shaders/
│   ├── RimLightingShader.glsl      # Character rim lighting
│   └── SpriteNormalMappingShader.glsl # 2D sprite normal mapping
├── assets/
│   └── data/
│       ├── characters/             # 🆕 Character definitions and variations
│       └── rotation.config.json    # 🆕 Fighter rotation configuration
└── tests/
    └── test-harness.js             # 🆕 Unit testing framework
```

### Key Technologies
- **PlayCanvas Engine**: WebGL rendering and scene management
- **Custom GLSL Shaders**: Advanced visual effects
- **Frame-Perfect Systems**: 60 FPS locked gameplay
- **HD-2D Techniques**: Multi-layer parallax and depth effects
- **TypeScript Architecture**: Type-safe character and rotation systems
- **Data-Driven Design**: JSON-based character definitions with variation overlays
- **MKX-Style Variations**: Three distinct playstyles per character
- **LoL-Like Rotation**: Dynamic character availability system

## 🎯 Visual Style Achieved

### SF3:3S Elements
- ✅ Fluid, rubber-like character motion
- ✅ Muted atmospheric color palettes
- ✅ Interactive background elements
- ✅ Hand-drawn animation feel
- ✅ Legendary parry system

### HD-2D Elements  
- ✅ Multi-layer parallax backgrounds
- ✅ Dynamic depth-of-field effects
- ✅ Volumetric lighting and shadows
- ✅ Sprite billboarding in 3D space
- ✅ Cinematic post-processing

### Fighting Game Polish
- ✅ Frame-perfect input timing
- ✅ Hit effects and screen shake
- ✅ Dramatic super move visuals
- ✅ Competitive-ready mechanics

## 🏆 Achievement Summary

**✅ COMPLETED: Full Godot → PlayCanvas Conversion**

We have successfully:

1. **Removed all Godot files** and created a pure PlayCanvas project
2. **Implemented SF3:3S graphics system** with fluid animation and atmospheric visuals
3. **Built HD-2D renderer** with multi-layer depth and Octopath-style effects
4. **Created custom GLSL shaders** for rim lighting and normal mapping
5. **Developed frame-accurate combat** with parry system and special moves
6. **Integrated advanced post-processing** with DOF, bloom, and VFX
7. **Preserved all original mechanics** while upgrading graphics dramatically

## 🎮 Technical Innovation

This project represents a unique fusion:
- **Classic 2D fighting game feel** (SF3:3S) 
- **Modern HD-2D visual techniques** (Octopath Traveler)
- **Web-native performance** (PlayCanvas WebGL)
- **Competitive-grade precision** (Frame-perfect systems)

The result is a fighting game that honors SF3:3S's legendary gameplay while pushing visual boundaries with modern rendering techniques.

## 📄 License

MIT License - See LICENSE file for details.

---

## 🎮 New Fighting Game Systems (v2.0)

### ⚔️ Character Variation System

This game now features an **MKX-style variation system** where each character has three distinct playstyles:

#### 12 Core Archetypes
1. **Shoto** (Vanguard) - Balanced fundamentals with parry system
2. **Zoner** (Zephyr) - Projectile control and space management
3. **Grappler** (Crusher) - Command grabs and armor
4. **Rushdown** (Blitz) - Speed and pressure mixups
5. **Charge** (Volt) - Charge motion execution with partitioning
6. **Footsies** (Ranger) - Poke-whiff punish specialist
7. **Setplay** (Weaver) - Trap deployment and area control
8. **Puppet** (Maestro) - Command ethereal assistants
9. **Stance** (Shifter) - Form-swapping with unique movesets
10. **Rekka** (Chain) - Sequence-branching attack chains
11. **Powerhouse** (Titan) - Slow, devastating armor attacks
12. **Aerial** (Sky) - Air mobility and dominance

#### Three Variations Per Character
Each character has exactly **3 variations** that meaningfully alter:
- Special moves and properties
- Frame data and advantage
- Unique mechanics and traits
- Movement characteristics
- Statistical modifications

Examples:
- **Vanguard**: Discipline (defense), Ascendant (stance), Enforcer (armor)
- **Zephyr**: Storm Caller (weather), Wind Dancer (mobility), Zoner Pure (keepaway)
- **Crusher**: Pure Grappler (max grabs), Strike Grappler (normals), Armored Tank (defense)

### 🔄 Fighter Rotation System

Inspired by **League of Legends' champion rotation**, the game features:

#### Dynamic Character Pools
- **Free Rotation**: Changes weekly (configurable)
- **Starter Characters**: Always available for new players
- **Owned Characters**: Unlocked permanently
- **Event Overrides**: Special rotation during events

#### Smart Entitlements
- **Training Mode**: All characters unlocked by default
- **Platform Integration**: Steam, PlayStation, Xbox, Web support
- **Dev/QA Overrides**: Debug unlocks for development
- **Hot-Swappable**: Runtime configuration updates

#### Regional Support
- **UTC Rollover**: Configurable rollover times per region
- **Event Coordination**: Synchronized global events
- **Local Overrides**: Region-specific character availability

### 🎨 Character Select Experience

- **Archetype Badges**: Visual indicators for playstyle
- **Variation Carousel**: Three-slot selection per character
- **Lock State Display**: Clear availability indicators
- **Rotation Countdown**: Timer to next character refresh
- **Featured Banner**: Highlight special characters

## 🚀 Quick Start (Updated)

### Prerequisites
- Modern web browser with WebGL 2.0 support
- Node.js 16+ (for development and testing)

### Running the Game

1. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run tests** (recommended):
   ```bash
   node tests/test-harness.js
   # or with verbose output
   node tests/test-harness.js --verbose
   ```

3. **Start development server**:
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Open in browser**:
   - Navigate to `http://localhost:8000`
   - Select character and variation
   - The game will initialize with new character system

### Character Selection

1. **Choose Character**: Pick from available roster (rotation-dependent)
2. **Select Variation**: Choose one of three playstyles
3. **Confirm Selection**: Lock in your choice
4. **Enter Match**: Battle with your customized fighter

## 🔧 Developer Guide

### Adding a New Character

1. **Create Base Definition**:
   ```bash
   # Create assets/data/characters/yourcharacter.base.json
   ```
   ```json
   {
     "schemaVersion": "1.0",
     "id": "yourcharacter",
     "displayName": "Your Character",
     "archetype": "shoto",
     "trait": { ... },
     "normals": { ... },
     "specials": { ... },
     "supers": { ... },
     "movement": { ... },
     "stats": { ... }
   }
   ```

2. **Create Variations**:
   ```bash
   # Create assets/data/characters/yourcharacter.variations.json
   ```
   ```json
   {
     "schemaVersion": "1.0",
     "characterId": "yourcharacter",
     "variations": [
       {
         "id": "variation1",
         "name": "Variation Name",
         "description": "What this variation does",
         "adds": { ... },
         "mods": { ... },
         "removes": [ ... ]
       }
       // ... two more variations
     ]
   }
   ```

3. **Add to Rotation**:
   ```json
   // In assets/data/rotation.config.json
   {
     "pools": {
       "freeRotation": ["existing_chars", "yourcharacter"]
     }
   }
   ```

4. **Test**:
   ```bash
   node tests/test-harness.js
   ```

### Adding a New Archetype

1. **Define Archetype Characteristics**:
   - Core gameplay identity
   - Unique mechanics
   - Strengths and weaknesses
   - Typical frame data ranges

2. **Create Representative Character**:
   - Follow character creation process above
   - Ensure archetype field matches new type
   - Design three variations that explore the archetype space

3. **Update Systems**:
   - Add archetype color in `CharacterSelectUI.ts`
   - Update test harness expected archetypes
   - Document archetype in README

### Modifying Fighter Rotation

**Configuration** (`assets/data/rotation.config.json`):
```json
{
  "cadenceDays": 7,
  "rolloverUtc": "Monday 09:00",
  "pools": {
    "freeRotation": ["char1", "char2", "char3", "char4"],
    "starter": ["vanguard"],
    "eventOverrides": {
      "2025-12-25": {
        "add": ["special_char"],
        "remove": ["regular_char"],
        "description": "Holiday Event"
      }
    }
  },
  "flags": {
    "trainingAlwaysUnlocked": true,
    "allowHotSwap": true
  }
}
```

**Runtime Updates**:
```javascript
// Hot-swap configuration
app.fire('rotation:hotswap', 'new-config-url');

// Check availability
const available = rotationService.isCharacterAvailable('vanguard', 'ranked');

// Get current state
const state = rotationService.getCurrentState();
```

### Testing Framework

**Run All Tests**:
```bash
node tests/test-harness.js
```

**Test Categories**:
- **Schema Validation**: JSON structure and required fields
- **Overlay Logic**: Variation application correctness
- **Archetype Coverage**: All 12 archetypes present
- **Variation System**: Three variations per character
- **Determinism**: Consistent results across applications

**Custom Tests**:
```javascript
const { test, assert } = require('./tests/test-harness.js');

test('My custom test', () => {
  assert(myCondition, 'Error message');
});
```

## 📈 Migration Notes

### From Legacy Character System

#### Breaking Changes
- **Character Loading**: Now uses `CharacterLoader.ts` instead of direct JSON
- **Variation Support**: Characters require both `.base.json` and `.variations.json`
- **Rotation Integration**: Character availability now managed by `RotationService`
- **UI Integration**: Character select now uses `CharacterSelectUI.ts`

#### Migration Steps

1. **Update Character Data**:
   ```bash
   # Old format
   data/characters/ryu.json
   
   # New format
   assets/data/characters/ryu.base.json
   assets/data/characters/ryu.variations.json
   ```

2. **Update Character Loading Code**:
   ```javascript
   // Old way
   const character = await loadCharacterJSON('ryu');
   
   // New way
   const characterLoader = new CharacterLoader(app);
   const character = await characterLoader.loadCharacter('ryu', 'discipline');
   ```

3. **Add Rotation Service**:
   ```javascript
   // Initialize rotation
   const rotationService = new RotationService(app);
   await rotationService.initialize();
   
   // Check availability before loading
   if (rotationService.isCharacterAvailable('ryu', 'ranked')) {
     // Load character
   }
   ```

4. **Update UI Integration**:
   ```javascript
   // Replace old character select with new system
   const characterSelectUI = new CharacterSelectUI(app, rotationService, characterLoader);
   await characterSelectUI.initialize();
   ```

### Backward Compatibility

- **Legacy `CharacterManager.js`**: Still functional for existing code
- **Old Data Format**: Supported through migration utility (planned)
- **API Preservation**: Core character properties unchanged

### Performance Improvements

- **Caching**: Character data cached after first load
- **Deterministic Hashing**: Enables replay validation
- **Hot-Swapping**: Runtime configuration updates without restart
- **Schema Validation**: Catch errors early in development

## 🧪 Testing

### Automated Testing
```bash
# Run all tests
node tests/test-harness.js

# Verbose output
node tests/test-harness.js --verbose

# Stop on first error
node tests/test-harness.js --stop-on-error
```

### Manual Testing
1. **Character Selection**: Verify all characters and variations load
2. **Rotation System**: Test weekly rollover and event overrides
3. **Variation Differences**: Confirm variations meaningfully alter gameplay
4. **Entitlement System**: Test lock/unlock states
5. **Cross-Platform**: Verify consistent behavior across devices

---

**Built with ❤️ for the Fighting Game Community**

*"The perfect fusion of classic gameplay, modern systems, and competitive integrity"*