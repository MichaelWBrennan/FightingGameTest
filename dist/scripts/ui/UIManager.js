/**
 * UIManager - Fighting game UI and HUD management
 * Handles health bars, combo counters, and game state UI
 */
import * as pc from 'playcanvas';
class UIManager {
    constructor(app) {
        this.app = app;
        this.state = {
            initialized: false,
            uiElements: new Map(),
            healthBars: new Map(),
            meterBars: new Map(),
            comboDisplays: new Map(),
            debugOverlay: false,
            canvas: null,
            screen: null
        };
    }
    async initialize() {
        console.log('Initializing UI Manager...');
        this.createGameUI();
        this.setupEventListeners();
        this.state.initialized = true;
        console.log('UI Manager initialized successfully');
    }
    createGameUI() {
        // Create root screen for HUD (inspired by classic SF/KOF layouts)
        this.uiRoot = new pc.Entity('HUDScreen');
        this.uiRoot.addComponent('screen', {
            referenceResolution: new pc.Vec2(1920, 1080),
            scaleBlend: 0.5,
            scaleMode: pc.SCALEMODE_BLEND,
            screenSpace: true
        });
        this.app.root.addChild(this.uiRoot);
        // Health bars (top left/right)
        this.createHealthBar('player1', new pc.Vec4(0.03, 0.90, 0.47, 0.97), false);
        this.createHealthBar('player2', new pc.Vec4(0.53, 0.90, 0.97, 0.97), true);
        // Super/EX meters (bottom)
        this.createMeterBar('player1', new pc.Vec4(0.03, 0.05, 0.35, 0.085), false, 4);
        this.createMeterBar('player2', new pc.Vec4(0.65, 0.05, 0.97, 0.085), true, 4);
        // Round timer (center top)
        this.roundTimerText = new pc.Entity('RoundTimer');
        this.roundTimerText.addComponent('element', {
            type: 'text',
            text: '99',
            fontSize: 56,
            color: new pc.Color(1, 1, 1),
            alignment: new pc.Vec2(0.5, 0.5),
            anchor: new pc.Vec4(0.5, 0.90, 0.5, 0.97),
            pivot: new pc.Vec2(0.5, 0.5)
        });
        this.uiRoot.addChild(this.roundTimerText);
        // Round win pips
        this.roundPipsP1 = this.createRoundPips('p1Pips', new pc.Vec4(0.25, 0.865, 0.35, 0.89), false);
        this.roundPipsP2 = this.createRoundPips('p2Pips', new pc.Vec4(0.65, 0.865, 0.75, 0.89), true);
        // Announcer banner (center)
        this.announcerText = new pc.Entity('AnnouncerText');
        this.announcerText.addComponent('element', {
            type: 'text',
            text: '',
            fontSize: 72,
            color: new pc.Color(1, 1, 1),
            outlineColor: new pc.Color(0, 0, 0),
            outlineThickness: 0.4,
            alignment: new pc.Vec2(0.5, 0.5),
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5)
        });
        this.announcerText.enabled = false;
        this.uiRoot.addChild(this.announcerText);
        // Combo displays
        this.createComboDisplay('player1', new pc.Vec4(0.08, 0.70, 0.20, 0.80), new pc.Color(1, 0.9, 0.6));
        this.createComboDisplay('player2', new pc.Vec4(0.80, 0.70, 0.92, 0.80), new pc.Color(0.8, 0.9, 1));
        console.log('Game UI elements created');
    }
    createHealthBar(playerId, anchor, flip) {
        const container = new pc.Entity(`${playerId}_HealthBar`);
        container.addComponent('element', { type: 'group', anchor });
        const background = new pc.Entity('Background');
        background.addComponent('element', {
            type: 'image',
            color: new pc.Color(0.1, 0.1, 0.1, 0.8),
            anchor: new pc.Vec4(0, 0, 1, 1)
        });
        const fill = new pc.Entity('Fill');
        fill.addComponent('element', {
            type: 'image',
            color: new pc.Color(0.8, 0.2, 0.2, 1),
            anchor: flip ? new pc.Vec4(0, 0, 1, 1) : new pc.Vec4(0, 0, 1, 1)
        });
        // Start full
        fill.element.width = 1;
        container.addChild(background);
        container.addChild(fill);
        this.uiRoot.addChild(container);
        const hb = {
            entity: container,
            background,
            fill,
            maxHealth: 1000,
            currentHealth: 1000,
            animationSpeed: 400
        };
        this.state.healthBars.set(playerId, hb);
    }
    createMeterBar(playerId, anchor, flip, segments) {
        const container = new pc.Entity(`${playerId}_MeterBar`);
        container.addComponent('element', { type: 'group', anchor });
        const background = new pc.Entity('Background');
        background.addComponent('element', {
            type: 'image',
            color: new pc.Color(0.08, 0.08, 0.12, 0.9),
            anchor: new pc.Vec4(0, 0, 1, 1)
        });
        container.addChild(background);
        const segmentEntities = [];
        for (let i = 0; i < segments; i++) {
            const seg = new pc.Entity(`Seg_${i}`);
            const left = i / segments;
            const right = (i + 1) / segments;
            seg.addComponent('element', {
                type: 'image',
                color: new pc.Color(0.1, 0.4 + 0.1 * i, 0.9, 1),
                anchor: new pc.Vec4(left + 0.01, 0.1, right - 0.01, 0.9)
            });
            seg.enabled = false;
            container.addChild(seg);
            segmentEntities.push(seg);
        }
        this.uiRoot.addChild(container);
        const mb = {
            entity: container,
            background,
            fill: background, // unused placeholder to satisfy type, segments carry fill
            segments: segmentEntities,
            maxMeter: segments,
            currentMeter: 0,
            segmentCount: segments
        };
        this.state.meterBars.set(playerId, mb);
    }
    createRoundPips(name, anchor, flip) {
        const container = new pc.Entity(name);
        container.addComponent('element', { type: 'group', anchor });
        for (let i = 0; i < 3; i++) {
            const pip = new pc.Entity(`pip_${i}`);
            const w = 0.08;
            const spacing = 0.02;
            const left = (flip ? 1 - (i + 1) * (w + spacing) : i * (w + spacing));
            pip.addComponent('element', {
                type: 'image',
                color: new pc.Color(0.25, 0.25, 0.3, 0.9),
                anchor: new pc.Vec4(left, 0, left + w, 1)
            });
            container.addChild(pip);
        }
        this.uiRoot.addChild(container);
        return container;
    }
    createComboDisplay(playerId, anchor, color) {
        const container = new pc.Entity(`${playerId}_Combo`);
        container.addComponent('element', { type: 'group', anchor });
        const hitsText = new pc.Entity('Hits');
        hitsText.addComponent('element', {
            type: 'text',
            text: '',
            fontSize: 36,
            color,
            alignment: new pc.Vec2(0.5, 0.5),
            anchor: new pc.Vec4(0, 0, 1, 1)
        });
        container.addChild(hitsText);
        const damageText = new pc.Entity('Damage');
        damageText.addComponent('element', {
            type: 'text',
            text: '',
            fontSize: 18,
            color: new pc.Color(1, 1, 1),
            alignment: new pc.Vec2(0.5, 1.0),
            anchor: new pc.Vec4(0, -0.1, 1, 0.3)
        });
        container.addChild(damageText);
        container.enabled = false;
        this.uiRoot.addChild(container);
        const cd = {
            entity: container,
            hitsText,
            damageText,
            visible: false,
            fadeTimer: 0
        };
        this.state.comboDisplays.set(playerId, cd);
    }
    setupEventListeners() {
        // Listen for combat/system events to update UI
        this.app.on('combat:combo', this.onCombo.bind(this));
        this.app.on('combat:super', () => this.showAnnouncer('SUPER!'));
        this.app.on('combat:parry', () => this.showAnnouncer('PARRY!'));
        this.app.on('gamestate:changed', (_old, next) => {
            if (next === 'BATTLE') {
                this.sequenceRoundStart();
            }
        });
        // Optional direct UI update hooks other systems can emit
        this.app.on('ui:health', (playerId, current, max) => this.setHealth(playerId, current, max));
        this.app.on('ui:meter', (playerId, segmentsFilled) => this.setMeter(playerId, segmentsFilled));
        this.app.on('ui:timer', (seconds) => this.setTimer(seconds));
        this.app.on('ui:roundwins', (playerId, wins) => this.setRoundWins(playerId, wins));
    }
    onCombo(data) {
        // Expect: { playerId: 'player1'|'player2', hits: number, damage?: number }
        const playerId = (data && data.playerId) || 'player1';
        const display = this.state.comboDisplays.get(playerId);
        if (!display)
            return;
        const hits = Math.max(1, Number(data?.hits || 1));
        const dmg = Number(data?.damage || 0);
        if (display.hitsText.element)
            display.hitsText.element.text = `${hits} HIT${hits > 1 ? 'S' : ''}!`;
        if (display.damageText.element)
            display.damageText.element.text = dmg > 0 ? `${Math.round(dmg)} dmg` : '';
        display.entity.enabled = true;
        display.visible = true;
        display.fadeTimer = 1.2; // seconds visible after last hit
    }
    sequenceRoundStart() {
        this.showAnnouncer('ROUND 1');
        setTimeout(() => this.showAnnouncer('FIGHT!'), 900);
        setTimeout(() => this.hideAnnouncer(), 1800);
    }
    showAnnouncer(text) {
        if (!this.announcerText.element)
            return;
        this.announcerText.element.text = text;
        this.announcerText.enabled = true;
    }
    hideAnnouncer() {
        this.announcerText.enabled = false;
    }
    setHealth(playerId, current, max) {
        const hb = this.state.healthBars.get(playerId);
        if (!hb)
            return;
        if (typeof max === 'number' && max > 0)
            hb.maxHealth = max;
        hb.currentHealth = Math.max(0, Math.min(current, hb.maxHealth));
        // Instant visual for now; could lerp in update
        const ratio = hb.maxHealth > 0 ? hb.currentHealth / hb.maxHealth : 0;
        if (hb.fill.element) {
            const anchor = hb.fill.element.anchor;
            hb.fill.element.anchor = new pc.Vec4(anchor.x, anchor.y, Math.max(0.001, ratio), anchor.w);
        }
    }
    setMeter(playerId, segmentsFilled) {
        const mb = this.state.meterBars.get(playerId);
        if (!mb)
            return;
        mb.currentMeter = Math.max(0, Math.min(segmentsFilled, mb.segmentCount));
        mb.segments.forEach((seg, i) => {
            seg.enabled = i < mb.currentMeter;
        });
    }
    setTimer(seconds) {
        if (this.roundTimerText.element) {
            this.roundTimerText.element.text = String(Math.max(0, Math.floor(seconds)));
        }
    }
    setRoundWins(playerId, wins) {
        const container = playerId === 'player1' ? this.roundPipsP1 : this.roundPipsP2;
        const count = Math.max(0, Math.min(2, Math.floor(wins)));
        container.children.forEach((pip, idx) => {
            if (pip.element) {
                pip.element.color = idx < count ? new pc.Color(1, 0.85, 0.2, 1) : new pc.Color(0.25, 0.25, 0.3, 0.9);
            }
        });
    }
    update(dt) {
        if (!this.state.initialized)
            return;
        // Handle combo display fade-out timing
        this.state.comboDisplays.forEach(display => {
            if (!display.visible)
                return;
            display.fadeTimer -= dt;
            if (display.fadeTimer <= 0) {
                display.entity.enabled = false;
                display.visible = false;
            }
        });
    }
    destroy() {
        // Clean up UI elements
        this.state.uiElements.clear();
        this.state.healthBars.clear();
        this.state.meterBars.clear();
        this.state.comboDisplays.clear();
        if (this.uiRoot && this.uiRoot.parent)
            this.uiRoot.destroy();
        console.log('UIManager destroyed');
    }
}
export default UIManager;
//# sourceMappingURL=UIManager.js.map