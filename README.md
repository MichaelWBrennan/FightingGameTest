# Fighting Game Starter

A complete starter project for a live-service fighting game inspired by Killer Instinct (2013) with deep combo systems, rollback netcode, and modular DLC architecture.

## 🎮 Features

- **Engine**: Godot 4 with C# scripting
- **Gameplay**: Killer Instinct-inspired combo system with openers, linkers, and enders
- **Netcode**: Foundation for GGPO-style rollback netcode
- **Monetization**: Individual character DLC model (no loot boxes or soft currencies)
- **Cross-Platform**: Windows, macOS, Steam Deck (Linux) support
- **Open Source**: MIT License

## 🚀 Quick Start

### Prerequisites

- [Godot 4.4+](https://godotengine.org/download)
- [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0) or higher
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MichaelWBrennan/FightingGameTest.git
   cd FightingGameTest
   ```

2. Open the project in Godot:
   - Launch Godot Engine
   - Click "Import"
   - Navigate to the project folder and select `project.godot`
   - Click "Import & Edit"

3. Build the C# project:
   - In Godot, go to `Project > Tools > C# > Create C# solution`
   - Click the "Build" button or press `Ctrl+Shift+B`

4. Run the game:
   - Press `F5` or click the "Play" button in Godot

## 🎯 Controls

### Player 1 (Keyboard)
- **Movement**: WASD
- **Light Punch**: J
- **Medium Punch**: K
- **Heavy Punch**: L
- **Light Kick**: U
- **Medium Kick**: I
- **Heavy Kick**: O

### Player 2 (Keyboard)
- **Movement**: Arrow Keys
- **Light Punch**: Numpad 1
- **Medium Punch**: Numpad 2
- **Heavy Punch**: Numpad 3
- **Light Kick**: Numpad 4
- **Medium Kick**: Numpad 5
- **Heavy Kick**: Numpad 6

### Gamepad Support
Both players can use standard gamepads. The game supports Xbox, PlayStation, and fight stick controllers.

## 🏗️ Architecture

### Core Systems

- **GameManager**: Central game state and scene management
- **InputManager**: Deterministic input handling for rollback netcode
- **Character System**: Data-driven character loading from JSON files
- **Combo System**: Opener → Linker → Ender combo structure

### Data-Driven Design

Characters are defined in JSON files located in `data/characters/`. This allows for:
- Easy character balancing
- Modular DLC character additions
- Community modding support

### File Structure

```
FightingGameTest/
├── assets/                 # Game assets
│   ├── characters/         # Character sprites and animations
│   ├── stages/            # Stage backgrounds and music
│   ├── ui/                # UI elements and icons
│   └── audio/             # Sound effects and music
├── data/                  # Game data files
│   ├── characters/        # Character definitions (JSON)
│   └── stages/           # Stage configurations
├── scenes/               # Godot scene files
│   ├── main_menu/        # Main menu scene
│   ├── character_select/ # Character selection
│   ├── gameplay/         # Main gameplay scene
│   └── core/            # Core system scenes
└── scripts/             # C# source code
    ├── core/            # Core game systems
    ├── characters/      # Character logic
    ├── input/           # Input management
    ├── netcode/         # Networking (future)
    └── ui/              # User interface
```

## 🎭 Character System

### Adding New Characters

1. Create a new JSON file in `data/characters/` (see `ryu.json` as template)
2. Define character properties:
   - Basic stats (health, speed, etc.)
   - Move data with frame information
   - Combo routes
   - Animation references

3. Add character sprites to `assets/characters/`
4. The character will automatically appear in character select

### Move Data Structure

Each move includes detailed frame data:
- **Startup Frames**: Time before hitbox becomes active
- **Active Frames**: How long the hitbox remains active
- **Recovery Frames**: Time after hitbox deactivates
- **Advantage**: Frame advantage on hit/block
- **Properties**: Special properties (cancelable, invincible, etc.)

## 🔧 Building for Distribution

### Development Build
```bash
# In Godot editor
Project > Export > Add Export Template
# Select your target platform and export
```

### Steam Build (SteamPipe Compatible)
The project is structured to support Steam deployment:
1. Export builds to `builds/` directory
2. Configure Steam app ID
3. Use Steamworks SDK for Steam integration

### GitHub Actions CI/CD
Automated builds are configured for:
- Development branch builds
- Tag-based release builds
- Multi-platform exports

## 🛣️ Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development milestones.

### Phase 1: Core Foundation ✅
- [x] Basic gameplay mechanics
- [x] Character system
- [x] Input handling
- [x] UI framework

### Phase 2: Combat System (In Progress)
- [ ] Complete combo system
- [ ] Hit/hurtbox visualization
- [ ] Special move inputs
- [ ] Super meter system

### Phase 3: Netcode
- [ ] Rollback netcode implementation
- [ ] Online matchmaking
- [ ] Replay system

### Phase 4: Polish & Content
- [ ] Additional characters
- [ ] Stage variety
- [ ] Sound and VFX
- [ ] Training mode features

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Follow C# naming conventions
- Use meaningful variable names
- Document public APIs
- Keep functions focused and small

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Killer Instinct (2013) by Double Helix Games / Iron Galaxy Studios
- GGPO rollback netcode concepts by Tony Cannon
- Godot Engine community for excellent documentation

## 📞 Support

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our GitHub Discussions
- **Documentation**: Check the [DESIGN_DOC.md](DESIGN_DOC.md) for technical details

---

**Built with ❤️ for the FGC (Fighting Game Community)**