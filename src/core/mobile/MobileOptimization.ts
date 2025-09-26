import type { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';

export interface TouchControl {
  id: string;
  name: string;
  type: 'button' | 'joystick' | 'gesture' | 'swipe';
  position: { x: number; y: number; width: number; height: number };
  action: string;
  visual: {
    icon?: string;
    color?: string;
    opacity?: number;
    size?: number;
  };
  haptic: {
    enabled: boolean;
    intensity: number;
    duration: number;
  };
}

export interface MobileUI {
  id: string;
  name: string;
  type: 'hud' | 'menu' | 'overlay' | 'popup';
  position: { x: number; y: number; width: number; height: number };
  responsive: {
    breakpoints: { min: number; max: number; scale: number }[];
    orientation: 'portrait' | 'landscape' | 'both';
  };
  touch: {
    enabled: boolean;
    gestures: string[];
    haptic: boolean;
  };
}

export interface MobilePerformance {
  targetFPS: number;
  maxResolution: number;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
  optimizations: {
    textureCompression: boolean;
    meshSimplification: boolean;
    particleReduction: boolean;
    shadowQuality: 'off' | 'low' | 'medium' | 'high';
    postProcessing: boolean;
    antiAliasing: boolean;
  };
  battery: {
    powerSaving: boolean;
    adaptiveQuality: boolean;
    backgroundThrottling: boolean;
  };
}

export class MobileOptimization {
  private app: pc.Application;
  private touchControls: Map<string, TouchControl> = new Map();
  private mobileUI: Map<string, MobileUI> = new Map();
  private performance: MobilePerformance;
  private isMobile: boolean = false;
  private orientation: 'portrait' | 'landscape' = 'portrait';
  private screenSize: { width: number; height: number } = { width: 0, height: 0 };
  private touchEvents: Map<string, TouchEvent> = new Map();
  private gestureRecognizer: GestureRecognizer;

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeMobileOptimization();
  }

  private initializeMobileOptimization(): void {
    this.detectMobile();
    this.initializePerformance();
    this.initializeTouchControls();
    this.initializeMobileUI();
    this.initializeGestureRecognition();
    this.setupEventListeners();
  }

  private detectMobile(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    this.isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    if (this.isMobile) {
      Logger.info('Mobile device detected');
    }
  }

  private initializePerformance(): void {
    this.performance = {
      targetFPS: 60,
      maxResolution: 1080,
      qualityLevel: 'medium',
      optimizations: {
        textureCompression: true,
        meshSimplification: true,
        particleReduction: true,
        shadowQuality: 'low',
        postProcessing: false,
        antiAliasing: false
      },
      battery: {
        powerSaving: true,
        adaptiveQuality: true,
        backgroundThrottling: true
      }
    };

    // Adjust performance based on device capabilities
    this.adjustPerformanceForDevice();
  }

  private adjustPerformanceForDevice(): void {
    const canvas = this.app.graphicsDevice.canvas;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = canvas.width / devicePixelRatio;
    const screenHeight = canvas.height / devicePixelRatio;

    // Adjust quality based on screen size
    if (screenWidth < 768) {
      this.performance.qualityLevel = 'low';
      this.performance.maxResolution = 720;
      this.performance.optimizations.shadowQuality = 'off';
      this.performance.optimizations.postProcessing = false;
    } else if (screenWidth < 1024) {
      this.performance.qualityLevel = 'medium';
      this.performance.maxResolution = 1080;
      this.performance.optimizations.shadowQuality = 'low';
      this.performance.optimizations.postProcessing = false;
    } else {
      this.performance.qualityLevel = 'high';
      this.performance.maxResolution = 1440;
      this.performance.optimizations.shadowQuality = 'medium';
      this.performance.optimizations.postProcessing = true;
    }

    // Check for low-end device
    const memory = (navigator as any).deviceMemory || 4;
    if (memory < 4) {
      this.performance.qualityLevel = 'low';
      this.performance.optimizations.particleReduction = true;
      this.performance.optimizations.meshSimplification = true;
    }
  }

  private initializeTouchControls(): void {
    // Virtual Joystick
    this.touchControls.set('joystick', {
      id: 'joystick',
      name: 'Virtual Joystick',
      type: 'joystick',
      position: { x: 50, y: 300, width: 120, height: 120 },
      action: 'movement',
      visual: {
        icon: 'joystick',
        color: '#FFFFFF',
        opacity: 0.7,
        size: 120
      },
      haptic: {
        enabled: true,
        intensity: 0.3,
        duration: 50
      }
    });

    // Attack Buttons
    this.touchControls.set('light_punch', {
      id: 'light_punch',
      name: 'Light Punch',
      type: 'button',
      position: { x: 300, y: 400, width: 80, height: 80 },
      action: 'light_punch',
      visual: {
        icon: 'punch',
        color: '#FF6B6B',
        opacity: 0.8,
        size: 80
      },
      haptic: {
        enabled: true,
        intensity: 0.5,
        duration: 100
      }
    });

    this.touchControls.set('medium_punch', {
      id: 'medium_punch',
      name: 'Medium Punch',
      type: 'button',
      position: { x: 400, y: 400, width: 80, height: 80 },
      action: 'medium_punch',
      visual: {
        icon: 'punch',
        color: '#FF8E53',
        opacity: 0.8,
        size: 80
      },
      haptic: {
        enabled: true,
        intensity: 0.6,
        duration: 120
      }
    });

    this.touchControls.set('heavy_punch', {
      id: 'heavy_punch',
      name: 'Heavy Punch',
      type: 'button',
      position: { x: 500, y: 400, width: 80, height: 80 },
      action: 'heavy_punch',
      visual: {
        icon: 'punch',
        color: '#FF4757',
        opacity: 0.8,
        size: 80
      },
      haptic: {
        enabled: true,
        intensity: 0.7,
        duration: 150
      }
    });

    // Kick Buttons
    this.touchControls.set('light_kick', {
      id: 'light_kick',
      name: 'Light Kick',
      type: 'button',
      position: { x: 300, y: 500, width: 80, height: 80 },
      action: 'light_kick',
      visual: {
        icon: 'kick',
        color: '#4ECDC4',
        opacity: 0.8,
        size: 80
      },
      haptic: {
        enabled: true,
        intensity: 0.5,
        duration: 100
      }
    });

    this.touchControls.set('medium_kick', {
      id: 'medium_kick',
      name: 'Medium Kick',
      type: 'button',
      position: { x: 400, y: 500, width: 80, height: 80 },
      action: 'medium_kick',
      visual: {
        icon: 'kick',
        color: '#45B7D1',
        opacity: 0.8,
        size: 80
      },
      haptic: {
        enabled: true,
        intensity: 0.6,
        duration: 120
      }
    });

    this.touchControls.set('heavy_kick', {
      id: 'heavy_kick',
      name: 'Heavy Kick',
      type: 'button',
      position: { x: 500, y: 500, width: 80, height: 80 },
      action: 'heavy_kick',
      visual: {
        icon: 'kick',
        color: '#2E86AB',
        opacity: 0.8,
        size: 80
      },
      haptic: {
        enabled: true,
        intensity: 0.7,
        duration: 150
      }
    });

    // Special Move Buttons
    this.touchControls.set('hadoken', {
      id: 'hadoken',
      name: 'Hadoken',
      type: 'button',
      position: { x: 600, y: 400, width: 100, height: 60 },
      action: 'hadoken',
      visual: {
        icon: 'hadoken',
        color: '#FFD700',
        opacity: 0.9,
        size: 100
      },
      haptic: {
        enabled: true,
        intensity: 0.8,
        duration: 200
      }
    });

    this.touchControls.set('shoryuken', {
      id: 'shoryuken',
      name: 'Shoryuken',
      type: 'button',
      position: { x: 600, y: 480, width: 100, height: 60 },
      action: 'shoryuken',
      visual: {
        icon: 'shoryuken',
        color: '#FF6347',
        opacity: 0.9,
        size: 100
      },
      haptic: {
        enabled: true,
        intensity: 0.8,
        duration: 200
      }
    });

    this.touchControls.set('tatsumaki', {
      id: 'tatsumaki',
      name: 'Tatsumaki',
      type: 'button',
      position: { x: 600, y: 560, width: 100, height: 60 },
      action: 'tatsumaki',
      visual: {
        icon: 'tatsumaki',
        color: '#32CD32',
        opacity: 0.9,
        size: 100
      },
      haptic: {
        enabled: true,
        intensity: 0.8,
        duration: 200
      }
    });

    // Block Button
    this.touchControls.set('block', {
      id: 'block',
      name: 'Block',
      type: 'button',
      position: { x: 50, y: 500, width: 100, height: 60 },
      action: 'block',
      visual: {
        icon: 'block',
        color: '#9370DB',
        opacity: 0.8,
        size: 100
      },
      haptic: {
        enabled: true,
        intensity: 0.4,
        duration: 100
      }
    });
  }

  private initializeMobileUI(): void {
    // Health Bar
    this.mobileUI.set('health_bar', {
      id: 'health_bar',
      name: 'Health Bar',
      type: 'hud',
      position: { x: 20, y: 20, width: 300, height: 40 },
      responsive: {
        breakpoints: [
          { min: 0, max: 480, scale: 0.8 },
          { min: 481, max: 768, scale: 1.0 },
          { min: 769, max: 1024, scale: 1.2 }
        ],
        orientation: 'both'
      },
      touch: {
        enabled: false,
        gestures: [],
        haptic: false
      }
    });

    // Meter Bar
    this.mobileUI.set('meter_bar', {
      id: 'meter_bar',
      name: 'Meter Bar',
      type: 'hud',
      position: { x: 20, y: 70, width: 300, height: 20 },
      responsive: {
        breakpoints: [
          { min: 0, max: 480, scale: 0.8 },
          { min: 481, max: 768, scale: 1.0 },
          { min: 769, max: 1024, scale: 1.2 }
        ],
        orientation: 'both'
      },
      touch: {
        enabled: false,
        gestures: [],
        haptic: false
      }
    });

    // Pause Menu
    this.mobileUI.set('pause_menu', {
      id: 'pause_menu',
      name: 'Pause Menu',
      type: 'menu',
      position: { x: 0, y: 0, width: 100, height: 100 },
      responsive: {
        breakpoints: [
          { min: 0, max: 480, scale: 0.9 },
          { min: 481, max: 768, scale: 1.0 },
          { min: 769, max: 1024, scale: 1.1 }
        ],
        orientation: 'both'
      },
      touch: {
        enabled: true,
        gestures: ['tap'],
        haptic: true
      }
    });
  }

  private initializeGestureRecognition(): void {
    this.gestureRecognizer = new GestureRecognizer();
    this.gestureRecognizer.initialize();
  }

  private setupEventListeners(): void {
    // Orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    // Resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Touch events
    if (this.isMobile) {
      this.setupTouchEvents();
    }

    // Battery events
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          this.handleBatteryChange(battery.level);
        });
      });
    }
  }

  private setupTouchEvents(): void {
    const canvas = this.app.graphicsDevice.canvas;
    
    canvas.addEventListener('touchstart', (e) => {
      this.handleTouchStart(e);
    });

    canvas.addEventListener('touchmove', (e) => {
      this.handleTouchMove(e);
    });

    canvas.addEventListener('touchend', (e) => {
      this.handleTouchEnd(e);
    });

    canvas.addEventListener('touchcancel', (e) => {
      this.handleTouchCancel(e);
    });
  }

  private handleOrientationChange(): void {
    const isPortrait = window.innerHeight > window.innerWidth;
    this.orientation = isPortrait ? 'portrait' : 'landscape';
    
    this.updateUIForOrientation();
    this.updateControlsForOrientation();
    
    this.app.fire('mobile:orientation_changed', {
      orientation: this.orientation
    });
  }

  private handleResize(): void {
    this.screenSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    this.updateUIForScreenSize();
    this.updateControlsForScreenSize();
    
    this.app.fire('mobile:resize', {
      screenSize: this.screenSize
    });
  }

  private handleBatteryChange(level: number): void {
    if (level < 0.2) {
      // Low battery - enable power saving
      this.performance.battery.powerSaving = true;
      this.performance.qualityLevel = 'low';
      this.performance.optimizations.particleReduction = true;
    } else if (level < 0.5) {
      // Medium battery - reduce quality
      this.performance.qualityLevel = 'medium';
    } else {
      // High battery - normal quality
      this.performance.qualityLevel = 'high';
    }
    
    this.applyPerformanceSettings();
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    
    for (const touch of e.changedTouches) {
      const touchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        startTime: Date.now()
      };
      
      this.touchEvents.set(touch.identifier.toString(), touchPoint);
      
      // Check for control hits
      const control = this.getControlAtPosition(touch.clientX, touch.clientY);
      if (control) {
        this.activateControl(control, touch);
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    
    for (const touch of e.changedTouches) {
      const touchPoint = this.touchEvents.get(touch.identifier.toString());
      if (touchPoint) {
        touchPoint.x = touch.clientX;
        touchPoint.y = touch.clientY;
        
        // Handle joystick movement
        const joystick = this.touchControls.get('joystick');
        if (joystick && this.isPointInControl(touch.clientX, touch.clientY, joystick)) {
          this.handleJoystickMovement(touch, joystick);
        }
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    
    for (const touch of e.changedTouches) {
      const touchPoint = this.touchEvents.get(touch.identifier.toString());
      if (touchPoint) {
        // Check for gesture
        const gesture = this.gestureRecognizer.recognize(touchPoint);
        if (gesture) {
          this.handleGesture(gesture);
        }
        
        this.touchEvents.delete(touch.identifier.toString());
      }
    }
  }

  private handleTouchCancel(e: TouchEvent): void {
    e.preventDefault();
    
    for (const touch of e.changedTouches) {
      this.touchEvents.delete(touch.identifier.toString());
    }
  }

  private getControlAtPosition(x: number, y: number): TouchControl | null {
    for (const control of this.touchControls.values()) {
      if (this.isPointInControl(x, y, control)) {
        return control;
      }
    }
    return null;
  }

  private isPointInControl(x: number, y: number, control: TouchControl): boolean {
    const rect = control.position;
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }

  private activateControl(control: TouchControl, touch: Touch): void {
    // Trigger haptic feedback
    if (control.haptic.enabled && 'vibrate' in navigator) {
      (navigator as any).vibrate(control.haptic.duration);
    }
    
    // Emit control activation event
    this.app.fire('mobile:control_activated', {
      controlId: control.id,
      action: control.action,
      touch: {
        x: touch.clientX,
        y: touch.clientY
      }
    });
  }

  private handleJoystickMovement(touch: Touch, joystick: TouchControl): void {
    const rect = joystick.position;
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      const normalizedX = Math.cos(angle) * maxDistance;
      const normalizedY = Math.sin(angle) * maxDistance;
      
      this.app.fire('mobile:joystick_moved', {
        x: normalizedX / maxDistance,
        y: normalizedY / maxDistance,
        angle: angle
      });
    } else {
      this.app.fire('mobile:joystick_moved', {
        x: deltaX / maxDistance,
        y: deltaY / maxDistance,
        angle: Math.atan2(deltaY, deltaX)
      });
    }
  }

  private handleGesture(gesture: any): void {
    this.app.fire('mobile:gesture_recognized', {
      gesture: gesture.type,
      data: gesture.data
    });
  }

  private updateUIForOrientation(): void {
    // Update UI elements based on orientation
    for (const ui of this.mobileUI.values()) {
      if (ui.responsive.orientation === this.orientation || ui.responsive.orientation === 'both') {
        this.updateUIElement(ui);
      }
    }
  }

  private updateControlsForOrientation(): void {
    // Update control positions based on orientation
    if (this.orientation === 'landscape') {
      // Adjust control positions for landscape
      this.adjustControlsForLandscape();
    } else {
      // Adjust control positions for portrait
      this.adjustControlsForPortrait();
    }
  }

  private updateUIForScreenSize(): void {
    // Update UI elements based on screen size
    for (const ui of this.mobileUI.values()) {
      this.updateUIElement(ui);
    }
  }

  private updateControlsForScreenSize(): void {
    // Update control positions based on screen size
    this.adjustControlsForScreenSize();
  }

  private updateUIElement(ui: MobileUI): void {
    // Apply responsive scaling
    const scale = this.getScaleForScreenSize(ui.responsive.breakpoints);
    if (scale !== 1) {
      ui.position.x *= scale;
      ui.position.y *= scale;
      ui.position.width *= scale;
      ui.position.height *= scale;
    }
  }

  private getScaleForScreenSize(breakpoints: any[]): number {
    const screenWidth = this.screenSize.width;
    
    for (const breakpoint of breakpoints) {
      if (screenWidth >= breakpoint.min && screenWidth <= breakpoint.max) {
        return breakpoint.scale;
      }
    }
    
    return 1.0;
  }

  private adjustControlsForLandscape(): void {
    // Adjust control positions for landscape mode
    const joystick = this.touchControls.get('joystick');
    if (joystick) {
      joystick.position.x = 50;
      joystick.position.y = 200;
    }
    
    // Move attack buttons to the right side
    const attackButtons = ['light_punch', 'medium_punch', 'heavy_punch', 'light_kick', 'medium_kick', 'heavy_kick'];
    let x = 600;
    let y = 300;
    
    for (const buttonId of attackButtons) {
      const button = this.touchControls.get(buttonId);
      if (button) {
        button.position.x = x;
        button.position.y = y;
        x += 100;
        if (x > 800) {
          x = 600;
          y += 100;
        }
      }
    }
  }

  private adjustControlsForPortrait(): void {
    // Adjust control positions for portrait mode
    const joystick = this.touchControls.get('joystick');
    if (joystick) {
      joystick.position.x = 50;
      joystick.position.y = 300;
    }
    
    // Move attack buttons to the bottom
    const attackButtons = ['light_punch', 'medium_punch', 'heavy_punch', 'light_kick', 'medium_kick', 'heavy_kick'];
    let x = 300;
    let y = 400;
    
    for (const buttonId of attackButtons) {
      const button = this.touchControls.get(buttonId);
      if (button) {
        button.position.x = x;
        button.position.y = y;
        x += 100;
        if (x > 600) {
          x = 300;
          y += 100;
        }
      }
    }
  }

  private adjustControlsForScreenSize(): void {
    // Adjust control positions based on screen size
    const scale = this.getScaleForScreenSize([
      { min: 0, max: 480, scale: 0.8 },
      { min: 481, max: 768, scale: 1.0 },
      { min: 769, max: 1024, scale: 1.2 }
    ]);
    
    for (const control of this.touchControls.values()) {
      control.position.x *= scale;
      control.position.y *= scale;
      control.position.width *= scale;
      control.position.height *= scale;
    }
  }

  private applyPerformanceSettings(): void {
    // Apply performance settings to the game
    this.app.fire('mobile:performance_changed', {
      performance: this.performance
    });
  }

  public getTouchControls(): TouchControl[] {
    return Array.from(this.touchControls.values());
  }

  public getMobileUI(): MobileUI[] {
    return Array.from(this.mobileUI.values());
  }

  public getPerformance(): MobilePerformance {
    return this.performance;
  }

  public isMobileDevice(): boolean {
    return this.isMobile;
  }

  public getOrientation(): 'portrait' | 'landscape' {
    return this.orientation;
  }

  public getScreenSize(): { width: number; height: number } {
    return this.screenSize;
  }

  public destroy(): void {
    this.touchControls.clear();
    this.mobileUI.clear();
    this.touchEvents.clear();
  }
}

class GestureRecognizer {
  private gestures: Map<string, any> = new Map();

  public initialize(): void {
    // Initialize gesture recognition
    this.gestures.set('swipe_left', {
      type: 'swipe',
      direction: 'left',
      minDistance: 50,
      maxTime: 300
    });
    
    this.gestures.set('swipe_right', {
      type: 'swipe',
      direction: 'right',
      minDistance: 50,
      maxTime: 300
    });
    
    this.gestures.set('swipe_up', {
      type: 'swipe',
      direction: 'up',
      minDistance: 50,
      maxTime: 300
    });
    
    this.gestures.set('swipe_down', {
      type: 'swipe',
      direction: 'down',
      minDistance: 50,
      maxTime: 300
    });
  }

  public recognize(touchPoint: any): any {
    // Simple gesture recognition
    // This would implement more sophisticated gesture recognition
    return null;
  }
}