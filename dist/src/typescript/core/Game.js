import { InputManager } from './InputManager';
import { GraphicsManager } from '../graphics/GraphicsManager';
import { SoundManager } from '../sound/SoundManager';
import { EffectManager } from '../effects/EffectManager';
import { PlayerManager } from '../player/PlayerManager';
export class GameManager {
    constructor() {
        Object.defineProperty(this, "gameState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                gNo: [0, 0, 0, 0],
                eNo: [0, 0, 0, 0],
                dNo: [0, 0, 0, 0],
                scNo: [0, 0, 0, 0],
                gameTimer: 0,
                gamePause: 0,
                playGame: 0,
                requestGNo: false,
                requestENo: false,
                allowBattleFlag: false,
                demoFlag: false,
                controlTime: 481,
                timeInTime: 60,
                roundNum: 0,
                modeType: 0,
                playMode: 0,
                processCounter: 1,
                turbo: false,
                turboTimer: 0,
                noTrans: false,
                systemTimer: 0,
                coverTimer: 0
            }
        });
        Object.defineProperty(this, "inputManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "graphicsManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "soundManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "effectManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playerManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.inputManager = new InputManager();
        this.graphicsManager = new GraphicsManager();
        this.soundManager = new SoundManager();
        this.effectManager = new EffectManager();
        this.playerManager = new PlayerManager();
    }
    gameTask() {
        const mainJumpTable = [
            this.waitAutoLoad.bind(this),
            this.loopDemo.bind(this),
            this.game.bind(this)
        ];
        this.initColorTransReq();
        let frameCount = this.gameState.processCounter;
        if (this.gameState.modeType === 7 && !this.gameState.turbo) {
            frameCount = this.getSysFF();
        }
        for (let i = 0; i < frameCount; i++) {
            if (i === frameCount - 1) {
                this.gameState.noTrans = false;
                if (this.gameState.turbo && this.gameState.processCounter > 1 && this.gameState.turboTimer !== 5) {
                    this.gameState.playGame = 0;
                    break;
                }
            }
            else {
                this.gameState.noTrans = true;
            }
            this.gameState.playGame = 0;
            if (this.gameState.gamePause !== 0x81) {
                this.gameState.systemTimer++;
            }
            this.initTexcashBeforeProcess();
            this.seqsBeforeProcess();
            if (!this.nowSoftReset()) {
                mainJumpTable[this.gameState.gNo[0]]();
            }
            this.seqsAfterProcess();
            this.texturecashUpdate();
            this.movePulpulWork();
            this.checkOffVib();
            this.checkLDREQQueue();
        }
        this.checkScreen();
        this.checkPosBG();
        this.dispSoundCode();
    }
    game() {
        const gameJumpTable = [
            this.game00.bind(this), this.game01.bind(this), this.game02.bind(this),
            this.game03.bind(this), this.game04.bind(this), this.game05.bind(this),
            this.game06.bind(this), this.game07.bind(this), this.game08.bind(this),
            this.game09.bind(this), this.game10.bind(this), this.game11.bind(this),
            this.game12.bind(this)
        ];
        if (this.gameState.gNo[1] === 2 || this.gameState.gNo[1] === 9) {
            this.gameState.playGame = 1;
        }
        else if (this.gameState.gNo[1] === 8) {
            this.gameState.playGame = 2;
        }
        gameJumpTable[this.gameState.gNo[1]]();
    }
    game00() {
        const game00JumpTable = [
            this.game0_0.bind(this),
            this.game0_1.bind(this),
            this.game0_2.bind(this)
        ];
        game00JumpTable[this.gameState.gNo[2]]();
        this.graphicsManager.setBackColor(0, 0, 0);
        this.graphicsManager.bgDrawSystem();
        this.basicSub();
        this.checkBackDemo();
    }
    game0_0() {
        if (this.titleAtADash()) {
            this.gameState.gNo[2]++;
        }
    }
    game0_1() {
        this.dispCopyright();
        this.titleMove(1);
        if (this.gameState.requestGNo) {
            this.gameState.gNo[2]++;
        }
    }
    game0_2() {
        switch (this.gameState.gNo[3]) {
            case 0:
                this.dispCopyright();
                this.titleMove(1);
                this.gameState.gNo[3]++;
                this.switchScreenInit(1);
                break;
            case 1:
                if (this.switchScreen(1)) {
                    this.gameState.gNo[3]++;
                    this.gameState.coverTimer = 23;
                    return;
                }
                this.titleMove(1);
                this.dispCopyright();
                break;
            case 2:
                this.fadeOut(1, 0xFF, 8);
                this.gameState.gNo[3]++;
                break;
            case 3:
                this.fadeOut(1, 0xFF, 8);
                this.gameState.gNo[3]++;
                this.texRelease(601);
                this.setTitleTexFlag(false);
                break;
            case 4:
                this.fadeOut(1, 0xFF, 8);
                this.gameState.gNo[3]++;
                this.purgeMmtmArea(2);
                this.makeTexcashOfList(2);
                break;
            case 5:
                this.fadeOut(1, 0xFF, 8);
                this.soundManager.bgmRequest(65);
                this.gameState.gNo[1] = 0xC;
                this.gameState.gNo[2] = 0;
                this.gameState.gNo[3] = 0;
                this.readyMenuTask();
                break;
        }
    }
    game01() {
        this.graphicsManager.bgDrawSystem();
        this.basicSub();
        this.setupPlayType();
        switch (this.gameState.gNo[2]) {
            case 0:
                this.switchScreen(1);
                this.gameState.gNo[2]++;
                this.initSelectNoValues();
                this.soundManager.bgmHalfVolume(0);
                if (this.gameState.modeType === 0) {
                    this.soundManager.bgmRequest(53);
                }
                else {
                    this.soundManager.bgmRequest(66);
                }
                this.initGameSettings();
                break;
            case 1:
                this.switchScreen(1);
                this.gameState.gNo[2]++;
                break;
            case 2:
                if (this.selectPlayer()) {
                    this.gameState.gNo[2]++;
                    this.setBonusGameFlag(false);
                    this.switchScreenInit(0);
                }
                break;
            default:
                this.selectPlayer();
                if (this.switchScreen(0)) {
                    this.game01Sub();
                    this.gameState.coverTimer = 5;
                    this.setAppearType(1);
                    this.setHitmarkColor();
                    this.handleDebugCharacters();
                    this.purgeTexcashOfList(3);
                    this.makeTexcashOfList(3);
                    this.handleDemoTransition();
                }
                break;
        }
        this.graphicsManager.bgMove();
    }
    game02() {
        const game02JumpTable = [
            this.game2_0.bind(this), this.game2_1.bind(this), this.game2_2.bind(this),
            this.game2_3.bind(this), this.game2_4.bind(this), this.game2_5.bind(this),
            this.game2_6.bind(this), this.game2_7.bind(this)
        ];
        this.setSceneCut();
        game02JumpTable[this.gameState.gNo[2]]();
        this.graphicsManager.bgMoveEx(3);
    }
    // Placeholder methods for the extensive functionality
    waitAutoLoad() {
        this.basicSub();
        this.graphicsManager.bgDrawSystem();
        this.graphicsManager.bgPosHoseiSub2(0);
        this.graphicsManager.bgFamilySetAppoint(0);
        this.graphicsManager.bgMoveEx(0);
    }
    loopDemo() {
        if (this.checkCoin()) {
            this.nextTitleSub();
            return;
        }
        switch (this.gameState.gNo[1]) {
            case 0:
                this.initDemoState();
                break;
            case 1:
                this.basicSub();
                if (this.capcomLogo()) {
                    this.loopDemoSub();
                    this.setInsertY(23);
                    this.gameState.eNo[1] = 2;
                    this.setETimer(1);
                    return;
                }
                break;
            case 2:
                this.basicSub();
                if (this.title()) {
                    this.loopDemoSub();
                    this.setInsertY(17);
                    this.gameState.dNo[0] = 1;
                    return;
                }
                break;
            // Add more demo loop cases...
        }
    }
    // Game state methods
    game2_0() { }
    game2_1() { }
    game2_2() { }
    game2_3() { }
    game2_4() { }
    game2_5() { }
    game2_6() { }
    game2_7() { }
    game03() { }
    game04() { }
    game05() { }
    game06() { }
    game07() { }
    game08() { }
    game09() { }
    game10() { }
    game11() { }
    game12() { }
    // Helper methods
    initColorTransReq() { }
    getSysFF() { return 1; }
    initTexcashBeforeProcess() { }
    seqsBeforeProcess() { }
    nowSoftReset() { return false; }
    seqsAfterProcess() { }
    textureHashUpdate() { }
    movePulpulWork() { }
    checkOffVib() { }
    checkLDREQQueue() { }
    checkScreen() { }
    checkPosBG() { }
    dispSoundCode() { }
    titleAtADash() { return false; }
    dispCopyright() { }
    titleMove(param) { }
    switchScreenInit(param) { }
    switchScreen(param) { return false; }
    fadeOut(param1, param2, param3) { }
    texRelease(id) { }
    setTitleTexFlag(flag) { }
    purgeMmtmArea(area) { }
    makeTexcashOfList(list) { }
    readyMenuTask() { }
    basicSub() { }
    setupPlayType() { }
    initSelectNoValues() { }
    initGameSettings() { }
    selectPlayer() { return false; }
    setBonusGameFlag(flag) { }
    game01Sub() { }
    setAppearType(type) { }
    setHitmarkColor() { }
    handleDebugCharacters() { }
    purgeTexcashOfList(list) { }
    handleDemoTransition() { }
    setSceneCut() { }
    checkCoin() { return false; }
    nextTitleSub() { }
    initDemoState() { }
    capcomLogo() { return false; }
    loopDemoSub() { }
    setInsertY(y) { }
    setETimer(timer) { }
    title() { return false; }
    // Public getters/setters for game state
    getGameState() {
        return this.gameState;
    }
    setGameMode(mode) {
        this.gameState.modeType = mode;
    }
}
//# sourceMappingURL=Game.js.map