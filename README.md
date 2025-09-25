# Street Fighter III: 3rd Strike – Professional Web Fighting Game

A fully-featured, industry-grade fighting game built with PlayCanvas and TypeScript. Features advanced netcode, comprehensive training tools, competitive matchmaking, and professional-quality systems that rival commercial fighting games.

## 🎮 **Core Features**

### **🥊 Advanced Fighting Game Engine**
- **60 FPS Deterministic Gameplay**: Frame-perfect combat with rollback netcode
- **Comprehensive Move System**: Normals, specials, supers with full frame data
- **Advanced Input System**: Motion inputs (QCF, QCB, DP, 360), charge moves, negative edge
- **Character Sub-Archetypes**: Multiple character variants with unique moves and stat modifiers
- **Professional Hit Detection**: Precise hitbox/hurtbox collision with visual debugging

### **🌐 Industry-Leading Netcode**
- **Rollback Netcode**: GGPO-style rollback with deterministic state management
- **WebRTC P2P**: Direct peer-to-peer connections with adaptive frame delay
- **Desync Recovery**: Automatic resync with compressed state snapshots
- **Connection Quality Monitoring**: Real-time RTT, jitter, and packet loss tracking
- **Worker Support**: Optional Web Worker for performance optimization

### **🎯 Professional Training Mode**
- **Frame Data Display**: Real-time startup/active/recovery/advantage information
- **Hitbox Visualization**: Toggle-able hitbox/hurtbox overlay with world-to-screen conversion
- **Dummy AI Modes**: Idle, block all, block random, reversal behaviors
- **State Management**: Save/load training states (F5/F6)
- **Input Recording/Playback**: Record and replay input sequences (F10-F12)
- **Position Control**: Quick mid-screen and corner positioning
- **Frame-by-Frame Debugging**: Step through gameplay frame by frame

### **🏆 Competitive Features**
- **Ranked Matchmaking**: MMR-based matching with Bayesian rating system
- **Tournament Brackets**: Automated single/double elimination brackets
- **Lobby System**: Create/join custom lobbies with friends
- **Party System**: Invite codes and party management
- **Spectator Mode**: Real-time match viewing with timeline controls
- **Replay System**: Save, load, and export match replays

### **♿ Accessibility & Customization**
- **Input Remapping**: Full keyboard and gamepad customization
- **SOCD Policies**: Configurable simultaneous opposite cardinal direction handling
- **Accessibility Options**: Colorblind mode, high contrast, UI scaling
- **Multi-Language Support**: Internationalization framework
- **Touch Controls**: Mobile-friendly touch input support

## 🏗️ **Technical Architecture**

### **Core Systems (`src/core/`)**
- `GameEngine.ts`: Main engine bootstrap with service architecture
- `combat/CombatSystem.ts`: Advanced combat logic with frame data
- `netcode/`: Complete rollback netcode implementation
- `characters/CharacterManager.ts`: Character spawning and management
- `input/InputManager.ts`: Multi-device input with motion detection
- `ui/`: Comprehensive overlay system (training, debug, options, etc.)
- `graphics/`: Custom shaders and visual effects
- `online/`: Matchmaking, lobbies, and social features

### **Character System**
- **JSON-Driven Configuration**: Complete character data in `data/characters/`
- **Sub-Archetypes**: Multiple character variants per fighter
- **Move Modifiers**: Stat and property modifications per sub-archetype
- **Additional Moves**: Sub-archetype specific techniques
- **Combo Routes**: Pre-defined combo sequences with difficulty ratings

### **Graphics & Audio**
- **Custom Shaders**: Character highlighting, rim lighting, normal mapping
- **Visual Effects**: Hit sparks, screen shake, afterimage trails
- **Multi-Bus Audio**: SFX, UI, and master volume controls
- **TTS Support**: Text-to-speech for accessibility

## 🚀 **Quick Start**

### **Play Online**
- Open your deployment URL (e.g., `https://your-app.vercel.app`)
- No downloads or installation required
- Game auto-starts when page loads

### **Build from Source**
```bash
npm install
npm run build
npm run preview
```

Open the printed URL (defaults to http://localhost:5173)

## 🎮 **Controls**

### **Keyboard (Default)**
- **Movement**: WASD
- **Punches**: U (Light), I (Medium), O (Heavy)
- **Kicks**: J (Light), K (Medium), L (Heavy)
- **Special Moves**: QCF/QCB/DP + Punch/Kick

### **Training Mode Hotkeys**
- **F1**: Command List
- **F2**: Options Menu
- **F3**: Pause/Resume
- **F4**: Step Frame
- **F5/F6**: Save/Load State
- **F7**: Cycle Dummy Mode
- **F8/F9**: Reset Position (Mid/Corner)
- **F10-F12**: Recording Controls

## 🏗️ **Development**

### **Character Data**
Characters are defined in `data/characters/` with comprehensive JSON configurations including:
- Move data (startup, active, recovery frames)
- Hitbox/hurtbox definitions
- Sub-archetype variants
- Combo routes and difficulty ratings

### **Asset Pipeline**
- Build step copies `data/` → `public/data/`
- Manifest generation: `public/assets/manifest.json`
- Smart preloading with versioned assets
- On-demand loading for large files

### **Ground-Truth Data Import**
To import data from SFIII decompilation:
```bash
npx ts-node tools/import_sf3_char_data.ts
```

## 🌟 **Advanced Features**

### **Netcode Architecture**
- Deterministic game state with checksum validation
- Compressed state snapshots for efficient rollback
- Adaptive frame delay based on connection quality
- Automatic desync detection and recovery

### **Training Tools**
- Real-time frame data display
- Visual hitbox/hurtbox debugging
- Input sequence recording and playback
- Multiple dummy AI behaviors
- State save/load for practice scenarios

### **Competitive Systems**
- MMR-based matchmaking with regional support
- Tournament bracket generation
- Lobby creation and management
- Spectator mode with timeline controls
- Replay system with export functionality

## 📊 **Performance**

- **60 FPS Gameplay**: Optimized for consistent frame rates
- **WebGL2 Rendering**: Hardware-accelerated graphics
- **Smart Asset Loading**: Efficient memory management
- **Worker Support**: Optional background processing
- **Mobile Optimized**: Touch controls and responsive UI

## 🎯 **Platform Support**

- **Web Browsers**: Primary platform (Chrome, Firefox, Safari, Edge)
- **Input Devices**: Keyboard, gamepad, touch
- **Graphics**: WebGL2 via PlayCanvas
- **Audio**: Web Audio API with multi-bus support

## 📚 **Documentation**

- In-code comments and `types/` for engine/runtime types
- Character data structure in `data/characters/`
- API documentation in service files

## 🤝 **Contributing**

This is a professional-grade fighting game implementation. Contributions welcome for:
- New character implementations
- Additional training tools
- UI/UX improvements
- Performance optimizations
- Bug fixes and feature enhancements

## 📞 **Support**

Open an issue or PR on the repository for:
- Bug reports
- Feature requests
- Technical questions
- Contribution discussions

---

**Built with ❤️ using PlayCanvas, TypeScript, and modern web technologies**