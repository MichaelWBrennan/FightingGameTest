import * as pc from 'playcanvas';

export interface PauseMenuData {
  canResume: boolean;
  canSaveReplay: boolean;
  hasReplays: boolean;
  hasGalleryItems: boolean;
  playerLevel: number;
}

export class PauseMenu {
  private app: pc.Application;
  private container: pc.Entity | null = null;
  private isVisible = false;
  private menuData: PauseMenuData | null = null;

  constructor(app: pc.Application) {
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.app.on('ui:show_pause_menu', this.show.bind(this));
    this.app.on('ui:hide_pause_menu', this.hide.bind(this));
    this.app.on('pause:item_clicked', this.onPauseItemClicked.bind(this));
  }

  public show(event: any): void {
    this.menuData = event.data;
    this.isVisible = true;
    this.createUI();
  }

  public hide(): void {
    this.isVisible = false;
    this.destroyUI();
  }

  private createUI(): void {
    if (!this.menuData) return;

    // Create main container
    this.container = new pc.Entity('PauseMenu');
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
      margin: [-300, -250, 300, 250],
      color: new pc.Color(0.2, 0.2, 0.2, 0.95)
    });
    this.container.addChild(panel);

    // Panel border
    const panelBorder = new pc.Entity('PanelBorder');
    panelBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.4, 0.4, 0.4, 0.8)
    });
    panel.addChild(panelBorder);

    // Create title
    const title = new pc.Entity('Title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-250, 200, 250, 250],
      text: 'PAUSED',
      fontSize: 28,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    this.container.addChild(title);

    // Create menu items
    this.createMenuItems();

    // Add to scene
    this.app.root.addChild(this.container);
  }

  private createMenuItems(): void {
    if (!this.menuData) return;

    const menuItems = [
      {
        id: 'resume',
        name: 'Resume',
        icon: '▶️',
        enabled: this.menuData.canResume,
        description: 'Continue the current match'
      },
      {
        id: 'save_replay',
        name: 'Save Replay',
        icon: '💾',
        enabled: this.menuData.canSaveReplay,
        description: 'Save this match as a replay'
      },
      {
        id: 'replay_theater',
        name: 'Replay Theater',
        icon: '🎬',
        enabled: this.menuData.hasReplays,
        description: 'Watch and analyze saved replays'
      },
      {
        id: 'gallery',
        name: 'Gallery',
        icon: '🖼️',
        enabled: this.menuData.hasGalleryItems,
        description: 'View unlocked artwork and collectibles'
      },
      {
        id: 'settings',
        name: 'Settings',
        icon: '⚙️',
        enabled: true,
        description: 'Configure game options and preferences'
      },
      {
        id: 'main_menu',
        name: 'Main Menu',
        icon: '🏠',
        enabled: true,
        description: 'Return to the main menu'
      }
    ];

    const itemWidth = 200;
    const itemHeight = 50;
    const spacing = 10;
    const startY = 100;
    const centerX = 0;

    menuItems.forEach((item, index) => {
      const y = startY - index * (itemHeight + spacing);
      const menuItem = this.createMenuItem(item, centerX, y, itemWidth, itemHeight);
      this.container!.addChild(menuItem);
    });
  }

  private createMenuItem(item: any, x: number, y: number, width: number, height: number): pc.Entity {
    const menuItem = new pc.Entity(`PauseMenuItem_${item.id}`);
    menuItem.addComponent('element', {
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
      color: item.enabled ? new pc.Color(0.2, 0.2, 0.2, 0.9) : new pc.Color(0.1, 0.1, 0.1, 0.5)
    });
    menuItem.addChild(background);

    // Border
    const border = new pc.Entity('Border');
    border.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: item.enabled ? new pc.Color(0.4, 0.4, 0.4, 0.8) : new pc.Color(0.2, 0.2, 0.2, 0.4)
    });
    menuItem.addChild(border);

    // Icon
    const icon = new pc.Entity('Icon');
    icon.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 0.2, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      text: item.icon,
      fontSize: 18,
      color: item.enabled ? new pc.Color(1, 1, 1, 1) : new pc.Color(0.5, 0.5, 0.5, 1),
      fontAsset: this.getFontAsset()
    });
    menuItem.addChild(icon);

    // Name
    const nameText = new pc.Entity('Name');
    nameText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.2, 0.5, 0.8, 1],
      pivot: [0, 0.5],
      margin: [10, 0, 0, 0],
      text: item.name,
      fontSize: 16,
      color: item.enabled ? new pc.Color(1, 1, 1, 1) : new pc.Color(0.5, 0.5, 0.5, 1),
      fontAsset: this.getFontAsset()
    });
    menuItem.addChild(nameText);

    // Description
    const descText = new pc.Entity('Description');
    descText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.2, 0, 0.8, 0.5],
      pivot: [0, 0.5],
      margin: [10, 0, 0, 0],
      text: item.description,
      fontSize: 10,
      color: item.enabled ? new pc.Color(0.7, 0.7, 0.7, 1) : new pc.Color(0.4, 0.4, 0.4, 1),
      fontAsset: this.getFontAsset()
    });
    menuItem.addChild(descText);

    // Disabled indicator
    if (!item.enabled) {
      const disabledOverlay = new pc.Entity('DisabledOverlay');
      disabledOverlay.addComponent('element', {
        type: pc.ELEMENTTYPE_IMAGE,
        anchor: [0, 0, 1, 1],
        pivot: [0.5, 0.5],
        margin: [0, 0, 0, 0],
        color: new pc.Color(0, 0, 0, 0.3)
      });
      menuItem.addChild(disabledOverlay);
    }

    // Add click handler
    if (item.enabled) {
      this.addMenuItemClickHandler(menuItem, item.id);
    }

    return menuItem;
  }

  private addMenuItemClickHandler(menuItem: pc.Entity, itemId: string): void {
    menuItem.addComponent('script', {
      enabled: true,
      scripts: [{
        name: 'PauseMenuItemHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('PauseMenuItemHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('pause:item_clicked', { itemId: '${itemId}' });
              });
            }
          }
        `)]
      }]
    });
  }

  private onPauseItemClicked(event: any): void {
    const { itemId } = event;
    
    switch (itemId) {
      case 'resume':
        this.app.fire('game:resume');
        this.hide();
        break;
      case 'save_replay':
        this.app.fire('replay:save_current');
        break;
      case 'replay_theater':
        this.app.fire('ui:show_replay_theater');
        break;
      case 'gallery':
        this.app.fire('ui:show_gallery');
        break;
      case 'settings':
        this.app.fire('ui:show_settings');
        break;
      case 'main_menu':
        this.app.fire('game:return_to_main_menu');
        break;
    }
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

  public destroy(): void {
    this.destroyUI();
  }
}