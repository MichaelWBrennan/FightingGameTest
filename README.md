# Fighting Game Retention System

A player-respecting, high-retention, high-ROI live system for PlayCanvas fighting games. This system delivers sustainable retention and efficient monetization without exploitative mechanics, optimizing LTV/CAC, D30/D90 retention, and ARPDAU through value creation rather than compulsion.

## 🎯 Mission Statement

Position your fighting game as the industry benchmark for ethical player retention while maximizing lifetime value through mastery, community, and transparent cosmetics—all without sacrificing player trust.

## 🛡️ Ethical Guardrails (Non-Negotiables)

- ❌ **No loot boxes, gacha, paid randomness, pay-to-win, or energy timers**
- ❌ **No virtual currency abstraction** - Direct, transparent pricing only
- ❌ **No FOMO traps** - Time-limited items have periodic reruns or transparent return paths
- ✅ **Fair progression** - Power is earned by skill/time, not purchase (cosmetics only)
- ✅ **Privacy by design** - GDPR/CCPA compliance with opt-in telemetry
- ✅ **Deterministic gameplay** - Retention systems never affect netcode or match fairness

## 📊 Business KPIs (Target Metrics)

- **Retention**: D1 ≥ 55%, D7 ≥ 30%, D30 ≥ 15%, D90 ≥ 8%
- **Revenue**: ARPDAU uplift ≥ +15% through cosmetic value, not power differential
- **Economics**: LTV/CAC ≥ 3.0 within 90 days
- **Satisfaction**: CSAT ≥ 80, NPS ≥ +40, Refund rate ≤ 2%

## 🏗️ System Architecture

### Client SDK (PlayCanvas)
Drop-in TypeScript SDK for tracking and engagement features:

```
src/client/
├── retention/
│   ├── RetentionClient.ts    # Session tracking & analytics
│   └── MasteryEngine.ts      # XP tracking & prestige
├── commerce/
│   └── Storefront.ts         # Direct pricing & transparency
├── social/
│   └── Clubs.ts              # Team formation & community
└── coach/
    └── CoachOverlay.ts       # Contextual gameplay tips
```

### Backend Services (Node.js + TypeScript)
Modular microservices architecture:

```
src/backend/
├── identity/          # Account management & consent
├── progression/       # Mastery tracking & objectives  
├── commerce/          # Catalog & direct payments
├── analytics/         # Event ingestion & churn prediction
├── liveops/          # Events & seasonal content
└── notify/           # Opt-in communication
```

### Data Contracts
JSON Schema-based event and configuration contracts:

```
contracts/
├── events/           # Event schemas (session, match, purchase, etc.)
└── config/          # Configuration schemas (objectives, catalog, etc.)
```

## 🎮 Core Features

### 1. Mastery-Centric Progression (Power-Neutral)
- **Account Mastery Track**: Infinite, prestige-able progression
- **Character Mastery Tracks**: Individual character specialization
- **Archetype Challenges**: Cross-character skill development
- **Rewards**: Titles, banners, announcer packs, VFX palettes, stage variants, profile cosmetics
- **Guarantee**: No gameplay advantage from any rewards

### 2. Session Anchors & Cadence
- **Daily/Weekly Objectives**: Skill-oriented, short lists, no streak penalties
- **Rotating Labs**: Curated "learn an archetype" queues with boosted XP and coaching overlays
- **Seasonal Ladders**: Transparent MMR with decay that never deletes rank rewards

### 3. Social & Status Systems
- **Clubs/Teams**: Opt-in social features with shared objectives and group trophies
- **Mentor Mode**: Veteran coaching system with cosmetic rewards for mentors
- **Replays + Highlights**: Shareable clips with creator watermark opt-in

### 4. Ethical Monetization (Cosmetics Only)
- **Direct Purchase**: Clear pricing, tax included, regionally appropriate
- **Bundle Transparency**: Visible à-la-carte vs bundle pricing with no dark discounts
- **Showcase Store**: Rotating cosmetics with documented Return Window dates in UI

### 5. Player Knowledge & Onboarding
- **Contextual Coach**: Frame-data tips, matchup primers, "why you lost" summaries
- **Sandbox Labs**: CPU scripts for practicing meta-common strings; save/load labs

