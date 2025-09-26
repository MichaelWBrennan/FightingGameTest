import * as pc from 'playcanvas';

export interface MenuBarData {
  playerLevel: number;
  unlockedFeatures: string[];
  hasReplays: boolean;
  hasGalleryItems: boolean;
}

export class MenuBar {
  private app: pc.Application;
  private container: pc.Entity | null = null;
  private isVisible = false;
  private menuData: MenuBarData | null = null;

  constructor(app: pc.Application) {
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.app.on('ui:show_menu_bar', this.show.bind(this));
    this.app.on('ui:hide_menu_bar', this.hide.bind(this));
    this.app.on('menu:item_clicked', this.onMenuItemClicked.bind(this));
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
    this.container = new pc.Entity('MenuBar');
    this.container.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0, 0, 1, 0],
      pivot: [0, 0],
      margin: [0, 0, 0, 0]
    });

    // Create background bar
    const background = new pc.Entity('Background');
    background.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0, 0],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.1, 0.1, 0.1, 0.9)
    });
    this.container.addChild(background);

    // Create border
    const border = new pc.Entity('Border');
    border.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 0.05],
      pivot: [0, 1],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.4, 0.4, 0.4, 0.8)
    });
    this.container.addChild(border);

    // Create menu items
    this.createMenuItems();

    // Add to scene
    this.app.root.addChild(this.container);
  }

  private createMenuItems(): void {
    if (!this.menuData) return;

    const menuItems = [
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
        id: 'achievements',
        name: 'Achievements',
        icon: '🏆',
        enabled: true,
        description: 'View your progress and achievements'
      },
      {
        id: 'profile',
        name: 'Profile',
        icon: '👤',
        enabled: true,
        description: 'View your player profile and statistics'
      }
    ];

    const itemWidth = 120;
    const itemHeight = 60;
    const spacing = 10;
    const startX = 20;

    menuItems.forEach((item, index) => {
      const x = startX + index * (itemWidth + spacing);
      const menuItem = this.createMenuItem(item, x, 0, itemWidth, itemHeight);
      this.container!.addChild(menuItem);
    });
  }

  private createMenuItem(item: any, x: number, y: number, width: number, height: number): pc.Entity {
    const menuItem = new pc.Entity(`MenuItem_${item.id}`);
    menuItem.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0, 0, 0, 0],
      pivot: [0, 0],
      margin: [x, y, x + width, y + height]
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
      anchor: [0, 0.6, 0.3, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      text: item.icon,
      fontSize: 20,
      color: item.enabled ? new pc.Color(1, 1, 1, 1) : new pc.Color(0.5, 0.5, 0.5, 1),
      fontAsset: this.getFontAsset()
    });
    menuItem.addChild(icon);

    // Name
    const nameText = new pc.Entity('Name');
    nameText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.3, 0.6, 1, 1],
      pivot: [0, 0.5],
      margin: [5, 0, -5, 0],
      text: item.name,
      fontSize: 12,
      color: item.enabled ? new pc.Color(1, 1, 1, 1) : new pc.Color(0.5, 0.5, 0.5, 1),
      fontAsset: this.getFontAsset()
    });
    menuItem.addChild(nameText);

    // Description
    const descText = new pc.Entity('Description');
    descText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.3, 0.2, 1, 0.6],
      pivot: [0, 0.5],
      margin: [5, 0, -5, 0],
      text: item.description.substring(0, 20) + '...',
      fontSize: 8,
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
        name: 'MenuItemHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('MenuItemHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('menu:item_clicked', { itemId: '${itemId}' });
              });
            }
          }
        `)]
      }]
    });
  }

  private onMenuItemClicked(event: any): void {
    const { itemId } = event;
    
    switch (itemId) {
      case 'replay_theater':
        this.app.fire('ui:show_replay_theater');
        break;
      case 'gallery':
        this.app.fire('ui:show_gallery');
        break;
      case 'settings':
        this.app.fire('ui:show_settings');
        break;
      case 'achievements':
        this.app.fire('ui:show_achievements');
        break;
      case 'profile':
        this.app.fire('ui:show_profile');
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