export interface MobileConfig {
  // Performance
  targetFPS: number;
  maxParticles: number;
  maxEffects: number;
  textureQuality: 'low' | 'medium' | 'high';
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  postProcessing: boolean;
  
  // Controls
  touchControls: boolean;
  virtualJoystick: boolean;
  buttonSize: 'small' | 'medium' | 'large';
  buttonSpacing: number;
  hapticFeedback: boolean;
  
  // UI
  uiScale: number;
  fontSize: 'small' | 'medium' | 'large';
  simplifiedUI: boolean;
  autoHideUI: boolean;
  
  // Battery
  batterySaver: boolean;
  backgroundPause: boolean;
  lowPowerMode: boolean;
  
  // Network
  dataSaver: boolean;
  wifiOnly: boolean;
  compressionLevel: number;
}

export interface DeviceCapabilities {
  platform: 'ios' | 'android' | 'desktop';
  memory: number;
  gpu: string;
  screenSize: { width: number; height: number };
  pixelRatio: number;
  touchSupport: boolean;
  hapticSupport: boolean;
  webglVersion: number;
  performance: 'low' | 'medium' | 'high';
}

export class MobileOptimizer {
  private config: MobileConfig;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private isInitialized = false;
  private performanceMonitor: PerformanceMonitor;
  private adaptiveQuality: AdaptiveQualityManager;

  constructor() {
    this.config = this.getDefaultConfig();
    this.performanceMonitor = new PerformanceMonitor();
    this.adaptiveQuality = new AdaptiveQualityManager();
  }

  private getDefaultConfig(): MobileConfig {
    return {
      // Performance
      targetFPS: 60,
      maxParticles: 50,
      maxEffects: 10,
      textureQuality: 'medium',
      shadowQuality: 'low',
      postProcessing: false,
      
      // Controls
      touchControls: true,
      virtualJoystick: true,
      buttonSize: 'medium',
      buttonSpacing: 10,
      hapticFeedback: true,
      
      // UI
      uiScale: 1.0,
      fontSize: 'medium',
      simplifiedUI: false,
      autoHideUI: true,
      
      // Battery
      batterySaver: false,
      backgroundPause: true,
      lowPowerMode: false,
      
      // Network
      dataSaver: false,
      wifiOnly: false,
      compressionLevel: 5
    };
  }

  public async initialize(): Promise<void> {
    this.deviceCapabilities = await this.detectDeviceCapabilities();
    this.optimizeForDevice();
    this.setupPerformanceMonitoring();
    this.setupBatteryMonitoring();
    this.setupNetworkMonitoring();
    this.isInitialized = true;
  }

  private async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobile = isIOS || isAndroid || /mobile/.test(userAgent);

    const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
    
    // Detect memory (approximate)
    const memory = (navigator as any).deviceMemory || 4;
    
    // Detect GPU
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const gpu = gl ? this.getGPUVendor(gl) : 'unknown';
    
    // Detect screen size
    const screenSize = {
      width: window.screen.width,
      height: window.screen.height
    };
    
    // Detect pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Detect touch support
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detect haptic support
    const hapticSupport = 'vibrate' in navigator;
    
