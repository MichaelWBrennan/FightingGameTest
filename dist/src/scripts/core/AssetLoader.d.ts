/**
 * PlayCanvas Asset Loader
 * Manages loading of SF3 assets with PlayCanvas asset system
 */
import * as pc from 'playcanvas';
export interface SF3Asset {
    id: string;
    type: 'texture' | 'audio' | 'sprite' | 'animation' | 'font';
    url: string;
    loaded: boolean;
}
export declare class AssetLoader extends pc.ScriptType {
    private loadedAssets;
    private loadingPromises;
    private characterAssets;
    private stageAssets;
    private uiAssets;
    initialize(): void;
    private setupAssetRegistry;
    private registerAsset;
    loadAsset(assetId: string): Promise<pc.Asset>;
    loadAssets(assetIds: string[]): Promise<pc.Asset[]>;
    loadCharacterAssets(characterName: string): Promise<pc.Asset[]>;
    loadStageAssets(stageName: string): Promise<pc.Asset[]>;
    loadUIAssets(): Promise<pc.Asset[]>;
    getAsset(assetId: string): pc.Asset | null;
    isAssetLoaded(assetId: string): boolean;
    getLoadingProgress(): number;
    preloadEssentialAssets(): Promise<pc.Asset[]>;
    static get scriptName(): string;
}
//# sourceMappingURL=AssetLoader.d.ts.map