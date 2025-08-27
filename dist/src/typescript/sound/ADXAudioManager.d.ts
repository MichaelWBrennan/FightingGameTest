/**
 * ADX Audio Manager - Converted from CRI libadxe C files
 * Handles ADX audio format decoding and playback
 */
export interface ADXHeader {
    signature: string;
    dataOffset: number;
    encoding: number;
    blockSize: number;
    sampleBitdepth: number;
    channelCount: number;
    sampleRate: number;
    totalSamples: number;
    cutoffFrequency: number;
    version: number;
    flags: number;
}
export interface SoundEvent {
    flags: number;
    note: number;
    vol: number;
    pan: number;
    pitch: number;
    prio: number;
    id1: number;
    id2: number;
    kofftime: number;
    attr: number;
    limit: number;
}
export interface CSERequest {
    flags: number;
    bank: number;
    note: number;
    vol: number;
    pan: number;
    pitch: number;
    prio: number;
    id1: number;
    id2: number;
    kofftime: number;
    attr: number;
    limit: number;
}
export interface EchoWork {
    active: boolean;
    delay: number;
    feedback: number;
    volume: number;
    pan: number;
}
export declare class ADXAudioManager {
    private static instance;
    private echoWorkArray;
    private readonly ECHO_WORK_MAX;
    private audioContext;
    private gainNode;
    static getInstance(): ADXAudioManager;
    private constructor();
    /**
     * Initialize audio context for web audio
     */
    private initializeAudio;
    /**
     * Initialize echo work array - converted from mlTsbInitEchoWork()
     */
    private initializeEchoWork;
    /**
     * Set TSB parameters to request - converted from mlTsbSetToReqp()
     */
    setTSBToRequest(request: CSERequest, soundEvent: SoundEvent, bank: number): void;
    /**
     * Process echo work array - converted from mlTsbMoveEchoWork()
     */
    processEchoWork(): number;
    /**
     * Update individual echo effect
     */
    private updateEchoEffect;
    /**
     * Decode ADX header - converted from ADXB_DecodeHeaderAdx
     */
    decodeADXHeader(data: ArrayBuffer): ADXHeader | null;
    /**
     * Play ADX audio data
     */
    playADXData(data: ArrayBuffer): Promise<void>;
    /**
     * Set master volume
     */
    setMasterVolume(volume: number): void;
    /**
     * Get audio context state
     */
    getAudioState(): string;
    /**
     * Resume audio context (required for user interaction)
     */
    resumeAudio(): Promise<void>;
}
