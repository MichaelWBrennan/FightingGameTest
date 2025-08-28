var SF3App = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // types/playcanvas-shim.ts
  var require_playcanvas_shim = __commonJS({
    "types/playcanvas-shim.ts"(exports, module) {
      var pcGlobal = globalThis.pc;
      module.exports = pcGlobal;
    }
  });

  // node_modules/eventemitter3/index.js
  var require_eventemitter3 = __commonJS({
    "node_modules/eventemitter3/index.js"(exports, module) {
      "use strict";
      var has = Object.prototype.hasOwnProperty;
      var prefix = "~";
      function Events() {
      }
      if (Object.create) {
        Events.prototype = /* @__PURE__ */ Object.create(null);
        if (!new Events().__proto__) prefix = false;
      }
      function EE(fn, context, once) {
        this.fn = fn;
        this.context = context;
        this.once = once || false;
      }
      function addListener(emitter, event, fn, context, once) {
        if (typeof fn !== "function") {
          throw new TypeError("The listener must be a function");
        }
        var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
        if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
        else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
        else emitter._events[evt] = [emitter._events[evt], listener];
        return emitter;
      }
      function clearEvent(emitter, evt) {
        if (--emitter._eventsCount === 0) emitter._events = new Events();
        else delete emitter._events[evt];
      }
      function EventEmitter3() {
        this._events = new Events();
        this._eventsCount = 0;
      }
      EventEmitter3.prototype.eventNames = function eventNames() {
        var names = [], events, name;
        if (this._eventsCount === 0) return names;
        for (name in events = this._events) {
          if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
        }
        if (Object.getOwnPropertySymbols) {
          return names.concat(Object.getOwnPropertySymbols(events));
        }
        return names;
      };
      EventEmitter3.prototype.listeners = function listeners(event) {
        var evt = prefix ? prefix + event : event, handlers = this._events[evt];
        if (!handlers) return [];
        if (handlers.fn) return [handlers.fn];
        for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
          ee[i] = handlers[i].fn;
        }
        return ee;
      };
      EventEmitter3.prototype.listenerCount = function listenerCount(event) {
        var evt = prefix ? prefix + event : event, listeners = this._events[evt];
        if (!listeners) return 0;
        if (listeners.fn) return 1;
        return listeners.length;
      };
      EventEmitter3.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return false;
        var listeners = this._events[evt], len = arguments.length, args, i;
        if (listeners.fn) {
          if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
          switch (len) {
            case 1:
              return listeners.fn.call(listeners.context), true;
            case 2:
              return listeners.fn.call(listeners.context, a1), true;
            case 3:
              return listeners.fn.call(listeners.context, a1, a2), true;
            case 4:
              return listeners.fn.call(listeners.context, a1, a2, a3), true;
            case 5:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
            case 6:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
          }
          for (i = 1, args = new Array(len - 1); i < len; i++) {
            args[i - 1] = arguments[i];
          }
          listeners.fn.apply(listeners.context, args);
        } else {
          var length = listeners.length, j;
          for (i = 0; i < length; i++) {
            if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
            switch (len) {
              case 1:
                listeners[i].fn.call(listeners[i].context);
                break;
              case 2:
                listeners[i].fn.call(listeners[i].context, a1);
                break;
              case 3:
                listeners[i].fn.call(listeners[i].context, a1, a2);
                break;
              case 4:
                listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                break;
              default:
                if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                  args[j - 1] = arguments[j];
                }
                listeners[i].fn.apply(listeners[i].context, args);
            }
          }
        }
        return true;
      };
      EventEmitter3.prototype.on = function on(event, fn, context) {
        return addListener(this, event, fn, context, false);
      };
      EventEmitter3.prototype.once = function once(event, fn, context) {
        return addListener(this, event, fn, context, true);
      };
      EventEmitter3.prototype.removeListener = function removeListener(event, fn, context, once) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return this;
        if (!fn) {
          clearEvent(this, evt);
          return this;
        }
        var listeners = this._events[evt];
        if (listeners.fn) {
          if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
            clearEvent(this, evt);
          }
        } else {
          for (var i = 0, events = [], length = listeners.length; i < length; i++) {
            if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
              events.push(listeners[i]);
            }
          }
          if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
          else clearEvent(this, evt);
        }
        return this;
      };
      EventEmitter3.prototype.removeAllListeners = function removeAllListeners(event) {
        var evt;
        if (event) {
          evt = prefix ? prefix + event : event;
          if (this._events[evt]) clearEvent(this, evt);
        } else {
          this._events = new Events();
          this._eventsCount = 0;
        }
        return this;
      };
      EventEmitter3.prototype.off = EventEmitter3.prototype.removeListener;
      EventEmitter3.prototype.addListener = EventEmitter3.prototype.on;
      EventEmitter3.prefixed = prefix;
      EventEmitter3.EventEmitter = EventEmitter3;
      if ("undefined" !== typeof module) {
        module.exports = EventEmitter3;
      }
    }
  });

  // src/core/utils/ConfigService.ts
  var ConfigService_exports = {};
  __export(ConfigService_exports, {
    ConfigService: () => ConfigService
  });
  var ConfigService;
  var init_ConfigService = __esm({
    "src/core/utils/ConfigService.ts"() {
      ConfigService = class {
        constructor() {
          this.cache = /* @__PURE__ */ new Map();
        }
        async loadJson(path, bust = false) {
          if (!bust && this.cache.has(path)) return this.cache.get(path);
          const res = await fetch(path);
          if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
          const data = await res.json();
          this.cache.set(path, data);
          return data;
        }
      };
    }
  });

  // src/core/debug/DebugOverlay.ts
  var DebugOverlay_exports = {};
  __export(DebugOverlay_exports, {
    DebugOverlay: () => DebugOverlay
  });
  var DebugOverlay;
  var init_DebugOverlay = __esm({
    "src/core/debug/DebugOverlay.ts"() {
      DebugOverlay = class {
        constructor() {
          this.lastTime = performance.now();
          this.frames = 0;
          this.fps = 0;
          this.container = document.createElement("div");
          this.container.style.position = "fixed";
          this.container.style.top = "8px";
          this.container.style.left = "8px";
          this.container.style.background = "rgba(0,0,0,0.5)";
          this.container.style.color = "#0f0";
          this.container.style.font = "12px monospace";
          this.container.style.padding = "6px 8px";
          this.container.style.borderRadius = "4px";
          this.container.style.zIndex = "9999";
          this.fpsLabel = document.createElement("div");
          this.timingsLabel = document.createElement("div");
          this.container.appendChild(this.fpsLabel);
          this.container.appendChild(this.timingsLabel);
          document.body.appendChild(this.container);
        }
        update() {
          this.frames++;
          const now = performance.now();
          if (now - this.lastTime >= 1e3) {
            this.fps = Math.round(this.frames * 1e3 / (now - this.lastTime));
            this.frames = 0;
            this.lastTime = now;
            this.fpsLabel.textContent = `FPS: ${this.fps}`;
          }
        }
        setTimings(samples) {
          const text = samples.map((s) => `${s.name}:${s.ms.toFixed(2)}ms`).join("  ");
          this.timingsLabel.textContent = text;
        }
      };
    }
  });

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    defaultStart: () => defaultStart
  });

  // src/core/GameEngine.ts
  var pc8 = __toESM(require_playcanvas_shim());

  // src/core/characters/CharacterManager.ts
  var pc = __toESM(require_playcanvas_shim());

  // src/core/utils/Logger.ts
  var Logger = class {
    static setLogLevel(level) {
      this.logLevel = level;
    }
    static debug(message, ...args) {
      if (this.logLevel <= 0 /* DEBUG */) {
        console.debug(`${this.prefix}[DEBUG]`, message, ...args);
      }
    }
    static info(message, ...args) {
      if (this.logLevel <= 1 /* INFO */) {
        console.info(`${this.prefix}[INFO]`, message, ...args);
      }
    }
    static warn(message, ...args) {
      if (this.logLevel <= 2 /* WARN */) {
        console.warn(`${this.prefix}[WARN]`, message, ...args);
      }
    }
    static error(message, ...args) {
      if (this.logLevel <= 3 /* ERROR */) {
        console.error(`${this.prefix}[ERROR]`, message, ...args);
      }
    }
  };
  Logger.logLevel = 1 /* INFO */;
  Logger.prefix = "[SF3]";

  // src/core/procgen/ProceduralFrameGenerator.ts
  var ProceduralFrameGenerator = class {
    generateForCharacter(config) {
      const updated = { ...config };
      const animations = updated.animations || {};
      const moveGroups = [updated.moves, updated.normals, updated.specials, updated.supers];
      for (const group of moveGroups) {
        if (!group) continue;
        for (const [name, move] of Object.entries(group)) {
          const key = `move_${name}`;
          if (!animations[key]) {
            const total = (move.startupFrames || move.startup || 0) + (move.activeFrames || move.active || 0) + (move.recoveryFrames || move.recovery || 0);
            animations[key] = {
              frameCount: Math.max(1, total || 5),
              duration: Math.max(83, (total || 5) * 16.6),
              loop: false
            };
          }
        }
      }
      updated.animations = animations;
      return updated;
    }
  };

  // src/core/characters/CharacterManager.ts
  var CharacterManager = class {
    constructor(app) {
      this.characters = /* @__PURE__ */ new Map();
      this.characterConfigs = /* @__PURE__ */ new Map();
      this.activeCharacters = [];
      this.preloader = null;
      this.frameGen = new ProceduralFrameGenerator();
      this.decomp = null;
      this.app = app;
    }
    async initialize() {
      try {
        const services = this.app._services;
        if (services && services.resolve) {
          this.preloader = services.resolve("preloader");
          try {
            this.decomp = services.resolve("decomp");
          } catch {
          }
        }
      } catch {
      }
      await this.loadCharacterConfigs();
      Logger.info("Character manager initialized");
    }
    async loadCharacterConfigs() {
      try {
        const dbResponse = await fetch("/data/characters_db.json");
        if (dbResponse.ok) {
          const db = await dbResponse.json();
          const keys = Object.keys(db);
          for (const key of keys) {
            let cfg = this.normalizeCharacterConfig(db[key]);
            cfg = this.frameGen.generateForCharacter(cfg);
            this.characterConfigs.set(key, cfg);
          }
          Logger.info(`Loaded ${keys.length} characters from consolidated database`);
          return;
        }
      } catch (e) {
        Logger.warn("Consolidated character database not found; falling back to individual files");
      }
      const characterNames = ["ryu", "ken", "chun_li", "sagat", "zangief"];
      for (const name of characterNames) {
        try {
          const response = await fetch(`/data/characters/${name}.json`);
          const rawConfig = await response.json();
          let config = this.normalizeCharacterConfig(rawConfig);
          config = this.frameGen.generateForCharacter(config);
          this.characterConfigs.set(name, config);
          Logger.info(`Loaded character config: ${name}`);
        } catch (error) {
          Logger.error(`Failed to load character ${name}:`, error);
        }
      }
      try {
        let cfg = null;
        try {
          const gt = await fetch("/data/characters_decomp/sf3_ground_truth_seed.json");
          if (gt.ok) cfg = await gt.json();
        } catch {
        }
        if (!cfg && this.decomp) cfg = await this.decomp.deriveFromDecompIfAvailable();
        if (cfg) {
          const norm = this.normalizeCharacterConfig(cfg);
          const finalCfg = this.frameGen.generateForCharacter(norm);
          this.characterConfigs.set(cfg.characterId || "sf3_ground_truth_seed", finalCfg);
          Logger.info("Loaded ground-truth character seed");
        }
      } catch {
      }
    }
    normalizeCharacterConfig(config) {
      const normalizedStats = {
        health: config.stats?.health ?? config.health ?? 1e3,
        walkSpeed: config.stats?.walkSpeed ?? config.walkSpeed ?? 2
      };
      let flattenedMoves = void 0;
      const movesAny = config.moves;
      if (movesAny && typeof movesAny === "object") {
        const groups = ["normals", "specials", "supers", "throws", "unique"];
        flattenedMoves = {};
        for (const key of Object.keys(movesAny)) {
          if (groups.includes(key) && movesAny[key] && typeof movesAny[key] === "object") {
            Object.assign(flattenedMoves, movesAny[key]);
          } else if (movesAny[key] && typeof movesAny[key] === "object") {
            flattenedMoves[key] = movesAny[key];
          }
        }
      }
      const normalized = {
        ...config,
        stats: normalizedStats,
        moves: flattenedMoves ?? config.moves
      };
      return normalized;
    }
    createCharacter(characterId, position) {
      try {
        const services = this.app._services;
        const entitlement = services?.resolve?.("entitlement");
        if (entitlement && !entitlement.hasCharacterAccess?.(characterId, "casual")) {
          Logger.warn(`Access denied by entitlements for character: ${characterId}`);
          return null;
        }
      } catch {
      }
      const config = this.characterConfigs.get(characterId);
      if (!config) {
        Logger.error(`Character config not found: ${characterId}`);
        return null;
      }
      const characterEntity = new pc.Entity(characterId);
      characterEntity.setPosition(position);
      const character = {
        id: characterId,
        entity: characterEntity,
        config,
        health: config.stats.health,
        meter: 0,
        state: "idle",
        currentMove: null,
        frameData: {
          startup: 0,
          active: 0,
          recovery: 0,
          advantage: 0
        }
      };
      this.characters.set(characterId, character);
      this.app.root.addChild(characterEntity);
      Logger.info(`Created character: ${characterId}`);
      return character;
    }
    getCharacter(characterId) {
      return this.characters.get(characterId);
    }
    setActiveCharacters(player1Id, player2Id) {
      const p1 = this.characters.get(player1Id);
      const p2 = this.characters.get(player2Id);
      if (p1 && p2) {
        this.activeCharacters = [p1, p2];
        Logger.info(`Active characters set: ${player1Id} vs ${player2Id}`);
      }
    }
    getActiveCharacters() {
      return this.activeCharacters;
    }
    update(deltaTime) {
      for (const character of this.activeCharacters) {
        this.updateCharacterState(character, deltaTime);
      }
    }
    updateCharacterState(character, deltaTime) {
    }
    getAvailableCharacters() {
      return Array.from(this.characterConfigs.keys());
    }
  };

  // src/core/combat/CombatSystem.ts
  var CombatSystem = class {
    constructor(app) {
      this.frameCounter = 0;
      this.hitstop = 0;
      this.app = app;
    }
    initialize(characterManager, inputManager) {
      this.characterManager = characterManager;
      this.inputManager = inputManager;
      Logger.info("Combat system initialized");
    }
    update(deltaTime) {
      if (this.hitstop > 0) {
        this.hitstop--;
        return;
      }
      this.frameCounter++;
      this.processInputs();
      this.updateHitboxes();
      this.checkCollisions();
    }
    processInputs() {
      const activeCharacters = this.characterManager.getActiveCharacters();
      for (let i = 0; i < activeCharacters.length; i++) {
        const character = activeCharacters[i];
        const inputs = this.inputManager.getPlayerInputs(i);
        this.processCharacterInputs(character, inputs);
      }
    }
    processCharacterInputs(character, inputs) {
      if (character.state !== "idle" && character.state !== "walking") {
        return;
      }
      if (inputs.left) {
        this.moveCharacter(character, -1);
      } else if (inputs.right) {
        this.moveCharacter(character, 1);
      }
      if (inputs.lightPunch) {
        this.executeMove(character, "lightPunch");
      } else if (inputs.mediumPunch) {
        this.executeMove(character, "mediumPunch");
      } else if (inputs.heavyPunch) {
        this.executeMove(character, "heavyPunch");
      }
      if (inputs.hadoken) {
        this.executeMove(character, "hadoken");
      }
    }
    moveCharacter(character, direction) {
      const walkSpeed = character.config.stats.walkSpeed;
      const currentPos = character.entity.getPosition();
      currentPos.x += direction * walkSpeed * (1 / 60);
      character.entity.setPosition(currentPos);
      character.state = "walking";
    }
    executeMove(character, moveName) {
      const moveData = character.config.moves[moveName];
      if (!moveData) {
        Logger.warn(`Move not found: ${moveName} for character ${character.id}`);
        return;
      }
      character.currentMove = {
        name: moveName,
        data: moveData,
        currentFrame: 0,
        phase: "startup"
      };
      character.state = "attacking";
      character.frameData = {
        startup: moveData.startupFrames,
        active: moveData.activeFrames,
        recovery: moveData.recoveryFrames,
        advantage: moveData.advantage || 0
      };
      Logger.info(`${character.id} executing ${moveName}`);
    }
    updateHitboxes() {
      const activeCharacters = this.characterManager.getActiveCharacters();
      for (const character of activeCharacters) {
        if (character.currentMove) {
          this.updateMoveFrames(character);
        }
      }
    }
    updateMoveFrames(character) {
      if (!character.currentMove) return;
      character.currentMove.currentFrame++;
      const move = character.currentMove;
      const frameData = character.frameData;
      if (move.currentFrame <= frameData.startup) {
        move.phase = "startup";
      } else if (move.currentFrame <= frameData.startup + frameData.active) {
        move.phase = "active";
      } else if (move.currentFrame <= frameData.startup + frameData.active + frameData.recovery) {
        move.phase = "recovery";
      } else {
        character.currentMove = null;
        character.state = "idle";
      }
    }
    checkCollisions() {
      const activeCharacters = this.characterManager.getActiveCharacters();
      if (activeCharacters.length !== 2) return;
      const [p1, p2] = activeCharacters;
      if (p1.currentMove?.phase === "active" && this.charactersColliding(p1, p2)) {
        this.processHit(p1, p2);
      } else if (p2.currentMove?.phase === "active" && this.charactersColliding(p2, p1)) {
        this.processHit(p2, p1);
      }
    }
    charactersColliding(attacker, defender) {
      const attackerPos = attacker.entity.getPosition();
      const defenderPos = defender.entity.getPosition();
      const distance = attackerPos.distance(defenderPos);
      return distance < 2;
    }
    processHit(attacker, defender) {
      if (!attacker.currentMove) return;
      const moveData = attacker.currentMove.data;
      const damage = moveData.damage;
      defender.health = Math.max(0, defender.health - damage);
      this.hitstop = Math.floor(damage / 10);
      Logger.info(`${attacker.id} hits ${defender.id} for ${damage} damage`);
      if (defender.health <= 0) {
        this.handleKO(defender, attacker);
      }
    }
    handleKO(ko, winner) {
      ko.state = "ko";
      Logger.info(`${ko.id} is KO'd! ${winner.id} wins!`);
      this.app.fire("match:victory", winner.id);
    }
    getCurrentFrame() {
      return this.frameCounter;
    }
    isInHistop() {
      return this.hitstop > 0;
    }
  };

  // src/core/stages/StageManager.ts
  var pc2 = __toESM(require_playcanvas_shim());
  var StageManager = class {
    constructor(app) {
      this.app = app;
    }
    async initialize() {
      const camera = new pc2.Entity("MainCamera");
      camera.addComponent("camera", {
        clearColor: new pc2.Color(0, 0, 0),
        fov: 55,
        nearClip: 0.1,
        farClip: 1e3
      });
      camera.setPosition(0, 2, 10);
      camera.lookAt(0, 1, 0);
      this.app.root.addChild(camera);
      const light = new pc2.Entity("DirectionalLight");
      light.addComponent("light", {
        type: pc2.LIGHTTYPE_DIRECTIONAL,
        color: new pc2.Color(1, 1, 1),
        intensity: 1,
        castShadows: false
      });
      light.setEulerAngles(45, 30, 0);
      this.app.root.addChild(light);
      const box = new pc2.Entity("TestBox");
      box.addComponent("model", { type: "box" });
      box.setPosition(0, 0.5, 0);
      this.app.root.addChild(box);
    }
  };

  // src/core/input/InputManager.ts
  var pc3 = __toESM(require_playcanvas_shim());
  var InputManager = class {
    constructor(app) {
      this.app = app;
      this.keyboard = app.keyboard;
      this.gamepads = app.gamepads;
      this.player1Inputs = this.createEmptyInputs();
      this.player2Inputs = this.createEmptyInputs();
      this.setupKeyboardBindings();
    }
    createEmptyInputs() {
      return {
        up: false,
        down: false,
        left: false,
        right: false,
        lightPunch: false,
        mediumPunch: false,
        heavyPunch: false,
        lightKick: false,
        mediumKick: false,
        heavyKick: false,
        hadoken: false,
        shoryuken: false,
        tatsumaki: false
      };
    }
    setupKeyboardBindings() {
      this.keyboard.on("keydown", (e) => {
        switch (e.key.toLowerCase()) {
          case "w":
            this.player1Inputs.up = true;
            break;
          case "s":
            this.player1Inputs.down = true;
            break;
          case "a":
            this.player1Inputs.left = true;
            break;
          case "d":
            this.player1Inputs.right = true;
            break;
          case "u":
            this.player1Inputs.lightPunch = true;
            break;
          case "i":
            this.player1Inputs.mediumPunch = true;
            break;
          case "o":
            this.player1Inputs.heavyPunch = true;
            break;
          case "j":
            this.player1Inputs.lightKick = true;
            break;
          case "k":
            this.player1Inputs.mediumKick = true;
            break;
          case "l":
            this.player1Inputs.heavyKick = true;
            break;
        }
      });
      this.keyboard.on("keyup", (e) => {
        switch (e.key.toLowerCase()) {
          case "w":
            this.player1Inputs.up = false;
            break;
          case "s":
            this.player1Inputs.down = false;
            break;
          case "a":
            this.player1Inputs.left = false;
            break;
          case "d":
            this.player1Inputs.right = false;
            break;
          case "u":
            this.player1Inputs.lightPunch = false;
            break;
          case "i":
            this.player1Inputs.mediumPunch = false;
            break;
          case "o":
            this.player1Inputs.heavyPunch = false;
            break;
          case "j":
            this.player1Inputs.lightKick = false;
            break;
          case "k":
            this.player1Inputs.mediumKick = false;
            break;
          case "l":
            this.player1Inputs.heavyKick = false;
            break;
        }
      });
    }
    getPlayerInputs(playerIndex) {
      return playerIndex === 0 ? this.player1Inputs : this.player2Inputs;
    }
    update() {
      this.updateGamepadInputs();
      this.updateSpecialMoves();
    }
    updateGamepadInputs() {
      const pads = this.gamepads.poll();
      const gamepad = pads[0];
      if (gamepad) {
        this.player1Inputs.left = gamepad.isPressed(pc3.PAD_L_STICK_BUTTON) || gamepad.isPressed(pc3.PAD_LEFT);
        this.player1Inputs.right = gamepad.isPressed(pc3.PAD_RIGHT);
        this.player1Inputs.up = gamepad.isPressed(pc3.PAD_UP);
        this.player1Inputs.down = gamepad.isPressed(pc3.PAD_DOWN);
        this.player1Inputs.lightPunch = gamepad.isPressed(pc3.PAD_FACE_1);
        this.player1Inputs.mediumPunch = gamepad.isPressed(pc3.PAD_FACE_2);
        this.player1Inputs.heavyPunch = gamepad.isPressed(pc3.PAD_R_SHOULDER_1);
        this.player1Inputs.lightKick = gamepad.isPressed(pc3.PAD_FACE_3);
        this.player1Inputs.mediumKick = gamepad.isPressed(pc3.PAD_FACE_4);
        this.player1Inputs.heavyKick = gamepad.isPressed(pc3.PAD_R_SHOULDER_2);
      }
    }
    updateSpecialMoves() {
      this.player1Inputs.hadoken = this.detectHadoken(this.player1Inputs);
      this.player2Inputs.hadoken = this.detectHadoken(this.player2Inputs);
    }
    detectHadoken(inputs) {
      return inputs.down && inputs.right && inputs.lightPunch;
    }
  };

  // src/core/ui/UIManager.ts
  var pc4 = __toESM(require_playcanvas_shim());
  var UIManager = class {
    constructor(app) {
      this.root = null;
      this.menu = null;
      this.hud = null;
      this.app = app;
    }
    async initialize() {
      this.root = new pc4.Entity("UIRoot");
      this.root.addComponent("screen", {
        referenceResolution: new pc4.Vec2(1920, 1080),
        scaleMode: pc4.SCALEMODE_BLEND,
        scaleBlend: 0.5,
        screenSpace: true
      });
      this.app.root.addChild(this.root);
    }
    showMenu() {
      this.hideHUD();
      if (this.menu) {
        this.menu.enabled = true;
        return;
      }
      this.menu = new pc4.Entity("MenuUI");
      this.menu.addComponent("element", { type: pc4.ELEMENTTYPE_GROUP, anchor: new pc4.Vec4(0, 0, 1, 1) });
      const label = new pc4.Entity("MenuLabel");
      label.addComponent("element", { type: pc4.ELEMENTTYPE_TEXT, text: "Press Enter to Start", fontSize: 48, pivot: new pc4.Vec2(0.5, 0.5), anchor: new pc4.Vec4(0.5, 0.5, 0.5, 0.5) });
      this.menu.addChild(label);
      this.root?.addChild(this.menu);
    }
    hideMenu() {
      if (this.menu) this.menu.enabled = false;
    }
    showHUD() {
      this.hideMenu();
      if (this.hud) {
        this.hud.enabled = true;
        return;
      }
      this.hud = new pc4.Entity("MatchHUD");
      this.hud.addComponent("element", { type: pc4.ELEMENTTYPE_GROUP, anchor: new pc4.Vec4(0, 0, 1, 1) });
      const p1 = new pc4.Entity("P1");
      p1.addComponent("element", { type: pc4.ELEMENTTYPE_TEXT, text: "P1: 1000", fontSize: 32, anchor: new pc4.Vec4(0, 1, 0, 1), pivot: new pc4.Vec2(0, 1) });
      const p2 = new pc4.Entity("P2");
      p2.addComponent("element", { type: pc4.ELEMENTTYPE_TEXT, text: "P2: 1000", fontSize: 32, anchor: new pc4.Vec4(1, 1, 1, 1), pivot: new pc4.Vec2(1, 1) });
      this.hud.addChild(p1);
      this.hud.addChild(p2);
      this.root?.addChild(this.hud);
    }
    hideHUD() {
      if (this.hud) this.hud.enabled = false;
    }
    updateHUD(p1Health, p2Health) {
      if (!this.hud) return;
      const p1 = this.hud.findByName("P1");
      const p2 = this.hud.findByName("P2");
      if (p1 && p1.element) {
        p1.element.text = `P1: ${Math.max(0, Math.floor(p1Health))}`;
      }
      if (p2 && p2.element) {
        p2.element.text = `P2: ${Math.max(0, Math.floor(p2Health))}`;
      }
    }
  };

  // src/scripts/graphics/PostProcessingManager.ts
  var pc6 = __toESM(require_playcanvas_shim());

  // src/core/graphics/ShaderUtils.ts
  var pc5 = __toESM(require_playcanvas_shim());

  // src/typescript/shaders/CharacterHighlightShader.ts
  var CharacterHighlightShader = class {
    static createMaterial(device) {
      const material = new device.StandardMaterial();
      material.chunks.VS_TRANSFORM = this.vertexShader;
      material.chunks.PS_OUTPUT = this.fragmentShader;
      return material;
    }
    static setUniforms(material, params) {
      material.setParameter("outline_width", params.outlineWidth);
      material.setParameter("outline_color", params.outlineColor);
      material.setParameter("rim_power", params.rimPower);
      material.setParameter("rim_intensity", params.rimIntensity);
      material.setParameter("rim_color", params.rimColor);
      material.setParameter("energy_flow_speed", params.energyFlowSpeed);
      material.setParameter("energy_frequency", params.energyFrequency);
      material.setParameter("enable_energy_flow", params.enableEnergyFlow);
      material.setParameter("ambient_color", params.ambientColor);
      material.setParameter("main_light_color", params.mainLightColor);
      material.setParameter("lighting_intensity", params.lightingIntensity);
      material.setParameter("light_direction", params.lightDirection);
      material.setParameter("enable_pseudo_depth", params.enablePseudoDepth);
      material.setParameter("depth_offset", params.depthOffset);
      material.setParameter("shadow_color", params.shadowColor);
      material.setParameter("time", params.time);
      material.setParameter("texture_pixelSize", params.texturePixelSize);
    }
  };
  CharacterHighlightShader.vertexShader = `
    attribute vec3 vertex_position;
    attribute vec2 vertex_texCoord0;
    
    uniform mat4 matrix_model;
    uniform mat4 matrix_view;
    uniform mat4 matrix_projection;
    
    varying vec2 vUv0;
    varying vec2 vWorldPosition;
    
    void main() {
        vec4 worldPos = matrix_model * vec4(vertex_position, 1.0);
        vWorldPosition = worldPos.xy;
        vUv0 = vertex_texCoord0;
        gl_Position = matrix_projection * matrix_view * worldPos;
    }
  `;
  CharacterHighlightShader.fragmentShader = `
    #ifdef GL_ES
    precision highp float;
    #endif
    
    varying vec2 vUv0;
    varying vec2 vWorldPosition;
    
    uniform sampler2D texture_diffuseMap;
    uniform vec2 texture_pixelSize;
    
    // Shader parameters
    uniform float outline_width;
    uniform vec4 outline_color;
    uniform float rim_power;
    uniform float rim_intensity;
    uniform vec4 rim_color;
    uniform float energy_flow_speed;
    uniform float energy_frequency;
    uniform bool enable_energy_flow;
    
    // Pseudo 2.5D lighting integration
    uniform vec4 ambient_color;
    uniform vec4 main_light_color;
    uniform float lighting_intensity;
    uniform vec2 light_direction;
    
    // Depth and shadow effects
    uniform bool enable_pseudo_depth;
    uniform float depth_offset;
    uniform vec4 shadow_color;
    
    uniform float time;
    
    // Calculate pseudo normal for depth effect
    vec3 calculate_pseudo_normal(vec2 uv) {
        vec2 tex_size = 1.0 / texture_pixelSize;
        float offset = 1.0 / tex_size.x;
        
        float height_left = texture2D(texture_diffuseMap, uv - vec2(offset, 0.0)).r;
        float height_right = texture2D(texture_diffuseMap, uv + vec2(offset, 0.0)).r;
        float height_up = texture2D(texture_diffuseMap, uv - vec2(0.0, offset)).r;
        float height_down = texture2D(texture_diffuseMap, uv + vec2(0.0, offset)).r;
        
        float dx = (height_right - height_left);
        float dy = (height_down - height_up);
        
        return normalize(vec3(dx, dy, 1.0));
    }
    
    void main() {
        vec2 uv = vUv0;
        vec4 tex_color = texture2D(texture_diffuseMap, uv);
        
        // Skip transparent pixels
        if (tex_color.a < 0.1) {
            gl_FragColor = tex_color;
            return;
        }
        
        vec3 final_color = tex_color.rgb;
        
        // Apply pseudo 2.5D lighting
        if (enable_pseudo_depth) {
            vec3 pseudo_normal = calculate_pseudo_normal(uv);
            float light_factor = dot(pseudo_normal, normalize(vec3(light_direction, 1.0)));
            light_factor = light_factor * 0.5 + 0.5;
            
            vec3 lit_color = mix(ambient_color.rgb, main_light_color.rgb, light_factor);
            final_color *= lit_color * lighting_intensity;
            
            // Add subtle shadow
            float shadow_factor = 1.0 - light_factor;
            shadow_factor = smoothstep(0.3, 0.7, shadow_factor);
            final_color = mix(final_color, shadow_color.rgb, shadow_factor * shadow_color.a * 0.2);
        }
        
        // Create outline by sampling neighboring pixels
        float outline = 0.0;
        vec2 tex_size = 1.0 / texture_pixelSize;
        float outline_width_uv = outline_width / tex_size.x;
        
        for (float i = 0.0; i < 8.0; i++) {
            float angle = i * 0.785398; // 45 degrees in radians
            vec2 offset = vec2(cos(angle), sin(angle)) * outline_width_uv;
            float alpha = texture2D(texture_diffuseMap, uv + offset).a;
            if (alpha < 0.1 && tex_color.a > 0.1) {
                outline = 1.0;
                break;
            }
        }
        
        // Apply outline with depth consideration
        if (outline > 0.0) {
            final_color = mix(final_color, outline_color.rgb, outline_color.a);
        }
        
        // Create enhanced rim lighting effect
        vec2 center = vec2(0.5, 0.5);
        vec2 rim_dir = normalize(uv - center);
        float rim_factor = dot(rim_dir, rim_dir);
        rim_factor = pow(rim_factor, rim_power);
        
        // Add energy flow animation
        float energy = 1.0;
        if (enable_energy_flow) {
            float time_offset = time * energy_flow_speed;
            energy = sin(uv.y * energy_frequency + time_offset) * 0.5 + 0.5;
            energy = smoothstep(0.3, 0.7, energy);
        }
        
        // Apply rim lighting with energy animation
        vec3 rim_light = rim_color.rgb * rim_intensity * rim_factor * energy;
        final_color += rim_light;
        
        // Enhanced contrast for fighting game aesthetics
        final_color = pow(final_color, vec3(0.9));
        final_color = clamp(final_color, 0.0, 1.0);
        
        gl_FragColor = vec4(final_color, tex_color.a);
    }
  `;

  // src/typescript/shaders/RimLightingShader.ts
  var RimLightingShader = class {
    static createMaterial(device) {
      const material = new device.StandardMaterial();
      material.chunks.VS_TRANSFORM = this.vertexShader;
      material.chunks.PS_OUTPUT = this.fragmentShader;
      return material;
    }
    static setUniforms(material, params) {
      material.setParameter("view_position", params.viewPosition);
      material.setParameter("light_globalAmbient", params.globalAmbient);
      material.setParameter("rimPower", params.rimPower);
      material.setParameter("rimIntensity", params.rimIntensity);
      material.setParameter("rimColor", params.rimColor);
      material.setParameter("light_color", params.lightColor);
      material.setParameter("light_direction", params.lightDirection);
      material.setParameter("light_intensity", params.lightIntensity);
      material.setParameter("material_diffuse", params.materialDiffuse);
      material.setParameter("material_emissive", params.materialEmissive);
      material.setParameter("material_opacity", params.materialOpacity);
      material.setParameter("depthBlur", params.depthBlur);
      material.setParameter("pixelSize", params.pixelSize);
      material.setParameter("screenResolution", params.screenResolution);
      material.setParameter("hitFlash", params.hitFlash);
      material.setParameter("hitFlashColor", params.hitFlashColor);
      material.setParameter("characterHighlight", params.characterHighlight);
    }
  };
  RimLightingShader.vertexShader = `
    // ========== VERTEX SHADER ==========
    attribute vec3 vertex_position;
    attribute vec2 vertex_texCoord0;
    attribute vec3 vertex_normal;

    uniform mat4 matrix_model;
    uniform mat4 matrix_view;
    uniform mat4 matrix_projection;
    uniform mat4 matrix_normal;

    // Camera and lighting uniforms
    uniform vec3 view_position;
    uniform vec3 light_globalAmbient;

    // Rim lighting parameters
    uniform float rimPower;
    uniform float rimIntensity;
    uniform vec3 rimColor;

    // Output to fragment shader
    varying vec2 vUv0;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vViewDirection;
    varying float vRimFactor;

    void main(void) {
        // Transform vertex position
        vec4 worldPosition = matrix_model * vec4(vertex_position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Transform normal to world space
        vWorldNormal = normalize((matrix_normal * vec4(vertex_normal, 0.0)).xyz);
        
        // Calculate view direction
        vViewDirection = normalize(view_position - vWorldPosition);
        
        // Calculate rim lighting factor in vertex shader for smooth interpolation
        float rimDot = 1.0 - dot(vViewDirection, vWorldNormal);
        vRimFactor = pow(smoothstep(0.0, 1.0, rimDot), rimPower);
        
        // Pass texture coordinates
        vUv0 = vertex_texCoord0;
        
        // Final vertex position
        gl_Position = matrix_projection * matrix_view * worldPosition;
    }
  `;
  RimLightingShader.fragmentShader = `
    // ========== FRAGMENT SHADER ==========
    #ifdef GL_ES
    precision highp float;
    #endif

    // Input from vertex shader
    varying vec2 vUv0;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vViewDirection;
    varying float vRimFactor;

    // Texture uniforms
    uniform sampler2D texture_diffuseMap;
    uniform sampler2D texture_normalMap;

    // Material properties
    uniform vec3 material_diffuse;
    uniform vec3 material_emissive;
    uniform float material_opacity;

    // Lighting uniforms
    uniform vec3 light_globalAmbient;
    uniform vec3 light_color;
    uniform vec3 light_direction;
    uniform float light_intensity;

    // Rim lighting parameters
    uniform float rimPower;
    uniform float rimIntensity;
    uniform vec3 rimColor;
    uniform float rimBlend;

    // HD-2D specific parameters
    uniform float depthBlur;
    uniform float pixelSize;
    uniform vec2 screenResolution;

    // Fighting game specific
    uniform float hitFlash;
    uniform vec3 hitFlashColor;
    uniform float characterHighlight;

    // Utility functions
    vec3 getNormalFromMap(vec2 uv, vec3 worldPos, vec3 worldNormal) {
        vec3 tangentNormal = texture2D(texture_normalMap, uv).xyz * 2.0 - 1.0;
        
        vec3 Q1 = dFdx(worldPos);
        vec3 Q2 = dFdy(worldPos);
        vec2 st1 = dFdx(uv);
        vec2 st2 = dFdy(uv);
        
        vec3 N = normalize(worldNormal);
        vec3 T = normalize(Q1 * st2.t - Q2 * st1.t);
        vec3 B = -normalize(cross(N, T));
        mat3 TBN = mat3(T, B, N);
        
        return normalize(TBN * tangentNormal);
    }

    vec3 pixelateColor(vec3 color, float pixelSize) {
        if (pixelSize <= 0.0) return color;
        
        // Quantize color for pixel art effect
        return floor(color * pixelSize) / pixelSize;
    }

    void main(void) {
        // Sample base diffuse texture
        vec4 baseColor = texture2D(texture_diffuseMap, vUv0);
        vec3 diffuse = baseColor.rgb * material_diffuse;
        
        // Get normal (use normal map if available)
        vec3 normal = vWorldNormal;
        #ifdef NORMALMAP
            normal = getNormalFromMap(vUv0, vWorldPosition, vWorldNormal);
        #endif
        
        // Calculate basic lighting
        float lightDot = max(dot(normal, -light_direction), 0.0);
        vec3 lightColor = light_color * light_intensity * lightDot;
        
        // Calculate rim lighting
        float rimFactor = vRimFactor;
        
        // Enhanced rim calculation for HD-2D effect
        float fresnel = pow(1.0 - dot(vViewDirection, normal), rimPower);
        fresnel = smoothstep(0.0, 1.0, fresnel);
        
        // Combine rim factors
        rimFactor = max(rimFactor, fresnel) * rimIntensity;
        
        // Apply rim color
        vec3 rimContribution = rimColor * rimFactor;
        
        // Combine lighting
        vec3 ambient = light_globalAmbient * diffuse;
        vec3 finalColor = ambient + diffuse * lightColor + rimContribution;
        
        // Apply emissive
        finalColor += material_emissive;
        
        // Character highlight effect (for special moves, selection, etc.)
        if (characterHighlight > 0.0) {
            vec3 highlightColor = vec3(1.2, 1.1, 1.0);
            finalColor = mix(finalColor, finalColor * highlightColor, characterHighlight);
        }
        
        // Hit flash effect (for impact feedback)
        if (hitFlash > 0.0) {
            finalColor = mix(finalColor, hitFlashColor, hitFlash);
        }
        
        // Depth-based blur simulation (simple desaturation)
        if (depthBlur > 0.0) {
            float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
            finalColor = mix(finalColor, vec3(luminance), depthBlur * 0.5);
        }
        
        // Pixel art preservation
        if (pixelSize > 0.0) {
            finalColor = pixelateColor(finalColor, pixelSize);
        }
        
        // Apply opacity with alpha testing for sprite edges
        float alpha = baseColor.a * material_opacity;
        if (alpha < 0.1) discard;
        
        gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  // src/typescript/shaders/SpriteNormalMappingShader.ts
  var SpriteNormalMappingShader = class {
    static createMaterial(device) {
      const material = new device.StandardMaterial();
      material.chunks.VS_TRANSFORM = this.vertexShader;
      material.chunks.PS_OUTPUT = this.fragmentShader;
      return material;
    }
    static setUniforms(material, params) {
      material.setParameter("view_position", params.viewPosition);
      material.setParameter("light_position_0", params.lightPosition0);
      material.setParameter("light_position_1", params.lightPosition1);
      material.setParameter("light_position_2", params.lightPosition2);
      material.setParameter("light_color_0", params.lightColor0);
      material.setParameter("light_color_1", params.lightColor1);
      material.setParameter("light_color_2", params.lightColor2);
      material.setParameter("light_intensity_0", params.lightIntensity0);
      material.setParameter("light_intensity_1", params.lightIntensity1);
      material.setParameter("light_intensity_2", params.lightIntensity2);
      material.setParameter("material_diffuse", params.materialDiffuse);
      material.setParameter("material_specular", params.materialSpecular);
      material.setParameter("material_shininess", params.materialShininess);
      material.setParameter("material_opacity", params.materialOpacity);
      material.setParameter("normalMapStrength", params.normalMapStrength);
      material.setParameter("spriteDepth", params.spriteDepth);
      material.setParameter("spritePixelSize", params.spritePixelSize);
      material.setParameter("pixelPerfect", params.pixelPerfect);
      material.setParameter("hitFlash", params.hitFlash);
      material.setParameter("hitFlashColor", params.hitFlashColor);
      material.setParameter("stunEffect", params.stunEffect);
      material.setParameter("counterHitGlow", params.counterHitGlow);
      material.setParameter("playerTint", params.playerTint);
      material.setParameter("animationFrame", params.animationFrame);
      material.setParameter("spriteSheetSize", params.spriteSheetSize);
      material.setParameter("frameSize", params.frameSize);
    }
  };
  SpriteNormalMappingShader.vertexShader = `
    // ========== VERTEX SHADER ==========
    attribute vec3 vertex_position;
    attribute vec2 vertex_texCoord0;
    attribute vec3 vertex_normal;
    attribute vec3 vertex_tangent;

    uniform mat4 matrix_model;
    uniform mat4 matrix_view;
    uniform mat4 matrix_projection;
    uniform mat4 matrix_normal;

    // Camera position
    uniform vec3 view_position;

    // Light positions (multiple lights for HD-2D)
    uniform vec3 light_position_0;
    uniform vec3 light_position_1;
    uniform vec3 light_position_2;

    // Output to fragment shader
    varying vec2 vUv0;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vWorldTangent;
    varying vec3 vWorldBitangent;
    varying vec3 vViewDirection;

    // Light directions in tangent space
    varying vec3 vLightDirection0_TS;
    varying vec3 vLightDirection1_TS;
    varying vec3 vLightDirection2_TS;
    varying vec3 vViewDirection_TS;

    void main(void) {
        // Transform vertex to world space
        vec4 worldPosition = matrix_model * vec4(vertex_position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Transform normal and tangent to world space
        vWorldNormal = normalize((matrix_normal * vec4(vertex_normal, 0.0)).xyz);
        vWorldTangent = normalize((matrix_normal * vec4(vertex_tangent, 0.0)).xyz);
        vWorldBitangent = cross(vWorldNormal, vWorldTangent);
        
        // Create tangent-to-world matrix
        mat3 TBN = mat3(vWorldTangent, vWorldBitangent, vWorldNormal);
        mat3 worldToTangent = transpose(TBN);
        
        // Calculate view direction
        vViewDirection = normalize(view_position - vWorldPosition);
        vViewDirection_TS = worldToTangent * vViewDirection;
        
        // Calculate light directions in tangent space
        vec3 lightDir0 = normalize(light_position_0 - vWorldPosition);
        vec3 lightDir1 = normalize(light_position_1 - vWorldPosition);
        vec3 lightDir2 = normalize(light_position_2 - vWorldPosition);
        
        vLightDirection0_TS = worldToTangent * lightDir0;
        vLightDirection1_TS = worldToTangent * lightDir1;
        vLightDirection2_TS = worldToTangent * lightDir2;
        
        // Pass texture coordinates
        vUv0 = vertex_texCoord0;
        
        // Final vertex position
        gl_Position = matrix_projection * matrix_view * worldPosition;
    }
  `;
  SpriteNormalMappingShader.fragmentShader = `
    // ========== FRAGMENT SHADER ==========
    #ifdef GL_ES
    precision highp float;
    #endif

    // Input from vertex shader
    varying vec2 vUv0;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vWorldTangent;
    varying vec3 vWorldBitangent;
    varying vec3 vViewDirection;

    varying vec3 vLightDirection0_TS;
    varying vec3 vLightDirection1_TS;
    varying vec3 vLightDirection2_TS;
    varying vec3 vViewDirection_TS;

    // Texture uniforms
    uniform sampler2D texture_diffuseMap;
    uniform sampler2D texture_normalMap;
    uniform sampler2D texture_specularMap;

    // Material properties
    uniform vec3 material_diffuse;
    uniform vec3 material_specular;
    uniform float material_shininess;
    uniform float material_opacity;

    // Light properties
    uniform vec3 light_color_0;
    uniform vec3 light_color_1;
    uniform vec3 light_color_2;
    uniform float light_intensity_0;
    uniform float light_intensity_1;
    uniform float light_intensity_2;

    // HD-2D specific parameters
    uniform float normalMapStrength;
    uniform float spriteDepth;
    uniform vec2 spritePixelSize;
    uniform float pixelPerfect;

    // Fighting game effects
    uniform float hitFlash;
    uniform vec3 hitFlashColor;
    uniform float stunEffect;
    uniform float counterHitGlow;
    uniform vec3 playerTint; // P1/P2 color tinting

    // Animation parameters
    uniform float animationFrame;
    uniform vec2 spriteSheetSize;
    uniform vec2 frameSize;

    vec2 getSpriteUV(vec2 baseUV) {
        if (animationFrame <= 0.0) return baseUV;
        
        // Calculate sprite sheet coordinates
        float frameX = mod(animationFrame, spriteSheetSize.x);
        float frameY = floor(animationFrame / spriteSheetSize.x);
        
        vec2 frameOffset = vec2(frameX, frameY) * frameSize;
        return frameOffset + baseUV * frameSize;
    }

    vec3 sampleNormalMap(vec2 uv) {
        vec3 normal = texture2D(texture_normalMap, uv).rgb;
        normal = normal * 2.0 - 1.0; // Convert from [0,1] to [-1,1]
        
        // Adjust normal map strength for HD-2D effect
        normal.xy *= normalMapStrength;
        normal = normalize(normal);
        
        return normal;
    }

    vec3 calculateLighting(vec3 normal, vec3 lightDir, vec3 lightColor, float lightIntensity, vec3 viewDir) {
        // Diffuse lighting
        float NdotL = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = lightColor * lightIntensity * NdotL;
        
        // Specular lighting (Blinn-Phong)
        vec3 halfVector = normalize(lightDir + viewDir);
        float NdotH = max(dot(normal, halfVector), 0.0);
        float specularPower = pow(NdotH, material_shininess);
        vec3 specular = material_specular * lightColor * specularPower * lightIntensity;
        
        return diffuse + specular;
    }

    vec3 applyPixelPerfectFiltering(vec3 color, vec2 uv) {
        if (pixelPerfect <= 0.0) return color;
        
        // Snap UV coordinates to pixel boundaries
        vec2 pixelUV = floor(uv * spritePixelSize) / spritePixelSize;
        
        // Sample with nearest neighbor filtering
        return texture2D(texture_diffuseMap, pixelUV).rgb * material_diffuse;
    }

    void main(void) {
        // Get sprite sheet UV coordinates
        vec2 spriteUV = getSpriteUV(vUv0);
        
        // Sample base diffuse texture
        vec4 baseColor = texture2D(texture_diffuseMap, spriteUV);
        vec3 diffuse = baseColor.rgb * material_diffuse;
        
        // Early discard for transparent pixels (important for sprites)
        if (baseColor.a < 0.1) discard;
        
        // Sample normal map and convert to tangent space
        vec3 normalTS = sampleNormalMap(spriteUV);
        
        // Sample specular map if available
        vec3 specularMask = texture2D(texture_specularMap, spriteUV).rgb;
        
        // Calculate lighting for each light source
        vec3 totalLighting = vec3(0.0);
        
        // Light 0 (Key light)
        totalLighting += calculateLighting(
            normalTS, 
            normalize(vLightDirection0_TS), 
            light_color_0, 
            light_intensity_0,
            normalize(vViewDirection_TS)
        );
        
        // Light 1 (Fill light)
        totalLighting += calculateLighting(
            normalTS, 
            normalize(vLightDirection1_TS), 
            light_color_1, 
            light_intensity_1,
            normalize(vViewDirection_TS)
        );
        
        // Light 2 (Rim light)
        totalLighting += calculateLighting(
            normalTS, 
            normalize(vLightDirection2_TS), 
            light_color_2, 
            light_intensity_2,
            normalize(vViewDirection_TS)
        );
        
        // Apply specular mask
        totalLighting *= (1.0 + specularMask * 0.5);
        
        // Combine diffuse and lighting
        vec3 finalColor = diffuse * totalLighting;
        
        // Apply player tinting (P1 warm, P2 cool)
        finalColor = mix(finalColor, finalColor * playerTint, 0.1);
        
        // Apply depth-based darkening for sprite layering
        if (spriteDepth > 0.0) {
            float depthFactor = 1.0 - spriteDepth * 0.2;
            finalColor *= depthFactor;
        }
        
        // Fighting game specific effects
        
        // Hit flash effect
        if (hitFlash > 0.0) {
            finalColor = mix(finalColor, hitFlashColor, hitFlash);
        }
        
        // Stun effect (desaturation + blur simulation)
        if (stunEffect > 0.0) {
            float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
            finalColor = mix(finalColor, vec3(luminance), stunEffect * 0.7);
            
            // Add slight blue tint for stun
            finalColor += vec3(0.0, 0.1, 0.2) * stunEffect * 0.3;
        }
        
        // Counter hit glow effect
        if (counterHitGlow > 0.0) {
            vec3 glowColor = vec3(1.0, 0.4, 0.4); // Red glow
            finalColor += glowColor * counterHitGlow * 0.5;
        }
        
        // Pixel perfect rendering option
        if (pixelPerfect > 0.0) {
            diffuse = applyPixelPerfectFiltering(diffuse, spriteUV);
            finalColor = mix(finalColor, diffuse * totalLighting, pixelPerfect);
        }
        
        // Apply opacity
        float alpha = baseColor.a * material_opacity;
        
        gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  // src/typescript/shaders/DepthPostProcessShader.ts
  var DepthPostProcessShader = class {
    static createMaterial(device) {
      const material = new device.StandardMaterial();
      material.chunks.VS_TRANSFORM = this.vertexShader;
      material.chunks.PS_OUTPUT = this.fragmentShader;
      return material;
    }
    static setUniforms(material, params) {
      material.setParameter("uScreenSize", params.screenSize);
      material.setParameter("uInvScreenSize", [1 / params.screenSize[0], 1 / params.screenSize[1]]);
      material.setParameter("uNearClip", params.nearClip);
      material.setParameter("uFarClip", params.farClip);
      material.setParameter("uFocusDistance", params.focusDistance);
      material.setParameter("uFocusRange", params.focusRange);
      material.setParameter("uBokehRadius", params.bokehRadius);
      material.setParameter("uBokehIntensity", params.bokehIntensity);
      material.setParameter("uFogColor", params.fogColor);
      material.setParameter("uFogDensity", params.fogDensity);
      material.setParameter("uFogStart", params.fogStart);
      material.setParameter("uFogEnd", params.fogEnd);
      material.setParameter("uAtmosphericPerspective", params.atmosphericPerspective);
      material.setParameter("uAtmosphereColor", params.atmosphereColor);
      material.setParameter("uHeatHaze", params.heatHaze);
      material.setParameter("uColorSeparation", params.colorSeparation);
      material.setParameter("uScreenShake", params.screenShake);
      material.setParameter("uScreenShakeOffset", params.screenShakeOffset);
      material.setParameter("uTimeScale", params.timeScale);
      material.setParameter("uTime", params.time);
    }
  };
  DepthPostProcessShader.vertexShader = `
    // ========== VERTEX SHADER ==========
    attribute vec3 vertex_position;
    attribute vec2 vertex_texCoord0;

    uniform mat4 matrix_model;
    uniform mat4 matrix_view;
    uniform mat4 matrix_projection;

    varying vec2 vUv0;

    void main(void) {
        vUv0 = vertex_texCoord0;
        gl_Position = matrix_projection * matrix_view * matrix_model * vec4(vertex_position, 1.0);
    }
  `;
  DepthPostProcessShader.fragmentShader = `
    // ========== FRAGMENT SHADER ==========
    #ifdef GL_ES
    precision highp float;
    #endif

    varying vec2 vUv0;

    // Input textures
    uniform sampler2D texture_colorBuffer;
    uniform sampler2D texture_depthBuffer;

    // Screen resolution
    uniform vec2 uScreenSize;
    uniform vec2 uInvScreenSize;

    // Camera parameters
    uniform float uNearClip;
    uniform float uFarClip;
    uniform vec3 uCameraPosition;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    // Depth-of-field parameters
    uniform float uFocusDistance;
    uniform float uFocusRange;
    uniform float uBokehRadius;
    uniform float uBokehIntensity;
    uniform int uDofSamples;

    // Volumetric fog parameters
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    uniform float uFogStart;
    uniform float uFogEnd;
    uniform vec3 uLightPosition;
    uniform vec3 uLightColor;
    uniform float uLightScattering;

    // HD-2D atmospheric effects
    uniform float uAtmosphericPerspective;
    uniform vec3 uAtmosphereColor;
    uniform float uHeatHaze;
    uniform float uColorSeparation;

    // Fighting game specific
    uniform float uScreenShake;
    uniform vec2 uScreenShakeOffset;
    uniform float uTimeScale;
    uniform float uTime;

    // Utility functions
    float linearizeDepth(float depth) {
        float z = depth * 2.0 - 1.0; // Convert from [0,1] to [-1,1]
        return (2.0 * uNearClip * uFarClip) / (uFarClip + uNearClip - z * (uFarClip - uNearClip));
    }

    float getDepth(vec2 uv) {
        return linearizeDepth(texture2D(texture_depthBuffer, uv).r);
    }

    vec3 getWorldPositionFromDepth(vec2 uv, float depth) {
        vec4 clipSpacePosition = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
        vec4 viewSpacePosition = inverse(uProjectionMatrix) * clipSpacePosition;
        viewSpacePosition /= viewSpacePosition.w;
        vec4 worldSpacePosition = inverse(uViewMatrix) * viewSpacePosition;
        return worldSpacePosition.xyz;
    }

    // Gaussian blur for depth-of-field
    vec3 gaussianBlur(sampler2D tex, vec2 uv, vec2 direction, float radius, int samples) {
        vec3 color = vec3(0.0);
        float totalWeight = 0.0;
        
        float step = radius / float(samples);
        
        for (int i = -samples; i <= samples; i++) {
            vec2 offset = direction * step * float(i);
            vec2 sampleUV = uv + offset * uInvScreenSize;
            
            // Check bounds
            if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                float weight = exp(-0.5 * pow(float(i) / float(samples), 2.0));
                color += texture2D(tex, sampleUV).rgb * weight;
                totalWeight += weight;
            }
        }
        
        return color / totalWeight;
    }

    // Bokeh blur for depth-of-field
    vec3 bokehBlur(sampler2D tex, vec2 uv, float radius) {
        vec3 color = vec3(0.0);
        float totalWeight = 0.0;
        
        // Hexagonal bokeh pattern
        const int samples = 19;
        const vec2 offsets[19] = vec2[](
            vec2(0.0, 0.0),
            vec2(0.0, 1.0), vec2(0.866, 0.5), vec2(0.866, -0.5), 
            vec2(0.0, -1.0), vec2(-0.866, -0.5), vec2(-0.866, 0.5),
            vec2(0.0, 2.0), vec2(1.732, 1.0), vec2(1.732, -1.0),
            vec2(0.0, -2.0), vec2(-1.732, -1.0), vec2(-1.732, 1.0),
            vec2(1.5, 0.866), vec2(1.5, -0.866), vec2(-1.5, -0.866), vec2(-1.5, 0.866),
            vec2(0.866, 1.5), vec2(-0.866, 1.5)
        );
        
        for (int i = 0; i < samples; i++) {
            vec2 offset = offsets[i] * radius * uInvScreenSize;
            vec2 sampleUV = uv + offset;
            
            if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                float weight = 1.0;
                if (i > 0) weight = 0.7; // Reduce weight for outer samples
                
                color += texture2D(tex, sampleUV).rgb * weight;
                totalWeight += weight;
            }
        }
        
        return color / totalWeight;
    }

    // Calculate depth-of-field blur amount
    float calculateDofBlur(float depth) {
        float distance = abs(depth - uFocusDistance);
        float blur = smoothstep(0.0, uFocusRange, distance);
        return blur * uBokehRadius;
    }

    // Volumetric fog calculation
    vec3 calculateVolumetricFog(vec2 uv, float depth, vec3 worldPos) {
        // Calculate fog factor based on distance
        float fogFactor = smoothstep(uFogStart, uFogEnd, depth);
        fogFactor *= uFogDensity;
        
        // Calculate light scattering
        vec3 lightDir = normalize(uLightPosition - worldPos);
        vec3 viewDir = normalize(uCameraPosition - worldPos);
        float scattering = pow(max(dot(lightDir, viewDir), 0.0), 8.0);
        
        // Combine fog color with light scattering
        vec3 fogColorWithLight = mix(uFogColor, uLightColor, scattering * uLightScattering);
        
        return fogColorWithLight * fogFactor;
    }

    // Atmospheric perspective
    vec3 applyAtmosphericPerspective(vec3 color, float depth) {
        float atmosphereFactor = smoothstep(10.0, 50.0, depth) * uAtmosphericPerspective;
        return mix(color, uAtmosphereColor, atmosphereFactor);
    }

    // Heat haze effect
    vec2 applyHeatHaze(vec2 uv, float time) {
        if (uHeatHaze <= 0.0) return uv;
        
        float wave1 = sin(uv.y * 30.0 + time * 5.0) * 0.003;
        float wave2 = sin(uv.y * 45.0 + time * 3.0) * 0.002;
        
        return uv + vec2(wave1 + wave2, 0.0) * uHeatHaze;
    }

    // Chromatic aberration for impact effects
    vec3 applyChromaticAberration(sampler2D tex, vec2 uv, float amount) {
        if (amount <= 0.0) return texture2D(tex, uv).rgb;
        
        vec2 offset = (uv - 0.5) * amount * 0.01;
        
        float r = texture2D(tex, uv + offset).r;
        float g = texture2D(tex, uv).g;
        float b = texture2D(tex, uv - offset).b;
        
        return vec3(r, g, b);
    }

    // Screen shake effect
    vec2 applyScreenShake(vec2 uv) {
        if (uScreenShake <= 0.0) return uv;
        
        vec2 shake = uScreenShakeOffset * uScreenShake * 0.01;
        return uv + shake;
    }

    void main(void) {
        // Apply screen shake
        vec2 finalUV = applyScreenShake(vUv0);
        
        // Apply heat haze
        finalUV = applyHeatHaze(finalUV, uTime);
        
        // Get depth at current pixel
        float depth = getDepth(finalUV);
        vec3 worldPos = getWorldPositionFromDepth(finalUV, depth);
        
        // Sample base color
        vec3 color = texture2D(texture_colorBuffer, finalUV).rgb;
        
        // Apply chromatic aberration for impact effects
        if (uColorSeparation > 0.0) {
            color = applyChromaticAberration(texture_colorBuffer, finalUV, uColorSeparation);
        }
        
        // Calculate depth-of-field
        float dofBlur = calculateDofBlur(depth);
        
        if (dofBlur > 0.1) {
            // Apply bokeh blur for out-of-focus areas
            vec3 blurredColor = bokehBlur(texture_colorBuffer, finalUV, dofBlur);
            color = mix(color, blurredColor, min(dofBlur * uBokehIntensity, 1.0));
        }
        
        // Apply volumetric fog
        if (uFogDensity > 0.0) {
            vec3 fogColor = calculateVolumetricFog(finalUV, depth, worldPos);
            color = mix(color, fogColor, min(uFogDensity, 0.9));
        }
        
        // Apply atmospheric perspective
        if (uAtmosphericPerspective > 0.0) {
            color = applyAtmosphericPerspective(color, depth);
        }
        
        // Time-based effects for fighting games
        if (uTimeScale != 1.0) {
            // Slow motion effect - enhance clarity
            color = mix(color, color * 1.1, (1.0 - uTimeScale) * 0.3);
        }
        
        gl_FragColor = vec4(color, 1.0);
    }
  `;

  // src/typescript/shaders/StageStormySkyShader.ts
  var StageStormySkyShader = class {
  };
  StageStormySkyShader.vertexShader = `
		attribute vec3 vertex_position;
		attribute vec2 vertex_texCoord0;
		uniform mat4 matrix_model;
		uniform mat4 matrix_view;
		uniform mat4 matrix_projection;
		varying vec2 vUv0;
		void main(){
			vUv0 = vertex_texCoord0;
			gl_Position = matrix_projection * matrix_view * matrix_model * vec4(vertex_position,1.0);
		}
	`;
  StageStormySkyShader.fragmentShader = `
		#ifdef GL_ES
		precision mediump float;
		#endif
		varying vec2 vUv0;
		uniform sampler2D texture_diffuseMap;
		uniform vec2 uScrollSpeed;
		uniform float uTime;
		uniform vec4 uTint;
		void main(){
			vec2 uv = vUv0 + uScrollSpeed * uTime * 0.001;
			vec4 col = texture2D(texture_diffuseMap, uv);
			gl_FragColor = vec4(col.rgb * uTint.rgb, col.a * uTint.a);
		}
	`;

  // src/core/graphics/ShaderUtils.ts
  var ShaderUtils = class {
    static createMaterialFromShaders(app, vertexShader, fragmentShader) {
      const shader = new pc5.Shader(app.graphicsDevice, {
        attributes: {
          vertex_position: pc5.SEMANTIC_POSITION,
          vertex_texCoord0: pc5.SEMANTIC_TEXCOORD0,
          vertex_normal: pc5.SEMANTIC_NORMAL,
          vertex_tangent: pc5.SEMANTIC_TANGENT
        },
        vshader: vertexShader,
        fshader: fragmentShader
      });
      const material = new pc5.Material();
      material.shader = shader;
      return material;
    }
    static createCharacterHighlightMaterial(app) {
      const mat = this.createMaterialFromShaders(app, CharacterHighlightShader.vertexShader, CharacterHighlightShader.fragmentShader);
      mat.setParameter("outline_width", 2);
      mat.setParameter("outline_color", new Float32Array([1, 0.5, 0, 1]));
      mat.setParameter("rim_power", 2);
      mat.setParameter("rim_intensity", 1);
      mat.setParameter("rim_color", new Float32Array([0.8, 0.9, 1, 1]));
      mat.setParameter("energy_flow_speed", 2);
      mat.setParameter("energy_frequency", 5);
      mat.setParameter("enable_energy_flow", 1);
      mat.setParameter("ambient_color", new Float32Array([0.2, 0.2, 0.3, 1]));
      mat.setParameter("main_light_color", new Float32Array([1, 0.95, 0.9, 1]));
      mat.setParameter("lighting_intensity", 1);
      mat.setParameter("light_direction", new Float32Array([0.3, -0.5]));
      mat.setParameter("enable_pseudo_depth", 1);
      mat.setParameter("depth_offset", 0.01);
      mat.setParameter("shadow_color", new Float32Array([0.1, 0.1, 0.2, 0.3]));
      mat.setParameter("time", 0);
      mat.setParameter("texture_pixelSize", new Float32Array([1 / 256, 1 / 256]));
      return mat;
    }
    static createRimLightingMaterial(app) {
      const mat = this.createMaterialFromShaders(app, RimLightingShader.vertexShader, RimLightingShader.fragmentShader);
      mat.setParameter("material_opacity", 1);
      mat.setParameter("material_diffuse", new Float32Array([1, 1, 1]));
      mat.setParameter("material_emissive", new Float32Array([0, 0, 0]));
      mat.setParameter("light_globalAmbient", new Float32Array([0.2, 0.2, 0.2]));
      mat.setParameter("light_color", new Float32Array([1, 1, 1]));
      mat.setParameter("light_direction", new Float32Array([0, -1, 0]));
      mat.setParameter("light_intensity", 1);
      mat.setParameter("rimPower", 2);
      mat.setParameter("rimIntensity", 0.8);
      mat.setParameter("rimColor", new Float32Array([0.8, 0.9, 1]));
      mat.setParameter("depthBlur", 0);
      mat.setParameter("pixelSize", 0);
      mat.setParameter("screenResolution", new Float32Array([1920, 1080]));
      mat.setParameter("hitFlash", 0);
      mat.setParameter("hitFlashColor", new Float32Array([1, 1, 1]));
      mat.setParameter("characterHighlight", 0);
      return mat;
    }
    static createSpriteNormalMappingMaterial(app) {
      const mat = this.createMaterialFromShaders(app, SpriteNormalMappingShader.vertexShader, SpriteNormalMappingShader.fragmentShader);
      mat.setParameter("material_diffuse", new Float32Array([1, 1, 1]));
      mat.setParameter("material_specular", new Float32Array([0.1, 0.1, 0.1]));
      mat.setParameter("material_shininess", 16);
      mat.setParameter("material_opacity", 1);
      mat.setParameter("light_color_0", new Float32Array([1, 1, 1]));
      mat.setParameter("light_color_1", new Float32Array([1, 1, 1]));
      mat.setParameter("light_color_2", new Float32Array([1, 1, 1]));
      mat.setParameter("light_intensity_0", 1);
      mat.setParameter("light_intensity_1", 0.5);
      mat.setParameter("light_intensity_2", 0.2);
      mat.setParameter("normalMapStrength", 1);
      mat.setParameter("spriteDepth", 0);
      mat.setParameter("spritePixelSize", new Float32Array([256, 256]));
      mat.setParameter("pixelPerfect", 0);
      mat.setParameter("hitFlash", 0);
      mat.setParameter("hitFlashColor", new Float32Array([1, 1, 1]));
      mat.setParameter("stunEffect", 0);
      mat.setParameter("counterHitGlow", 0);
      mat.setParameter("playerTint", new Float32Array([1, 1, 1]));
      mat.setParameter("animationFrame", 0);
      mat.setParameter("spriteSheetSize", new Float32Array([1, 1]));
      mat.setParameter("frameSize", new Float32Array([1, 1]));
      return mat;
    }
    static createDepthPostProcessMaterial(app) {
      const mat = this.createMaterialFromShaders(app, DepthPostProcessShader.vertexShader, DepthPostProcessShader.fragmentShader);
      const device = app.graphicsDevice;
      mat.setParameter("uScreenSize", new Float32Array([device.width, device.height]));
      mat.setParameter("uInvScreenSize", new Float32Array([1 / Math.max(1, device.width), 1 / Math.max(1, device.height)]));
      mat.setParameter("uNearClip", 0.1);
      mat.setParameter("uFarClip", 1e3);
      mat.setParameter("uFocusDistance", 15);
      mat.setParameter("uFocusRange", 5);
      mat.setParameter("uBokehRadius", 1.5);
      mat.setParameter("uBokehIntensity", 0.8);
      mat.setParameter("uFogColor", new Float32Array([0.7, 0.8, 0.9]));
      mat.setParameter("uFogDensity", 0);
      mat.setParameter("uFogStart", 10);
      mat.setParameter("uFogEnd", 50);
      mat.setParameter("uAtmosphericPerspective", 0);
      mat.setParameter("uAtmosphereColor", new Float32Array([0.7, 0.8, 0.9]));
      mat.setParameter("uHeatHaze", 0);
      mat.setParameter("uColorSeparation", 0);
      mat.setParameter("uScreenShake", 0);
      mat.setParameter("uScreenShakeOffset", new Float32Array([0, 0]));
      mat.setParameter("uTimeScale", 1);
      mat.setParameter("uTime", 0);
      return mat;
    }
    static createStageStormySkyMaterial(app) {
      const mat = this.createMaterialFromShaders(app, StageStormySkyShader.vertexShader, StageStormySkyShader.fragmentShader);
      mat.setParameter("uScrollSpeed", new Float32Array([0.01, 2e-3]));
      mat.setParameter("uTime", 0);
      mat.setParameter("uTint", new Float32Array([0.6, 0.7, 0.8, 1]));
      return mat;
    }
  };

  // src/scripts/graphics/PostProcessingManager.ts
  var PostProcessingManager = class {
    constructor(app) {
      this.initialized = false;
      // Post-processing configuration
      this.effects = {
        depthOfField: {
          enabled: true,
          focusDistance: 15,
          focusRange: 5,
          blurRadius: 1.5,
          maxBlur: 2,
          bokehIntensity: 0.8,
          adaptiveFocus: true
        },
        bloom: {
          enabled: true,
          threshold: 0.7,
          intensity: 0.9,
          radius: 0.8,
          passes: 3,
          quality: "high"
        },
        colorGrading: {
          enabled: true,
          contrast: 1.1,
          saturation: 1.15,
          brightness: 0.05,
          warmth: 0.1,
          vignette: 0.3,
          filmGrain: 0.15
        },
        lightingEffects: {
          enabled: true,
          volumetricFog: true,
          lightShafts: true,
          screenSpaceReflections: false,
          ambientOcclusion: true
        },
        fightingGameEffects: {
          enabled: true,
          hitPause: false,
          screenShake: { intensity: 0, duration: 0, decay: 0, frequency: 0, active: false },
          flashEffect: { color: new pc6.Color(1, 1, 1), intensity: 0, duration: 0, active: false },
          slowMotion: { factor: 1, duration: 0, active: false },
          dramaTicLighting: false
        }
      };
      // Render targets for multi-pass rendering
      this.renderTargets = {
        sceneColor: null,
        sceneDepth: null,
        blurHorizontal: null,
        blurVertical: null,
        bloom: null,
        final: null
      };
      // Post-processing materials/shaders
      this.materials = {
        depthOfField: null,
        bloom: null,
        colorGrading: null,
        combine: null,
        blur: null
      };
      // Effect cameras for multi-pass rendering
      this.cameras = {
        postProcess: null,
        depth: null
      };
      // Performance settings
      this.quality = "ultra";
      // ultra, high, medium, low
      this.resolution = {
        scale: 1,
        minScale: 0.5,
        maxScale: 1
      };
      // Entities
      this.fullScreenQuad = null;
      this.app = app;
    }
    async initialize() {
      console.log("Initializing Post-Processing Manager...");
      try {
        this.createRenderTargets();
        await this.createPostProcessingMaterials();
        this.setupPostProcessingCameras();
        this.createEffectEntities();
        this.setupRenderPipeline();
        this.initialized = true;
        console.log("Post-Processing Manager initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Post-Processing Manager:", error);
        throw error;
      }
    }
    createRenderTargets() {
      const device = this.app.graphicsDevice;
      const width = Math.floor(device.width * this.resolution.scale);
      const height = Math.floor(device.height * this.resolution.scale);
      this.renderTargets.sceneColor = new pc6.RenderTarget({
        colorBuffer: new pc6.Texture(device, {
          width,
          height,
          format: pc6.PIXELFORMAT_R8_G8_B8_A8,
          mipmaps: false,
          addressU: pc6.ADDRESS_CLAMP_TO_EDGE,
          addressV: pc6.ADDRESS_CLAMP_TO_EDGE,
          magFilter: pc6.FILTER_LINEAR,
          minFilter: pc6.FILTER_LINEAR
        }),
        depthBuffer: true,
        samples: this.quality === "ultra" ? 4 : 1
      });
      this.renderTargets.sceneDepth = new pc6.RenderTarget({
        colorBuffer: new pc6.Texture(device, {
          width,
          height,
          format: pc6.PIXELFORMAT_R8_G8_B8_A8,
          mipmaps: false,
          addressU: pc6.ADDRESS_CLAMP_TO_EDGE,
          addressV: pc6.ADDRESS_CLAMP_TO_EDGE,
          magFilter: pc6.FILTER_LINEAR,
          minFilter: pc6.FILTER_LINEAR
        }),
        depthBuffer: false
      });
      const blurWidth = Math.floor(width * 0.5);
      const blurHeight = Math.floor(height * 0.5);
      this.renderTargets.blurHorizontal = new pc6.RenderTarget({
        colorBuffer: new pc6.Texture(device, {
          width: blurWidth,
          height: blurHeight,
          format: pc6.PIXELFORMAT_R8_G8_B8_A8,
          mipmaps: false,
          addressU: pc6.ADDRESS_CLAMP_TO_EDGE,
          addressV: pc6.ADDRESS_CLAMP_TO_EDGE,
          magFilter: pc6.FILTER_LINEAR,
          minFilter: pc6.FILTER_LINEAR
        }),
        depthBuffer: false
      });
      this.renderTargets.blurVertical = new pc6.RenderTarget({
        colorBuffer: new pc6.Texture(device, {
          width: blurWidth,
          height: blurHeight,
          format: pc6.PIXELFORMAT_R8_G8_B8_A8,
          mipmaps: false,
          addressU: pc6.ADDRESS_CLAMP_TO_EDGE,
          addressV: pc6.ADDRESS_CLAMP_TO_EDGE,
          magFilter: pc6.FILTER_LINEAR,
          minFilter: pc6.FILTER_LINEAR
        }),
        depthBuffer: false
      });
      this.renderTargets.bloom = new pc6.RenderTarget({
        colorBuffer: new pc6.Texture(device, {
          width: blurWidth,
          height: blurHeight,
          format: pc6.PIXELFORMAT_R8_G8_B8_A8,
          mipmaps: false,
          addressU: pc6.ADDRESS_CLAMP_TO_EDGE,
          addressV: pc6.ADDRESS_CLAMP_TO_EDGE,
          magFilter: pc6.FILTER_LINEAR,
          minFilter: pc6.FILTER_LINEAR
        }),
        depthBuffer: false
      });
      console.log("Post-processing render targets created");
    }
    async createPostProcessingMaterials() {
      const depthMat = ShaderUtils.createDepthPostProcessMaterial(this.app);
      depthMat.blendType = pc6.BLEND_NONE;
      depthMat.depthTest = false;
      depthMat.depthWrite = false;
      this.materials.depthOfField = depthMat;
      this.materials.bloom = new pc6.StandardMaterial();
      this.materials.bloom.chunks.PS_LIGHTING = this.getBloomFragmentShader();
      this.materials.bloom.blendType = pc6.BLEND_ADDITIVE;
      this.materials.bloom.depthTest = false;
      this.materials.bloom.depthWrite = false;
      this.materials.blur = new pc6.StandardMaterial();
      this.materials.blur.chunks.PS_LIGHTING = this.getBlurFragmentShader();
      this.materials.blur.blendType = pc6.BLEND_NONE;
      this.materials.blur.depthTest = false;
      this.materials.blur.depthWrite = false;
      this.materials.colorGrading = new pc6.StandardMaterial();
      this.materials.colorGrading.chunks.PS_LIGHTING = this.getColorGradingFragmentShader();
      this.materials.colorGrading.blendType = pc6.BLEND_NONE;
      this.materials.colorGrading.depthTest = false;
      this.materials.colorGrading.depthWrite = false;
      this.materials.combine = new pc6.StandardMaterial();
      this.materials.combine.chunks.PS_LIGHTING = this.getCombineFragmentShader();
      this.materials.combine.blendType = pc6.BLEND_NONE;
      this.materials.combine.depthTest = false;
      this.materials.combine.depthWrite = false;
      console.log("Post-processing materials created");
    }
    getDOFFragmentShader() {
      return `
        uniform sampler2D texture_sceneColor;
        uniform sampler2D texture_sceneDepth;
        uniform vec2 uScreenSize;
        uniform float uFocusDistance;
        uniform float uFocusRange;
        uniform float uMaxBlur;
        
        varying vec2 vUv0;
        
        void main() {
            vec2 uv = vUv0;
            vec4 sceneColor = texture2D(texture_sceneColor, uv);
            float depth = texture2D(texture_sceneDepth, uv).r;
            
            // Calculate blur amount based on distance from focus
            float focusBlur = abs(depth - uFocusDistance) / uFocusRange;
            focusBlur = clamp(focusBlur, 0.0, 1.0) * uMaxBlur;
            
            // Simple box blur (would be replaced with proper DOF in production)
            vec3 color = sceneColor.rgb;
            if (focusBlur > 0.1) {
                vec3 blurColor = vec3(0.0);
                float samples = 0.0;
                
                for (int x = -2; x <= 2; x++) {
                    for (int y = -2; y <= 2; y++) {
                        vec2 offset = vec2(float(x), float(y)) * focusBlur / uScreenSize;
                        blurColor += texture2D(texture_sceneColor, uv + offset).rgb;
                        samples += 1.0;
                    }
                }
                
                color = mix(color, blurColor / samples, focusBlur);
            }
            
            gl_FragColor = vec4(color, sceneColor.a);
        }`;
    }
    getBloomFragmentShader() {
      return `
        uniform sampler2D texture_sceneColor;
        uniform float uBloomThreshold;
        uniform float uBloomIntensity;
        
        varying vec2 vUv0;
        
        void main() {
            vec4 color = texture2D(texture_sceneColor, vUv0);
            
            // Extract bright areas
            float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            float bloomAmount = max(luminance - uBloomThreshold, 0.0);
            bloomAmount *= uBloomIntensity;
            
            gl_FragColor = vec4(color.rgb * bloomAmount, color.a);
        }`;
    }
    getBlurFragmentShader() {
      return `
        uniform sampler2D texture_source;
        uniform vec2 uBlurDirection;
        uniform vec2 uScreenSize;
        
        varying vec2 vUv0;
        
        void main() {
            vec2 texelSize = 1.0 / uScreenSize;
            vec3 color = vec3(0.0);
            
            // 9-tap Gaussian blur
            color += texture2D(texture_source, vUv0 - 4.0 * uBlurDirection * texelSize).rgb * 0.05;
            color += texture2D(texture_source, vUv0 - 3.0 * uBlurDirection * texelSize).rgb * 0.09;
            color += texture2D(texture_source, vUv0 - 2.0 * uBlurDirection * texelSize).rgb * 0.12;
            color += texture2D(texture_source, vUv0 - 1.0 * uBlurDirection * texelSize).rgb * 0.15;
            color += texture2D(texture_source, vUv0).rgb * 0.18;
            color += texture2D(texture_source, vUv0 + 1.0 * uBlurDirection * texelSize).rgb * 0.15;
            color += texture2D(texture_source, vUv0 + 2.0 * uBlurDirection * texelSize).rgb * 0.12;
            color += texture2D(texture_source, vUv0 + 3.0 * uBlurDirection * texelSize).rgb * 0.09;
            color += texture2D(texture_source, vUv0 + 4.0 * uBlurDirection * texelSize).rgb * 0.05;
            
            gl_FragColor = vec4(color, 1.0);
        }`;
    }
    getColorGradingFragmentShader() {
      return `
        uniform sampler2D texture_sceneColor;
        uniform float uContrast;
        uniform float uSaturation;
        uniform float uBrightness;
        uniform float uWarmth;
        uniform float uVignette;
        uniform float uFilmGrain;
        uniform float uTime;
        
        varying vec2 vUv0;
        
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
            vec2 uv = vUv0;
            vec4 color = texture2D(texture_sceneColor, uv);
            
            // Brightness
            color.rgb += uBrightness;
            
            // Contrast
            color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
            
            // Saturation
            float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = mix(vec3(luminance), color.rgb, uSaturation);
            
            // Warmth (blue/orange tint)
            color.rgb = mix(color.rgb, color.rgb * vec3(1.0 + uWarmth, 1.0, 1.0 - uWarmth), abs(uWarmth));
            
            // Vignette
            if (uVignette > 0.0) {
                float dist = distance(uv, vec2(0.5));
                float vignetteFactor = 1.0 - smoothstep(0.3, 0.8, dist * uVignette);
                color.rgb *= vignetteFactor;
            }
            
            // Film grain
            if (uFilmGrain > 0.0) {
                float noise = random(uv + uTime) * 2.0 - 1.0;
                color.rgb += noise * uFilmGrain * 0.1;
            }
            
            gl_FragColor = vec4(color.rgb, color.a);
        }`;
    }
    getCombineFragmentShader() {
      return `
        uniform sampler2D texture_sceneColor;
        uniform sampler2D texture_bloom;
        uniform float uBloomIntensity;
        uniform vec3 uFlashColor;
        uniform float uFlashIntensity;
        
        varying vec2 vUv0;
        
        void main() {
            vec4 sceneColor = texture2D(texture_sceneColor, vUv0);
            vec4 bloomColor = texture2D(texture_bloom, vUv0);
            
            // Combine scene and bloom
            vec3 finalColor = sceneColor.rgb + bloomColor.rgb * uBloomIntensity;
            
            // Apply flash effect (for hit effects)
            if (uFlashIntensity > 0.0) {
                finalColor = mix(finalColor, uFlashColor, uFlashIntensity);
            }
            
            gl_FragColor = vec4(finalColor, sceneColor.a);
        }`;
    }
    setupPostProcessingCameras() {
      this.cameras.postProcess = new pc6.Entity("PostProcessCamera");
      this.cameras.postProcess.addComponent("camera", {
        clearColor: new pc6.Color(0, 0, 0, 0),
        projection: pc6.PROJECTION_ORTHOGRAPHIC,
        orthoHeight: 1,
        nearClip: 0,
        farClip: 1,
        priority: 100,
        enabled: false
      });
      this.app.root.addChild(this.cameras.postProcess);
    }
    createEffectEntities() {
      this.fullScreenQuad = new pc6.Entity("FullScreenQuad");
      this.fullScreenQuad.addComponent("render", {
        type: "plane"
      });
      this.fullScreenQuad.setLocalScale(2, 2, 1);
      this.fullScreenQuad.setPosition(0, 0, 0.5);
      this.app.root.addChild(this.fullScreenQuad);
    }
    setupRenderPipeline() {
      const mainCamera = this.app.root.findByName("MainCamera");
      if (mainCamera && mainCamera.camera) {
        mainCamera.camera.renderTarget = this.renderTargets.sceneColor;
      }
      console.log("Post-processing render pipeline configured");
    }
    // Public API methods
    setDepthOfField(focusDistance, focusRange, blurRadius) {
      this.effects.depthOfField.focusDistance = focusDistance;
      this.effects.depthOfField.focusRange = focusRange;
      this.effects.depthOfField.blurRadius = blurRadius;
    }
    setBloom(threshold, intensity, radius) {
      this.effects.bloom.threshold = threshold;
      this.effects.bloom.intensity = intensity;
      this.effects.bloom.radius = radius;
    }
    setColorGrading(contrast, saturation, brightness, warmth) {
      this.effects.colorGrading.contrast = contrast;
      this.effects.colorGrading.saturation = saturation;
      this.effects.colorGrading.brightness = brightness;
      this.effects.colorGrading.warmth = warmth;
    }
    // Fighting game specific effects
    triggerHitFlash(color = [1, 1, 1], intensity = 0.8, duration = 100) {
      this.effects.fightingGameEffects.flashEffect.color = new pc6.Color(color[0], color[1], color[2]);
      this.effects.fightingGameEffects.flashEffect.intensity = intensity;
      this.effects.fightingGameEffects.flashEffect.duration = duration;
      this.effects.fightingGameEffects.flashEffect.active = true;
      const startTime = Date.now();
      const fadeFlash = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        if (progress < 1) {
          this.effects.fightingGameEffects.flashEffect.intensity = intensity * (1 - progress);
          requestAnimationFrame(fadeFlash);
        } else {
          this.effects.fightingGameEffects.flashEffect.intensity = 0;
          this.effects.fightingGameEffects.flashEffect.active = false;
        }
      };
      fadeFlash();
    }
    triggerScreenShake(intensity = 1, duration = 300) {
      this.effects.fightingGameEffects.screenShake.intensity = intensity;
      this.effects.fightingGameEffects.screenShake.duration = duration;
      this.effects.fightingGameEffects.screenShake.active = true;
      const startTime = Date.now();
      const mainCamera = this.app.root.findByName("MainCamera");
      const originalPos = mainCamera.getPosition().clone();
      const shakeCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        if (progress < 1) {
          const currentIntensity = intensity * (1 - progress);
          const shakeX = (Math.random() - 0.5) * currentIntensity * 0.5;
          const shakeY = (Math.random() - 0.5) * currentIntensity * 0.3;
          mainCamera.setPosition(originalPos.x + shakeX, originalPos.y + shakeY, originalPos.z);
          requestAnimationFrame(shakeCamera);
        } else {
          mainCamera.setPosition(originalPos);
          this.effects.fightingGameEffects.screenShake.intensity = 0;
          this.effects.fightingGameEffects.screenShake.active = false;
        }
      };
      shakeCamera();
    }
    triggerSlowMotion(factor = 0.3, duration = 1e3) {
      this.effects.fightingGameEffects.slowMotion.factor = factor;
      this.effects.fightingGameEffects.slowMotion.duration = duration;
      this.effects.fightingGameEffects.slowMotion.active = true;
      this.app.timeScale = factor;
      setTimeout(() => {
        this.effects.fightingGameEffects.slowMotion.factor = 1;
        this.effects.fightingGameEffects.slowMotion.active = false;
        this.app.timeScale = 1;
      }, duration);
    }
    setDramaticLighting(enabled) {
      this.effects.fightingGameEffects.dramaTicLighting = enabled;
      if (enabled) {
        this.setColorGrading(1.3, 1.4, 0.1, 0.2);
        this.setBloom(0.5, 1.2, 1);
      } else {
        this.setColorGrading(1.1, 1.15, 0.05, 0.1);
        this.setBloom(0.7, 0.9, 0.8);
      }
    }
    // Update loop
    update(dt) {
      if (!this.initialized) return;
      this.updateEffectParameters(dt);
      this.renderPostProcessing(dt);
    }
    updateEffectParameters(dt) {
      if (this.materials.depthOfField) {
        this.materials.depthOfField.setParameter("uFocusDistance", this.effects.depthOfField.focusDistance);
        this.materials.depthOfField.setParameter("uFocusRange", this.effects.depthOfField.focusRange);
        this.materials.depthOfField.setParameter("uMaxBlur", this.effects.depthOfField.maxBlur);
      }
      if (this.materials.bloom) {
        this.materials.bloom.setParameter("uBloomThreshold", this.effects.bloom.threshold);
        this.materials.bloom.setParameter("uBloomIntensity", this.effects.bloom.intensity);
      }
      if (this.materials.colorGrading) {
        this.materials.colorGrading.setParameter("uContrast", this.effects.colorGrading.contrast);
        this.materials.colorGrading.setParameter("uSaturation", this.effects.colorGrading.saturation);
        this.materials.colorGrading.setParameter("uBrightness", this.effects.colorGrading.brightness);
        this.materials.colorGrading.setParameter("uWarmth", this.effects.colorGrading.warmth);
        this.materials.colorGrading.setParameter("uVignette", this.effects.colorGrading.vignette);
        this.materials.colorGrading.setParameter("uFilmGrain", this.effects.colorGrading.filmGrain);
        this.materials.colorGrading.setParameter("uTime", Date.now() * 1e-3);
      }
      if (this.materials.combine) {
        this.materials.combine.setParameter("uBloomIntensity", this.effects.bloom.intensity);
        this.materials.combine.setParameter("uFlashColor", [
          this.effects.fightingGameEffects.flashEffect.color.r,
          this.effects.fightingGameEffects.flashEffect.color.g,
          this.effects.fightingGameEffects.flashEffect.color.b
        ]);
        this.materials.combine.setParameter("uFlashIntensity", this.effects.fightingGameEffects.flashEffect.intensity);
      }
    }
    renderPostProcessing(dt) {
      if (!this.fullScreenQuad || !this.materials.depthOfField || !this.renderTargets.sceneColor) return;
      const device = this.app.graphicsDevice;
      const timeSec = Date.now() * 1e-3;
      this.materials.depthOfField.setParameter("uTime", timeSec);
      this.materials.depthOfField.setParameter("uScreenSize", new Float32Array([device.width, device.height]));
      this.materials.depthOfField.setParameter("uInvScreenSize", new Float32Array([1 / Math.max(1, device.width), 1 / Math.max(1, device.height)]));
      this.materials.depthOfField.setParameter("texture_colorBuffer", this.renderTargets.sceneColor.colorBuffer);
      const depthBufferTex = this.renderTargets.sceneDepth ? this.renderTargets.sceneDepth.colorBuffer : this.renderTargets.sceneColor.colorBuffer;
      this.materials.depthOfField.setParameter("texture_depthBuffer", depthBufferTex);
      this.fullScreenQuad.render.material = this.materials.depthOfField;
    }
    // Quality management
    setQuality(quality) {
      this.quality = quality;
      const qualitySettings = {
        low: { scale: 0.5, bloom: false, dof: false },
        medium: { scale: 0.75, bloom: true, dof: false },
        high: { scale: 1, bloom: true, dof: true },
        ultra: { scale: 1, bloom: true, dof: true }
      };
      const settings = qualitySettings[quality];
      this.resolution.scale = settings.scale;
      this.effects.bloom.enabled = settings.bloom;
      this.effects.depthOfField.enabled = settings.dof;
      this.createRenderTargets();
      console.log(`Post-processing quality set to: ${quality}`);
    }
    destroy() {
      if (this.fullScreenQuad) {
        this.fullScreenQuad.destroy();
      }
      Object.values(this.renderTargets).forEach((target) => {
        if (target) {
          target.destroy();
        }
      });
      Object.values(this.cameras).forEach((camera) => {
        if (camera) {
          camera.destroy();
        }
      });
      console.log("PostProcessingManager destroyed");
    }
  };
  var PostProcessingManager_default = PostProcessingManager;

  // src/core/utils/EventBus.ts
  var EventBus = class {
    constructor() {
      this.handlers = /* @__PURE__ */ new Map();
    }
    on(event, handler) {
      if (!this.handlers.has(event)) this.handlers.set(event, /* @__PURE__ */ new Set());
      this.handlers.get(event).add(handler);
    }
    off(event, handler) {
      this.handlers.get(event)?.delete(handler);
    }
    emit(event, payload) {
      this.handlers.get(event)?.forEach((h) => h(payload));
    }
    clear() {
      this.handlers.clear();
    }
  };

  // src/core/utils/ServiceContainer.ts
  var ServiceContainer = class {
    constructor() {
      this.services = /* @__PURE__ */ new Map();
    }
    register(key, instance) {
      this.services.set(key, instance);
    }
    resolve(key) {
      if (!this.services.has(key)) {
        throw new Error(`Service not registered: ${key}`);
      }
      return this.services.get(key);
    }
    has(key) {
      return this.services.has(key);
    }
    clear() {
      this.services.clear();
    }
  };

  // src/core/utils/FeatureFlags.ts
  var FeatureFlags = class {
    constructor() {
      this.flags = /* @__PURE__ */ new Map();
    }
    enable(key) {
      this.flags.set(key, true);
    }
    disable(key) {
      this.flags.set(key, false);
    }
    set(key, value) {
      this.flags.set(key, value);
    }
    isEnabled(key, defaultValue = false) {
      return this.flags.has(key) ? !!this.flags.get(key) : defaultValue;
    }
  };

  // src/core/UpdatePipeline.ts
  var UpdatePipeline = class {
    constructor() {
      this.systems = [];
      this.samples = [];
    }
    add(system) {
      this.systems.push(system);
      this.systems.sort((a, b) => a.priority - b.priority);
    }
    remove(system) {
      this.systems = this.systems.filter((s) => s !== system);
    }
    update(deltaTime) {
      this.samples.length = 0;
      for (const sys of this.systems) {
        const start = performance.now();
        sys.update(deltaTime);
        const end = performance.now();
        this.samples.push({ name: sys.name || "system", ms: end - start });
      }
    }
    getTimings() {
      return this.samples.slice();
    }
    clear() {
      this.systems.length = 0;
    }
  };

  // src/core/state/GameStateStack.ts
  var GameStateStack = class {
    constructor() {
      this.stack = [];
    }
    get current() {
      return this.stack[this.stack.length - 1];
    }
    async push(state) {
      const prev = this.current;
      this.stack.push(state);
      await state.enter(prev);
    }
    async pop() {
      const state = this.stack.pop();
      if (state) await state.exit(this.current);
    }
    async replace(state) {
      const prev = this.stack.pop();
      if (prev) await prev.exit(state);
      this.stack.push(state);
      await state.enter(prev);
    }
    update(dt) {
      this.current?.update(dt);
    }
  };

  // src/core/state/BootState.ts
  var BootState = class {
    constructor(app, services, events) {
      this.name = "boot";
      this.app = app;
      this.services = services;
      this.events = events;
    }
    async enter() {
      try {
        const config = this.services.resolve("config");
        const monetization = this.services.resolve("monetization");
        const entitlement = this.services.resolve("entitlement");
        const security = this.services.resolve("security");
        await Promise.all([
          config.loadJson("/data/balance/live_balance.json").catch(() => ({})),
          monetization.initialize().catch(() => void 0),
          entitlement.initialize?.().catch(() => void 0)
        ]);
        security.start?.();
        this.events.emit("state:goto", { state: "menu" });
      } catch (e) {
        console.error("BootState failed:", e);
        this.events.emit("state:goto", { state: "menu" });
      }
    }
    exit() {
    }
    update(dt) {
    }
  };

  // src/core/state/MenuState.ts
  var MenuState = class {
    constructor(app, events) {
      this.name = "menu";
      this.menuEntity = null;
      this.onKey = (e) => {
        if (e.key === "Enter") {
          this.events.emit("state:goto", { state: "match" });
        }
      };
      this.app = app;
      this.events = events;
    }
    enter() {
      const ui = this.app._ui;
      ui?.showMenu();
      try {
        const services = this.app._services;
        const monetization = services?.resolve?.("monetization");
        monetization?.storefront?.startStoreImpression?.("featured");
      } catch {
      }
      window.addEventListener("keydown", this.onKey);
    }
    exit() {
      window.removeEventListener("keydown", this.onKey);
      const ui = this.app._ui;
      ui?.hideMenu();
      try {
        const services = this.app._services;
        const monetization = services?.resolve?.("monetization");
        monetization?.storefront?.endStoreImpression?.();
      } catch {
      }
    }
    update(dt) {
    }
  };

  // src/core/state/MatchState.ts
  var MatchState = class {
    constructor(app, events) {
      this.name = "match";
      this.app = app;
      this.events = events;
    }
    enter() {
      const ui = this.app._ui;
      ui?.showHUD();
    }
    exit() {
    }
    update(dt) {
    }
  };

  // src/core/utils/PreloadManager.ts
  var PreloadManager = class {
    constructor() {
      this.manifest = { assets: [] };
    }
    async loadManifest(url = "/assets/manifest.json") {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Manifest load failed: ${res.status}`);
      this.manifest = await res.json();
    }
    getAssetsByType(type) {
      return this.manifest.assets.filter((a) => a.type === type).map((a) => a.path);
    }
    async getJson(path) {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`JSON load failed: ${path}`);
      const text = await res.text();
      try {
        const entry = this.manifest.assets.find((a) => a.path === path);
        if (entry?.sha256 && "crypto" in window && window.crypto.subtle) {
          const buf = new TextEncoder().encode(text);
          const hashBuf = await window.crypto.subtle.digest("SHA-256", buf);
          const hashArray = Array.from(new Uint8Array(hashBuf));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          if (hashHex !== entry.sha256) throw new Error(`Integrity check failed for ${path}`);
        }
      } catch {
      }
      return JSON.parse(text);
    }
  };

  // src/core/ai/AIManager.ts
  var AIManager = class {
    constructor(app) {
      this.policies = /* @__PURE__ */ new Map();
      this.active = null;
      this.dda = { difficulty: 1 };
      this.app = app;
    }
    registerPolicy(name, policy) {
      this.policies.set(name, policy);
    }
    activate(name) {
      if (this.policies.has(name)) this.active = name;
    }
    setDifficulty(x) {
      this.dda.difficulty = Math.max(0.1, Math.min(3, x));
    }
    update(dt) {
      if (!this.active) return;
      const policy = this.policies.get(this.active);
      policy?.({ dt, app: this.app, state: { difficulty: this.dda.difficulty } });
    }
  };

  // src/core/procgen/ProceduralStageGenerator.ts
  var ProceduralStageGenerator = class {
    constructor(seed = Date.now()) {
      this.rng = mulberry32(seed >>> 0);
    }
    generate(opts = {}) {
      const theme = opts.theme || "training";
      switch (theme) {
        case "urban":
          return this.urban();
        case "gothic":
          return this.gothic();
        default:
          return this.training();
      }
    }
    training() {
      return {
        name: "Training (Procedural)",
        layers: {
          skybox: { type: "gradient", elements: [] },
          farBackground: { type: "mountains", elements: this.mountains(3) },
          midBackground: { type: "buildings", elements: this.buildings(4) },
          nearBackground: { type: "trees", elements: this.trees(3) },
          playground: { type: "stage_floor", elements: [{ type: "platform", x: 0, y: -5, width: 40, height: 2 }] }
        }
      };
    }
    gothic() {
      return {
        name: "Gothic (Procedural)",
        layers: {
          skybox: { type: "stormy_sky", elements: [{ type: "plane", name: "stormy_sky" }] },
          farBackground: { type: "mountains", elements: this.mountains(2) },
          midBackground: { type: "castle", elements: this.buildings(3) },
          nearBackground: { type: "gargoyles", elements: this.trees(2) },
          playground: { type: "cobblestone", elements: [{ type: "platform", x: 0, y: -5, width: 40, height: 2 }] }
        }
      };
    }
    urban() {
      return {
        name: "Urban (Procedural)",
        layers: {
          skybox: { type: "cityscape", elements: [] },
          farBackground: { type: "cityscape", elements: this.buildings(5) },
          midBackground: { type: "street", elements: this.buildings(3) },
          nearBackground: { type: "crowd", elements: this.buildings(2) },
          playground: { type: "street_stage", elements: [{ type: "asphalt", x: 0, y: -5, width: 50, height: 3 }] }
        }
      };
    }
    mountains(n) {
      const arr = [];
      for (let i = 0; i < n; i++) arr.push({ type: "mountain", x: (i - n / 2) * 100, y: -20 + this.rand(-5, 5), width: this.rand(30, 50), height: this.rand(20, 30), color: "#4A5568" });
      return arr;
    }
    buildings(n) {
      const arr = [];
      for (let i = 0; i < n; i++) arr.push({ type: "building", x: (i - n / 2) * 80, y: -10, width: this.rand(20, 60), height: this.rand(40, 120), color: "#6B7280" });
      return arr;
    }
    trees(n) {
      const arr = [];
      for (let i = 0; i < n; i++) arr.push({ type: "tree", x: (i - n / 2) * 60, y: -6, scale: this.rand(1, 2), sway: true });
      return arr;
    }
    rand(min, max) {
      return min + (max - min) * this.rng();
    }
  };
  function mulberry32(a) {
    return function() {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // src/core/utils/DecompDataService.ts
  var DecompDataService = class {
    async loadGroundTruthCharacter() {
      try {
        const res = await fetch("/data/characters_decomp/sf3_ground_truth_seed.json");
        if (!res.ok) return null;
        const data = await res.json();
        return data;
      } catch {
        return null;
      }
    }
    // Browser-side fallback: if json not present, attempt to fetch raw decomp table and heuristically parse
    async deriveFromDecompIfAvailable() {
      try {
        const urlCandidates = [
          "/sfiii-decomp/src/anniversary/bin2obj/char_table.c"
        ];
        let text = null;
        for (const u of urlCandidates) {
          try {
            const r = await fetch(u, { cache: "no-store" });
            if (r.ok) {
              text = await r.text();
              break;
            }
          } catch {
          }
        }
        if (!text) return null;
        const triplets = this.parseHeuristicMoveTriplets(text);
        const moves = this.assignToMockMoveNames(triplets);
        const characterId = "sf3_ground_truth_seed";
        const animations = {};
        for (const k of Object.keys(moves)) {
          const total = Math.max(1, moves[k].startup + moves[k].active + moves[k].recovery);
          animations[`move_${k}`] = { frameCount: total, duration: Math.max(83, total * 16.6), loop: false };
        }
        const json = {
          characterId,
          name: characterId,
          displayName: characterId,
          archetype: "technical",
          spritePath: `/assets/sprites/${characterId}.png`,
          health: 1e3,
          walkSpeed: 150,
          dashSpeed: 300,
          jumpHeight: 380,
          complexity: "medium",
          strengths: [],
          weaknesses: [],
          uniqueMechanics: [],
          moves,
          animations
        };
        return json;
      } catch {
        return null;
      }
    }
    parseHeuristicMoveTriplets(source) {
      const hexOrDec = /0x[0-9A-Fa-f]+|\d+/g;
      const numbers = [];
      for (const m of source.matchAll(hexOrDec)) {
        const t = m[0];
        const v = t.startsWith("0x") ? parseInt(t, 16) : parseInt(t, 10);
        if (!Number.isFinite(v)) continue;
        numbers.push(v >>> 0);
      }
      const smalls = numbers.filter((n) => n > 0 && n <= 120);
      const triplets = [];
      for (let i = 0; i + 2 < smalls.length; i += 3) {
        const a = smalls[i + 0];
        const b = smalls[i + 1];
        const c = smalls[i + 2];
        if (a + b + c <= 0) continue;
        if (a > 60 || b > 60 || c > 90) continue;
        triplets.push({ startup: a, active: b, recovery: c });
      }
      return triplets;
    }
    assignToMockMoveNames(triplets) {
      const names = [
        "light_punch",
        "medium_punch",
        "heavy_punch",
        "light_kick",
        "medium_kick",
        "heavy_kick",
        "special_1",
        "special_2",
        "special_3",
        "super_1"
      ];
      const out = {};
      for (let i = 0; i < names.length && i < triplets.length; i++) {
        out[names[i]] = triplets[i];
      }
      return out;
    }
  };

  // src/client/retention/RetentionClient.ts
  var import_eventemitter3 = __toESM(require_eventemitter3());

  // node_modules/uuid/dist/esm-browser/stringify.js
  var byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  }

  // node_modules/uuid/dist/esm-browser/rng.js
  var getRandomValues;
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      if (typeof crypto === "undefined" || !crypto.getRandomValues) {
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      }
      getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
  }

  // node_modules/uuid/dist/esm-browser/native.js
  var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
  var native_default = { randomUUID };

  // node_modules/uuid/dist/esm-browser/v4.js
  function v4(options, buf, offset) {
    if (native_default.randomUUID && !buf && !options) {
      return native_default.randomUUID();
    }
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? rng();
    if (rnds.length < 16) {
      throw new Error("Random bytes length must be >= 16");
    }
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      if (offset < 0 || offset + 16 > buf.length) {
        throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
      }
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return unsafeStringify(rnds);
  }
  var v4_default = v4;

  // src/client/retention/RetentionClient.ts
  var OfflineEventQueue = class {
    constructor(storageKey) {
      this.maxSize = 1e3;
      this.storageKey = storageKey;
    }
    enqueue(event) {
      try {
        const queue = this.getQueue();
        queue.push(event);
        if (queue.length > this.maxSize) {
          queue.splice(0, queue.length - this.maxSize);
        }
        localStorage.setItem(this.storageKey, JSON.stringify(queue));
      } catch (error) {
        console.warn("RetentionClient: Unable to store offline event", error);
      }
    }
    dequeueAll() {
      try {
        const queue = this.getQueue();
        localStorage.setItem(this.storageKey, JSON.stringify([]));
        return queue;
      } catch (error) {
        console.warn("RetentionClient: Unable to retrieve offline events", error);
        return [];
      }
    }
    getQueue() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        return [];
      }
    }
  };
  var RetentionClient = class extends import_eventemitter3.EventEmitter {
    constructor(config) {
      super();
      this.eventQueue = [];
      this.eventEndpoints = {
        session_start: "/analytics/events",
        match_result: "/analytics/events",
        progression_grant: "/progression/events",
        store_impression: "/commerce/events",
        purchase_completed: "/commerce/events",
        club_event: "/social/events"
      };
      this.flushTimer = null;
      this.isOnline = true;
      this.config = {
        batchSize: 10,
        flushIntervalMs: 3e4,
        // 30 seconds
        maxRetries: 3,
        offlineStorageKey: "retention_events",
        enableDebugLogging: false,
        ...config
      };
      this.sessionHash = `s_${v4_default().replace(/-/g, "")}`;
      this.offlineQueue = new OfflineEventQueue(this.config.offlineStorageKey);
      this.setupNetworkMonitoring();
      this.setupFlushTimer();
      this.processOfflineEvents();
    }
    /**
     * Start a new session and track session_start event
     */
    startSession(additionalData) {
      const event = {
        event: "session_start",
        v: "1.0",
        ts: Math.floor(Date.now() / 1e3),
        userId: this.config.userId,
        sessionHash: this.sessionHash,
        platform: this.detectPlatform(),
        clientVersion: this.getClientVersion(),
        returningPlayer: this.isReturningPlayer(),
        daysSinceLastSession: this.getDaysSinceLastSession(),
        ...additionalData
      };
      this.trackEvent(event);
      this.updateLastSessionTime();
    }
    /**
     * Track a match result
     */
    trackMatchResult(matchData) {
      const event = {
        event: "match_result",
        v: "1.0",
        ts: Math.floor(Date.now() / 1e3),
        userId: this.config.userId,
        sessionHash: this.sessionHash,
        ...matchData
      };
      this.trackEvent(event);
    }
    /**
     * Track club-related events
     */
    trackClubEvent(action, clubId) {
      const event = {
        event: "club_event",
        v: "1.0",
        ts: Math.floor(Date.now() / 1e3),
        userId: this.config.userId,
        sessionHash: this.sessionHash,
        clubId: clubId || "unknown",
        action
      };
      this.trackEvent(event);
    }
    /**
     * Track progression grants (XP, unlocks, etc.)
     */
    trackProgression(grantType, amount, reason, additionalData) {
      const event = {
        event: "progression_grant",
        v: "1.0",
        ts: Math.floor(Date.now() / 1e3),
        userId: this.config.userId,
        sessionHash: this.sessionHash,
        grantType,
        amount,
        reason,
        ...additionalData
      };
      this.trackEvent(event);
    }
    /**
     * Track store impressions
     */
    trackStoreImpression(section, additionalData) {
      const event = {
        event: "store_impression",
        v: "1.0",
        ts: Math.floor(Date.now() / 1e3),
        userId: this.config.userId,
        sessionHash: this.sessionHash,
        storeSection: section,
        ...additionalData
      };
      this.trackEvent(event);
    }
    /**
     * Track completed purchases
     */
    trackPurchase(transactionId, totalAmount, currency, items, additionalData) {
      const event = {
        event: "purchase_completed",
        v: "1.0",
        ts: Math.floor(Date.now() / 1e3),
        userId: this.config.userId,
        sessionHash: this.sessionHash,
        transactionId,
        totalAmount,
        currency,
        items,
        ...additionalData
      };
      this.trackEvent(event);
    }
    /**
     * Manually flush all queued events
     */
    flush() {
      return this.flushEvents();
    }
    /**
     * End session and flush all remaining events
     */
    endSession() {
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
      return this.flushEvents();
    }
    trackEvent(event) {
      if (!this.validateEvent(event)) {
        this.log("Invalid event data:", event);
        return;
      }
      this.eventQueue.push(event);
      this.emit("event_tracked", event);
      if (this.eventQueue.length >= this.config.batchSize) {
        this.flushEvents();
      }
    }
    async flushEvents() {
      if (this.eventQueue.length === 0) {
        return;
      }
      const eventsToSend = [...this.eventQueue];
      this.eventQueue = [];
      const eventsByEndpoint = {};
      for (const event of eventsToSend) {
        const endpoint = this.eventEndpoints[event.event];
        if (endpoint) {
          if (!eventsByEndpoint[endpoint]) {
            eventsByEndpoint[endpoint] = [];
          }
          eventsByEndpoint[endpoint].push(event);
        }
      }
      for (const endpoint in eventsByEndpoint) {
        try {
          if (this.isOnline) {
            await this.sendEvents(endpoint, eventsByEndpoint[endpoint]);
            this.log(`Successfully sent ${eventsByEndpoint[endpoint].length} events to ${endpoint}`);
            this.emit("events_sent", { endpoint, events: eventsByEndpoint[endpoint] });
          } else {
            eventsByEndpoint[endpoint].forEach((event) => this.offlineQueue.enqueue(event));
            this.log(`Stored ${eventsByEndpoint[endpoint].length} events offline for ${endpoint}`);
          }
        } catch (error) {
          this.log(`Failed to send events to ${endpoint}, storing offline:`, error);
          eventsByEndpoint[endpoint].forEach((event) => this.offlineQueue.enqueue(event));
          this.emit("events_failed", { endpoint, events: eventsByEndpoint[endpoint], error });
        }
      }
    }
    async _sendWithRetry(endpoint, payload, retryCount = 0) {
      try {
        const response = await fetch(`${this.config.apiEndpoint}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`,
            "X-Client-Version": this.getClientVersion()
          },
          body: JSON.stringify({ events: payload })
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (retryCount < this.config.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1e3;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this._sendWithRetry(endpoint, payload, retryCount + 1);
        }
        throw error;
      }
    }
    async sendEvents(endpointOrEvents, events) {
      let endpoint;
      let payload;
      if (typeof endpointOrEvents === "string") {
        endpoint = endpointOrEvents;
        payload = events ?? [];
      } else {
        endpoint = "/analytics/events";
        payload = endpointOrEvents;
      }
      return this._sendWithRetry(endpoint, payload);
    }
    validateEvent(event) {
      return !!(event.event && event.v && event.ts && event.userId && event.sessionHash);
    }
    setupNetworkMonitoring() {
      if (typeof window !== "undefined") {
        window.addEventListener("online", () => {
          this.isOnline = true;
          this.processOfflineEvents();
        });
        window.addEventListener("offline", () => {
          this.isOnline = false;
        });
        this.isOnline = navigator.onLine;
      }
    }
    setupFlushTimer() {
      this.flushTimer = setInterval(() => {
        this.flushEvents();
      }, this.config.flushIntervalMs);
    }
    async processOfflineEvents() {
      if (!this.isOnline) return;
      const offlineEvents = this.offlineQueue.dequeueAll();
      if (offlineEvents.length > 0) {
        try {
          await this.sendEvents("/analytics/events", offlineEvents);
          this.log(`Successfully sent ${offlineEvents.length} offline events`);
        } catch (error) {
          this.log("Failed to send offline events:", error);
          offlineEvents.forEach((event) => this.offlineQueue.enqueue(event));
        }
      }
    }
    detectPlatform() {
      if (typeof window === "undefined") return "desktop";
      const userAgent = navigator.userAgent.toLowerCase();
      if (/mobile|android|iphone|ipad/.test(userAgent)) {
        return "mobile";
      }
      return "web";
    }
    getClientVersion() {
      return "1.0.0";
    }
    isReturningPlayer() {
      try {
        return localStorage.getItem("retention_last_session") !== null;
      } catch {
        return false;
      }
    }
    getDaysSinceLastSession() {
      try {
        const lastSession = localStorage.getItem("retention_last_session");
        if (!lastSession) return 0;
        const lastTime = parseInt(lastSession);
        const daysDiff = Math.floor((Date.now() - lastTime) / (1e3 * 60 * 60 * 24));
        return Math.max(0, daysDiff);
      } catch {
        return 0;
      }
    }
    updateLastSessionTime() {
      try {
        localStorage.setItem("retention_last_session", Date.now().toString());
      } catch {
      }
    }
    log(message, ...args) {
      if (this.config.enableDebugLogging) {
        console.log(`[RetentionClient] ${message}`, ...args);
      }
    }
  };

  // src/client/commerce/Storefront.ts
  var import_eventemitter32 = __toESM(require_eventemitter3());
  var Storefront = class extends import_eventemitter32.EventEmitter {
    constructor(config) {
      super();
      this.catalog = /* @__PURE__ */ new Map();
      this.bundles = /* @__PURE__ */ new Map();
      this.sections = /* @__PURE__ */ new Map();
      this.currentImpression = null;
      this.config = config;
      this.setupEventListeners();
    }
    /**
     * Load store catalog from server
     */
    async loadCatalog() {
      try {
        const response = await fetch(`${this.config.apiEndpoint}/store/catalog`, {
          headers: {
            "Accept": "application/json",
            "X-Region": this.config.region,
            "X-Currency": this.config.currency
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to load catalog: ${response.statusText}`);
        }
        const catalogData = await response.json();
        this.processCatalogData(catalogData);
        this.emit("catalog_loaded", { itemCount: this.catalog.size, bundleCount: this.bundles.size });
      } catch (error) {
        this.log("Failed to load catalog:", error);
        this.emit("catalog_error", error);
        throw error;
      }
    }
    /**
     * Get items for a specific store section
     */
    getSection(sectionId) {
      return this.sections.get(sectionId) || null;
    }
    /**
     * Get all available store sections
     */
    getSections() {
      return Array.from(this.sections.values());
    }
    /**
     * Get specific item details
     */
    getItem(itemId) {
      return this.catalog.get(itemId) || null;
    }
    /**
     * Get specific bundle details
     */
    getBundle(bundleId) {
      return this.bundles.get(bundleId) || null;
    }
    /**
     * Filter items based on criteria
     */
    filterItems(filter) {
      let items = Array.from(this.catalog.values());
      if (filter.type) {
        items = items.filter((item) => item.type === filter.type);
      }
      if (filter.rarity) {
        items = items.filter((item) => item.rarity === filter.rarity);
      }
      if (filter.character) {
        items = items.filter((item) => item.characterId === filter.character);
      }
      if (filter.owned !== void 0) {
        items = items.filter((item) => item.owned === filter.owned);
      }
      if (filter.priceRange) {
        items = items.filter(
          (item) => item.price >= filter.priceRange.min && item.price <= filter.priceRange.max
        );
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        items = items.filter(
          (item) => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
        );
      }
      return items;
    }
    /**
     * Start tracking store impression for analytics
     */
    startStoreImpression(sectionId) {
      this.endStoreImpression();
      this.currentImpression = {
        section: sectionId,
        startTime: Date.now(),
        viewedItems: [],
        clickedItems: []
      };
      const section = this.getSection(sectionId);
      if (section) {
        section.items.forEach((item) => {
          this.currentImpression.viewedItems.push(item.id);
        });
      }
    }
    /**
     * Track item click for analytics
     */
    trackItemClick(itemId) {
      if (this.currentImpression && !this.currentImpression.clickedItems.includes(itemId)) {
        this.currentImpression.clickedItems.push(itemId);
      }
    }
    /**
     * End store impression and send analytics
     */
    endStoreImpression() {
      if (!this.currentImpression) return;
      const duration = Date.now() - this.currentImpression.startTime;
      const section = this.getSection(this.currentImpression.section);
      if (section) {
        const viewedItems = this.currentImpression.viewedItems.map((itemId) => {
          const item = this.getItem(itemId) || this.getBundle(itemId);
          if (!item) return null;
          return {
            itemId,
            price: "pricing" in item ? item.pricing.bundlePrice : item.price,
            currency: item.currency,
            onSale: this.isItemOnSale(item),
            returnWindowDays: this.getReturnWindowDays(item)
          };
        }).filter(Boolean);
        this.config.retentionClient.trackStoreImpression({
          storeSection: this.currentImpression.section,
          itemsViewed: viewedItems,
          viewDurationMs: duration,
          clickedItems: this.currentImpression.clickedItems
        });
      }
      this.currentImpression = null;
    }
    /**
     * Purchase an item or bundle
     */
    async purchaseItem(itemId, paymentDetails) {
      try {
        const item = this.getItem(itemId) || this.getBundle(itemId);
        if (!item) {
          throw new Error("Item not found");
        }
        if (!item.purchasable) {
          throw new Error("Item is not purchasable");
        }
        this.validatePaymentMethod(paymentDetails.paymentMethod);
        const purchasePayload = {
          itemId,
          paymentMethod: paymentDetails.paymentMethod,
          currency: this.config.currency,
          region: this.config.region,
          billingDetails: paymentDetails.billingDetails
        };
        const response = await fetch(`${this.config.apiEndpoint}/store/purchase`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Region": this.config.region,
            "X-Currency": this.config.currency
          },
          body: JSON.stringify(purchasePayload)
        });
        const result = await response.json();
        if (response.ok && result.success) {
          this.trackPurchaseSuccess(result);
          this.updateItemOwnership(itemId);
          this.emit("purchase_completed", result);
          return result;
        } else {
          this.emit("purchase_failed", result);
          return { success: false, error: result.error || "Purchase failed" };
        }
      } catch (error) {
        this.log("Purchase error:", error);
        const errorResult = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        this.emit("purchase_failed", errorResult);
        return errorResult;
      }
    }
    /**
     * Get transparent pricing breakdown for a bundle
     */
    getBundlePricing(bundleId) {
      const bundle = this.getBundle(bundleId);
      if (!bundle) return null;
      const individualPrices = bundle.items.map((itemId) => {
        const item = this.getItem(itemId);
        return item ? {
          itemId,
          name: item.name,
          price: item.price
        } : null;
      }).filter(Boolean);
      return {
        bundlePrice: bundle.pricing.bundlePrice,
        individualPrices,
        totalIndividual: bundle.pricing.individualTotal,
        savings: bundle.pricing.savingsAmount,
        savingsPercent: bundle.pricing.savingsPercent
      };
    }
    /**
     * Get return window information for an item
     */
    getReturnInfo(itemId) {
      const item = this.getItem(itemId);
      if (!item) return null;
      const { availability } = item;
      let description;
      if (availability.permanent) {
        description = "This item is permanently available in the store.";
      } else if (availability.returnDate) {
        const returnDate = new Date(availability.returnDate * 1e3);
        description = `This item will return to the store on ${returnDate.toLocaleDateString()}.`;
      } else {
        description = `This item will return in ${availability.returnWindowDays} days.`;
      }
      return {
        permanent: availability.permanent,
        returnWindowDays: availability.returnWindowDays,
        returnDate: availability.returnDate ? new Date(availability.returnDate * 1e3) : void 0,
        description
      };
    }
    /**
     * Check if user meets unlock conditions for an item
     */
    checkUnlockConditions(itemId, userProfile) {
      const item = this.getItem(itemId);
      if (!item || !item.availability.unlockConditions) {
        return { unlocked: true, missingConditions: [] };
      }
      const missingConditions = [];
      item.availability.unlockConditions.forEach((condition) => {
        let conditionMet = false;
        switch (condition.type) {
          case "account_level":
            conditionMet = userProfile.accountLevel >= parseInt(condition.value);
            if (!conditionMet) {
              missingConditions.push(`Reach account level ${condition.value}`);
            }
            break;
          case "character_mastery":
            const [charId, level] = condition.value.split(":");
            const charLevel = userProfile.characters?.[charId]?.level || 0;
            conditionMet = charLevel >= parseInt(level);
            if (!conditionMet) {
              missingConditions.push(`Reach level ${level} with ${charId}`);
            }
            break;
          case "achievement":
            conditionMet = userProfile.achievements?.includes(condition.value);
            if (!conditionMet) {
              missingConditions.push(`Complete achievement: ${condition.value}`);
            }
            break;
          case "event_participation":
            conditionMet = userProfile.eventParticipation?.includes(condition.value);
            if (!conditionMet) {
              missingConditions.push(`Participate in event: ${condition.value}`);
            }
            break;
        }
      });
      return {
        unlocked: missingConditions.length === 0,
        missingConditions
      };
    }
    processCatalogData(catalogData) {
      if (catalogData.items) {
        catalogData.items.forEach((itemData) => {
          const item = {
            ...itemData,
            owned: false,
            // Will be updated based on user's owned items
            purchasable: this.isItemPurchasable(itemData)
          };
          this.catalog.set(item.id, item);
        });
      }
      if (catalogData.bundles) {
        catalogData.bundles.forEach((bundleData) => {
          const bundle = {
            ...bundleData,
            purchasable: this.isBundlePurchasable(bundleData)
          };
          this.bundles.set(bundle.id, bundle);
        });
      }
      if (catalogData.sections) {
        catalogData.sections.forEach((sectionData) => {
          const section = {
            ...sectionData,
            items: sectionData.items.map(
              (itemId) => this.catalog.get(itemId) || this.bundles.get(itemId)
            ).filter(Boolean)
          };
          this.sections.set(section.id, section);
        });
      }
    }
    isItemPurchasable(item) {
      const now = Date.now() / 1e3;
      if (!item.availability.permanent) {
        if (item.availability.endTime && now > item.availability.endTime) {
          return false;
        }
      }
      return true;
    }
    isBundlePurchasable(bundle) {
      const now = Date.now() / 1e3;
      return now >= bundle.availability.startTime && now <= bundle.availability.endTime;
    }
    isItemOnSale(item) {
      return "pricing" in item && item.pricing.savingsPercent > 0;
    }
    getReturnWindowDays(item) {
      if ("availability" in item && "returnWindowDays" in item.availability) {
        return item.availability.returnWindowDays;
      }
      if ("availability" in item && "returnDate" in item.availability && item.availability.returnDate) {
        const daysUntilReturn = Math.ceil((item.availability.returnDate * 1e3 - Date.now()) / (1e3 * 60 * 60 * 24));
        return Math.max(0, daysUntilReturn);
      }
      return 0;
    }
    validatePaymentMethod(method) {
      const availableMethods = this.getAvailablePaymentMethods();
      if (!availableMethods.includes(method)) {
        throw new Error(`Payment method ${method} not available in ${this.config.region}`);
      }
    }
    getAvailablePaymentMethods() {
      const allMethods = ["card", "paypal", "apple_pay", "google_pay"];
      return allMethods;
    }
    trackPurchaseSuccess(result) {
      if (!result.receipt) return;
      const isFirstPurchase = this.isFirstPurchase();
      this.config.retentionClient.trackPurchase({
        transactionId: result.transactionId,
        totalAmount: result.receipt.totalAmount,
        currency: result.receipt.currency,
        items: result.receipt.items.map((item) => ({
          itemId: item.itemId,
          itemType: this.getItemType(item.itemId),
          price: item.price,
          quantity: 1
        })),
        taxAmount: result.receipt.taxAmount,
        firstPurchase: isFirstPurchase
      });
    }
    updateItemOwnership(itemId) {
      const item = this.catalog.get(itemId);
      if (item) {
        item.owned = true;
        item.purchasable = false;
        this.catalog.set(itemId, item);
      }
      const bundle = this.bundles.get(itemId);
      if (bundle) {
        bundle.items.forEach((bundledItemId) => {
          const bundledItem = this.catalog.get(bundledItemId);
          if (bundledItem) {
            bundledItem.owned = true;
            bundledItem.purchasable = false;
            this.catalog.set(bundledItemId, bundledItem);
          }
        });
      }
    }
    isFirstPurchase() {
      return Array.from(this.catalog.values()).every((item) => !item.owned);
    }
    getItemType(itemId) {
      const item = this.catalog.get(itemId);
      if (item) return item.type;
      const bundle = this.bundles.get(itemId);
      if (bundle) return "bundle";
      return "skin";
    }
    setupEventListeners() {
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            this.endStoreImpression();
          }
        });
      }
      if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", () => {
          this.endStoreImpression();
        });
      }
    }
    log(message, ...args) {
      if (this.config.debugMode) {
        console.log(`[Storefront] ${message}`, ...args);
      }
    }
  };

  // src/core/monetization/MonetizationService.ts
  var MonetizationService = class {
    constructor(opts) {
      this.retention = new RetentionClient({
        apiEndpoint: opts?.retention?.apiEndpoint || "/api",
        userId: opts?.retention?.userId || "guest",
        apiKey: opts?.retention?.apiKey || "public",
        enableDebugLogging: false,
        batchSize: 5,
        flushIntervalMs: 15e3
      });
      this.storefront = new Storefront({
        retentionClient: this.retention,
        apiEndpoint: opts?.storefront?.apiEndpoint || "/data",
        currency: opts?.storefront?.currency || "USD",
        region: opts?.storefront?.region || "US",
        accessibilityMode: true,
        debugMode: false
      });
    }
    async initialize() {
      try {
        this.retention.startSession();
        await this.storefront.loadCatalog().catch(() => void 0);
      } catch {
      }
    }
  };

  // src/scripts/EntitlementBridge.ts
  var pc7 = __toESM(require_playcanvas_shim());
  var EntitlementBridge = class {
    constructor() {
      this.platformProviders = /* @__PURE__ */ new Map();
      this.updateInterval = null;
      this.isInitialized = false;
      this.entitlements = {
        ownedCharacters: [],
        platformSKUs: [],
        devUnlocks: [],
        qaFlags: {
          unlockAll: false,
          temporaryUnlocks: []
        },
        subscription: {
          active: false,
          tier: "free",
          benefits: []
        }
      };
      this.eventEmitter = new pc7.EventHandler();
    }
    /**
     * Initialize the entitlement system
     */
    async initialize() {
      console.log("EntitlementBridge: Initializing...");
      try {
        this.registerPlatformProviders();
        await this.loadLocalEntitlements();
        await this.queryPlatformEntitlements();
        this.setupPeriodicRefresh();
        this.isInitialized = true;
        console.log("EntitlementBridge: Initialized successfully");
        this.emitEntitlementsChanged();
      } catch (error) {
        console.error("EntitlementBridge: Failed to initialize:", error);
        throw error;
      }
    }
    /**
     * Register available platform providers
     */
    registerPlatformProviders() {
      this.platformProviders.set("steam", {
        name: "Steam",
        isAvailable: () => typeof window !== "undefined" && "steamworks" in window,
        getOwnedContent: async () => {
          return [];
        },
        hasSubscription: async () => false,
        validatePurchase: async (itemId) => false
      });
      this.platformProviders.set("playstation", {
        name: "PlayStation",
        isAvailable: () => typeof window !== "undefined" && "PlayStation" in window,
        getOwnedContent: async () => {
          return [];
        },
        hasSubscription: async () => false,
        validatePurchase: async (itemId) => false
      });
      this.platformProviders.set("xbox", {
        name: "Xbox",
        isAvailable: () => typeof window !== "undefined" && "Xbox" in window,
        getOwnedContent: async () => {
          return [];
        },
        hasSubscription: async () => false,
        validatePurchase: async (itemId) => false
      });
      this.platformProviders.set("web", {
        name: "Web",
        isAvailable: () => true,
        getOwnedContent: async () => {
          const stored = localStorage.getItem("owned_characters");
          return stored ? JSON.parse(stored) : [];
        },
        hasSubscription: async () => {
          const subscription = localStorage.getItem("subscription_active");
          return subscription === "true";
        },
        validatePurchase: async (itemId) => {
          return false;
        }
      });
      console.log(`EntitlementBridge: Registered ${this.platformProviders.size} platform providers`);
    }
    /**
     * Load local entitlements (dev/QA overrides)
     */
    async loadLocalEntitlements() {
      try {
        const isDev = true;
        if (isDev) {
          const devUnlocks = localStorage.getItem("dev_unlocks");
          if (devUnlocks) {
            this.entitlements.devUnlocks = JSON.parse(devUnlocks);
            console.log("EntitlementBridge: Loaded dev unlocks:", this.entitlements.devUnlocks);
          }
        }
        const qaFlags = localStorage.getItem("qa_flags");
        if (qaFlags) {
          const flags = JSON.parse(qaFlags);
          this.entitlements.qaFlags = { ...this.entitlements.qaFlags, ...flags };
          console.log("EntitlementBridge: Loaded QA flags:", this.entitlements.qaFlags);
        }
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("unlock_all") === "true") {
          this.entitlements.qaFlags.unlockAll = true;
          console.log("EntitlementBridge: URL override - unlock all characters");
        }
        if (urlParams.get("dev_mode") === "true") {
          this.entitlements.devUnlocks.push("all");
          console.log("EntitlementBridge: URL override - dev mode enabled");
        }
      } catch (error) {
        console.warn("EntitlementBridge: Failed to load local entitlements:", error);
      }
    }
    /**
     * Query platform entitlements from all available providers
     */
    async queryPlatformEntitlements() {
      const ownedContent = [];
      const platformSKUs = [];
      for (const [platformName, provider] of this.platformProviders) {
        try {
          if (provider.isAvailable()) {
            console.log(`EntitlementBridge: Querying ${platformName} entitlements...`);
            const content = await provider.getOwnedContent();
            ownedContent.push(...content);
            const hasSubscription = await provider.hasSubscription();
            if (hasSubscription) {
              this.entitlements.subscription = {
                active: true,
                tier: "premium",
                benefits: ["all_characters", "early_access", "exclusive_skins"]
              };
            }
            platformSKUs.push(platformName);
            console.log(`EntitlementBridge: ${platformName} - ${content.length} items, subscription: ${hasSubscription}`);
          }
        } catch (error) {
          console.warn(`EntitlementBridge: Failed to query ${platformName}:`, error);
        }
      }
      this.entitlements.ownedCharacters = [...new Set(ownedContent)];
      this.entitlements.platformSKUs = platformSKUs;
      console.log(`EntitlementBridge: Total owned characters: ${this.entitlements.ownedCharacters.length}`);
    }
    /**
     * Setup periodic refresh of entitlements
     */
    setupPeriodicRefresh() {
      this.updateInterval = window.setInterval(async () => {
        try {
          const oldEntitlements = JSON.stringify(this.entitlements);
          await this.queryPlatformEntitlements();
          const newEntitlements = JSON.stringify(this.entitlements);
          if (oldEntitlements !== newEntitlements) {
            console.log("EntitlementBridge: Entitlements updated");
            this.emitEntitlementsChanged();
          }
        } catch (error) {
          console.warn("EntitlementBridge: Periodic refresh failed:", error);
        }
      }, 5 * 60 * 1e3);
    }
    /**
     * Check if player has access to a specific character
     */
    hasCharacterAccess(characterId, mode = "casual") {
      if (!this.isInitialized) {
        console.warn("EntitlementBridge: Not initialized, denying access");
        return false;
      }
      if (this.entitlements.qaFlags.unlockAll) {
        return true;
      }
      if (this.entitlements.devUnlocks.includes("all") || this.entitlements.devUnlocks.includes(characterId)) {
        return true;
      }
      if (this.entitlements.qaFlags.temporaryUnlocks.includes(characterId)) {
        return true;
      }
      if (this.entitlements.subscription.active && this.entitlements.subscription.benefits.includes("all_characters")) {
        return true;
      }
      if (this.entitlements.ownedCharacters.includes(characterId)) {
        return true;
      }
      switch (mode) {
        case "training":
          return this.hasTrainingAccess(characterId);
        case "story":
          return this.hasStoryAccess(characterId);
        case "tournament":
          return this.entitlements.ownedCharacters.includes(characterId);
        default:
          return false;
      }
    }
    /**
     * Check training mode access (often more permissive)
     */
    hasTrainingAccess(characterId) {
      return true;
    }
    /**
     * Check story mode access (progression-based)
     */
    hasStoryAccess(characterId) {
      const storyProgress = localStorage.getItem("story_progress");
      if (storyProgress) {
        const progress = JSON.parse(storyProgress);
        return progress.unlockedCharacters?.includes(characterId) || false;
      }
      return characterId === "vanguard";
    }
    /**
     * Get all owned characters
     */
    getOwnedCharacters() {
      const owned = [
        ...this.entitlements.ownedCharacters,
        ...this.entitlements.devUnlocks.filter((unlock) => unlock !== "all"),
        ...this.entitlements.qaFlags.temporaryUnlocks
      ];
      if (this.entitlements.subscription.active && this.entitlements.subscription.benefits.includes("all_characters")) {
        owned.push("all_subscription_characters");
      }
      return [...new Set(owned)];
    }
    /**
     * Purchase a character (initiates platform purchase flow)
     */
    async purchaseCharacter(characterId, platform = "web") {
      const provider = this.platformProviders.get(platform);
      if (!provider) {
        throw new Error(`Platform '${platform}' not available`);
      }
      try {
        console.log(`EntitlementBridge: Initiating purchase of '${characterId}' on ${platform}`);
        const success = await provider.validatePurchase(characterId);
        if (success) {
          if (!this.entitlements.ownedCharacters.includes(characterId)) {
            this.entitlements.ownedCharacters.push(characterId);
            if (platform === "web") {
              localStorage.setItem("owned_characters", JSON.stringify(this.entitlements.ownedCharacters));
            }
            console.log(`EntitlementBridge: Successfully purchased '${characterId}'`);
            this.emitEntitlementsChanged();
          }
        }
        return success;
      } catch (error) {
        console.error(`EntitlementBridge: Purchase failed for '${characterId}':`, error);
        return false;
      }
    }
    /**
     * Grant temporary access (for events, trials, etc.)
     */
    grantTemporaryAccess(characterId, durationMs = 24 * 60 * 60 * 1e3) {
      if (!this.entitlements.qaFlags.temporaryUnlocks.includes(characterId)) {
        this.entitlements.qaFlags.temporaryUnlocks.push(characterId);
        setTimeout(() => {
          const index = this.entitlements.qaFlags.temporaryUnlocks.indexOf(characterId);
          if (index > -1) {
            this.entitlements.qaFlags.temporaryUnlocks.splice(index, 1);
            console.log(`EntitlementBridge: Temporary access expired for '${characterId}'`);
            this.emitEntitlementsChanged();
          }
        }, durationMs);
        console.log(`EntitlementBridge: Granted temporary access to '${characterId}' for ${durationMs}ms`);
        this.emitEntitlementsChanged();
      }
    }
    /**
     * Get subscription status
     */
    getSubscriptionStatus() {
      return { ...this.entitlements.subscription };
    }
    /**
     * Get entitlement summary for debugging
     */
    getEntitlementSummary() {
      return {
        ownedCharacters: this.entitlements.ownedCharacters.length,
        platformSKUs: this.entitlements.platformSKUs,
        devUnlocks: this.entitlements.devUnlocks,
        qaFlags: this.entitlements.qaFlags,
        subscription: this.entitlements.subscription,
        availablePlatforms: Array.from(this.platformProviders.keys()).filter(
          (name) => this.platformProviders.get(name).isAvailable()
        )
      };
    }
    /**
     * Force refresh entitlements
     */
    async refresh() {
      console.log("EntitlementBridge: Force refreshing entitlements...");
      await this.queryPlatformEntitlements();
      this.emitEntitlementsChanged();
    }
    /**
     * Subscribe to entitlement change events
     */
    on(event, callback) {
      this.eventEmitter.on(event, callback);
    }
    /**
     * Unsubscribe from entitlement change events
     */
    off(event, callback) {
      this.eventEmitter.off(event, callback);
    }
    /**
     * Emit entitlements changed event
     */
    emitEntitlementsChanged() {
      this.eventEmitter.fire("entitlements:changed", {
        ownedCharacters: this.getOwnedCharacters(),
        subscription: this.entitlements.subscription
      });
    }
    /**
     * Cleanup resources
     */
    destroy() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      this.eventEmitter.destroy();
      this.isInitialized = false;
      console.log("EntitlementBridge: Destroyed");
    }
  };

  // src/core/security/SecurityService.ts
  var SecurityService = class {
    constructor() {
      this.devtoolsDetected = false;
      this.integrityViolations = [];
    }
    start() {
      this.detectDevTools();
      this.detectTimingTamper();
      this.freezeCriticalObjects();
    }
    detectDevTools() {
      const threshold = 200;
      const check = () => {
        const start = performance.now();
        debugger;
        const elapsed = performance.now() - start;
        if (elapsed > threshold) {
          this.devtoolsDetected = true;
          console.warn("SecurityService: DevTools detected");
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    }
    detectTimingTamper() {
      let last = performance.now();
      setInterval(() => {
        const now = performance.now();
        if (now < last) {
          this.integrityViolations.push("clock_skew");
        }
        last = now;
      }, 1e3);
    }
    freezeCriticalObjects() {
      try {
        Object.freeze(Object);
        Object.freeze(Function);
      } catch {
      }
    }
    getStatus() {
      return { devtools: this.devtoolsDetected, violations: [...this.integrityViolations] };
    }
  };

  // src/core/GameEngine.ts
  var GameEngine = class {
    constructor(canvas) {
      this.postProcessingManager = null;
      this.debugOverlay = null;
      // private assetManager: any;
      this.isInitialized = false;
      this.updateHandler = null;
      this.app = new pc8.Application(canvas, {
        mouse: new pc8.Mouse(canvas),
        touch: new pc8.TouchDevice(canvas),
        keyboard: new pc8.Keyboard(window),
        gamepads: new pc8.GamePads()
      });
      this.setupApplication();
      this.initializeManagers();
      this.eventBus = new EventBus();
      this.services = new ServiceContainer();
      this.featureFlags = new FeatureFlags();
      this.pipeline = new UpdatePipeline();
      this.services.register("app", this.app);
      this.services.register("events", this.eventBus);
      this.services.register("flags", this.featureFlags);
      this.services.register("config", new (init_ConfigService(), __toCommonJS(ConfigService_exports)).ConfigService());
      this.preloader = new PreloadManager();
      this.aiManager = new AIManager(this.app);
      this.stageGen = new ProceduralStageGenerator();
      this.decompService = new DecompDataService();
      this.monetization = new MonetizationService();
      this.entitlement = new EntitlementBridge();
      this.security = new SecurityService();
      this.services.register("preloader", this.preloader);
      this.services.register("ai", this.aiManager);
      this.services.register("stageGen", this.stageGen);
      this.services.register("decomp", this.decompService);
      this.services.register("monetization", this.monetization);
      this.services.register("entitlement", this.entitlement);
      this.services.register("security", this.security);
      this.app._services = this.services;
      this.stateStack = new GameStateStack();
      this.eventBus.on("state:goto", async ({ state }) => {
        switch (state) {
          case "menu":
            await this.stateStack.replace(new MenuState(this.app, this.eventBus));
            break;
          case "match":
            await this.stateStack.replace(new MatchState(this.app, this.eventBus));
            break;
        }
      });
    }
    setupApplication() {
      this.app.setCanvasFillMode(pc8.FILLMODE_FILL_WINDOW);
      this.app.setCanvasResolution(pc8.RESOLUTION_AUTO);
      window.addEventListener("resize", () => this.app.resizeCanvas());
      Logger.info("PlayCanvas application initialized");
    }
    initializeManagers() {
      this.inputManager = new InputManager(this.app);
      this.characterManager = new CharacterManager(this.app);
      this.combatSystem = new CombatSystem(this.app);
      this.stageManager = new StageManager(this.app);
      this.uiManager = new UIManager(this.app);
      this.app._ui = this.uiManager;
      this.postProcessingManager = new PostProcessingManager_default(this.app);
      const inputUpdatable = { name: "input", priority: 10, update: (dt) => this.inputManager.update() };
      const characterUpdatable = { name: "characters", priority: 20, update: (dt) => this.characterManager.update(dt) };
      const combatUpdatable = { name: "combat", priority: 30, update: (dt) => this.combatSystem.update(dt) };
      const postFxUpdatable = { name: "postfx", priority: 90, update: (dt) => this.postProcessingManager?.update(dt) };
      const aiUpdatable = { name: "ai", priority: 25, update: (dt) => this.aiManager.update(dt) };
      this.pipeline.add(inputUpdatable);
      this.pipeline.add(characterUpdatable);
      this.pipeline.add(aiUpdatable);
      this.pipeline.add(combatUpdatable);
      this.pipeline.add(postFxUpdatable);
    }
    async initialize() {
      if (this.isInitialized) return;
      try {
        Logger.info("Initializing game systems...");
        await this.characterManager.initialize();
        await this.stageManager.initialize();
        await this.uiManager.initialize();
        if (this.postProcessingManager) {
          await this.postProcessingManager.initialize();
        }
        await this.preloader.loadManifest("/assets/manifest.json");
        this.combatSystem.initialize(this.characterManager, this.inputManager);
        this.isInitialized = true;
        this.app.start();
        await this.stateStack.push(new BootState(this.app, this.services, this.eventBus));
        this.updateHandler = (dt) => {
          this.pipeline.update(dt);
          this.stateStack.update(dt);
          if (!this.debugOverlay && typeof window !== "undefined") {
            try {
              const { DebugOverlay: DebugOverlay2 } = (init_DebugOverlay(), __toCommonJS(DebugOverlay_exports));
              this.debugOverlay = new DebugOverlay2();
            } catch {
            }
          }
          this.debugOverlay?.update();
          this.debugOverlay?.setTimings(this.pipeline.getTimings());
        };
        this.app.on("update", this.updateHandler);
        Logger.info("Game engine fully initialized");
      } catch (error) {
        Logger.error("Failed to initialize game engine:", error);
        throw error;
      }
    }
    getApp() {
      return this.app;
    }
    getCharacterManager() {
      return this.characterManager;
    }
    getCombatSystem() {
      return this.combatSystem;
    }
    destroy() {
      if (this.updateHandler) {
        this.app.off("update", this.updateHandler);
        this.updateHandler = null;
      }
      this.app.destroy();
      Logger.info("Game engine destroyed");
    }
  };

  // src/index.ts
  var pc9 = __toESM(require_playcanvas_shim());
  async function defaultStart(canvas) {
    const targetCanvas = canvas || createCanvas();
    const engine = new GameEngine(targetCanvas);
    Logger.info("Starting Street Fighter III: 3rd Strike - PlayCanvas Edition");
    await engine.initialize();
    const characterManager = engine.getCharacterManager();
    const ryu = characterManager.createCharacter("ryu", new pc9.Vec3(-2, 0, 0));
    const ken = characterManager.createCharacter("ken", new pc9.Vec3(2, 0, 0));
    if (ryu && ken) {
      characterManager.setActiveCharacters("ryu", "ken");
    }
  }
  function createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.id = "application-canvas";
    Object.assign(canvas.style, {
      width: "100vw",
      height: "100vh",
      display: "block",
      background: "#000",
      position: "fixed",
      inset: "0"
    });
    document.body.appendChild(canvas);
    return canvas;
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=bundle.js.map
