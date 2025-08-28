
# Street Fighter III: 3rd Strike – PlayCanvas Web Port (TypeScript)

Fully web-playable port of SFIII: 3rd Strike using the PlayCanvas engine and TypeScript. Minimal runtime, modern code structure, and smart asset preloading for fast start.

## 🏗️ Project Architecture (Minimal, Modern)

### Runtime (`src/core/`)
- `GameEngine.ts`: Main PlayCanvas engine bootstrap (update pipeline, services, states)
- `characters/CharacterManager.ts`: Character configs + spawning
- `combat/CombatSystem.ts`: Simplified frame logic hooks
- `input/InputManager.ts`: Keyboard/gamepad mapping
- `stages/StageManager.ts`: Camera/light/test scene
- `ui/UIManager.ts`: Menu + match HUD
- `utils/PreloadManager.ts`: Smart asset preloader (manifest-driven)
- `graphics/ShaderUtils.ts`: TS shader materials for PlayCanvas

Legacy conversion sources have been removed from runtime to keep the codebase focused and lean. The PlayCanvas path is authoritative.

## 📊 Characters & Combat

JSON-driven character configurations (`data/characters/`): Ryu, Ken, Chun-Li, Sagat, Zangief

## 🔧 Development Setup

### Installation
```bash
npm install
npm run build
npm run preview
```

Open the printed URL (defaults to http://localhost:5173). The game creates its own canvas and starts automatically.

### Vercel Deployment
- `public/` contains the built `bundle.js` and `data/`
- `api/index.ts` is a serverless entry that injects PlayCanvas + bundle and calls the game start
- `vercel.json` rewrites `/` → `/api/index`

## 📈 Notes

### Platform Support
- Web browsers (primary)
- Keyboard + gamepad
- WebGL2 via PlayCanvas

## 📦 Assets & Preloading
- Build step copies `data/` → `public/data/`
- A manifest is generated: `public/assets/manifest.json`
- `PreloadManager` loads the manifest and exposes helpers

## 📚 Docs
- See in-code comments and `types/` for engine/runtime types

## 📞 Support
Open an issue or PR on the repository branch.
