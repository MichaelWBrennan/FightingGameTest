import * as pc from 'playcanvas';

const SceneManager = pc.createScript('SceneManager');

SceneManager.prototype.initialize = function() {
    this.scenes = new Map();
    this.currentScene = null;
    this.transitionInProgress = false;

    this.setupDefaultScene();
};

SceneManager.prototype.setupDefaultScene = function() {
    // Create main game scene
    const mainScene = new pc.Entity('MainScene');
    this.app.root.addChild(mainScene);

    // Setup camera
    const cameraEntity = new pc.Entity('MainCamera');
    cameraEntity.addComponent('camera', {
        clearColor: new pc.Color(0.1, 0.1, 0.1),
        farClip: 1000,
        nearClip: 0.1
    });
    cameraEntity.setPosition(0, 5, 10);
    cameraEntity.lookAt(0, 0, 0);
    mainScene.addChild(cameraEntity);

    // Setup lighting
    const lightEntity = new pc.Entity('DirectionalLight');
    lightEntity.addComponent('light', {
        type: 'directional',
        castShadows: true,
        intensity: 1,
        shadowBias: 0.0005,
        shadowDistance: 50
    });
    lightEntity.setEulerAngles(45, -30, 0);
    mainScene.addChild(lightEntity);

    this.scenes.set('main', mainScene);
    this.currentScene = 'main';
};

SceneManager.prototype.loadScene = function(sceneName, sceneConfig) {
    if (this.transitionInProgress) {
        console.warn('Scene transition already in progress');
        return Promise.reject(new Error('Transition in progress'));
    }

    this.transitionInProgress = true;

    return new Promise((resolve) => {
        // Fade out current scene
        this.fadeOut().then(() => {
            // Unload current scene
            if (this.currentScene && this.scenes.has(this.currentScene)) {
                const currentSceneEntity = this.scenes.get(this.currentScene);
                currentSceneEntity.destroy();
                this.scenes.delete(this.currentScene);
            }

            // Load new scene
            const newScene = this.createScene(sceneName, sceneConfig);
            this.scenes.set(sceneName, newScene);
            this.currentScene = sceneName;

            // Fade in new scene
            this.fadeIn().then(() => {
                this.transitionInProgress = false;
                resolve(newScene);
            });
        });
    });
};

SceneManager.prototype.createScene = function(name, config) {
    const sceneEntity = new pc.Entity(name);
    this.app.root.addChild(sceneEntity);

    // Apply scene configuration
    if (config) {
        this.applySceneConfig(sceneEntity, config);
    }

    return sceneEntity;
};

SceneManager.prototype.fadeOut = function() {
    return new Promise(resolve => {
        // Implement fade transition
        setTimeout(resolve, 500); // Placeholder
    });
};

SceneManager.prototype.fadeIn = function() {
    return new Promise(resolve => {
        // Implement fade transition  
        setTimeout(resolve, 500); // Placeholder
    });
};

export { SceneManager };