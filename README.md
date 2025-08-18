# Ethical Fighting Game Retention System

A player-respecting, high-retention system for PlayCanvas fighting games that delivers sustainable engagement and efficient monetization without exploitative mechanics.

## 🎯 Key Features

### Ethical Design
- **No loot boxes, gacha, or pay-to-win mechanics**
- **Direct, transparent pricing** for all cosmetics
- **Fair progression** based on skill and time, not purchases
- **Privacy by design** with GDPR/CCPA compliance

### Core Systems
- **Mastery Progression**: Infinite account and character tracks with cosmetic rewards
- **Session Anchors**: Daily/weekly objectives and rotating skill labs
- **Social Features**: Clubs, mentor system, and shareable replays
- **Churn Prevention**: Ethical winback with practice tools, not purchase pressure
- **Live Events**: Calendarized tournaments with earnable cosmetics

### HD-2D Graphics System
- **Modern HD-2D Pipeline**: Combines 2D sprites with 3D environments for a contemporary "2.5D" aesthetic
- **Modular Components**:
  - `StageLayerManager`: Manages multi-layer parallax stage backgrounds
  - `SpriteRendererHD2D`: Renders character sprites with normal maps and dynamic lighting
  - `CameraCinematicController`: Controls camera perspective and cinematic movements
  - `PostProcessingPipeline`: Handles screen-space effects like bloom and depth of field
- **Character System**: Flexible character data system with base configurations and variations
- **Stage System**: Multi-layer stage backgrounds with parallax scrolling and 3D props

### Technical Architecture
```
src/
├── client/           # PlayCanvas SDK
│   ├── retention/    # Session tracking & analytics
│   ├── commerce/     # Direct pricing & transparency
│   ├── social/       # Team formation & community
│   └── coach/        # Contextual gameplay tips
├── backend/          # Node.js microservices
│   ├── identity/     # Account management
│   ├── progression/  # Mastery tracking
│   ├── commerce/     # Catalog & payments
│   └── analytics/    # Event ingestion & prediction
├── scripts/          # Game systems
│   ├── characters/   # Character management
│   ├── combat/       # Combat system
│   ├── core/         # Core game systems
│   ├── graphics/     # HD-2D graphics pipeline
│   ├── components/   # PlayCanvas components
│   │   └── graphics/ # Graphics components
│   │       ├── StageLayerManager.ts
│   │       ├── SpriteRendererHD2D.ts
│   │       ├── CameraCinematicController.ts
│   │       └── PostProcessingPipeline.ts
│   └── ui/           # User interface
└── contracts/        # JSON Schema event definitions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with Bun runtime
- PostgreSQL 14+
- Redis 6+
- ClickHouse 23+ (for analytics)

### Installation
```bash
git clone <repository>
cd fighting-game-retention-system
bun install

# Database setup
createdb fighting_game_identity
createdb fighting_game_progression
createdb fighting_game_analytics

# Environment configuration
cp src/backend/identity/.env.example src/backend/identity/.env
cp src/backend/progression/.env.example src/backend/progression/.env
cp src/backend/analytics/.env.example src/backend/analytics/.env

# Start services
bun run dev:backend
```

### Client Integration
```typescript
import { RetentionClient } from '@fighting-game/client-sdk';

const retention = new RetentionClient({
  apiEndpoint: 'https://api.yourgame.com',
  userId: 'u_123',
  apiKey: 'your-api-key'
});

retention.startSession();
```

### Graphics System Integration

#### Adding New Characters
1. **Sprite Assets**: Add sprite sheets and normal maps to `assets/sprites/`
2. **Character Data**: Create `.base.json` and `.variations.json` files in `assets/data/characters/`
3. **Integration**: The `CharacterManager` automatically loads character data and creates instances with `SpriteRendererHD2D`

#### Creating New Stages
1. **Stage Assets**: Add layer textures and 3D props to `assets/`
2. **Stage Data**: Define stage layers, lighting, and camera settings in JSON files in `data/stages/`
3. **Integration**: The `StageLayerManager` handles creation and management of stage layers with parallax scrolling

#### Camera and Effects
- **Camera Control**: Use `CameraCinematicController` to set focus targets and adjust camera smoothing
- **Post-Processing**: The `PostProcessingPipeline` manages effects like bloom and depth of field

## 📊 Business Impact

- **Retention**: D1 ≥ 55%, D7 ≥ 30%, D30 ≥ 15%
- **Revenue**: ARPDAU uplift ≥ +15% through cosmetic sales
- **Economics**: LTV/CAC ≥ 3.0 within 90 days
- **Satisfaction**: CSAT ≥ 80, NPS ≥ +40
- **Performance**: 60 FPS target with efficient rendering pipeline

## 📄 Documentation

For detailed information about the graphics system, see:
- [HD-2D Graphics Pipeline Documentation](GRAPHICS_PIPELINE.md) - Complete guide to the rendering pipeline

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
**Built with ❤️ for the fighting game community**