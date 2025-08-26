
/**
 * Game UI System - TypeScript Implementation
 * Converted from HTML to TypeScript DOM manipulation
 */

export interface UIConfig {
  healthBarWidth: number;
  healthBarHeight: number;
  timerFontSize: number;
  comboTextSize: number;
  playerColors: {
    p1: string;
    p2: string;
  };
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  meter: number;
  maxMeter: number;
  combo: number;
  damage: number;
  name: string;
}

export interface MatchState {
  timeRemaining: number;
  round: number;
  maxRounds: number;
  p1Score: number;
  p2Score: number;
}

export class GameUIManager {
  private container: HTMLElement;
  private config: UIConfig;
  private elements: {
    healthBars: {
      p1: HTMLElement;
      p2: HTMLElement;
    };
    meterBars: {
      p1: HTMLElement;
      p2: HTMLElement;
    };
    timer: HTMLElement;
    comboDisplay: HTMLElement;
    roundDisplay: HTMLElement;
    damageDisplay: {
      p1: HTMLElement;
      p2: HTMLElement;
    };
  };

  constructor(containerId: string, config: UIConfig) {
    this.container = document.getElementById(containerId) || document.body;
    this.config = config;
    this.elements = this.createUIElements();
    this.setupStyles();
  }

  private createUIElements(): any {
    // Create main game UI container
    const gameUI = document.createElement('div');
    gameUI.id = 'game-ui';
    gameUI.className = 'game-ui-container';

    // Create top bar for timer and round info
    const topBar = document.createElement('div');
    topBar.className = 'top-bar';

    const timer = document.createElement('div');
    timer.id = 'game-timer';
    timer.className = 'timer';
    timer.textContent = '99';

    const roundDisplay = document.createElement('div');
    roundDisplay.id = 'round-display';
    roundDisplay.className = 'round-display';
    roundDisplay.textContent = 'ROUND 1';

    topBar.appendChild(timer);
    topBar.appendChild(roundDisplay);

    // Create health bar container
    const healthContainer = document.createElement('div');
    healthContainer.className = 'health-container';

    // Player 1 health bar
    const p1HealthWrapper = document.createElement('div');
    p1HealthWrapper.className = 'health-wrapper p1-health';

    const p1HealthBar = document.createElement('div');
    p1HealthBar.id = 'p1-health';
    p1HealthBar.className = 'health-bar';

    const p1HealthFill = document.createElement('div');
    p1HealthFill.className = 'health-fill';

    const p1Name = document.createElement('div');
    p1Name.className = 'player-name';
    p1Name.textContent = 'PLAYER 1';

    p1HealthBar.appendChild(p1HealthFill);
    p1HealthWrapper.appendChild(p1Name);
    p1HealthWrapper.appendChild(p1HealthBar);

    // Player 2 health bar
    const p2HealthWrapper = document.createElement('div');
    p2HealthWrapper.className = 'health-wrapper p2-health';

    const p2HealthBar = document.createElement('div');
    p2HealthBar.id = 'p2-health';
    p2HealthBar.className = 'health-bar';

    const p2HealthFill = document.createElement('div');
    p2HealthFill.className = 'health-fill';

    const p2Name = document.createElement('div');
    p2Name.className = 'player-name';
    p2Name.textContent = 'PLAYER 2';

    p2HealthBar.appendChild(p2HealthFill);
    p2HealthWrapper.appendChild(p2Name);
    p2HealthWrapper.appendChild(p2HealthBar);

    healthContainer.appendChild(p1HealthWrapper);
    healthContainer.appendChild(p2HealthWrapper);

    // Create meter bars
    const meterContainer = document.createElement('div');
    meterContainer.className = 'meter-container';

    const p1MeterBar = document.createElement('div');
    p1MeterBar.id = 'p1-meter';
    p1MeterBar.className = 'meter-bar p1-meter';

    const p1MeterFill = document.createElement('div');
    p1MeterFill.className = 'meter-fill';
    p1MeterBar.appendChild(p1MeterFill);

    const p2MeterBar = document.createElement('div');
    p2MeterBar.id = 'p2-meter';
    p2MeterBar.className = 'meter-bar p2-meter';

    const p2MeterFill = document.createElement('div');
    p2MeterFill.className = 'meter-fill';
    p2MeterBar.appendChild(p2MeterFill);

    meterContainer.appendChild(p1MeterBar);
    meterContainer.appendChild(p2MeterBar);

    // Create combo display
    const comboDisplay = document.createElement('div');
    comboDisplay.id = 'combo-display';
    comboDisplay.className = 'combo-display';

    // Create damage display
    const damageContainer = document.createElement('div');
    damageContainer.className = 'damage-container';

    const p1DamageDisplay = document.createElement('div');
    p1DamageDisplay.id = 'p1-damage';
    p1DamageDisplay.className = 'damage-display p1-damage';

    const p2DamageDisplay = document.createElement('div');
    p2DamageDisplay.id = 'p2-damage';
    p2DamageDisplay.className = 'damage-display p2-damage';

    damageContainer.appendChild(p1DamageDisplay);
    damageContainer.appendChild(p2DamageDisplay);

    // Assemble UI
    gameUI.appendChild(topBar);
    gameUI.appendChild(healthContainer);
    gameUI.appendChild(meterContainer);
    gameUI.appendChild(comboDisplay);
    gameUI.appendChild(damageContainer);

    this.container.appendChild(gameUI);

    return {
      healthBars: {
        p1: p1HealthFill,
        p2: p2HealthFill
      },
      meterBars: {
        p1: p1MeterFill,
        p2: p2MeterFill
      },
      timer,
      comboDisplay,
      roundDisplay,
      damageDisplay: {
        p1: p1DamageDisplay,
        p2: p2DamageDisplay
      }
    };
  }

