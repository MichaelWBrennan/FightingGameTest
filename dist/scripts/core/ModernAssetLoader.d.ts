/**
 * Modern Asset Loader with Lazy Loading and Caching
 */
import * as pc from 'playcanvas';
export interface AssetManifest {
    version: string;
    bundles: {
        [bundleName: string]: {
            priority: 'critical' | 'high' | 'normal' | 'low';
            assets: string[];
            dependencies?: string[];
        };
    };
    assets: {
        [assetPath: string]: {
            type: 'texture' | 'model' | 'animation' | 'audio' | 'script' | 'json';
            size: number;
            hash: string;
            preload?: boolean;
        };
    };
}
export interface LoadingProgress {
    bundleName: string;
    loaded: number;
    total: number;
    percentage: number;
}
export declare class ModernAssetLoader {
    private app;
    private manifest;
    private loadedBundles;
    private loadingPromises;
    private cache;
    private progressCallbacks;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
    loadBundle(bundleName: string): Promise<void>;
    private loadBundleInternal;
    private loadAsset;
    private loadAssetByType;
    private loadTexture;
    private loadModel;
    private loadAnimation;
    private loadAudio;
    private loadJSON;
    private chunkArray;
    private setupServiceWorker;
    onProgress(callback: (progress: LoadingProgress) => void): () => void;
    getAsset(path: string): any | null;
    preloadCritical(): Promise<void[]>;
    unloadBundle(bundleName: string): void;
    getMemoryUsage(): {
        totalAssets: number;
        cacheSize: number;
    };
}
