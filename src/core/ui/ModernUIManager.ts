import * as pc from 'playcanvas';

export interface UITheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
    fontWeight: {
      normal: number;
      bold: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface UIComponent {
  id: string;
  type: 'button' | 'panel' | 'text' | 'image' | 'input' | 'slider' | 'toggle' | 'dropdown';
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  enabled: boolean;
  style: Record<string, any>;
  children?: UIComponent[];
  onClick?: () => void;
  onHover?: () => void;
  onValueChange?: (value: any) => void;
}

export class ModernUIManager {
  private app: pc.Application;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private components: Map<string, UIComponent> = new Map();
  private theme: UITheme;
  private isInitialized = false;
  private mousePosition = { x: 0, y: 0 };
  private hoveredComponent: string | null = null;
  private focusedComponent: string | null = null;
  private animations: Map<string, any> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.canvas = app.graphicsDevice.canvas as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.theme = this.createDefaultTheme();
    this.setupEventListeners();
  }

  private createDefaultTheme(): UITheme {
    return {
      name: 'modern_dark',
      colors: {
        primary: '#00D4FF',
        secondary: '#FF6B35',
        accent: '#FFD700',
        background: '#0A0A0A',
        surface: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#CCCCCC',
        success: '#00FF88',
        warning: '#FFB800',
        error: '#FF4444'
      },
      typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: {
          small: 12,
          medium: 16,
          large: 24,
          xlarge: 32
        },
        fontWeight: {
          normal: 400,
          bold: 700
        }
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32
      },
      borderRadius: {
        small: 4,
        medium: 8,
        large: 12
      },
      shadows: {
        small: '0 2px 4px rgba(0, 0, 0, 0.3)',
        medium: '0 4px 8px rgba(0, 0, 0, 0.4)',
        large: '0 8px 16px rgba(0, 0, 0, 0.5)'
      }
    };
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePosition.x = e.clientX - rect.left;
      this.mousePosition.y = e.clientY - rect.top;
      this.updateHover();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleClick(x, y);
    });

    this.canvas.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
  }

  public initialize(): void {
    this.isInitialized = true;
    this.createMainMenu();
    this.startRenderLoop();
  }

  private createMainMenu(): void {
    // Main menu background
    this.addComponent({
      id: 'main_menu_bg',
      type: 'panel',
      position: { x: 0, y: 0 },
      size: { width: this.canvas.width, height: this.canvas.height },
      visible: true,
      enabled: true,
      style: {
        backgroundColor: this.theme.colors.background,
        backgroundImage: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
      }
    });

    // Game title
    this.addComponent({
      id: 'game_title',
      type: 'text',
      position: { x: this.canvas.width / 2, y: 100 },
      size: { width: 400, height: 60 },
      visible: true,
      enabled: true,
      style: {
        text: 'STREET FIGHTER III',
        fontSize: this.theme.typography.fontSize.xlarge,
        fontWeight: this.theme.typography.fontWeight.bold,
        color: this.theme.colors.primary,
        textAlign: 'center',
        textShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
      }
    });

    // Menu buttons
    const buttonY = 200;
    const buttonSpacing = 60;

    this.addComponent({
      id: 'story_mode_btn',
      type: 'button',
      position: { x: this.canvas.width / 2 - 100, y: buttonY },
      size: { width: 200, height: 50 },
      visible: true,
      enabled: true,
      style: {
        backgroundColor: this.theme.colors.primary,
        color: this.theme.colors.background,
        borderRadius: this.theme.borderRadius.medium,
        fontSize: this.theme.typography.fontSize.medium,
        fontWeight: this.theme.typography.fontWeight.bold,
        textAlign: 'center',
        text: 'STORY MODE',
        shadow: this.theme.shadows.medium,
        hoverColor: this.theme.colors.accent
      },
      onClick: () => this.openStoryMode()
    });

    this.addComponent({
      id: 'versus_btn',
      type: 'button',
      position: { x: this.canvas.width / 2 - 100, y: buttonY + buttonSpacing },
      size: { width: 200, height: 50 },
      visible: true,
      enabled: true,
      style: {
        backgroundColor: this.theme.colors.secondary,
        color: this.theme.colors.text,
        borderRadius: this.theme.borderRadius.medium,
        fontSize: this.theme.typography.fontSize.medium,
        fontWeight: this.theme.typography.fontWeight.bold,
        textAlign: 'center',
        text: 'VERSUS',
        shadow: this.theme.shadows.medium,
        hoverColor: this.theme.colors.accent
      },
      onClick: () => this.openVersusMode()
    });

    this.addComponent({
      id: 'training_btn',
      type: 'button',
      position: { x: this.canvas.width / 2 - 100, y: buttonY + buttonSpacing * 2 },
      size: { width: 200, height: 50 },
      visible: true,
      enabled: true,
      style: {
        backgroundColor: this.theme.colors.surface,
        color: this.theme.colors.text,
        borderRadius: this.theme.borderRadius.medium,
        fontSize: this.theme.typography.fontSize.medium,
        fontWeight: this.theme.typography.fontWeight.bold,
        textAlign: 'center',
        text: 'TRAINING',
        shadow: this.theme.shadows.medium,
        hoverColor: this.theme.colors.accent
      },
      onClick: () => this.openTrainingMode()
    });

    this.addComponent({
      id: 'online_btn',
      type: 'button',
      position: { x: this.canvas.width / 2 - 100, y: buttonY + buttonSpacing * 3 },
      size: { width: 200, height: 50 },
      visible: true,
      enabled: true,
      style: {
        backgroundColor: this.theme.colors.surface,
        color: this.theme.colors.text,
        borderRadius: this.theme.borderRadius.medium,
        fontSize: this.theme.typography.fontSize.medium,
        fontWeight: this.theme.typography.fontWeight.bold,
        textAlign: 'center',
        text: 'ONLINE',
        shadow: this.theme.shadows.medium,
        hoverColor: this.theme.colors.accent
      },
      onClick: () => this.openOnlineMode()
    });

    this.addComponent({
      id: 'options_btn',
      type: 'button',
      position: { x: this.canvas.width / 2 - 100, y: buttonY + buttonSpacing * 4 },
      size: { width: 200, height: 50 },
      visible: true,
      enabled: true,
      style: {
        backgroundColor: this.theme.colors.surface,
        color: this.theme.colors.text,
        borderRadius: this.theme.borderRadius.medium,
        fontSize: this.theme.typography.fontSize.medium,
        fontWeight: this.theme.typography.fontWeight.bold,
        textAlign: 'center',
        text: 'OPTIONS',
        shadow: this.theme.shadows.medium,
        hoverColor: this.theme.colors.accent
      },
      onClick: () => this.openOptions()
    });
  }

  public addComponent(component: UIComponent): void {
    this.components.set(component.id, component);
  }

  public removeComponent(id: string): void {
    this.components.delete(id);
  }

  public getComponent(id: string): UIComponent | null {
    return this.components.get(id) || null;
  }

  public setComponentVisible(id: string, visible: boolean): void {
    const component = this.components.get(id);
    if (component) {
      component.visible = visible;
    }
  }

  public setComponentEnabled(id: string, enabled: boolean): void {
    const component = this.components.get(id);
    if (component) {
      component.enabled = enabled;
    }
  }

  public setComponentStyle(id: string, style: Record<string, any>): void {
    const component = this.components.get(id);
    if (component) {
      component.style = { ...component.style, ...style };
    }
  }

  private updateHover(): void {
    let newHovered: string | null = null;

    for (const [id, component] of this.components) {
      if (component.visible && component.enabled && this.isPointInComponent(this.mousePosition, component)) {
        newHovered = id;
        break;
      }
    }

    if (newHovered !== this.hoveredComponent) {
      if (this.hoveredComponent) {
        this.setComponentStyle(this.hoveredComponent, { hover: false });
      }
      if (newHovered) {
        this.setComponentStyle(newHovered, { hover: true });
      }
      this.hoveredComponent = newHovered;
    }
  }

  private handleClick(x: number, y: number): void {
    for (const [id, component] of this.components) {
      if (component.visible && component.enabled && this.isPointInComponent({ x, y }, component)) {
        if (component.onClick) {
          component.onClick();
        }
        this.focusedComponent = id;
        break;
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.focusedComponent) {
      const component = this.components.get(this.focusedComponent);
      if (component && component.onValueChange) {
        component.onValueChange(e.key);
      }
    }
  }

  private isPointInComponent(point: { x: number; y: number }, component: UIComponent): boolean {
    return point.x >= component.position.x &&
           point.x <= component.position.x + component.size.width &&
           point.y >= component.position.y &&
           point.y <= component.position.y + component.size.height;
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      requestAnimationFrame(render);
    };
    render();
  }

  private render(): void {
    if (!this.isInitialized) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render all visible components
    for (const component of this.components.values()) {
      if (component.visible) {
        this.renderComponent(component);
      }
    }
  }

  private renderComponent(component: UIComponent): void {
    const { position, size, style } = component;

    switch (component.type) {
      case 'panel':
        this.renderPanel(component);
        break;
      case 'button':
        this.renderButton(component);
        break;
      case 'text':
        this.renderText(component);
        break;
      case 'image':
        this.renderImage(component);
        break;
      case 'input':
        this.renderInput(component);
        break;
      case 'slider':
        this.renderSlider(component);
        break;
      case 'toggle':
        this.renderToggle(component);
        break;
      case 'dropdown':
        this.renderDropdown(component);
        break;
    }
  }

  private renderPanel(component: UIComponent): void {
    const { position, size, style } = component;
    
    this.ctx.save();
    
    // Background
    if (style.backgroundColor) {
      this.ctx.fillStyle = style.backgroundColor;
      this.ctx.fillRect(position.x, position.y, size.width, size.height);
    }
    
    // Border
    if (style.borderColor) {
      this.ctx.strokeStyle = style.borderColor;
      this.ctx.lineWidth = style.borderWidth || 1;
      this.ctx.strokeRect(position.x, position.y, size.width, size.height);
    }
    
    // Shadow
    if (style.shadow) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 4;
    }
    
    this.ctx.restore();
  }

  private renderButton(component: UIComponent): void {
    const { position, size, style } = component;
    
    this.ctx.save();
    
    // Button background
    const bgColor = style.hover ? (style.hoverColor || style.backgroundColor) : style.backgroundColor;
    this.ctx.fillStyle = bgColor || this.theme.colors.primary;
    
    // Rounded rectangle
    const radius = style.borderRadius || this.theme.borderRadius.medium;
    this.ctx.beginPath();
    this.ctx.roundRect(position.x, position.y, size.width, size.height, radius);
    this.ctx.fill();
    
    // Button text
    if (style.text) {
      this.ctx.fillStyle = style.color || this.theme.colors.text;
      this.ctx.font = `${style.fontWeight || this.theme.typography.fontWeight.bold} ${style.fontSize || this.theme.typography.fontSize.medium}px ${this.theme.typography.fontFamily}`;
      this.ctx.textAlign = style.textAlign || 'center';
      this.ctx.textBaseline = 'middle';
      
      const textX = position.x + size.width / 2;
      const textY = position.y + size.height / 2;
      
      // Text shadow
      if (style.textShadow) {
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
      }
      
      this.ctx.fillText(style.text, textX, textY);
    }
    
    this.ctx.restore();
  }

  private renderText(component: UIComponent): void {
    const { position, size, style } = component;
    
    this.ctx.save();
    
    this.ctx.fillStyle = style.color || this.theme.colors.text;
    this.ctx.font = `${style.fontWeight || this.theme.typography.fontWeight.normal} ${style.fontSize || this.theme.typography.fontSize.medium}px ${this.theme.typography.fontFamily}`;
    this.ctx.textAlign = style.textAlign || 'left';
    this.ctx.textBaseline = 'top';
    
    if (style.textShadow) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 2;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
    }
    
    this.ctx.fillText(style.text || '', position.x, position.y);
    
    this.ctx.restore();
  }

  private renderImage(component: UIComponent): void {
    // Image rendering would be implemented here
    // For now, just render a placeholder
    const { position, size, style } = component;
    
    this.ctx.save();
    this.ctx.fillStyle = style.backgroundColor || this.theme.colors.surface;
    this.ctx.fillRect(position.x, position.y, size.width, size.height);
    
    this.ctx.fillStyle = this.theme.colors.textSecondary;
    this.ctx.font = `${this.theme.typography.fontSize.small}px ${this.theme.typography.fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('IMAGE', position.x + size.width / 2, position.y + size.height / 2);
    
    this.ctx.restore();
  }

  private renderInput(component: UIComponent): void {
    // Input rendering would be implemented here
    this.renderPanel(component);
  }

  private renderSlider(component: UIComponent): void {
    // Slider rendering would be implemented here
    this.renderPanel(component);
  }

  private renderToggle(component: UIComponent): void {
    // Toggle rendering would be implemented here
    this.renderPanel(component);
  }

  private renderDropdown(component: UIComponent): void {
    // Dropdown rendering would be implemented here
    this.renderPanel(component);
  }

  // Menu action handlers
  private openStoryMode(): void {
    console.log('Opening Story Mode');
    // Implementation would go here
  }

  private openVersusMode(): void {
    console.log('Opening Versus Mode');
    // Implementation would go here
  }

  private openTrainingMode(): void {
    console.log('Opening Training Mode');
    // Implementation would go here
  }

  private openOnlineMode(): void {
    console.log('Opening Online Mode');
    // Implementation would go here
  }

  private openOptions(): void {
    console.log('Opening Options');
    // Implementation would go here
  }

  public setTheme(theme: UITheme): void {
    this.theme = theme;
  }

  public getTheme(): UITheme {
    return this.theme;
  }

  public destroy(): void {
    this.components.clear();
    this.animations.clear();
  }
}