### 6. Churn Prediction & Respectful Winback
- **On-Device Signals**: Lightweight behavioral analysis + backend models
- **Ethical Winback**: Practice vouchers, Lab unlocks, training tools—not purchase pressure
- **Opt-In Communication**: Rate-limited, one-click unsubscribe

### 7. Live-Ops Operating System
- **Calendarized Events**: Skill trials, community tournaments with fixed start/stop
- **No Paid Passes**: Event cosmetics are earnable via play and return to store later

### 8. Analytics & Experimentation
- **First-Party Telemetry**: Event contracts, cohorting, holdout groups
- **A/B/n Framework**: Fixed-horizon statistics to avoid peeking
- **Ethical Governance**: Experiments cannot change match fairness

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with Bun runtime
- PostgreSQL 14+
- Redis 6+
- ClickHouse 23+ (for analytics)

### Installation

1. **Clone and Setup**
```bash
git clone <repository>
cd fighting-game-retention-system
bun install
```

2. **Database Setup**
```bash
# PostgreSQL setup
createdb fighting_game_identity
createdb fighting_game_progression
createdb fighting_game_analytics

# Redis setup (default configuration)
redis-server

# ClickHouse setup
# Install ClickHouse and create database: fighting_game_events
```

3. **Environment Configuration**
```bash
# Copy environment templates
cp src/backend/identity/.env.example src/backend/identity/.env
cp src/backend/progression/.env.example src/backend/progression/.env
cp src/backend/analytics/.env.example src/backend/analytics/.env

# Edit each .env file with your database credentials
```

4. **Start Services**
```bash
# Start all backend services
bun run dev:backend

# Or start individually
cd src/backend/identity && bun run dev
cd src/backend/progression && bun run dev  
cd src/backend/analytics && bun run dev
```

5. **Client Integration**
```typescript
import { RetentionClient, MasteryEngine, Storefront } from '@fighting-game/client-sdk';

// Initialize retention tracking
const retention = new RetentionClient({
  apiEndpoint: 'https://api.yourgame.com',
  userId: 'u_123',
  apiKey: 'your-api-key'
});

// Start session tracking
retention.startSession();

// Track match results
retention.trackMatchResult({
  matchId: 'm_456',
  ranked: true,
  roundsWon: 2,
  roundsLost: 1,
  characterId: 'grappler_a',
  opponentId: 'rushdown_b',
  disconnect: false
});
```

## 📈 Analytics & Metrics

### Event Tracking
The system tracks key events for retention analysis:

- **Session Events**: Start, end, duration
- **Match Events**: Results, character usage, disconnects
- **Progression Events**: XP grants, level ups, prestige
- **Commerce Events**: Store views, purchases, bundle interactions
- **Social Events**: Club activities, mentor sessions

### Churn Prediction
Ethical churn prediction focuses on value creation:

- **Cold-Start Heuristics**: New player analysis (0-7 days)
- **Behavioral Patterns**: Session frequency, skill progression, social engagement
- **Risk Tiers**: Low/Medium/High with transparent explanations
- **Winback Actions**: Practice unlocks, mentor matching, skill feedback (never purchase pressure)

### A/B Testing
Built-in experimentation framework:

- **Traffic Splitting**: Consistent user assignment to test variants
- **Statistical Rigor**: Fixed-horizon testing to avoid peeking
- **Ethical Constraints**: Experiments cannot affect competitive balance
- **Governance**: All tests reviewed for player impact

## 🎨 Customization & Extension

### Adding New Event Types
1. Create JSON schema in `contracts/events/`
2. Update client SDK interfaces
3. Add server-side validation
4. Update analytics pipelines

### Extending Progression
1. Add new XP sources in `ProgressionEngine`
2. Define new mastery tracks
3. Create reward definitions
4. Update client UI hooks

### Custom Monetization
1. Add item types in catalog schema
2. Implement new store sections
3. Add pricing models
4. Ensure ethical compliance

## 🔒 Privacy & Compliance

### GDPR/CCPA Compliance
- **Explicit Consent**: All non-essential data collection requires opt-in
- **Data Minimization**: Only collect data needed for stated purposes
- **Right to Deletion**: Complete data removal on request
- **Data Portability**: Export all user data in standard formats

