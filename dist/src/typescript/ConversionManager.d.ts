/**
 * Master Conversion Manager
 * Handles conversion of all remaining C files to TypeScript
 */
import { SF3EffectSystem } from './game/EffectSystem';
import { SF3CharacterSystem } from './game/CharacterSystem';
import { SF3BackgroundSystem } from './game/BackgroundSystem';
import { ADXDecoder } from './audio/ADXCodec';
import { CRIFilesystem } from './audio/CRIFilesystem';
import { SDLGameRenderer } from './platform/SDLRenderer';
import { SDLInputManager } from './platform/SDLInput';
import { PS2MemoryManager } from './memory/PS2MemoryManager';
import { PS2SDKCompat } from './sdk/PS2SDK';
import { CoroutineSystem } from './libco/CoroutineSystem';
export interface ConversionStatus {
    totalFiles: number;
    convertedFiles: number;
    remainingFiles: string[];
    conversionProgress: number;
    systemsInitialized: boolean;
}
export declare class ConversionManager {
    private effectSystem;
    private characterSystem;
    private backgroundSystem;
    private audioDecoder;
    private filesystem;
    private renderer;
    private inputManager;
    private memoryManager;
    private sdkCompat;
    private coroutineSystem;
    private conversionMap;
    constructor();
    private initializeConversionMap;
    initializeRenderer(canvas: HTMLCanvasElement): void;
    getConversionStatus(): ConversionStatus;
    private getRemainingFiles;
    getEffectSystem(): SF3EffectSystem;
    getCharacterSystem(): SF3CharacterSystem;
    getBackgroundSystem(): SF3BackgroundSystem;
    getAudioDecoder(): ADXDecoder;
    getFilesystem(): CRIFilesystem;
    getRenderer(): SDLGameRenderer | null;
    getInputManager(): SDLInputManager;
    getMemoryManager(): PS2MemoryManager;
    getSDKCompat(): PS2SDKCompat;
    getCoroutineSystem(): CoroutineSystem;
    update(deltaTime: number): void;
    render(): void;
    generateConversionReport(): string;
}
export declare const conversionManager: ConversionManager;
