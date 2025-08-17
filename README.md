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
│   │   └── CharacterManager.js     # Character system and animation
│   └── combat/
│       └── CombatSystem.js         # Fighting game mechanics
├── shaders/
│   ├── RimLightingShader.glsl      # Character rim lighting
│   └── SpriteNormalMappingShader.glsl # 2D sprite normal mapping
└── assets/                         # Game assets and data
```

### Key Technologies
- **PlayCanvas Engine**: WebGL rendering and scene management
- **Custom GLSL Shaders**: Advanced visual effects
- **Frame-Perfect Systems**: 60 FPS locked gameplay
- **HD-2D Techniques**: Multi-layer parallax and depth effects

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

**Built with ❤️ for the Fighting Game Community**

*"The perfect fusion of classic gameplay and modern visuals"*