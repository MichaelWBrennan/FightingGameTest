var SF3App = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    defaultStart: () => defaultStart
  });

  // src/core/GameEngine.ts
  var pc4 = __toESM(require_playcanvas_shim());

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

  // src/core/characters/CharacterManager.ts
  var CharacterManager = class {
    constructor(app) {
      this.characters = /* @__PURE__ */ new Map();
      this.characterConfigs = /* @__PURE__ */ new Map();
      this.activeCharacters = [];
      this.app = app;
    }
    async initialize() {
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
            const normalized = this.normalizeCharacterConfig(db[key]);
            this.characterConfigs.set(key, normalized);
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
          const config = this.normalizeCharacterConfig(rawConfig);
          this.characterConfigs.set(name, config);
          Logger.info(`Loaded character config: ${name}`);
        } catch (error) {
          Logger.error(`Failed to load character ${name}:`, error);
        }
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
  var UIManager = class {
    constructor(app) {
      this.app = app;
    }
    async initialize() {
    }
  };

  // src/core/GameEngine.ts
  var GameEngine = class {
    constructor(canvas) {
      // private assetManager: any;
      this.isInitialized = false;
      this.updateHandler = null;
      this.app = new pc4.Application(canvas, {
        mouse: new pc4.Mouse(canvas),
        touch: new pc4.TouchDevice(canvas),
        keyboard: new pc4.Keyboard(window),
        gamepads: new pc4.GamePads()
      });
      this.setupApplication();
      this.initializeManagers();
    }
    setupApplication() {
      this.app.setCanvasFillMode(pc4.FILLMODE_FILL_WINDOW);
      this.app.setCanvasResolution(pc4.RESOLUTION_AUTO);
      window.addEventListener("resize", () => this.app.resizeCanvas());
      Logger.info("PlayCanvas application initialized");
    }
    initializeManagers() {
      this.inputManager = new InputManager(this.app);
      this.characterManager = new CharacterManager(this.app);
      this.combatSystem = new CombatSystem(this.app);
      this.stageManager = new StageManager(this.app);
      this.uiManager = new UIManager(this.app);
    }
    async initialize() {
      if (this.isInitialized) return;
      try {
        Logger.info("Initializing game systems...");
        await this.characterManager.initialize();
        await this.stageManager.initialize();
        await this.uiManager.initialize();
        this.combatSystem.initialize(this.characterManager, this.inputManager);
        this.isInitialized = true;
        this.app.start();
        this.updateHandler = (dt) => {
          this.inputManager.update();
          this.characterManager.update(dt);
          this.combatSystem.update(dt);
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
  var pc5 = __toESM(require_playcanvas_shim());
  async function defaultStart(canvas) {
    const targetCanvas = canvas || document.getElementById("application-canvas");
    const engine = new GameEngine(targetCanvas);
    Logger.info("Starting Street Fighter III: 3rd Strike - PlayCanvas Edition");
    await engine.initialize();
    const characterManager = engine.getCharacterManager();
    const ryu = characterManager.createCharacter("ryu", new pc5.Vec3(-2, 0, 0));
    const ken = characterManager.createCharacter("ken", new pc5.Vec3(2, 0, 0));
    if (ryu && ken) {
      characterManager.setActiveCharacters("ryu", "ken");
    }
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=bundle.js.map