### Consent Management
```typescript
// Check consent before analytics
const hasAnalyticsConsent = await consentManager.hasConsent(userId, 'analytics');
if (hasAnalyticsConsent) {
  analytics.track(event);
}

// Update communication preferences
await consentManager.updateCommunicationPreferences(userId, {
  emailMarketing: false,
  emailUpdates: true,
  emailSecurity: true,
  pushNotifications: false
});
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
bun test

# Test specific service
cd src/backend/progression && bun test

# Test client SDK
cd src/client && bun test
```

### Integration Tests
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up

# Run integration tests
bun run test:integration
```

### Contract Validation
```bash
# Validate all schemas
bun run validate-contracts

# Validate specific event
bun run validate-event contracts/events/match_result.v1.json
```

## 📊 Monitoring & Dashboards

### Key Metrics Dashboard
- **Retention Curves**: D1/D7/D30/D90 retention by cohort
- **Revenue Metrics**: ARPDAU, LTV, conversion rates
- **Engagement**: Session frequency, duration, match participation
- **Churn Risk**: Distribution of risk scores, winback effectiveness

### Operational Metrics
- **Service Health**: API response times, error rates, uptime
- **Data Pipeline**: Event ingestion rates, processing delays
- **Experiment Status**: Active tests, statistical power, results

### Business Intelligence
- **Cohort Analysis**: Player behavior segmentation
- **Feature Usage**: Adoption rates for new features
- **Content Performance**: Lab completion rates, objective engagement

## 🚢 Deployment

### Production Environment
```bash
# Build all services
bun run build

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up

# Or deploy individual services
cd src/backend/identity && bun run start
```

### Environment Variables
Critical production settings:

```env
# Security
JWT_SECRET=your-production-jwt-secret
API_KEYS=prod-key-1,prod-key-2

# Databases
DB_HOST=your-postgres-host
CLICKHOUSE_HOST=your-clickhouse-host
REDIS_HOST=your-redis-host

# External Services
STRIPE_SECRET_KEY=your-stripe-key
IDENTITY_SERVICE_URL=https://identity.yourgame.com
```

### Scaling Considerations
- **Event Ingestion**: Use Kafka for high-throughput scenarios
- **Analytics**: ClickHouse clustering for large datasets  
- **Caching**: Redis clustering for session storage
- **Load Balancing**: Service mesh for microservice communication

## 📚 Documentation

### Core Documentation
- [Player Bill of Rights](docs/player_bill_of_rights.md) - Our ethical framework
- [Economy Design](docs/economy_no_currency.md) - Transparent monetization approach
- [Privacy & Consent](docs/privacy_and_optin.md) - Data handling practices
- [Experimentation Guide](docs/experimentation_playbook.md) - A/B testing methodology

### Technical Documentation  
- [API Reference](docs/api_reference.md) - Complete API documentation
- [Event Schemas](docs/event_schemas.md) - All event contract definitions
- [Database Schema](docs/database_schema.md) - Database structure reference
- [Deployment Guide](docs/deployment.md) - Production deployment instructions

### Development Guides
- [Contributing](docs/contributing.md) - Contribution guidelines
- [Architecture](docs/architecture.md) - System design overview
- [Security](docs/security.md) - Security considerations and practices

## 🤝 Contributing

We welcome contributions that align with our ethical framework:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b ethical-feature`
3. **Follow our coding standards**: ESLint configuration provided
4. **Add tests**: Maintain test coverage above 80%
5. **Update documentation**: Keep docs current with changes
6. **Submit pull request**: Include ethical impact assessment

### Ethical Review Process
All contributions undergo ethical review:
- Does this respect player autonomy?
- Does this create genuine value?
- Is this transparent and fair?
- Does this maintain competitive integrity?

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

- **Documentation**: [docs.yourgame.com](https://docs.yourgame.com)
- **Community**: [community.yourgame.com](https://community.yourgame.com)
- **Issues**: [GitHub Issues](https://github.com/yourgame/retention-system/issues)
- **Ethics Concerns**: ethics@yourgame.com
- **Player Rights**: rights@yourgame.com

## 🎖️ Industry Benchmark

This system represents a new standard for ethical game monetization and retention. By choosing transparency over manipulation, value creation over exploitation, and player respect over short-term revenue, we demonstrate that commercial success and ethical practices are not just compatible—they're synergistic.

---

**Built with ❤️ for the fighting game community**

*When the industry chooses dark patterns, we choose transparency.*  
*When others exploit, we create value.*  
*When competitors manipulate, we respect.*

This is the future of ethical game development. Join us.