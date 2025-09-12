
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

JSON-driven character configurations (`data/characters/`): Ryu, Ken, Chun-Li, Sagat, Zangief, Lei Wulong

## ▶️ Play in your browser (no npm)

- Open a hosted copy of the `public/` folder in any modern browser. No Node or npm is required for players.
- Local quick play (no npm): serve the `public/` folder over HTTP, then open the printed URL.
  - Python 3: `python3 -m http.server --directory public 8080`
  - BusyBox: `busybox httpd -f -p 8080 -h public`
  - Note: Opening `public/index.html` directly from the filesystem may fail because paths like `/bundle.js` are absolute and expect an HTTP host root.
- Required files in `public/` to play:
  - `index.html`
  - `bundle.js`
  - `data/` (and optional `assets/`)

If `public/bundle.js` is missing, use a prebuilt release or build from source (below).

## 🔧 Build from source (contributors)

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

Players: once deployed, just open your site URL in a browser — no downloads or npm required.

### Static hosting (no serverless)
- Serve the `public/` directory at your site root so `/bundle.js` resolves correctly.
- Works on any static host or CDN. No backend required.

## 📈 Notes

### Platform Support
- Web browsers (primary)
- Keyboard + gamepad
- WebGL2 via PlayCanvas

## 📦 Assets & Preloading
- Build step copies `data/` → `public/data/`
- A manifest is generated: `public/assets/manifest.json`
- `PreloadManager` loads the manifest and exposes helpers
  - The manifest excludes large opaque binaries like `encrypted.bin`; such files are not preloaded and should be fetched on-demand by the features that require them.
  - Static assets are requested with a `?v=BUILD_VERSION` query so browsers can cache between deploys.

### Ground-truth character data (optional)
- To seed frames from the decomp repo, clone it at `/workspace/sfiii-decomp`.
- Import runs automatically during `npm run build` if the repo is present, or run it manually:
```bash
npx ts-node tools/import_sf3_char_data.ts
```
- This writes JSON into `data/characters_decomp/` and the runtime will be able to fetch it via `DecompDataService` if referenced.

## 📚 Docs
- See in-code comments and `types/` for engine/runtime types

## 📞 Support
Open an issue or PR on the repository branch.
