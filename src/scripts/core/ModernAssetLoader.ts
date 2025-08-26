
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

export class ModernAssetLoader {
  private app: pc.Application;
  private manifest: AssetManifest | null = null;
  private loadedBundles = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();
  private cache = new Map<string, any>();
  private progressCallbacks = new Set<(progress: LoadingProgress) => void>();

  constructor(app: pc.Application) {
    this.app = app;
    this.setupServiceWorker();
  }

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/assets/manifest.json');
      this.manifest = await response.json();
      console.log('Asset manifest loaded:', this.manifest.version);
    } catch (error) {
      console.error('Failed to load asset manifest:', error);
      throw error;
    }
  }

  async loadBundle(bundleName: string): Promise<void> {
    if (!this.manifest) {
      throw new Error('Asset manifest not loaded');
    }

    if (this.loadedBundles.has(bundleName)) {
      return;
    }

    if (this.loadingPromises.has(bundleName)) {
      return this.loadingPromises.get(bundleName)!;
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
    } finally {
      this.loadingPromises.delete(bundleName);
    }
  }

  private async loadBundleInternal(bundleName: string, bundle: AssetManifest['bundles'][string]): Promise<void> {
    // Load dependencies first
    if (bundle.dependencies) {
      for (const dep of bundle.dependencies) {
        await this.loadBundle(dep);
      }
    }

    const totalAssets = bundle.assets.length;
    let loadedAssets = 0;

    const updateProgress = () => {
      const progress: LoadingProgress = {
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
        } catch (error) {
          console.error(`Failed to load asset: ${assetPath}`, error);
        }
      }));
    }
  }

  private async loadAsset(assetPath: string): Promise<any> {
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

  private async loadAssetByType(path: string, type: string): Promise<any> {
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

  private loadTexture(path: string): Promise<pc.Texture> {
    return new Promise((resolve, reject) => {
      const asset = new pc.Asset(path, 'texture', { url: path });
      
      asset.on('load', () => resolve(asset.resource));
      asset.on('error', reject);
      
      this.app.assets.add(asset);
      this.app.assets.load(asset);
    });
  }

  private loadModel(path: string): Promise<pc.Model> {
    return new Promise((resolve, reject) => {
      const asset = new pc.Asset(path, 'model', { url: path });
      
      asset.on('load', () => resolve(asset.resource));
      asset.on('error', reject);
      
      this.app.assets.add(asset);
      this.app.assets.load(asset);
    });
  }

  private loadAnimation(path: string): Promise<pc.AnimationClip> {
    return new Promise((resolve, reject) => {
      const asset = new pc.Asset(path, 'animation', { url: path });
      
      asset.on('load', () => resolve(asset.resource));
      asset.on('error', reject);
      
      this.app.assets.add(asset);
      this.app.assets.load(asset);
    });
  }

  private loadAudio(path: string): Promise<pc.Sound> {
    return new Promise((resolve, reject) => {
      const asset = new pc.Asset(path, 'audio', { url: path });
      
      asset.on('load', () => resolve(asset.resource));
      asset.on('error', reject);
      
      this.app.assets.add(asset);
      this.app.assets.load(asset);
    });
  }

  private async loadJSON(path: string): Promise<any> {
    const response = await fetch(path);
    return response.json();
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registered for asset caching'))
        .catch(error => console.warn('Service Worker registration failed:', error));
    }
  }

  // Public API
  onProgress(callback: (progress: LoadingProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  getAsset(path: string): any | null {
    return this.cache.get(path) || null;
  }

  preloadCritical(): Promise<void[]> {
    if (!this.manifest) return Promise.resolve([]);
    
    const criticalBundles = Object.entries(this.manifest.bundles)
      .filter(([, bundle]) => bundle.priority === 'critical')
      .map(([name]) => name);

    return Promise.all(criticalBundles.map(bundle => this.loadBundle(bundle)));
  }

  unloadBundle(bundleName: string): void {
    const bundle = this.manifest?.bundles[bundleName];
    if (!bundle) return;

    // Remove assets from cache
    for (const assetPath of bundle.assets) {
      this.cache.delete(assetPath);
    }

    this.loadedBundles.delete(bundleName);
  }

  getMemoryUsage(): { totalAssets: number; cacheSize: number } {
    return {
      totalAssets: this.cache.size,
      cacheSize: JSON.stringify([...this.cache.values()]).length
    };
  }
}