  private setupStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .game-ui-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        font-family: 'Arial Black', Arial, sans-serif;
        z-index: 1000;
      }

      .top-bar {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        padding: 20px;
      }

      .timer {
        font-size: ${this.config.timerFontSize}px;
        font-weight: bold;
        color: white;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        background: linear-gradient(45deg, #ff6b6b, #feca57);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .round-display {
        position: absolute;
        right: 20px;
        font-size: 18px;
        color: white;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      }

      .health-container {
        display: flex;
        justify-content: space-between;
        padding: 0 40px;
        margin-top: 10px;
      }

      .health-wrapper {
        width: 40%;
      }

      .player-name {
        font-size: 16px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 5px;
        color: white;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      }

      .health-bar {
        width: 100%;
        height: ${this.config.healthBarHeight}px;
        background: linear-gradient(to bottom, #333, #111);
        border: 3px solid #666;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
      }

      .health-fill {
        height: 100%;
        width: 100%;
        background: linear-gradient(to right, #ff4757, #ffa502, #26de81);
        transition: width 0.3s ease-out;
        box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);
      }

      .p1-health .health-fill {
        transform-origin: left;
      }

      .p2-health .health-fill {
        transform-origin: right;
      }

      .meter-container {
        display: flex;
        justify-content: space-between;
        padding: 0 40px;
        margin-top: 10px;
      }

      .meter-bar {
        width: 20%;
        height: 15px;
        background: linear-gradient(to bottom, #222, #000);
        border: 2px solid #444;
        border-radius: 5px;
        overflow: hidden;
      }

      .meter-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(to right, #3742fa, #70a1ff);
        transition: width 0.2s ease-out;
        box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3);
      }

      .combo-display {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: ${this.config.comboTextSize}px;
        font-weight: bold;
        color: #feca57;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        opacity: 0;
        transition: opacity 0.3s ease-out;
        pointer-events: none;
      }

      .combo-display.active {
        opacity: 1;
      }

      .damage-container {
        position: absolute;
        top: 30%;
        width: 100%;
        display: flex;
        justify-content: space-between;
        padding: 0 100px;
      }

      .damage-display {
        font-size: 24px;
        font-weight: bold;
        color: #ff4757;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease-out;
      }

      .damage-display.active {
        opacity: 1;
        transform: translateY(0);
      }

      .p1-damage {
        text-align: left;
      }

      .p2-damage {
        text-align: right;
      }
    `;

    document.head.appendChild(style);
  }

  public updatePlayerState(player: 'p1' | 'p2', state: PlayerState): void {
    const healthBar = this.elements.healthBars[player];
    const meterBar = this.elements.meterBars[player];
    const damageDisplay = this.elements.damageDisplay[player];

    // Update health bar
    const healthPercent = (state.health / state.maxHealth) * 100;
    healthBar.style.width = `${Math.max(0, healthPercent)}%`;

    // Update meter bar
    const meterPercent = (state.meter / state.maxMeter) * 100;
    meterBar.style.width = `${Math.max(0, meterPercent)}%`;

    // Show damage if any
    if (state.damage > 0) {
      this.showDamage(player, state.damage);
    }

    // Update combo display
    if (state.combo > 1) {
      this.showCombo(state.combo);
    }
  }

  public updateMatchState(state: MatchState): void {
    // Update timer
    this.elements.timer.textContent = Math.ceil(state.timeRemaining).toString();

    // Update round display
    this.elements.roundDisplay.textContent = `ROUND ${state.round}`;

    // Timer color changes based on remaining time
    if (state.timeRemaining <= 10) {
      this.elements.timer.style.color = '#ff4757';
    } else if (state.timeRemaining <= 30) {
      this.elements.timer.style.color = '#ffa502';
    } else {
      this.elements.timer.style.color = 'white';
    }
  }

  private showDamage(player: 'p1' | 'p2', damage: number): void {
    const damageDisplay = this.elements.damageDisplay[player];
    damageDisplay.textContent = `-${damage}`;
    damageDisplay.classList.add('active');

    setTimeout(() => {
      damageDisplay.classList.remove('active');
    }, 2000);
  }

  private showCombo(comboCount: number): void {
    this.elements.comboDisplay.textContent = `${comboCount} HIT COMBO!`;
    this.elements.comboDisplay.classList.add('active');

    setTimeout(() => {
      this.elements.comboDisplay.classList.remove('active');
    }, 1500);
  }

  public showRoundStart(roundNumber: number): void {
    const roundStartElement = document.createElement('div');
    roundStartElement.className = 'round-start-display';
    roundStartElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      font-weight: bold;
      color: white;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
      z-index: 2000;
      pointer-events: none;
    `;
    roundStartElement.textContent = `ROUND ${roundNumber}`;

    this.container.appendChild(roundStartElement);

    setTimeout(() => {
      roundStartElement.textContent = 'FIGHT!';
    }, 1000);

    setTimeout(() => {
      this.container.removeChild(roundStartElement);
    }, 2500);
  }

  public showKO(winner: 'p1' | 'p2'): void {
    const koElement = document.createElement('div');
    koElement.className = 'ko-display';
    koElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 72px;
      font-weight: bold;
      color: #ff4757;
      text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
      z-index: 2000;
      pointer-events: none;
      animation: koAnimation 2s ease-out;
    `;
    koElement.textContent = 'K.O.';

    // Add KO animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes koAnimation {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 0;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    this.container.appendChild(koElement);

    setTimeout(() => {
      koElement.textContent = `PLAYER ${winner.toUpperCase()} WINS!`;
    }, 1500);

    setTimeout(() => {
      this.container.removeChild(koElement);
      document.head.removeChild(style);
    }, 4000);
  }

  public destroy(): void {
    const gameUI = document.getElementById('game-ui');
    if (gameUI && gameUI.parentNode) {
      gameUI.parentNode.removeChild(gameUI);
    }
  }
}

export const defaultUIConfig: UIConfig = {
  healthBarWidth: 300,
  healthBarHeight: 25,
  timerFontSize: 36,
  comboTextSize: 28,
  playerColors: {
    p1: '#3742fa',
    p2: '#ff4757'
  }
};