    // Detect WebGL version
    const webglVersion = gl ? 1 : 0;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglVersion = 2; // Assume WebGL 2 if debug info is available
      }
    }
    
    // Determine performance tier
    let performance: 'low' | 'medium' | 'high' = 'medium';
    if (memory < 2 || pixelRatio > 2) {
      performance = 'low';
    } else if (memory > 6 && webglVersion >= 2) {
      performance = 'high';
    }

    return {
      platform,
      memory,
      gpu,
      screenSize,
      pixelRatio,
      touchSupport,
      hapticSupport,
      webglVersion,
      performance
    };
  }

  private getGPUVendor(gl: WebGLRenderingContext): string {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    return 'unknown';
  }

  private optimizeForDevice(): void {
    if (!this.deviceCapabilities) return;

    const { platform, performance, memory, screenSize } = this.deviceCapabilities;

    // Adjust performance settings based on device capabilities
    if (performance === 'low') {
      this.config.targetFPS = 30;
      this.config.maxParticles = 20;
      this.config.maxEffects = 5;
      this.config.textureQuality = 'low';
      this.config.shadowQuality = 'off';
      this.config.postProcessing = false;
      this.config.simplifiedUI = true;
      this.config.batterySaver = true;
    } else if (performance === 'high') {
      this.config.targetFPS = 60;
      this.config.maxParticles = 100;
      this.config.maxEffects = 20;
      this.config.textureQuality = 'high';
      this.config.shadowQuality = 'medium';
      this.config.postProcessing = true;
    }

    // Platform-specific optimizations
    if (platform === 'ios') {
      this.config.hapticFeedback = true;
      this.config.backgroundPause = true;
      this.config.dataSaver = true;
    } else if (platform === 'android') {
      this.config.virtualJoystick = true;
      this.config.autoHideUI = true;
    }

    // Screen size optimizations
    if (screenSize.width < 768) {
      this.config.buttonSize = 'large';
      this.config.uiScale = 1.2;
      this.config.fontSize = 'large';
    } else if (screenSize.width > 1200) {
      this.config.buttonSize = 'small';
      this.config.uiScale = 0.8;
    }
  }

  private setupPerformanceMonitoring(): void {
    this.performanceMonitor.onPerformanceChange = (level) => {
      this.adaptiveQuality.adjustQuality(level);
    };
  }

  private setupBatteryMonitoring(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryStatus = () => {
          if (battery.level < 0.2) {
            this.enableBatterySaver();
          } else if (battery.level > 0.5) {
            this.disableBatterySaver();
          }
        };

        battery.addEventListener('levelchange', updateBatteryStatus);
        updateBatteryStatus();
      });
    }
  }

  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateNetworkStatus = () => {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.enableDataSaver();
        } else if (connection.effectiveType === '4g') {
          this.disableDataSaver();
        }
      };

      connection.addEventListener('change', updateNetworkStatus);
      updateNetworkStatus();
    }
  }

  public enableBatterySaver(): void {
    this.config.batterySaver = true;
    this.config.lowPowerMode = true;
    this.config.targetFPS = 30;
    this.config.maxParticles = 10;
    this.config.maxEffects = 3;
    this.config.postProcessing = false;
    this.config.shadowQuality = 'off';
    this.applyConfig();
  }

  public disableBatterySaver(): void {
    this.config.batterySaver = false;
    this.config.lowPowerMode = false;
    this.applyConfig();
  }

  public enableDataSaver(): void {
    this.config.dataSaver = true;
    this.config.wifiOnly = true;
    this.config.compressionLevel = 9;
    this.applyConfig();
  }

  public disableDataSaver(): void {
    this.config.dataSaver = false;
    this.config.wifiOnly = false;
    this.config.compressionLevel = 5;
    this.applyConfig();
  }

  public setTouchControls(enabled: boolean): void {
    this.config.touchControls = enabled;
    this.applyConfig();
  }

  public setVirtualJoystick(enabled: boolean): void {
    this.config.virtualJoystick = enabled;
    this.applyConfig();
  }

  public setButtonSize(size: 'small' | 'medium' | 'large'): void {
    this.config.buttonSize = size;
    this.applyConfig();
  }

  public setUIScale(scale: number): void {
    this.config.uiScale = Math.max(0.5, Math.min(2.0, scale));
    this.applyConfig();
  }

  public setSimplifiedUI(enabled: boolean): void {
    this.config.simplifiedUI = enabled;
    this.applyConfig();
  }

  private applyConfig(): void {
    if (!this.isInitialized) return;

    // Apply performance settings
    this.applyPerformanceSettings();
    
    // Apply control settings
    this.applyControlSettings();
    
    // Apply UI settings
    this.applyUISettings();
    
    // Apply network settings
    this.applyNetworkSettings();
  }

  private applyPerformanceSettings(): void {
    const root = document.documentElement;
    
    root.style.setProperty('--target-fps', this.config.targetFPS.toString());
    root.style.setProperty('--max-particles', this.config.maxParticles.toString());
    root.style.setProperty('--max-effects', this.config.maxEffects.toString());
    root.style.setProperty('--texture-quality', this.config.textureQuality);
    root.style.setProperty('--shadow-quality', this.config.shadowQuality);
    root.style.setProperty('--post-processing', this.config.postProcessing ? '1' : '0');
  }

  private applyControlSettings(): void {
    const root = document.documentElement;
    
    root.style.setProperty('--touch-controls', this.config.touchControls ? '1' : '0');
    root.style.setProperty('--virtual-joystick', this.config.virtualJoystick ? '1' : '0');
    root.style.setProperty('--button-size', this.config.buttonSize);
    root.style.setProperty('--button-spacing', `${this.config.buttonSpacing}px`);
    root.style.setProperty('--haptic-feedback', this.config.hapticFeedback ? '1' : '0');
  }

  private applyUISettings(): void {
    const root = document.documentElement;
    
    root.style.setProperty('--ui-scale', this.config.uiScale.toString());
    root.style.setProperty('--font-size', this.config.fontSize);
    root.style.setProperty('--simplified-ui', this.config.simplifiedUI ? '1' : '0');
    root.style.setProperty('--auto-hide-ui', this.config.autoHideUI ? '1' : '0');
  }

  private applyNetworkSettings(): void {
    // This would integrate with the networking system
    console.log('Applying network settings:', {
      dataSaver: this.config.dataSaver,
      wifiOnly: this.config.wifiOnly,
      compressionLevel: this.config.compressionLevel
    });
  }

  public getConfig(): MobileConfig {
    return { ...this.config };
  }

  public getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  public isMobile(): boolean {
    return this.deviceCapabilities?.platform === 'ios' || this.deviceCapabilities?.platform === 'android';
  }

  public isLowEndDevice(): boolean {
    return this.deviceCapabilities?.performance === 'low';
  }

  public getRecommendedSettings(): Partial<MobileConfig> {
    if (!this.deviceCapabilities) return {};

    const { performance, memory, screenSize } = this.deviceCapabilities;

    if (performance === 'low') {
      return {
        targetFPS: 30,
        maxParticles: 20,
        textureQuality: 'low',
        shadowQuality: 'off',
        postProcessing: false,
        simplifiedUI: true,
        batterySaver: true
      };
    } else if (performance === 'high') {
      return {
        targetFPS: 60,
        maxParticles: 100,
        textureQuality: 'high',
        shadowQuality: 'medium',
        postProcessing: true,
        simplifiedUI: false,
        batterySaver: false
      };
    }

    return {};
  }

  public exportConfig(): string {
    return JSON.stringify(this.config);
  }

  public importConfig(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.config = { ...this.config, ...parsed };
      this.applyConfig();
      return true;
    } catch (error) {
      console.error('Failed to import mobile config:', error);
      return false;
    }
  }
}

class PerformanceMonitor {
  private fps: number = 60;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private performanceLevel: 'low' | 'medium' | 'high' = 'medium';
  public onPerformanceChange?: (level: 'low' | 'medium' | 'high') => void;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    const monitor = (currentTime: number) => {
      this.frameCount++;
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        this.updatePerformanceLevel();
      }
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  private updatePerformanceLevel(): void {
    const newLevel = this.fps < 30 ? 'low' : this.fps < 50 ? 'medium' : 'high';
    
    if (newLevel !== this.performanceLevel) {
      this.performanceLevel = newLevel;
      this.onPerformanceChange?.(newLevel);
    }
  }

  public getFPS(): number {
    return this.fps;
  }

  public getPerformanceLevel(): 'low' | 'medium' | 'high' {
    return this.performanceLevel;
  }
}

class AdaptiveQualityManager {
  public adjustQuality(level: 'low' | 'medium' | 'high'): void {
    // This would adjust various quality settings based on performance
    console.log(`Adjusting quality to: ${level}`);
  }
}