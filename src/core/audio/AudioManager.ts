import type * as pc from 'playcanvas';

export interface AudioClip {
  name: string;
  url: string;
  volume: number;
  pitch: number;
  loop: boolean;
  category: 'sfx' | 'music' | 'voice' | 'ambient';
  priority: number;
}

export interface AudioBus {
  name: string;
  volume: number;
  muted: boolean;
  effects: AudioEffect[];
}

export interface AudioEffect {
  type: 'lowpass' | 'highpass' | 'reverb' | 'distortion' | 'chorus';
  params: Record<string, number>;
}

export class AudioManager {
  private app: pc.Application;
  private audioContext: AudioContext | null = null;
  private masterVolume = 1.0;
  private buses: Map<string, AudioBus> = new Map();
  private clips: Map<string, AudioClip> = new Map();
  private playingSounds: Map<string, AudioBufferSourceNode> = new Map();
  private musicNode: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeAudioContext();
    this.setupAudioBuses();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.masterVolume;

      // Create bus gain nodes
      this.sfxGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.voiceGain = this.audioContext.createGain();
      this.ambientGain = this.audioContext.createGain();

      // Connect buses to master
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.voiceGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);

      this.isInitialized = true;
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private setupAudioBuses(): void {
    this.buses.set('master', {
      name: 'master',
      volume: 1.0,
      muted: false,
      effects: []
    });

    this.buses.set('sfx', {
      name: 'sfx',
      volume: 0.8,
      muted: false,
      effects: []
    });

    this.buses.set('music', {
      name: 'music',
      volume: 0.6,
      muted: false,
      effects: []
    });

    this.buses.set('voice', {
      name: 'voice',
      volume: 0.9,
      muted: false,
      effects: []
    });

    this.buses.set('ambient', {
      name: 'ambient',
      volume: 0.5,
      muted: false,
      effects: []
    });
  }

  public async loadAudioClip(clip: AudioClip): Promise<void> {
    if (!this.audioContext) {
      console.error('Audio context not initialized');
      return;
    }

    try {
      const response = await fetch(clip.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.clips.set(clip.name, {
        ...clip,
        audioBuffer
      } as any);

      console.log(`Loaded audio clip: ${clip.name}`);
    } catch (error) {
      console.error(`Failed to load audio clip ${clip.name}:`, error);
    }
  }

  public async loadAudioClips(clips: AudioClip[]): Promise<void> {
    const loadPromises = clips.map(clip => this.loadAudioClip(clip));
    await Promise.all(loadPromises);
  }

  public playSound(soundName: string, options: {
    volume?: number;
    pitch?: number;
    loop?: boolean;
    fadeIn?: number;
  } = {}): string | null {
    if (!this.audioContext || !this.isInitialized) {
      console.warn('Audio system not initialized');
      return null;
    }

    const clip = this.clips.get(soundName);
    if (!clip) {
      console.warn(`Audio clip not found: ${soundName}`);
      return null;
    }

    const soundId = `${soundName}_${Date.now()}_${Math.random()}`;
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = (clip as any).audioBuffer;
    source.playbackRate.value = options.pitch || clip.pitch || 1.0;
    source.loop = options.loop || clip.loop || false;

    // Set volume
    const bus = this.buses.get(clip.category);
    const busVolume = bus ? (bus.muted ? 0 : bus.volume) : 1.0;
    const finalVolume = (options.volume || clip.volume || 1.0) * busVolume * this.masterVolume;
    gainNode.gain.value = finalVolume;

    // Connect to appropriate bus
    const targetGain = this.getGainNodeForCategory(clip.category);
    if (targetGain) {
      source.connect(gainNode);
      gainNode.connect(targetGain);
    }

    // Fade in if specified
    if (options.fadeIn && options.fadeIn > 0) {
      gainNode.gain.value = 0;
      gainNode.gain.linearRampToValueAtTime(finalVolume, this.audioContext.currentTime + options.fadeIn);
    }

    source.start();
    this.playingSounds.set(soundId, source);

    // Clean up when finished
    source.onended = () => {
      this.playingSounds.delete(soundId);
    };

    return soundId;
  }

  public stopSound(soundId: string, fadeOut: number = 0): void {
    const source = this.playingSounds.get(soundId);
    if (!source) return;

    if (fadeOut > 0 && this.audioContext) {
      const gainNode = source.context.createGain();
      gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOut);
      source.stop(this.audioContext.currentTime + fadeOut);
    } else {
      source.stop();
    }

    this.playingSounds.delete(soundId);
  }

  public playMusic(musicName: string, options: {
    volume?: number;
    loop?: boolean;
    fadeIn?: number;
  } = {}): void {
    // Stop current music
    this.stopMusic();

    if (!this.audioContext || !this.isInitialized) return;

    const clip = this.clips.get(musicName);
    if (!clip || clip.category !== 'music') {
      console.warn(`Music clip not found: ${musicName}`);
      return;
    }

    this.musicNode = this.audioContext.createBufferSource();
    this.musicGain = this.audioContext.createGain();

    this.musicNode.buffer = (clip as any).audioBuffer;
    this.musicNode.loop = options.loop !== false;
    this.musicNode.playbackRate.value = clip.pitch || 1.0;

    const bus = this.buses.get('music');
    const busVolume = bus ? (bus.muted ? 0 : bus.volume) : 1.0;
    const finalVolume = (options.volume || clip.volume || 1.0) * busVolume * this.masterVolume;
    this.musicGain.gain.value = finalVolume;

    this.musicNode.connect(this.musicGain);
    this.musicGain.connect(this.masterGain);

    // Fade in if specified
    if (options.fadeIn && options.fadeIn > 0) {
      this.musicGain.gain.value = 0;
      this.musicGain.gain.linearRampToValueAtTime(finalVolume, this.audioContext.currentTime + options.fadeIn);
    }

    this.musicNode.start();
  }

  public stopMusic(fadeOut: number = 1.0): void {
    if (!this.musicNode || !this.audioContext) return;

    if (fadeOut > 0 && this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, this.audioContext.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOut);
      this.musicNode.stop(this.audioContext.currentTime + fadeOut);
    } else {
      this.musicNode.stop();
    }

    this.musicNode = null;
    this.musicGain = null;
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  public setBusVolume(busName: string, volume: number): void {
    const bus = this.buses.get(busName);
    if (bus) {
      bus.volume = Math.max(0, Math.min(1, volume));
      this.updateBusGain(busName);
    }
  }

  public setBusMuted(busName: string, muted: boolean): void {
    const bus = this.buses.get(busName);
    if (bus) {
      bus.muted = muted;
      this.updateBusGain(busName);
    }
  }

  private updateBusGain(busName: string): void {
    const bus = this.buses.get(busName);
    if (!bus) return;

    const gainNode = this.getGainNodeForCategory(busName as any);
    if (gainNode) {
      gainNode.gain.value = bus.muted ? 0 : bus.volume * this.masterVolume;
    }
  }

  private getGainNodeForCategory(category: string): GainNode | null {
    switch (category) {
      case 'sfx': return this.sfxGain;
      case 'music': return this.musicGain;
      case 'voice': return this.voiceGain;
      case 'ambient': return this.ambientGain;
      default: return null;
    }
  }

  public addAudioEffect(busName: string, effect: AudioEffect): void {
    const bus = this.buses.get(busName);
    if (bus) {
      bus.effects.push(effect);
      this.applyEffectsToBus(busName);
    }
  }

  private applyEffectsToBus(busName: string): void {
    const bus = this.buses.get(busName);
    if (!bus || !this.audioContext) return;

    const gainNode = this.getGainNodeForCategory(busName);
    if (!gainNode) return;

    // Clear existing effects
    gainNode.disconnect();

    let currentNode: AudioNode = gainNode;

    // Apply effects in order
    for (const effect of bus.effects) {
      const effectNode = this.createEffectNode(effect);
      if (effectNode) {
        currentNode.connect(effectNode);
        currentNode = effectNode;
      }
    }

    // Connect to master
    currentNode.connect(this.masterGain!);
  }

  private createEffectNode(effect: AudioEffect): AudioNode | null {
    if (!this.audioContext) return null;

    switch (effect.type) {
      case 'lowpass':
        const lowpass = this.audioContext.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = effect.params.frequency || 1000;
        lowpass.Q.value = effect.params.Q || 1;
        return lowpass;

      case 'highpass':
        const highpass = this.audioContext.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = effect.params.frequency || 1000;
        highpass.Q.value = effect.params.Q || 1;
        return highpass;

      case 'reverb':
        const reverb = this.audioContext.createConvolver();
        // Create a simple reverb impulse response
        const length = this.audioContext.sampleRate * 2;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const channelData = impulse.getChannelData(channel);
          for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
          }
        }
        reverb.buffer = impulse;
        return reverb;

      default:
        return null;
    }
  }

  public stopAllSounds(): void {
    for (const [soundId, source] of this.playingSounds) {
      source.stop();
    }
    this.playingSounds.clear();
    this.stopMusic();
  }

  public getPlayingSounds(): string[] {
    return Array.from(this.playingSounds.keys());
  }

  public isPlaying(soundName: string): boolean {
    return Array.from(this.playingSounds.keys()).some(id => id.startsWith(soundName));
  }

  public destroy(): void {
    this.stopAllSounds();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}