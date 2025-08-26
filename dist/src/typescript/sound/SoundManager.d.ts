export declare class SoundManager {
    private audioContext;
    private bgmVolume;
    private sfxVolume;
    private currentBgm;
    private audioBuffers;
    private activeSounds;
    constructor();
    private initializeAudio;
    loadSound(id: number, url: string): Promise<void>;
    bgmRequest(id: number): void;
    bgmStop(): void;
    bgmHalfVolume(fadeTime: number): void;
    bgmFadeOut(fadeTime: number): void;
    playSE(id: number, volume?: number): string | null;
    stopSE(soundId: string): void;
    stopAllSE(): void;
    setBgmVolume(volume: number): void;
    setSfxVolume(volume: number): void;
    getBgmVolume(): number;
    getSfxVolume(): number;
    isPlayingBgm(): boolean;
    getActiveSoundCount(): number;
}
//# sourceMappingURL=SoundManager.d.ts.map