
import * as pc from 'playcanvas';

const AssetLoader = pc.createScript('AssetLoader');

AssetLoader.prototype.initialize = function() {
    this.loadedAssets = new Map();
    this.loadingPromises = new Map();
};

AssetLoader.prototype.loadAsset = function(name, url, type = 'texture') {
    if (this.loadedAssets.has(name)) {
        return Promise.resolve(this.loadedAssets.get(name));
    }

    if (this.loadingPromises.has(name)) {
        return this.loadingPromises.get(name);
    }

    const promise = new Promise((resolve, reject) => {
        const asset = new pc.Asset(name, type, { url });
        
        asset.ready(() => {
            this.loadedAssets.set(name, asset);
            resolve(asset);
        });

        asset.on('error', (err) => {
            reject(err);
        });

        this.app.assets.add(asset);
        this.app.assets.load(asset);
    });

    this.loadingPromises.set(name, promise);
    return promise;
};

AssetLoader.prototype.getAsset = function(name) {
    return this.loadedAssets.get(name);
};

AssetLoader.prototype.preloadAssets = function(assetManifest) {
    const promises = assetManifest.map(({ name, url, type }) => 
        this.loadAsset(name, url, type)
    );
    
    return Promise.all(promises);
};

export { AssetLoader };
