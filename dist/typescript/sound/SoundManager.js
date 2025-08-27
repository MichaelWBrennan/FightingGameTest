export class SoundManager {
    constructor() {
        this.bgmVolume = 1.0;
        this.sfxVolume = 1.0;
        this.currentBgm = null;
        this.audioBuffers = new Map();
        this.activeSounds = new Map();
        this.audioContext = new AudioContext();
        this.initializeAudio();
    }
    async initializeAudio() {
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        }
        catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }
    async loadSound(id, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(id, audioBuffer);
        }
        catch (error) {
            console.error(`Failed to load sound ${id}:`, error);
        }
    }
    bgmRequest(id) {
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
    bgmStop() {
        if (this.currentBgm) {
            this.currentBgm.stop();
            this.currentBgm = null;
        }
    }
    bgmHalfVolume(fadeTime) {
        if (this.currentBgm) {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(this.bgmVolume, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.bgmVolume * 0.5, this.audioContext.currentTime + fadeTime);
        }
    }
    bgmFadeOut(fadeTime) {
        if (this.currentBgm) {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(this.bgmVolume, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
            setTimeout(() => {
                this.bgmStop();
            }, fadeTime * 1000);
        }
    }
    playSE(id, volume = 1.0) {
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
    stopSE(soundId) {
        const sound = this.activeSounds.get(soundId);
        if (sound) {
            sound.stop();
            this.activeSounds.delete(soundId);
        }
    }
    stopAllSE() {
        for (const [id, sound] of this.activeSounds) {
            sound.stop();
        }
        this.activeSounds.clear();
    }
    setBgmVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
    }
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    getBgmVolume() {
        return this.bgmVolume;
    }
    getSfxVolume() {
        return this.sfxVolume;
    }
    isPlayingBgm() {
        return this.currentBgm !== null;
    }
    getActiveSoundCount() {
        return this.activeSounds.size;
    }
}
//# sourceMappingURL=SoundManager.js.map