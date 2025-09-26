import * as pc from 'playcanvas';
import { SavedStage } from '../stages/StageSaveSystem';

export interface StageSelectorData {
  savedStages: SavedStage[];
  gameMode: string;
  isOnline: boolean;
  canSelect: boolean;
}

export class StageSelector {
  private app: pc.Application;
  private container: pc.Entity | null = null;
  private isVisible = false;
  private selectorData: StageSelectorData | null = null;
  private selectedStageId: string | null = null;

  constructor(app: pc.Application) {
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.app.on('ui:show_stage_selector', this.show.bind(this));
    this.app.on('ui:hide_stage_selector', this.hide.bind(this));
    this.app.on('stage:selected', this.onStageSelected.bind(this));
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

    // Don't show if not enough stages or online mode
    if (!this.selectorData.canSelect || this.selectorData.isOnline) {
      return;
    }

    // Create main container
    this.container = new pc.Entity('StageSelector');
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
      color: new pc.Color(0, 0, 0, 0.7)
    });
    this.container.addChild(background);

    // Create main panel
    const panel = new pc.Entity('Panel');
    panel.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-400, -300, 400, 300],
      color: new pc.Color(0.1, 0.1, 0.1, 0.95)
    });
    this.container.addChild(panel);

    // Create title
    const title = new pc.Entity('Title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-350, 250, 350, 300],
      text: 'Select Stage',
      fontSize: 28,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    this.container.addChild(title);

    // Create stage grid
    const stageGrid = this.createStageGrid();
    this.container.addChild(stageGrid);

    // Create buttons
    const buttons = this.createButtons();
    this.container.addChild(buttons);

    // Add to scene
    this.app.root.addChild(this.container);
  }

  private createStageGrid(): pc.Entity {
    const grid = new pc.Entity('StageGrid');
    grid.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-350, -200, 350, 200]
    });

    if (!this.selectorData) return grid;

    const stages = this.selectorData.savedStages;
    const itemsPerRow = 3;
    const itemWidth = 200;
    const itemHeight = 150;
    const spacing = 20;

    stages.forEach((stage, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      
      const x = (col - (itemsPerRow - 1) / 2) * (itemWidth + spacing);
      const y = (row - Math.floor(stages.length / itemsPerRow) / 2) * (itemHeight + spacing);

      const stageItem = this.createStageItem(stage, x, y, itemWidth, itemHeight);
      grid.addChild(stageItem);
    });

    return grid;
  }

  private createStageItem(stage: SavedStage, x: number, y: number, width: number, height: number): pc.Entity {
    const item = new pc.Entity(`StageItem_${stage.id}`);
    item.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [x - width/2, y - height/2, x + width/2, y + height/2]
    });

    // Background - unified dark theme
    const background = new pc.Entity('Background');
    background.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [2, 2, -2, -2],
      color: new pc.Color(0.2, 0.2, 0.2, 0.9)
    });
    item.addChild(background);

    // Border - subtle dark border
    const border = new pc.Entity('Border');
    border.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.4, 0.4, 0.4, 0.8)
    });
    item.addChild(border);

    // Stage name - prominent white text
    const nameText = new pc.Entity('Name');
    nameText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0.7, 1, 1],
      pivot: [0.5, 0.5],
      margin: [8, 0, -8, 0],
      text: stage.name,
      fontSize: 14,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    item.addChild(nameText);

    // Stage description - smaller gray text
    const descText = new pc.Entity('Description');
    descText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0.4, 1, 0.7],
      pivot: [0.5, 0.5],
      margin: [8, 0, -8, 0],
      text: stage.description.substring(0, 40) + '...',
      fontSize: 10,
      color: new pc.Color(0.7, 0.7, 0.7, 1),
      fontAsset: this.getFontAsset()
    });
    item.addChild(descText);

    // Tags - small info text
    const tagsText = new pc.Entity('Tags');
    tagsText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0.1, 1, 0.4],
      pivot: [0.5, 0.5],
      margin: [8, 0, -8, 0],
      text: stage.tags.slice(0, 3).join(', '),
      fontSize: 8,
      color: new pc.Color(0.5, 0.5, 0.5, 1),
      fontAsset: this.getFontAsset()
    });
    item.addChild(tagsText);

    // Play count - small info text
    const playCountText = new pc.Entity('PlayCount');
    playCountText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 0.5, 0.1],
      pivot: [0, 0.5],
      margin: [8, 0, 0, 0],
      text: `${stage.playCount} plays`,
      fontSize: 8,
      color: new pc.Color(0.4, 0.4, 0.4, 1),
      fontAsset: this.getFontAsset()
    });
    item.addChild(playCountText);

    // Favorite indicator - subtle star
    if (stage.isFavorite) {
      const favoriteIcon = new pc.Entity('Favorite');
      favoriteIcon.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        anchor: [0.5, 0, 1, 0.1],
        pivot: [1, 0.5],
        margin: [0, 0, -8, 0],
        text: '★',
        fontSize: 10,
        color: new pc.Color(1, 0.8, 0, 1),
        fontAsset: this.getFontAsset()
      });
      item.addChild(favoriteIcon);
    }

    // Add click handler
    this.addStageItemClickHandler(item, stage.id);

    return item;
  }

  private addStageItemClickHandler(item: pc.Entity, stageId: string): void {
    item.addComponent('script', {
      enabled: true,
      scripts: [{
        name: 'StageItemHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('StageItemHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('stage:item_clicked', { stageId: '${stageId}' });
              });
            }
          }
        `)
      }]
    });
  }

  private createButtons(): pc.Entity {
    const buttons = new pc.Entity('Buttons');
    buttons.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-350, -250, 350, -200]
    });

    // Select button - unified dark theme
    const selectButton = new pc.Entity('SelectButton');
    selectButton.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 0.3, 1],
      pivot: [0, 0.5],
      margin: [10, 5, -10, -5],
      color: new pc.Color(0.2, 0.2, 0.2, 0.9)
    });
    buttons.addChild(selectButton);

    // Select button border
    const selectBorder = new pc.Entity('SelectBorder');
    selectBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.2, 0.6, 0.2, 0.8)
    });
    selectButton.addChild(selectBorder);

    const selectText = new pc.Entity('SelectText');
    selectText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      text: 'Select',
      fontSize: 16,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    selectButton.addChild(selectText);

    // Random button - unified dark theme
    const randomButton = new pc.Entity('RandomButton');
    randomButton.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.35, 0, 0.65, 1],
      pivot: [0, 0.5],
      margin: [10, 5, -10, -5],
      color: new pc.Color(0.2, 0.2, 0.2, 0.9)
    });
    buttons.addChild(randomButton);

    // Random button border
    const randomBorder = new pc.Entity('RandomBorder');
    randomBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.2, 0.2, 0.6, 0.8)
    });
    randomButton.addChild(randomBorder);

    const randomText = new pc.Entity('RandomText');
    randomText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      text: 'Random',
      fontSize: 16,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    randomButton.addChild(randomText);

    // Cancel button - unified dark theme
    const cancelButton = new pc.Entity('CancelButton');
    cancelButton.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.7, 0, 1, 1],
      pivot: [0, 0.5],
      margin: [10, 5, -10, -5],
      color: new pc.Color(0.2, 0.2, 0.2, 0.9)
    });
    buttons.addChild(cancelButton);

    // Cancel button border
    const cancelBorder = new pc.Entity('CancelBorder');
    cancelBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.6, 0.2, 0.2, 0.8)
    });
    cancelButton.addChild(cancelBorder);

    const cancelText = new pc.Entity('CancelText');
    cancelText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      text: 'Cancel',
      fontSize: 16,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    cancelButton.addChild(cancelText);

    // Add click handlers
    this.addButtonHandlers(selectButton, randomButton, cancelButton);

    return buttons;
  }

  private addButtonHandlers(selectButton: pc.Entity, randomButton: pc.Entity, cancelButton: pc.Entity): void {
    // Select button click
    selectButton.addComponent('script', {
      enabled: true,
      scripts: [{
        name: 'ButtonHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('ButtonHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('stage:select_requested');
              });
            }
          }
        `)
      }]
    });

    // Random button click
    randomButton.addComponent('script', {
      enabled: true,
      scripts: [{
        name: 'ButtonHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('ButtonHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('stage:random_requested');
              });
            }
          }
        `)
      }]
    });

    // Cancel button click
    cancelButton.addComponent('script', {
      enabled: true,
      scripts: [{
        name: 'ButtonHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('ButtonHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('stage:select_cancelled');
              });
            }
          }
        `)
      }]
    });
  }

  private onStageSelected(event: any): void {
    this.selectedStageId = event.stageId;
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

  public getSelectedStageId(): string | null {
    return this.selectedStageId;
  }

  public destroy(): void {
    this.destroyUI();
  }
}