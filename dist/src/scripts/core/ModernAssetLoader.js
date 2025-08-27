/**
 * Modern Asset Loader with Lazy Loading and Caching
 */
import * as pc from 'playcanvas';
export class ModernAssetLoader {
    constructor(app) {
        this.manifest = null;
        this.loadedBundles = new Set();
        this.loadingPromises = new Map();
        this.cache = new Map();
        this.progressCallbacks = new Set();
        this.app = app;
        this.setupServiceWorker();
    }
    async initialize() {
        try {
            const response = await fetch('/assets/manifest.json');
            this.manifest = await response.json();
            console.log('Asset manifest loaded:', this.manifest.version);
        }
        catch (error) {
            console.error('Failed to load asset manifest:', error);
            throw error;
        }
    }
    async loadBundle(bundleName) {
        if (!this.manifest) {
            throw new Error('Asset manifest not loaded');
        }
        if (this.loadedBundles.has(bundleName)) {
            return;
        }
        if (this.loadingPromises.has(bundleName)) {
            return this.loadingPromises.get(bundleName);
        }
        const bundle = this.manifest.bundles[bundleName];
        if (!bundle) {
            throw new Error(`Bundle not found: ${bundleName}`);
        }
        const loadPromise = this.loadBundleInternal(bundleName, bundle);
        this.loadingPromises.set(bundleName, loadPromise);
        try {
            await loadPromise;
            this.loadedBundles.add(bundleName);
        }
        finally {
            this.loadingPromises.delete(bundleName);
        }
    }
    async loadBundleInternal(bundleName, bundle) {
        // Load dependencies first
        if (bundle.dependencies) {
            for (const dep of bundle.dependencies) {
                await this.loadBundle(dep);
            }
        }
        const totalAssets = bundle.assets.length;
        let loadedAssets = 0;
        const updateProgress = () => {
            const progress = {
                bundleName,
                loaded: loadedAssets,
                total: totalAssets,
                percentage: (loadedAssets / totalAssets) * 100
            };
            for (const callback of this.progressCallbacks) {
                callback(progress);
            }
        };
        // Load assets in parallel with concurrency limit
        const concurrencyLimit = 4;
        const chunks = this.chunkArray(bundle.assets, concurrencyLimit);
        for (const chunk of chunks) {
            await Promise.all(chunk.map(async (assetPath) => {
                try {
                    await this.loadAsset(assetPath);
                    loadedAssets++;
                    updateProgress();
                }
                catch (error) {
                    console.error(`Failed to load asset: ${assetPath}`, error);
                }
            }));
        }
    }
    async loadAsset(assetPath) {
        if (this.cache.has(assetPath)) {
            return this.cache.get(assetPath);
        }
        const assetInfo = this.manifest?.assets[assetPath];
        if (!assetInfo) {
            throw new Error(`Asset info not found: ${assetPath}`);
        }
        const asset = await this.loadAssetByType(assetPath, assetInfo.type);
        this.cache.set(assetPath, asset);
        return asset;
    }
    async loadAssetByType(path, type) {
        switch (type) {
            case 'texture':
                return this.loadTexture(path);
            case 'model':
                return this.loadModel(path);
            case 'animation':
                return this.loadAnimation(path);
            case 'audio':
                return this.loadAudio(path);
            case 'json':
                return this.loadJSON(path);
            default:
                throw new Error(`Unsupported asset type: ${type}`);
        }
    }
    loadTexture(path) {
        return new Promise((resolve, reject) => {
            const asset = new pc.Asset(path, 'texture', { url: path });
            asset.on('load', () => resolve(asset.resource));
            asset.on('error', reject);
            this.app.assets.add(asset);
            this.app.assets.load(asset);
        });
    }
    loadModel(path) {
        return new Promise((resolve, reject) => {
            const asset = new pc.Asset(path, 'model', { url: path });
            asset.on('load', () => resolve(asset.resource));
            asset.on('error', reject);
            this.app.assets.add(asset);
            this.app.assets.load(asset);
        });
    }
    loadAnimation(path) {
        return new Promise((resolve, reject) => {
            const asset = new pc.Asset(path, 'animation', { url: path });
            asset.on('load', () => resolve(asset.resource));
            asset.on('error', reject);
            this.app.assets.add(asset);
            this.app.assets.load(asset);
        });
    }
    loadAudio(path) {
        return new Promise((resolve, reject) => {
            const asset = new pc.Asset(path, 'audio', { url: path });
            asset.on('load', () => resolve(asset.resource));
            asset.on('error', reject);
            this.app.assets.add(asset);
            this.app.assets.load(asset);
        });
    }
    async loadJSON(path) {
        const response = await fetch(path);
        return response.json();
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('Service Worker registered for asset caching'))
                .catch(error => console.warn('Service Worker registration failed:', error));
        }
    }
    // Public API
    onProgress(callback) {
        this.progressCallbacks.add(callback);
        return () => this.progressCallbacks.delete(callback);
    }
    getAsset(path) {
        return this.cache.get(path) || null;
    }
    preloadCritical() {
        if (!this.manifest)
            return Promise.resolve([]);
        const criticalBundles = Object.entries(this.manifest.bundles)
            .filter(([, bundle]) => bundle.priority === 'critical')
            .map(([name]) => name);
        return Promise.all(criticalBundles.map(bundle => this.loadBundle(bundle)));
    }
    unloadBundle(bundleName) {
        const bundle = this.manifest?.bundles[bundleName];
        if (!bundle)
            return;
        // Remove assets from cache
        for (const assetPath of bundle.assets) {
            this.cache.delete(assetPath);
        }
        this.loadedBundles.delete(bundleName);
    }
    getMemoryUsage() {
        return {
            totalAssets: this.cache.size,
            cacheSize: JSON.stringify([...this.cache.values()]).length
        };
    }
}
//# sourceMappingURL=ModernAssetLoader.js.map