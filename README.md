# Fighting Game Platform

An industry-defining competitive fighting game platform built on Godot 4 with C# scripting. Inspired by the greatest fighting games of all time, this project creates an evolving platform for continuous content delivery without traditional sequel fragmentation.

## 🎯 Vision

Create the last fighting game platform a player ever needs—continuously evolving, professionally maintained, with no sequels, no currency grinding, and no power creep. Maintain competitive fairness, mechanical expression, and mass accessibility.

## 🎮 Features

### Core Platform
- **Engine**: Godot 4 with C# scripting for MIT license compliance
- **Architecture**: Data-driven character system with JSON configuration
- **Monetization**: Ethical cosmetic-only system with weekly fighter rotation (no character purchases)
- **Cross-Platform**: Windows, macOS, Steam Deck (Linux) support
- **Open Source**: MIT License for community contributions

### Live-Service Framework
- **Automated Deployment**: GitHub Actions → SteamPipe integration
- **Live Balance Hotfixes**: Config-only updates without client patches
- **Modular Cosmetic System**: Ethical monetization through cosmetics only
- **Weekly Fighter Rotation**: All characters accessible through rotation
- **Version Control**: Automated build versioning and hotfix delivery

### Combat Systems (Best of All-Time Integration)
- **Rollback Netcode**: GGPO-style deterministic input synchronization
- **Roman Cancel System**: Multi-tier cancel logic with frame freeze visuals
- **Parry & Just Defend**: Third Strike/Garou-inspired defensive mechanics  
- **Combo System**: Killer Instinct-inspired opener/linker/ender structure
- **Balance Infrastructure**: Live telemetry with automated tier suggestions

### Character Archetype System
Complete 16-24 character roster with major fighting game archetypes:
- **Shoto**: Balanced fundamentals (Ryu-style)
- **Rushdown**: High-speed pressure (Chun-Li-style) 
- **Grappler**: High damage, close-range specialist
- **Zoner**: Long-range control, keep-away specialist
- **Technical**: Complex mechanics, high skill ceiling

Each character includes:
- Archetype classification and complexity tier
- Counterplay tags and meter interactions
- Unique mechanics flags (parry, stance swap, projectile deflect)
- Independent maintenance and expansion capability

### Competitive & Community Systems
- **Ranked Ladder**: TrueSkill-based matchmaking with anti-smurfing
- **Multiple Modes**: Casual queue, custom rooms, tournament mode, offline versus
- **Replay System**: Local and server-side with rollback state synchronization
- **Integration**: Discord RPC and OBS overlay hooks
- **API**: Open leaderboard API for third-party sites

### Developer Tools & Pipeline
- **Dev Console**: Frame step, hitbox visualization, input display (F1)
- **CHARACTER_DEV_TEMPLATE**: Complete template for modular character creation
- **Balance Analytics**: Match telemetry with automated balance suggestions
- **Live Config**: Real-time balance adjustments without client updates

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

2. Open in Godot:
   - Launch Godot Engine
   - Click "Import"
   - Navigate to project folder and select `project.godot`
   - Click "Import & Edit"

3. Build the C# project:
   - In Godot: `Project > Tools > C# > Create C# solution`
   - Click "Build" or press `Ctrl+Shift+B`

4. Run the game:
   - Press `F5` or click "Play" button

## 🎯 Controls

### Player 1 (Keyboard)
- **Movement**: WASD
- **Light Punch**: J | **Medium Punch**: K | **Heavy Punch**: L
- **Light Kick**: U | **Medium Kick**: I | **Heavy Kick**: O

### Player 2 (Keyboard)
- **Movement**: Arrow Keys  
- **Light Punch**: Numpad 1 | **Medium Punch**: Numpad 2 | **Heavy Punch**: Numpad 3
- **Light Kick**: Numpad 4 | **Medium Kick**: Numpad 5 | **Heavy Kick**: Numpad 6

### Developer Controls
- **F1**: Toggle Developer Console
- **F2**: Frame Step (when enabled)

Both players support standard gamepads (Xbox, PlayStation, fight sticks).

## 🏗️ Architecture

### Live-Service Infrastructure
```
GitHub Actions → Build Pipeline → Steam Deployment
     ↓              ↓                   ↓
Live Balance ← Config Updates → Client Hotfixes
```

### Character System
Characters defined in JSON with comprehensive data:
```
data/characters/[character_id].json
├── Archetype & Complexity Classification
├── Frame Data & Hitbox Information  
├── Combo Routes & Move Properties
├── Balance Multipliers & Adjustments
└── Telemetry Integration Points
```

