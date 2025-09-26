import * as pc from 'playcanvas';
import { GameMode } from '../modes/GameModeManager';

export interface ModeSelectorData {
  availableModes: GameMode[];
  playerLevel: number;
  unlockedCharacters: string[];
  canSelectStage: boolean;
  savedStagesCount: number;
}

export class ModeSelector {
  private app: pc.Application;
  private container: pc.Entity | null = null;
  private isVisible = false;
  private selectorData: ModeSelectorData | null = null;
  private selectedModeId: string | null = null;

  constructor(app: pc.Application) {
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.app.on('ui:show_mode_selector', this.show.bind(this));
    this.app.on('ui:hide_mode_selector', this.hide.bind(this));
    this.app.on('mode:selected', this.onModeSelected.bind(this));
  }

  public show(event: any): void {
    this.selectorData = event.data;
    this.isVisible = true;
    this.createUI();
  }

  public hide(): void {
    this.isVisible = false;
    this.destroyUI();
  }

  private createUI(): void {
    if (!this.selectorData) return;

    // Create main container
    this.container = new pc.Entity('ModeSelector');
    this.container.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0, 0, 0, 0],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0]
    });

    // Create background overlay
    const background = new pc.Entity('Background');
    background.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 0, 0],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0, 0, 0, 0.8)
    });
    this.container.addChild(background);

    // Create main panel
    const panel = new pc.Entity('Panel');
    panel.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-500, -400, 500, 400],
      color: new pc.Color(0.1, 0.1, 0.1, 0.95)
    });
    this.container.addChild(panel);

    // Create title
    const title = new pc.Entity('Title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-450, 350, 450, 400],
      text: 'Select Game Mode',
      fontSize: 32,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    this.container.addChild(title);

    // Create mode categories
    this.createModeCategories();

    // Create close button
    const closeButton = this.createCloseButton();
    this.container.addChild(closeButton);

    // Add to scene
    this.app.root.addChild(this.container);
  }

  private createModeCategories(): void {
    if (!this.selectorData) return;

    // Create a unified grid layout for all modes
    const modes = this.selectorData.availableModes;
    const itemsPerRow = 4;
    const buttonWidth = 180;
    const buttonHeight = 80;
    const spacing = 15;
    const startY = 250;
    const startX = -((itemsPerRow - 1) * (buttonWidth + spacing)) / 2;

    modes.forEach((mode, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      
      const x = startX + col * (buttonWidth + spacing);
      const y = startY - row * (buttonHeight + spacing);

      const modeButton = this.createModeButton(mode, x, y, buttonWidth, buttonHeight);
      this.container!.addChild(modeButton);
    });
  }

  private createModeButton(mode: GameMode, x: number, y: number, width: number, height: number): pc.Entity {
    const button = new pc.Entity(`ModeButton_${mode.id}`);
    button.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [x - width/2, y - height/2, x + width/2, y + height/2]
    });

    // Button background - unified dark theme
    const background = new pc.Entity('Background');
    background.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [2, 2, -2, -2],
      color: new pc.Color(0.2, 0.2, 0.2, 0.9)
    });
    button.addChild(background);

    // Button border - subtle dark border
    const border = new pc.Entity('Border');
    border.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.4, 0.4, 0.4, 0.8)
    });
    button.addChild(border);

    // Mode name - prominent white text
    const nameText = new pc.Entity('Name');
    nameText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0.7, 1, 1],
      pivot: [0.5, 0.5],
      margin: [8, 0, -8, 0],
      text: mode.name,
      fontSize: 16,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    button.addChild(nameText);

    // Mode description - smaller gray text
    const descText = new pc.Entity('Description');
    descText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0.4, 1, 0.7],
      pivot: [0.5, 0.5],
      margin: [8, 0, -8, 0],
      text: mode.description.substring(0, 40) + '...',
      fontSize: 11,
      color: new pc.Color(0.7, 0.7, 0.7, 1),
      fontAsset: this.getFontAsset()
    });
    button.addChild(descText);

    // Player count - small info text
    const playerText = new pc.Entity('PlayerCount');
    playerText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0.1, 0.6, 0.4],
      pivot: [0, 0.5],
      margin: [8, 0, 0, 0],
      text: `${mode.minPlayers}-${mode.maxPlayers}P`,
      fontSize: 9,
      color: new pc.Color(0.5, 0.5, 0.5, 1),
      fontAsset: this.getFontAsset()
    });
    button.addChild(playerText);

    // Level requirement - yellow indicator
    if (mode.unlockRequirements?.level) {
      const levelText = new pc.Entity('LevelReq');
      levelText.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        anchor: [0.6, 0.1, 1, 0.4],
        pivot: [1, 0.5],
        margin: [0, 0, -8, 0],
        text: `Lv.${mode.unlockRequirements.level}`,
        fontSize: 9,
        color: new pc.Color(1, 0.8, 0, 1),
        fontAsset: this.getFontAsset()
      });
      button.addChild(levelText);
    }

    // Stage selector indicator - subtle icon
    if (this.canModeSelectStage(mode)) {
      const stageIcon = new pc.Entity('StageIcon');
      stageIcon.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        anchor: [0.8, 0.7, 1, 1],
        pivot: [1, 0.5],
        margin: [0, 0, -8, 0],
        text: '🏰',
        fontSize: 14,
        color: new pc.Color(0.8, 0.8, 0.8, 1),
        fontAsset: this.getFontAsset()
      });
      button.addChild(stageIcon);
    }

    // Add click handler
    this.addModeButtonClickHandler(button, mode.id);

    return button;
  }

  private canModeSelectStage(mode: GameMode): boolean {
    if (!this.selectorData) return false;
    
    // Check if mode allows stage selection and player has enough saved stages
    const offlineModes = [
      'story', 'arcade', 'versus', 'training', 'survival', 'time_attack', 
      'mission', 'boss_rush', 'endless', 'replay_theater', 'gallery', 
      'settings', 'tournament', 'team_battle', 'tag_team', 'king_of_hill', 
      'custom_match', 'practice', 'combo_challenge'
    ];
    
    return offlineModes.includes(mode.id) && this.selectorData.canSelectStage;
  }


  private addModeButtonClickHandler(button: pc.Entity, modeId: string): void {
    button.addComponent('script', {
      enabled: true,
      scripts: [{
        name: 'ModeButtonHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('ModeButtonHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('mode:item_clicked', { modeId: '${modeId}' });
              });
            }
          }
        `)]
      }]
    });
  }

  private createCloseButton(): pc.Entity {
    const closeButton = new pc.Entity('CloseButton');
    closeButton.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.9, 0.9, 1, 1],
      pivot: [0.5, 0.5],
      margin: [-40, -40, -10, -10],
      color: new pc.Color(0.6, 0.2, 0.2, 1)
    });

    const closeText = new pc.Entity('CloseText');
    closeText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      text: '✕',
      fontSize: 20,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    closeButton.addChild(closeText);

    // Add click handler
    closeButton.addComponent('script', {
      enabled: true,
      scripts: [{
        name: 'ButtonHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('ButtonHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('ui:hide_mode_selector');
              });
            }
          }
        `)]
      }]
    });

    return closeButton;
  }

  private onModeSelected(event: any): void {
    this.selectedModeId = event.modeId;
  }

  private getFontAsset(): pc.Asset | null {
    // This would return the actual font asset
    // For now, return null to use default font
    return null;
  }

  private destroyUI(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  public getSelectedModeId(): string | null {
    return this.selectedModeId;
  }

  public destroy(): void {
    this.destroyUI();
  }
}