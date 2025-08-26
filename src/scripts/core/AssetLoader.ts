
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

export class AssetLoader extends pc.ScriptType {
  private loadedAssets: Map<string, SF3Asset> = new Map();
  private loadingPromises: Map<string, Promise<pc.Asset>> = new Map();
  
  private characterAssets: string[] = [
    'ryu_sprites', 'ken_sprites', 'chun_sprites', 'akuma_sprites',
    'ryu_audio', 'ken_audio', 'chun_audio', 'akuma_audio'
  ];

  private stageAssets: string[] = [
    'new_york_bg', 'metro_city_bg', 'underground_bg', 'training_bg'
  ];

  private uiAssets: string[] = [
    'ui_fonts', 'ui_buttons', 'ui_panels', 'ui_effects'
  ];

  initialize(): void {
    this.setupAssetRegistry();
    console.log('AssetLoader initialized');
  }

  private setupAssetRegistry(): void {
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

  private registerAsset(id: string, type: SF3Asset['type'], url: string): void {
    const asset: SF3Asset = {
      id,
      type,
      url,
      loaded: false
    };
    
    this.loadedAssets.set(id, asset);
  }

  public async loadAsset(assetId: string): Promise<pc.Asset> {
    // Return existing loading promise if already loading
    if (this.loadingPromises.has(assetId)) {
      return this.loadingPromises.get(assetId)!;
    }

    const assetInfo = this.loadedAssets.get(assetId);
    if (!assetInfo) {
      throw new Error(`Asset not registered: ${assetId}`);
    }

    // Create loading promise
    const loadingPromise = new Promise<pc.Asset>((resolve, reject) => {
      const pcAsset = new pc.Asset(assetId, assetInfo.type, {
        url: assetInfo.url
      });

      pcAsset.ready((asset: pc.Asset) => {
        assetInfo.loaded = true;
        this.loadingPromises.delete(assetId);
        console.log(`Asset loaded: ${assetId}`);
        resolve(asset);
      });

      pcAsset.on('error', (err: any) => {
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

  public async loadAssets(assetIds: string[]): Promise<pc.Asset[]> {
    const promises = assetIds.map(id => this.loadAsset(id));
    return Promise.all(promises);
  }

  public async loadCharacterAssets(characterName: string): Promise<pc.Asset[]> {
    const characterAssetIds = [
      `${characterName}_sprites`,
      `${characterName}_audio`
    ];
    
    return this.loadAssets(characterAssetIds);
  }

  public async loadStageAssets(stageName: string): Promise<pc.Asset[]> {
    const stageAssetIds = [`${stageName}_bg`];
    return this.loadAssets(stageAssetIds);
  }

  public async loadUIAssets(): Promise<pc.Asset[]> {
    return this.loadAssets(this.uiAssets);
  }

  public getAsset(assetId: string): pc.Asset | null {
    return this.app.assets.find(assetId) || null;
  }

  public isAssetLoaded(assetId: string): boolean {
    const assetInfo = this.loadedAssets.get(assetId);
    return assetInfo?.loaded || false;
  }

  public getLoadingProgress(): number {
    const totalAssets = this.loadedAssets.size;
    const loadedAssets = Array.from(this.loadedAssets.values())
      .filter(asset => asset.loaded).length;
    
    return totalAssets > 0 ? (loadedAssets / totalAssets) * 100 : 0;
  }

  public preloadEssentialAssets(): Promise<pc.Asset[]> {
    const essentialAssets = [
      'ui_fonts',
      'ui_buttons', 
      'bgm_character_select',
      'sfx_hit',
      'sfx_block'
    ];

    return this.loadAssets(essentialAssets);
  }

  public static get scriptName(): string {
    return 'assetLoader';
  }
}

pc.registerScript(AssetLoader, 'assetLoader');
