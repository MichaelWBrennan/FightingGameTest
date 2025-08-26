/**
 * ADX Audio Manager - Converted from CRI libadxe C files
 * Handles ADX audio format decoding and playback
 */
export class ADXAudioManager {
    static getInstance() {
        if (!ADXAudioManager.instance) {
            ADXAudioManager.instance = new ADXAudioManager();
        }
        return ADXAudioManager.instance;
    }
    constructor() {
        Object.defineProperty(this, "echoWorkArray", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "ECHO_WORK_MAX", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 8
        });
        Object.defineProperty(this, "audioContext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "gainNode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.initializeEchoWork();
        this.initializeAudio();
    }
    /**
     * Initialize audio context for web audio
     */
    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
        }
        catch (error) {
            console.warn('Web Audio not supported:', error);
        }
    }
    /**
     * Initialize echo work array - converted from mlTsbInitEchoWork()
     */
    initializeEchoWork() {
        for (let i = 0; i < this.ECHO_WORK_MAX; i++) {
            this.echoWorkArray[i] = {
                active: false,
                delay: 0,
                feedback: 0,
                volume: 0,
                pan: 0
            };
        }
        return 0;
    }
    /**
     * Set TSB parameters to request - converted from mlTsbSetToReqp()
     */
    setTSBToRequest(request, soundEvent, bank) {
        request.flags = soundEvent.flags;
        request.bank = bank;
        request.note = soundEvent.note;
        request.vol = soundEvent.vol;
        request.pan = soundEvent.pan;
        request.pitch = soundEvent.pitch;
        request.prio = soundEvent.prio;
        request.id1 = soundEvent.id1;
        request.id2 = soundEvent.id2;
        request.kofftime = soundEvent.kofftime;
        request.attr = soundEvent.attr;
        request.limit = soundEvent.limit;
    }
    /**
     * Process echo work array - converted from mlTsbMoveEchoWork()
     */
    processEchoWork() {
        for (let i = 0; i < this.ECHO_WORK_MAX; i++) {
            const echoWork = this.echoWorkArray[i];
            if (echoWork.active) {
                // Process echo effect
                this.updateEchoEffect(echoWork);
            }
        }
        return 0;
    }
    /**
     * Update individual echo effect
     */
    updateEchoEffect(echoWork) {
        // Echo processing logic would go here
        // For web implementation, this would use Web Audio delay nodes
        if (this.audioContext) {
            // Create delay effect if needed
            const delayNode = this.audioContext.createDelay(echoWork.delay / 1000);
            const feedbackNode = this.audioContext.createGain();
            delayNode.delayTime.value = echoWork.delay / 1000;
            feedbackNode.gain.value = echoWork.feedback;
        }
    }
    /**
     * Decode ADX header - converted from ADXB_DecodeHeaderAdx
     */
    decodeADXHeader(data) {
        if (data.byteLength < 32) {
            return null;
        }
        const view = new DataView(data);
        const signature = new TextDecoder().decode(data.slice(0, 2));
        if (signature !== '\x80\x00') {
            return null;
        }
        return {
            signature,
            dataOffset: view.getUint16(2, false),
            encoding: view.getUint8(4),
            blockSize: view.getUint8(5),
            sampleBitdepth: view.getUint8(6),
            channelCount: view.getUint8(7),
            sampleRate: view.getUint32(8, false),
            totalSamples: view.getUint32(12, false),
            cutoffFrequency: view.getUint16(16, false),
            version: view.getUint8(18),
            flags: view.getUint8(19)
        };
    }
    /**
     * Play ADX audio data
     */
    async playADXData(data) {
        if (!this.audioContext || !this.gainNode) {
            console.warn('Audio context not initialized');
            return;
        }
        const header = this.decodeADXHeader(data);
        if (!header) {
            console.error('Invalid ADX header');
            return;
        }
        try {
            // In a full implementation, this would decode ADX format to PCM
            // For now, we'll assume the data can be decoded by the browser
            const audioBuffer = await this.audioContext.decodeAudioData(data.slice(header.dataOffset));
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.gainNode);
            source.start();
        }
        catch (error) {
            console.error('Failed to play ADX audio:', error);
        }
    }
    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    /**
     * Get audio context state
     */
    getAudioState() {
        return this.audioContext?.state || 'unavailable';
    }
    /**
     * Resume audio context (required for user interaction)
     */
    async resumeAudio() {
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
}
//# sourceMappingURL=ADXAudioManager.js.map