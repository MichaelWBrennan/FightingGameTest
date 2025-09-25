export interface AccessibilitySettings {
  // Visual
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
  uiScale: number;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  colorSaturation: number;
  brightness: number;
  contrast: number;
  
  // Audio
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  voiceVolume: number;
  audioDescription: boolean;
  visualAudioCues: boolean;
  monoAudio: boolean;
  
  // Input
  inputRemapping: Map<string, string>;
  inputSensitivity: number;
  inputDeadzone: number;
  autoRepeat: boolean;
  holdToRepeat: boolean;
  oneHandedMode: boolean;
  
  // Cognitive
  simplifiedUI: boolean;
  reducedMotion: boolean;
  pauseOnFocus: boolean;
  tutorialHints: boolean;
  confirmationDialogs: boolean;
  
  // Motor
  buttonHoldTime: number;
  doubleClickTime: number;
  stickyKeys: boolean;
  slowKeys: boolean;
  bounceKeys: boolean;
  
  // Reading
  textToSpeech: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVoice: string;
  subtitles: boolean;
  subtitleSize: 'small' | 'medium' | 'large';
  subtitleBackground: boolean;
  subtitleOutline: boolean;
}

export interface ColorBlindFilter {
  name: string;
  matrix: number[][];
}

export class AccessibilityManager {
  private settings: AccessibilitySettings;
  private colorBlindFilters: Map<string, ColorBlindFilter> = new Map();
  private isInitialized = false;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.initializeColorBlindFilters();
  }

  private getDefaultSettings(): AccessibilitySettings {
    return {
      // Visual
      colorBlindMode: 'none',
      highContrast: false,
      uiScale: 1.0,
      fontSize: 'medium',
      colorSaturation: 1.0,
      brightness: 1.0,
      contrast: 1.0,
      
      // Audio
      masterVolume: 1.0,
      sfxVolume: 1.0,
      musicVolume: 0.8,
      voiceVolume: 1.0,
      audioDescription: false,
      visualAudioCues: false,
      monoAudio: false,
      
      // Input
      inputRemapping: new Map(),
      inputSensitivity: 1.0,
      inputDeadzone: 0.1,
      autoRepeat: true,
      holdToRepeat: false,
      oneHandedMode: false,
      
      // Cognitive
      simplifiedUI: false,
      reducedMotion: false,
      pauseOnFocus: true,
      tutorialHints: true,
      confirmationDialogs: true,
      
      // Motor
      buttonHoldTime: 500,
      doubleClickTime: 300,
      stickyKeys: false,
      slowKeys: false,
      bounceKeys: false,
      
      // Reading
      textToSpeech: false,
      ttsRate: 1.0,
      ttsPitch: 1.0,
      ttsVoice: 'default',
      subtitles: true,
      subtitleSize: 'medium',
      subtitleBackground: true,
      subtitleOutline: true
    };
  }

  private initializeColorBlindFilters(): void {
    this.colorBlindFilters.set('protanopia', {
      name: 'Protanopia',
      matrix: [
        [0.567, 0.433, 0],
        [0.558, 0.442, 0],
        [0, 0.242, 0.758]
      ]
    });

    this.colorBlindFilters.set('deuteranopia', {
      name: 'Deuteranopia',
      matrix: [
        [0.625, 0.375, 0],
        [0.7, 0.3, 0],
        [0, 0.3, 0.7]
      ]
    });

    this.colorBlindFilters.set('tritanopia', {
      name: 'Tritanopia',
      matrix: [
        [0.95, 0.05, 0],
        [0, 0.433, 0.567],
        [0, 0.475, 0.525]
      ]
    });
  }

  public initialize(): void {
    this.loadSettings();
    this.applySettings();
    this.isInitialized = true;
  }

  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
    this.saveSettings();
  }

  public resetSettings(): void {
    this.settings = this.getDefaultSettings();
    this.applySettings();
    this.saveSettings();
  }

  private applySettings(): void {
    this.applyVisualSettings();
    this.applyAudioSettings();
    this.applyInputSettings();
    this.applyCognitiveSettings();
    this.applyMotorSettings();
    this.applyReadingSettings();
  }

  private applyVisualSettings(): void {
    const root = document.documentElement;
    
    // Color blind mode
    if (this.settings.colorBlindMode !== 'none') {
      const filter = this.colorBlindFilters.get(this.settings.colorBlindMode);
      if (filter) {
        root.style.filter = `url(#colorBlindFilter)`;
        this.createColorBlindSVGFilter(filter);
      }
    } else {
      root.style.filter = 'none';
    }

    // High contrast
    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // UI Scale
    root.style.setProperty('--ui-scale', this.settings.uiScale.toString());

    // Font size
    const fontSizeMap = {
      small: '12px',
      medium: '16px',
      large: '20px',
      xlarge: '24px'
    };
    root.style.setProperty('--font-size', fontSizeMap[this.settings.fontSize]);

    // Color saturation
    root.style.setProperty('--color-saturation', this.settings.colorSaturation.toString());

    // Brightness and contrast
    root.style.setProperty('--brightness', this.settings.brightness.toString());
    root.style.setProperty('--contrast', this.settings.contrast.toString());
  }

  private applyAudioSettings(): void {
    // These would be applied to the audio system
    console.log('Applying audio settings:', {
      masterVolume: this.settings.masterVolume,
      sfxVolume: this.settings.sfxVolume,
      musicVolume: this.settings.musicVolume,
      voiceVolume: this.settings.voiceVolume
    });
  }

  private applyInputSettings(): void {
    // These would be applied to the input system
    console.log('Applying input settings:', {
      inputSensitivity: this.settings.inputSensitivity,
      inputDeadzone: this.settings.inputDeadzone,
      oneHandedMode: this.settings.oneHandedMode
    });
  }

  private applyCognitiveSettings(): void {
    const root = document.documentElement;
    
    // Simplified UI
    if (this.settings.simplifiedUI) {
      root.classList.add('simplified-ui');
    } else {
      root.classList.remove('simplified-ui');
    }

    // Reduced motion
    if (this.settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }

  private applyMotorSettings(): void {
    // These would be applied to the input system
    console.log('Applying motor settings:', {
      buttonHoldTime: this.settings.buttonHoldTime,
      doubleClickTime: this.settings.doubleClickTime,
      stickyKeys: this.settings.stickyKeys
    });
  }

  private applyReadingSettings(): void {
    const root = document.documentElement;
    
    // Subtitles
    if (this.settings.subtitles) {
      root.classList.add('subtitles-enabled');
    } else {
      root.classList.remove('subtitles-enabled');
    }

    // Subtitle size
    const subtitleSizeMap = {
      small: '14px',
      medium: '18px',
      large: '22px'
    };
    root.style.setProperty('--subtitle-size', subtitleSizeMap[this.settings.subtitleSize]);

    // Subtitle background and outline
    if (this.settings.subtitleBackground) {
      root.classList.add('subtitle-background');
    } else {
      root.classList.remove('subtitle-background');
    }

    if (this.settings.subtitleOutline) {
      root.classList.add('subtitle-outline');
    } else {
      root.classList.remove('subtitle-outline');
    }
  }

  private createColorBlindSVGFilter(filter: ColorBlindFilter): void {
    let svgFilter = document.getElementById('colorBlindFilter');
    if (svgFilter) {
      svgFilter.remove();
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.id = 'colorBlindFilter';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const colorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    colorMatrix.setAttribute('type', 'matrix');
    colorMatrix.setAttribute('values', filter.matrix.flat().join(' '));

    defs.appendChild(colorMatrix);
    svg.appendChild(defs);
    document.body.appendChild(svg);
  }

  public speakText(text: string, priority: 'low' | 'normal' | 'high' = 'normal'): void {
    if (!this.settings.textToSpeech) return;

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.settings.ttsRate;
      utterance.pitch = this.settings.ttsPitch;
      
      if (this.settings.ttsVoice !== 'default') {
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === this.settings.ttsVoice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      speechSynthesis.speak(utterance);
    }
  }

  public showSubtitle(text: string, duration: number = 3000): void {
    if (!this.settings.subtitles) return;

    // Create subtitle element
    const subtitle = document.createElement('div');
    subtitle.className = 'subtitle';
    subtitle.textContent = text;
    subtitle.style.position = 'fixed';
    subtitle.style.bottom = '20px';
    subtitle.style.left = '50%';
    subtitle.style.transform = 'translateX(-50%)';
    subtitle.style.color = 'white';
    subtitle.style.fontSize = this.settings.subtitleSize === 'small' ? '14px' : 
                             this.settings.subtitleSize === 'large' ? '22px' : '18px';
    subtitle.style.textAlign = 'center';
    subtitle.style.zIndex = '10000';
    subtitle.style.pointerEvents = 'none';

    if (this.settings.subtitleBackground) {
      subtitle.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      subtitle.style.padding = '8px 16px';
      subtitle.style.borderRadius = '4px';
    }

    if (this.settings.subtitleOutline) {
      subtitle.style.textShadow = '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black';
    }

    document.body.appendChild(subtitle);

    // Remove after duration
    setTimeout(() => {
      if (subtitle.parentNode) {
        subtitle.parentNode.removeChild(subtitle);
      }
    }, duration);
  }

  public createVisualAudioCue(sound: string, position: { x: number; y: number }): void {
    if (!this.settings.visualAudioCues) return;

    // Create visual indicator for audio cue
    const cue = document.createElement('div');
    cue.className = 'audio-cue';
    cue.style.position = 'fixed';
    cue.style.left = `${position.x}px`;
    cue.style.top = `${position.y}px`;
    cue.style.width = '20px';
    cue.style.height = '20px';
    cue.style.borderRadius = '50%';
    cue.style.backgroundColor = '#00D4FF';
    cue.style.border = '2px solid white';
    cue.style.zIndex = '10000';
    cue.style.pointerEvents = 'none';
    cue.style.animation = 'pulse 0.5s ease-out';

    document.body.appendChild(cue);

    setTimeout(() => {
      if (cue.parentNode) {
        cue.parentNode.removeChild(cue);
      }
    }, 500);
  }

  public isSettingEnabled(setting: keyof AccessibilitySettings): boolean {
    return Boolean(this.settings[setting]);
  }

  public getSettingValue<T>(setting: keyof AccessibilitySettings): T {
    return this.settings[setting] as T;
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('accessibility_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert inputRemapping back to Map
        if (parsed.inputRemapping) {
          parsed.inputRemapping = new Map(parsed.inputRemapping);
        }
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      const toSave = { ...this.settings };
      // Convert inputRemapping to array for JSON serialization
      toSave.inputRemapping = Array.from(toSave.inputRemapping.entries());
      localStorage.setItem('accessibility_settings', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }

  public exportSettings(): string {
    return JSON.stringify(this.settings);
  }

  public importSettings(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.settings = { ...this.settings, ...parsed };
      this.applySettings();
      this.saveSettings();
      return true;
    } catch (error) {
      console.error('Failed to import accessibility settings:', error);
      return false;
    }
  }
}