### Modular Systems
Each major fighting game mechanic operates as independent module:
- Roman Cancel System (toggleable)
- Parry & Defend System (configurable windows)
- Combo Scaling Engine (adjustable parameters)
- Balance Manager (live config updates)
- Telemetry System (automatic data collection)

## 🎭 Character Development

### Creating New Characters
1. Copy `CHARACTER_DEV_TEMPLATE/` folder
2. Edit `character_config.json` with character data
3. Add animations and sound effects
4. Test using developer console: `spawn [character_id]`
5. Iterate based on balance telemetry

### Archetype Guidelines
- **Easy**: 3-5 frame startup moves, simple inputs
- **Medium**: 6-10 frame startup, quarter-circle motions
- **Hard**: 8-15 frame startup, complex inputs
- **Expert**: Variable timing, unique mechanics

See `CHARACTER_DEV_TEMPLATE/README.md` for detailed guidelines.

## ⚖️ Balance Philosophy

### Core Principles
1. **Competitive Integrity**: No pay-to-win, all characters viable
2. **Anti-Power-Creep**: Strict limits on damage, speed, health
3. **Risk/Reward Consistency**: High reward requires high risk

### Balance Process
- **Quarterly Major Patches**: Character adjustments, system changes
- **Monthly Minor Patches**: Frame data tweaks, damage adjustments  
- **Live Hotfixes**: Critical fixes via config updates
- **Community Feedback**: Beta testing, surveys, tournament data

See `BALANCE.md` for complete balance philosophy and guidelines.

## 🔧 Building for Distribution

### Development Build
In Godot editor: `Project > Export > [Platform]`

### Steam Integration
Configured for SteamPipe deployment:
```bash
# Triggered by GitHub Actions on tag push
git tag v1.0.0
git push origin v1.0.0
```

### Hotfix Deployment  
```bash
# Config-only hotfix deployment
gh workflow run release.yml -f hotfix_mode=true
```

## 🛣️ Development Roadmap

### Phase 1: Foundation ✅
- [x] Core gameplay mechanics  
- [x] Character system with archetype classification
- [x] Live-service infrastructure
- [x] Balance and telemetry systems

### Phase 2: Advanced Mechanics (In Progress)
- [ ] Complete Roman Cancel implementation
- [ ] Parry system visual feedback
- [ ] Adaptive AI training mode
- [ ] Hitbox editor integration

### Phase 3: Content Expansion
- [ ] 16-character launch roster
- [ ] Tournament mode with bracket system
- [ ] Advanced replay features
- [ ] Community integration features

### Phase 4: Competitive Launch
- [ ] Ranked matchmaking with anti-smurfing
- [ ] Professional tournament support
- [ ] Streaming integration tools
- [ ] Community mod support

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Follow coding standards in `DESIGN_DOC.md`
4. Test with developer console
5. Submit pull request with balance justification

### Character Contributions
- Use `CHARACTER_DEV_TEMPLATE/` for new characters
- Include balance rationale and counterplay options
- Test against existing roster for balance
- Provide placeholder assets if art unavailable

### Balance Contributions
- Submit telemetry data with proposed changes
- Justify changes with competitive reasoning
- Test in community beta program
- Document impact on existing meta

## 📊 Analytics & Telemetry

The platform collects anonymous match data for balance purposes:
- Character win/loss rates per archetype
- Move usage and effectiveness statistics  
- Combo damage distribution analysis
- Defensive option success rates

Data is used exclusively for balance improvements and is never sold or shared.

## 📄 License & Credits

**License**: MIT License - see [LICENSE](LICENSE) file

**Inspired By**:
- Killer Instinct (2013) - Combo system and live-service model
- Guilty Gear Series - Roman Cancel mechanics  
- Street Fighter Third Strike - Parry system
- GGPO - Rollback netcode concepts

**Built With**: 
- Godot Engine 4.4+ (MIT License)
- .NET 6.0+ Runtime
- GitHub Actions CI/CD
- Community feedback and contributions

## 📞 Support & Community

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions for feature requests
- **Balance Feedback**: Use in-game telemetry system
- **Developer Documentation**: See [DESIGN_DOC.md](DESIGN_DOC.md)

---

**Built with ❤️ for the FGC (Fighting Game Community)**

*Creating the definitive competitive fighting game platform - no sequels, no grinding, just pure competitive evolution.*