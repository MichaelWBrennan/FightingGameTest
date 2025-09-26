import type { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';

export interface UISettings {
  theme: 'dark' | 'light' | 'auto' | 'custom';
  colorScheme: ColorScheme;
  layout: UILayout;
  typography: TypographySettings;
  animations: AnimationSettings;
  accessibility: AccessibilitySettings;
  customization: CustomizationSettings;
  localization: LocalizationSettings;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface UILayout {
  resolution: {
    width: number;
    height: number;
  };
  scaling: 'fixed' | 'responsive' | 'adaptive';
  orientation: 'portrait' | 'landscape' | 'auto';
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  grid: {
    columns: number;
    rows: number;
    gap: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

export interface AnimationSettings {
  enabled: boolean;
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
  transitions: {
    fade: boolean;
    slide: boolean;
    scale: boolean;
    rotate: boolean;
  };
  performance: {
    reduceMotion: boolean;
    lowEndDevice: boolean;
  };
}

export interface AccessibilitySettings {
  enabled: boolean;
  colorBlindSupport: boolean;
  highContrast: boolean;
  textToSpeech: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  fontScaling: boolean;
  colorInversion: boolean;
  motionReduction: boolean;
  audioCues: boolean;
  hapticFeedback: boolean;
}

export interface CustomizationSettings {
  enabled: boolean;
  themes: CustomTheme[];
  layouts: CustomLayout[];
  widgets: CustomWidget[];
  shortcuts: CustomShortcut[];
  preferences: UserPreferences;
}

export interface CustomTheme {
  id: string;
  name: string;
  description: string;
  colorScheme: ColorScheme;
  typography: TypographySettings;
  isDefault: boolean;
  isPublic: boolean;
  creator: string;
}

export interface CustomLayout {
  id: string;
  name: string;
  description: string;
  layout: UILayout;
  isDefault: boolean;
  isPublic: boolean;
  creator: string;
}

export interface CustomWidget {
  id: string;
  name: string;
  type: 'button' | 'panel' | 'indicator' | 'input' | 'display';
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  properties: any;
  isVisible: boolean;
  isEnabled: boolean;
}

export interface CustomShortcut {
  id: string;
  name: string;
  key: string;
  action: string;
  context: string;
  isEnabled: boolean;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  units: 'metric' | 'imperial';
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
}

export interface LocalizationSettings {
  enabled: boolean;
  currentLanguage: string;
  fallbackLanguage: string;
  supportedLanguages: string[];
  translations: Map<string, any>;
  rtlSupport: boolean;
  pluralization: boolean;
  dateFormatting: boolean;
  numberFormatting: boolean;
}

export interface UIComponent {
  id: string;
  type: string;
  properties: any;
  children: UIComponent[];
  parent?: string;
  isVisible: boolean;
  isEnabled: boolean;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  style: any;
  events: Map<string, Function>;
}

export interface UIManager {
  components: Map<string, UIComponent>;
  layouts: Map<string, UILayout>;
  themes: Map<string, CustomTheme>;
  currentTheme: string;
  currentLayout: string;
  eventSystem: UIEventSystem;
  renderer: UIRenderer;
  animator: UIAnimator;
}

export class AdvancedUISystem {
  private app: pc.Application;
  private uiSettings: UISettings;
  private uiManager: UIManager;
  private accessibilityManager: AccessibilityManager;
  private customizationManager: CustomizationManager;
  private localizationManager: LocalizationManager;

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeAdvancedUISystem();
  }

  private initializeAdvancedUISystem(): void {
    this.initializeUISettings();
    this.initializeUIManager();
    this.initializeAccessibilityManager();
    this.initializeCustomizationManager();
    this.initializeLocalizationManager();
  }

  private initializeUISettings(): void {
    this.uiSettings = {
      theme: 'dark',
      colorScheme: {
        primary: '#2196F3',
        secondary: '#FFC107',
        accent: '#FF5722',
        background: '#121212',
        surface: '#1E1E1E',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        border: '#333333',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3'
      },
      layout: {
        resolution: {
          width: 1920,
          height: 1080
        },
        scaling: 'responsive',
        orientation: 'landscape',
        safeArea: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        },
        grid: {
          columns: 12,
          rows: 8,
          gap: 16
        },
        spacing: {
          xs: 4,
          sm: 8,
          md: 16,
          lg: 24,
          xl: 32
        }
      },
      typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        fontSize: {
          xs: 12,
          sm: 14,
          md: 16,
          lg: 18,
          xl: 24,
          xxl: 32
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          bold: 700
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.5,
          relaxed: 1.8
        },
        letterSpacing: {
          tight: -0.5,
          normal: 0,
          wide: 0.5
        }
      },
      animations: {
        enabled: true,
        duration: {
          fast: 150,
          normal: 300,
          slow: 500
        },
        easing: {
          linear: 'linear',
          easeIn: 'ease-in',
          easeOut: 'ease-out',
          easeInOut: 'ease-in-out'
        },
        transitions: {
          fade: true,
          slide: true,
          scale: true,
          rotate: true
        },
        performance: {
          reduceMotion: false,
          lowEndDevice: false
        }
      },
      accessibility: {
        enabled: true,
        colorBlindSupport: true,
        highContrast: false,
        textToSpeech: true,
        screenReader: true,
        keyboardNavigation: true,
        focusIndicators: true,
        fontScaling: true,
        colorInversion: false,
        motionReduction: false,
        audioCues: true,
        hapticFeedback: true
      },
      customization: {
        enabled: true,
        themes: [],
        layouts: [],
        widgets: [],
        shortcuts: [],
        preferences: {
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          currency: 'USD',
          units: 'metric',
          notifications: {
            enabled: true,
            sound: true,
            vibration: true,
            popup: true
          },
          privacy: {
            dataCollection: true,
            analytics: true,
            crashReporting: true
          }
        }
      },
      localization: {
        enabled: true,
        currentLanguage: 'en',
        fallbackLanguage: 'en',
        supportedLanguages: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh'],
        translations: new Map(),
        rtlSupport: true,
        pluralization: true,
        dateFormatting: true,
        numberFormatting: true
      }
    };
  }

  private initializeUIManager(): void {
    this.uiManager = {
      components: new Map(),
      layouts: new Map(),
      themes: new Map(),
      currentTheme: 'default',
      currentLayout: 'default',
      eventSystem: new UIEventSystem(),
      renderer: new UIRenderer(),
      animator: new UIAnimator()
    };
  }

  private initializeAccessibilityManager(): void {
    this.accessibilityManager = new AccessibilityManager();
  }

  private initializeCustomizationManager(): void {
    this.customizationManager = new CustomizationManager();
  }

  private initializeLocalizationManager(): void {
    this.localizationManager = new LocalizationManager();
  }

  public createComponent(type: string, properties: any, parent?: string): UIComponent {
    const component: UIComponent = {
      id: `component_${Date.now()}`,
      type,
      properties,
      children: [],
      parent,
      isVisible: true,
      isEnabled: true,
      position: { x: 0, y: 0, z: 0 },
      size: { width: 100, height: 100, depth: 0 },
      style: {},
      events: new Map()
    };

    this.uiManager.components.set(component.id, component);

    if (parent) {
      const parentComponent = this.uiManager.components.get(parent);
      if (parentComponent) {
        parentComponent.children.push(component);
      }
    }

    this.app.fire('ui:component_created', { component });
    Logger.info(`Created UI component: ${type}`);
    return component;
  }

  public updateComponent(componentId: string, updates: Partial<UIComponent>): boolean {
    const component = this.uiManager.components.get(componentId);
    if (!component) {
      Logger.warn(`UI component ${componentId} not found`);
      return false;
    }

    Object.assign(component, updates);
    this.app.fire('ui:component_updated', { component });
    Logger.info(`Updated UI component: ${componentId}`);
    return true;
  }

  public deleteComponent(componentId: string): boolean {
    const component = this.uiManager.components.get(componentId);
    if (!component) {
      Logger.warn(`UI component ${componentId} not found`);
      return false;
    }

    // Remove from parent
    if (component.parent) {
      const parentComponent = this.uiManager.components.get(component.parent);
      if (parentComponent) {
        parentComponent.children = parentComponent.children.filter(c => c.id !== componentId);
      }
    }

    // Remove children
    for (const child of component.children) {
      this.deleteComponent(child.id);
    }

    this.uiManager.components.delete(componentId);
    this.app.fire('ui:component_deleted', { componentId });
    Logger.info(`Deleted UI component: ${componentId}`);
    return true;
  }

  public setTheme(themeId: string): boolean {
    const theme = this.uiManager.themes.get(themeId);
    if (!theme) {
      Logger.warn(`Theme ${themeId} not found`);
      return false;
    }

    this.uiManager.currentTheme = themeId;
    this.uiSettings.colorScheme = theme.colorScheme;
    this.uiSettings.typography = theme.typography;

    this.applyTheme(theme);
    this.app.fire('ui:theme_changed', { theme });
    Logger.info(`Changed theme to: ${theme.name}`);
    return true;
  }

  private applyTheme(theme: CustomTheme): void {
    // Apply theme to all components
    for (const component of this.uiManager.components.values()) {
      this.applyThemeToComponent(component, theme);
    }
  }

  private applyThemeToComponent(component: UIComponent, theme: CustomTheme): void {
    // Apply theme colors and typography to component
    component.style = {
      ...component.style,
      color: theme.colorScheme.text,
      backgroundColor: theme.colorScheme.surface,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.md
    };

    // Apply to children
    for (const child of component.children) {
      this.applyThemeToComponent(child, theme);
    }
  }

  public setLayout(layoutId: string): boolean {
    const layout = this.uiManager.layouts.get(layoutId);
    if (!layout) {
      Logger.warn(`Layout ${layoutId} not found`);
      return false;
    }

    this.uiManager.currentLayout = layoutId;
    this.uiSettings.layout = layout;

    this.applyLayout(layout);
    this.app.fire('ui:layout_changed', { layout });
    Logger.info(`Changed layout to: ${layoutId}`);
    return true;
  }

  private applyLayout(layout: UILayout): void {
    // Apply layout settings
    this.app.fire('ui:layout_applied', { layout });
  }

  public enableAccessibility(feature: string): boolean {
    return this.accessibilityManager.enableFeature(feature);
  }

  public disableAccessibility(feature: string): boolean {
    return this.accessibilityManager.disableFeature(feature);
  }

  public setLanguage(language: string): boolean {
    return this.localizationManager.setLanguage(language);
  }

  public getTranslation(key: string, params?: any): string {
    return this.localizationManager.getTranslation(key, params);
  }

  public createCustomTheme(theme: Omit<CustomTheme, 'id'>): CustomTheme {
    return this.customizationManager.createTheme(theme);
  }

  public createCustomLayout(layout: Omit<CustomLayout, 'id'>): CustomLayout {
    return this.customizationManager.createLayout(layout);
  }

  public getUISettings(): UISettings {
    return this.uiSettings;
  }

  public getUIComponent(componentId: string): UIComponent | undefined {
    return this.uiManager.components.get(componentId);
  }

  public getUIComponents(): UIComponent[] {
    return Array.from(this.uiManager.components.values());
  }

  public getThemes(): CustomTheme[] {
    return Array.from(this.uiManager.themes.values());
  }

  public getLayouts(): UILayout[] {
    return Array.from(this.uiManager.layouts.values());
  }

  public destroy(): void {
    this.uiManager.components.clear();
    this.uiManager.layouts.clear();
    this.uiManager.themes.clear();
  }
}

class AccessibilityManager {
  private features: Map<string, boolean> = new Map();

  public enableFeature(feature: string): boolean {
    this.features.set(feature, true);
    Logger.info(`Enabled accessibility feature: ${feature}`);
    return true;
  }

  public disableFeature(feature: string): boolean {
    this.features.set(feature, false);
    Logger.info(`Disabled accessibility feature: ${feature}`);
    return false;
  }

  public isFeatureEnabled(feature: string): boolean {
    return this.features.get(feature) || false;
  }
}

class CustomizationManager {
  private themes: Map<string, CustomTheme> = new Map();
  private layouts: Map<string, CustomLayout> = new Map();

  public createTheme(theme: Omit<CustomTheme, 'id'>): CustomTheme {
    const customTheme: CustomTheme = {
      ...theme,
      id: `theme_${Date.now()}`
    };

    this.themes.set(customTheme.id, customTheme);
    Logger.info(`Created custom theme: ${customTheme.name}`);
    return customTheme;
  }

  public createLayout(layout: Omit<CustomLayout, 'id'>): CustomLayout {
    const customLayout: CustomLayout = {
      ...layout,
      id: `layout_${Date.now()}`
    };

    this.layouts.set(customLayout.id, customLayout);
    Logger.info(`Created custom layout: ${customLayout.name}`);
    return customLayout;
  }
}

class LocalizationManager {
  private currentLanguage: string = 'en';
  private translations: Map<string, any> = new Map();

  public setLanguage(language: string): boolean {
    this.currentLanguage = language;
    Logger.info(`Changed language to: ${language}`);
    return true;
  }

  public getTranslation(key: string, params?: any): string {
    const translation = this.translations.get(`${this.currentLanguage}.${key}`);
    if (!translation) {
      return key; // Return key if translation not found
    }

    if (params) {
      return this.interpolateTranslation(translation, params);
    }

    return translation;
  }

  private interpolateTranslation(translation: string, params: any): string {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] || match;
    });
  }
}

class UIEventSystem {
  public addEventListener(componentId: string, event: string, handler: Function): void {
    // Add event listener to component
  }

  public removeEventListener(componentId: string, event: string, handler: Function): void {
    // Remove event listener from component
  }

  public dispatchEvent(componentId: string, event: string, data: any): void {
    // Dispatch event to component
  }
}

class UIRenderer {
  public renderComponent(component: UIComponent): void {
    // Render UI component
  }

  public updateComponent(component: UIComponent): void {
    // Update UI component
  }
}

class UIAnimator {
  public animateComponent(component: UIComponent, animation: string, duration: number): void {
    // Animate UI component
  }

  public stopAnimation(component: UIComponent): void {
    // Stop component animation
  }
}