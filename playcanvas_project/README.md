# Fighting Game - PlayCanvas Conversion

This is a complete conversion of the Godot fighting game to PlayCanvas. The conversion maintains all the core fighting game mechanics while adapting them to work in a web browser using PlayCanvas engine.

## Features Converted

### ✅ Core Systems
- **Input System** - Fighting game controls with combo detection
- **Combat System** - Frame-accurate collision detection and damage calculation
- **Animation System** - Character state management and visual feedback
- **Game Manager** - Round/match management and game flow
- **UI System** - Health bars, meters, timers, and game messages

### ✅ Character System
- **Fighter Component** - Main character controller with full move sets
- **Character Data** - JSON-driven character configuration system
- **Movement** - Walking, jumping, crouching, dashing
- **Combat** - Normal attacks, special moves, super moves
- **Frame Data** - Startup, active, recovery frames for all moves

### ✅ Fighting Game Mechanics
- **Hitboxes/Hurtboxes** - Accurate collision detection
- **Block/Hit Stun** - Proper fighting game timing
- **Combo System** - Combo counting and scaling
- **Meter System** - Super meter building and usage
- **Projectiles** - Special move projectiles (fireballs, etc.)

### ✅ Characters Ported
- **Ryu** - Shoto archetype with Hadoken, Shoryuken, Shinku Hadoken
- **Chun-Li** - Speed archetype with lightning legs
- **Ken** - Aggressive shoto variant
- **Zangief** - Grappler archetype
- **Sagat** - Tiger shot projectiles
- **Lei Wulong** - Technical fighter

## Controls

### Player 1 (Keyboard Left Side)
- **Movement**: WASD
- **Attacks**: J (LP), K (MP), L (HP), U (LK), I (MK), O (HK)
- **Block**: Y
- **Grab**: H
- **Dash**: Space

### Player 2 (Keyboard Right Side)
- **Movement**: Arrow Keys
- **Attacks**: Numpad 1-6
- **Block**: Numpad 0
- **Grab**: Numpad Enter
- **Dash**: Numpad 7

### Special Move Inputs
- **Quarter Circle Forward + Punch** (236P): Hadoken, Tiger Shot
- **Dragon Punch + Punch** (623P): Shoryuken
- **Double Quarter Circle + Punch** (236236P): Super moves

## Running the Demo

1. Install dependencies:
```bash
bun install
```

2. Start the development server:
```bash
bun run dev
```

3. Open your browser to `http://localhost:8080`

## Project Structure

```
playcanvas_project/
├── index.html              # Main HTML file with PlayCanvas setup
├── scripts/
│   ├── main.js             # Game initialization and entry point
│   ├── systems/            # Core game systems
│   │   ├── InputSystem.js  # Input handling and combo detection
│   │   ├── CombatSystem.js # Combat mechanics and collision
│   │   ├── AnimationSystem.js # Character animations
│   │   └── GameManager.js  # Game state and match management
│   ├── components/         # PlayCanvas script components
│   │   ├── Fighter.js      # Main character controller
│   │   ├── Hitbox.js       # Collision detection component
│   │   └── Projectile.js   # Special move projectiles
│   └── ui/                 # User interface
│       └── GameUI.js       # Health bars, timers, UI management
├── data/
│   └── characters/         # Character JSON configurations
├── assets/
│   └── sprites/           # Character sprite assets
└── scenes/                # Scene configurations
```

## Character Data Format

Characters are defined using JSON files that specify:
- Basic stats (health, speed, etc.)
- Move sets with frame data
- Special move inputs
- Combo routes
- Sub-archetypes for variation

Example character structure:
```json
{
  "characterId": "ryu",
  "name": "Ryu",
  "archetype": "shoto",
  "health": 1000,
  "moves": {
    "normals": { ... },
    "specials": { ... },
    "supers": { ... }
  }
}
```

## Differences from Godot Version

### Advantages of PlayCanvas Version
- **Web-native** - Runs in any modern browser
- **Cross-platform** - Works on desktop, mobile, tablets
- **No installation** - Instant access via URL
- **WebGL acceleration** - Hardware-accelerated graphics
- **Real-time updates** - Hot reload during development

### Technical Adaptations
- **Sprite handling** - Adapted to PlayCanvas sprite system
- **Input system** - Browser keyboard/mouse events
- **Audio** - Web Audio API integration
- **Performance** - Optimized for JavaScript engine

## Development Notes

### Current Implementation Status
- ✅ Core fighting game mechanics working
- ✅ Two-player local gameplay
- ✅ Full character move sets
- ✅ Visual feedback and UI
- 🔄 Sprite animations (placeholder system)
- 🔄 Audio system integration
- 🔄 Online multiplayer capability

### Future Enhancements
- **Real Sprites** - Replace placeholder visuals with actual sprite sheets
- **Sound Effects** - Add audio for attacks, impacts, voices
- **Online Play** - WebRTC for remote multiplayer
- **Tournament Mode** - Bracket system for competitions
- **Replay System** - Record and playback matches

## Testing the Game

1. Load the game in your browser
2. Wait for "FIGHT!" message
3. Try basic attacks: J, K, L for Player 1
4. Test special moves: Quarter-circle forward + punch for Hadoken
5. Use blocking with Y key
6. Win rounds to see match progression

## Performance Optimization

The game runs at 60 FPS with:
- Efficient collision detection
- Minimal memory allocation during gameplay
- Optimized sprite rendering
- Frame-based timing system

## Contributing

The modular system makes it easy to:
- Add new characters via JSON files
- Create new special moves
- Modify game mechanics
- Add visual effects
- Implement new UI features

---

*Converted from Godot to PlayCanvas while maintaining the depth and precision of traditional fighting games.*