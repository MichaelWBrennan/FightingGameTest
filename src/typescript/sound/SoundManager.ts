
export class SoundManager {
    private audioContext: AudioContext;
    private bgmVolume: number = 1.0;
    private sfxVolume: number = 1.0;
    private currentBgm: AudioBufferSourceNode | null = null;
    private audioBuffers: Map<number, AudioBuffer> = new Map();
    private activeSounds: Map<string, AudioBufferSourceNode> = new Map();

    constructor() {
        this.audioContext = new AudioContext();
        this.initializeAudio();
    }

    private async initializeAudio(): Promise<void> {
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    public async loadSound(id: number, url: string): Promise<void> {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(id, audioBuffer);
        } catch (error) {
            console.error(`Failed to load sound ${id}:`, error);
        }
    }

    public bgmRequest(id: number): void {
        const audioBuffer = this.audioBuffers.get(id);
        if (!audioBuffer) {
            console.warn(`BGM ${id} not loaded`);
            return;
        }

        // Stop current BGM if playing
        if (this.currentBgm) {
            this.currentBgm.stop();
            this.currentBgm = null;
        }

        // Create and play new BGM
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.loop = true;
        gainNode.gain.value = this.bgmVolume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start();
        this.currentBgm = source;
    }

    public bgmStop(): void {
        if (this.currentBgm) {
            this.currentBgm.stop();
            this.currentBgm = null;
        }
    }

    public bgmHalfVolume(fadeTime: number): void {
        if (this.currentBgm) {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(this.bgmVolume, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.bgmVolume * 0.5, this.audioContext.currentTime + fadeTime);
        }
    }

    public bgmFadeOut(fadeTime: number): void {
        if (this.currentBgm) {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(this.bgmVolume, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
            
            setTimeout(() => {
                this.bgmStop();
            }, fadeTime * 1000);
        }
    }

    public playSE(id: number, volume: number = 1.0): string | null {
        const audioBuffer = this.audioBuffers.get(id);
        if (!audioBuffer) {
            console.warn(`Sound effect ${id} not loaded`);
            return null;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const soundId = `se_${id}_${Date.now()}`;

        source.buffer = audioBuffer;
        gainNode.gain.value = volume * this.sfxVolume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.onended = () => {
            this.activeSounds.delete(soundId);
        };

        source.start();
        this.activeSounds.set(soundId, source);

        return soundId;
    }

    public stopSE(soundId: string): void {
        const sound = this.activeSounds.get(soundId);
        if (sound) {
            sound.stop();
            this.activeSounds.delete(soundId);
        }
    }

    public stopAllSE(): void {
        for (const [id, sound] of this.activeSounds) {
            sound.stop();
        }
        this.activeSounds.clear();
    }

    public setBgmVolume(volume: number): void {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
    }

    public setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    public getBgmVolume(): number {
        return this.bgmVolume;
    }

    public getSfxVolume(): number {
        return this.sfxVolume;
    }

    public isPlayingBgm(): boolean {
        return this.currentBgm !== null;
    }

    public getActiveSoundCount(): number {
        return this.activeSounds.size;
    }
}
