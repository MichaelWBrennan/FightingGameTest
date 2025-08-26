/**
 * PlayCanvas Asset Loader
 * Manages loading of SF3 assets with PlayCanvas asset system
 */
import * as pc from 'playcanvas';
export class AssetLoader extends pc.ScriptType {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "loadedAssets", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "loadingPromises", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "characterAssets", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'ryu_sprites', 'ken_sprites', 'chun_sprites', 'akuma_sprites',
                'ryu_audio', 'ken_audio', 'chun_audio', 'akuma_audio'
            ]
        });
        Object.defineProperty(this, "stageAssets", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'new_york_bg', 'metro_city_bg', 'underground_bg', 'training_bg'
            ]
        });
        Object.defineProperty(this, "uiAssets", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'ui_fonts', 'ui_buttons', 'ui_panels', 'ui_effects'
            ]
        });
    }
    initialize() {
        this.setupAssetRegistry();
        console.log('AssetLoader initialized');
    }
    setupAssetRegistry() {
        // Register character assets
        this.characterAssets.forEach(assetId => {
            this.registerAsset(assetId, 'texture', `assets/characters/${assetId}.png`);
        });
        // Register stage assets  
        this.stageAssets.forEach(assetId => {
            this.registerAsset(assetId, 'texture', `assets/stages/${assetId}.png`);
        });
        // Register UI assets
        this.uiAssets.forEach(assetId => {
            this.registerAsset(assetId, 'texture', `assets/ui/${assetId}.png`);
        });
        // Register audio assets
        const audioAssets = [
            'bgm_character_select', 'bgm_new_york', 'bgm_metro_city',
            'sfx_hit', 'sfx_block', 'sfx_special', 'sfx_super'
        ];
        audioAssets.forEach(assetId => {
            this.registerAsset(assetId, 'audio', `assets/audio/${assetId}.wav`);
        });
    }
    registerAsset(id, type, url) {
        const asset = {
            id,
            type,
            url,
            loaded: false
        };
        this.loadedAssets.set(id, asset);
    }
    async loadAsset(assetId) {
        // Return existing loading promise if already loading
        if (this.loadingPromises.has(assetId)) {
            return this.loadingPromises.get(assetId);
        }
        const assetInfo = this.loadedAssets.get(assetId);
        if (!assetInfo) {
            throw new Error(`Asset not registered: ${assetId}`);
        }
        // Create loading promise
        const loadingPromise = new Promise((resolve, reject) => {
            const pcAsset = new pc.Asset(assetId, assetInfo.type, {
                url: assetInfo.url
            });
            pcAsset.ready((asset) => {
                assetInfo.loaded = true;
                this.loadingPromises.delete(assetId);
                console.log(`Asset loaded: ${assetId}`);
                resolve(asset);
            });
            pcAsset.on('error', (err) => {
                this.loadingPromises.delete(assetId);
                console.error(`Failed to load asset: ${assetId}`, err);
                reject(err);
            });
            this.app.assets.add(pcAsset);
            this.app.assets.load(pcAsset);
        });
        this.loadingPromises.set(assetId, loadingPromise);
        return loadingPromise;
    }
    async loadAssets(assetIds) {
        const promises = assetIds.map(id => this.loadAsset(id));
        return Promise.all(promises);
    }
    async loadCharacterAssets(characterName) {
        const characterAssetIds = [
            `${characterName}_sprites`,
            `${characterName}_audio`
        ];
        return this.loadAssets(characterAssetIds);
    }
    async loadStageAssets(stageName) {
        const stageAssetIds = [`${stageName}_bg`];
        return this.loadAssets(stageAssetIds);
    }
    async loadUIAssets() {
        return this.loadAssets(this.uiAssets);
    }
    getAsset(assetId) {
        return this.app.assets.find(assetId) || null;
    }
    isAssetLoaded(assetId) {
        const assetInfo = this.loadedAssets.get(assetId);
        return assetInfo?.loaded || false;
    }
    getLoadingProgress() {
        const totalAssets = this.loadedAssets.size;
        const loadedAssets = Array.from(this.loadedAssets.values())
            .filter(asset => asset.loaded).length;
        return totalAssets > 0 ? (loadedAssets / totalAssets) * 100 : 0;
    }
    preloadEssentialAssets() {
        const essentialAssets = [
            'ui_fonts',
            'ui_buttons',
            'bgm_character_select',
            'sfx_hit',
            'sfx_block'
        ];
        return this.loadAssets(essentialAssets);
    }
    static get scriptName() {
        return 'assetLoader';
    }
}
pc.registerScript(AssetLoader, 'assetLoader');
//# sourceMappingURL=AssetLoader.js.map