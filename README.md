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

## 📊 Business Impact

- **Retention**: D1 ≥ 55%, D7 ≥ 30%, D30 ≥ 15%
- **Revenue**: ARPDAU uplift ≥ +15% through cosmetic sales
- **Economics**: LTV/CAC ≥ 3.0 within 90 days
- **Satisfaction**: CSAT ≥ 80, NPS ≥ +40

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
**Built with ❤️ for the fighting game community**