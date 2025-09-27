/**
 * HD-2D Usage Example - How to use the integrated HD-2D system
 * Demonstrates integration with existing FightForgeGraphicsManager
 */

import * as pc from 'playcanvas';
import { HD2DIntegration } from './HD2DIntegration';

export class HD2DUsageExample {
  private app: pc.Application;
  private hd2dIntegration: HD2DIntegration;
  
  constructor(app: pc.Application) {
    this.app = app;
    this.hd2dIntegration = new HD2DIntegration(app, {
      // Enable all cutting-edge features
      enableCuttingEdge: true,
      enableModernRendering: true,
      enableEnhancements: true,
      enableAssetProcessing: true,
      
      // Performance settings
      targetFrameRate: 60,
      adaptiveQuality: true,
      dynamicResolution: true,
      
      // Visual quality
      pixelPerfect: true,
      pixelScale: 1.0,
      hdr: true,
      wideColorGamut: true,
      
      // Advanced features (will be auto-detected)
      rayTracing: false,
      dlss: false,
      fsr: true,
      temporalUpsampling: true
    });
  }
  
  public async initialize(): Promise<void> {
    console.log('Initializing HD-2D Usage Example...');
    
    try {
      // Initialize the HD-2D integration system
      await this.hd2dIntegration.initialize();
      
      // Setup example scene
      await this.setupExampleScene();
      
      // Setup UI controls
      this.setupUIControls();
      
      console.log('HD-2D Usage Example initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize HD-2D Usage Example:', error);
      throw error;
    }
  }
  
  private async setupExampleScene(): Promise<void> {
    // Create example characters
    const player1 = this.hd2dIntegration.createCharacter('player1', {
      name: 'Fighter1',
      animations: {
        idle: { frameCount: 8, frameRate: 12 },
        attack: { frameCount: 12, frameRate: 24 },
        block: { frameCount: 6, frameRate: 12 }
      }
    });
    
    const player2 = this.hd2dIntegration.createCharacter('player2', {
      name: 'Fighter2',
      animations: {
        idle: { frameCount: 8, frameRate: 12 },
        attack: { frameCount: 12, frameRate: 24 },
        block: { frameCount: 6, frameRate: 12 }
      }
    });
    
    // Position characters
    player1.setPosition(-2, 0, 0);
    player2.setPosition(2, 0, 0);
    
    // Create example stage elements
    this.createExampleStageElements();
    
    // Setup example lighting
    this.setupExampleLighting();
  }
  
  private createExampleStageElements(): void {
    // Create background elements
    const background = new pc.Entity('Background');
    background.addComponent('render', {
      type: 'plane',
      material: new pc.StandardMaterial()
    });
    background.setPosition(0, -3, -10);
    background.setLocalScale(20, 10, 1);
    this.app.root.addChild(background);
    
    // Create foreground elements
    const foreground = new pc.Entity('Foreground');
    foreground.addComponent('render', {
      type: 'plane',
      material: new pc.StandardMaterial()
    });
    foreground.setPosition(0, -2, 5);
    foreground.setLocalScale(15, 8, 1);
    this.app.root.addChild(foreground);
  }
  
  private setupExampleLighting(): void {
    // Create main light
    const mainLight = new pc.Entity('MainLight');
    mainLight.addComponent('light', {
      type: pc.LIGHTTYPE_DIRECTIONAL,
      color: new pc.Color(1, 0.95, 0.9),
      intensity: 1.2,
      castShadows: true
    });
    mainLight.setEulerAngles(45, 30, 0);
    this.app.root.addChild(mainLight);
    
    // Create ambient light
    const ambientLight = new pc.Entity('AmbientLight');
    ambientLight.addComponent('light', {
      type: pc.LIGHTTYPE_AMBIENT,
      color: new pc.Color(0.3, 0.4, 0.5),
      intensity: 0.4
    });
    this.app.root.addChild(ambientLight);
  }
  
  private setupUIControls(): void {
    // Create UI controls for HD-2D settings
    this.createPixelScaleControl();
    this.createRimLightingControl();
    this.createAtmosphericPerspectiveControl();
    this.createDLSSControl();
    this.createFSRControl();
    this.createRayTracingControl();
    this.createPerformanceDisplay();
  }
  
  private createPixelScaleControl(): void {
    // Create pixel scale slider
    const pixelScaleSlider = document.createElement('input');
    pixelScaleSlider.type = 'range';
    pixelScaleSlider.min = '0.5';
    pixelScaleSlider.max = '4.0';
    pixelScaleSlider.step = '0.1';
    pixelScaleSlider.value = '1.0';
    pixelScaleSlider.style.position = 'absolute';
    pixelScaleSlider.style.top = '10px';
    pixelScaleSlider.style.left = '10px';
    pixelScaleSlider.style.width = '200px';
    
    const pixelScaleLabel = document.createElement('label');
    pixelScaleLabel.textContent = 'Pixel Scale: 1.0';
    pixelScaleLabel.style.position = 'absolute';
    pixelScaleLabel.style.top = '30px';
    pixelScaleLabel.style.left = '10px';
    pixelScaleLabel.style.color = 'white';
    
    pixelScaleSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.hd2dIntegration.setPixelScale(value);
      pixelScaleLabel.textContent = `Pixel Scale: ${value.toFixed(1)}`;
    });
    
    document.body.appendChild(pixelScaleSlider);
    document.body.appendChild(pixelScaleLabel);
  }
  
  private createRimLightingControl(): void {
    // Create rim lighting intensity slider
    const rimLightingSlider = document.createElement('input');
    rimLightingSlider.type = 'range';
    rimLightingSlider.min = '0';
    rimLightingSlider.max = '2.0';
    rimLightingSlider.step = '0.1';
    rimLightingSlider.value = '0.8';
    rimLightingSlider.style.position = 'absolute';
    rimLightingSlider.style.top = '60px';
    rimLightingSlider.style.left = '10px';
    rimLightingSlider.style.width = '200px';
    
    const rimLightingLabel = document.createElement('label');
    rimLightingLabel.textContent = 'Rim Lighting: 0.8';
    rimLightingLabel.style.position = 'absolute';
    rimLightingLabel.style.top = '80px';
    rimLightingLabel.style.left = '10px';
    rimLightingLabel.style.color = 'white';
    
    rimLightingSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.hd2dIntegration.setRimLightingIntensity(value);
      rimLightingLabel.textContent = `Rim Lighting: ${value.toFixed(1)}`;
    });
    
    document.body.appendChild(rimLightingSlider);
    document.body.appendChild(rimLightingLabel);
  }
  
  private createAtmosphericPerspectiveControl(): void {
    // Create atmospheric perspective toggle
    const atmosphericToggle = document.createElement('input');
    atmosphericToggle.type = 'checkbox';
    atmosphericToggle.checked = true;
    atmosphericToggle.style.position = 'absolute';
    atmosphericToggle.style.top = '110px';
    atmosphericToggle.style.left = '10px';
    
    const atmosphericLabel = document.createElement('label');
    atmosphericLabel.textContent = 'Atmospheric Perspective';
    atmosphericLabel.style.position = 'absolute';
    atmosphericLabel.style.top = '110px';
    atmosphericLabel.style.left = '30px';
    atmosphericLabel.style.color = 'white';
    
    atmosphericToggle.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      this.hd2dIntegration.setAtmosphericPerspective(enabled);
    });
    
    document.body.appendChild(atmosphericToggle);
    document.body.appendChild(atmosphericLabel);
  }
  
  private createDLSSControl(): void {
    // Create DLSS quality selector
    const dlssSelect = document.createElement('select');
    dlssSelect.style.position = 'absolute';
    dlssSelect.style.top = '140px';
    dlssSelect.style.left = '10px';
    
    const dlssOptions = [
      { value: 'performance', text: 'DLSS Performance' },
      { value: 'balanced', text: 'DLSS Balanced' },
      { value: 'quality', text: 'DLSS Quality' },
      { value: 'ultra_quality', text: 'DLSS Ultra Quality' }
    ];
    
    dlssOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      dlssSelect.appendChild(optionElement);
    });
    
    const dlssLabel = document.createElement('label');
    dlssLabel.textContent = 'DLSS Quality:';
    dlssLabel.style.position = 'absolute';
    dlssLabel.style.top = '140px';
    dlssLabel.style.left = '150px';
    dlssLabel.style.color = 'white';
    
    dlssSelect.addEventListener('change', (e) => {
      const quality = (e.target as HTMLSelectElement).value as 'performance' | 'balanced' | 'quality' | 'ultra_quality';
      this.hd2dIntegration.setDLSSQuality(quality);
    });
    
    document.body.appendChild(dlssSelect);
    document.body.appendChild(dlssLabel);
  }
  
  private createFSRControl(): void {
    // Create FSR quality selector
    const fsrSelect = document.createElement('select');
    fsrSelect.style.position = 'absolute';
    fsrSelect.style.top = '170px';
    fsrSelect.style.left = '10px';
    
    const fsrOptions = [
      { value: 'performance', text: 'FSR Performance' },
      { value: 'balanced', text: 'FSR Balanced' },
      { value: 'quality', text: 'FSR Quality' },
      { value: 'ultra_quality', text: 'FSR Ultra Quality' }
    ];
    
    fsrOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      fsrSelect.appendChild(optionElement);
    });
    
    const fsrLabel = document.createElement('label');
    fsrLabel.textContent = 'FSR Quality:';
    fsrLabel.style.position = 'absolute';
    fsrLabel.style.top = '170px';
    fsrLabel.style.left = '150px';
    fsrLabel.style.color = 'white';
    
    fsrSelect.addEventListener('change', (e) => {
      const quality = (e.target as HTMLSelectElement).value as 'performance' | 'balanced' | 'quality' | 'ultra_quality';
      this.hd2dIntegration.setFSRQuality(quality);
    });
    
    document.body.appendChild(fsrSelect);
    document.body.appendChild(fsrLabel);
  }
  
  private createRayTracingControl(): void {
    // Create ray tracing toggle
    const rayTracingToggle = document.createElement('input');
    rayTracingToggle.type = 'checkbox';
    rayTracingToggle.checked = false;
    rayTracingToggle.style.position = 'absolute';
    rayTracingToggle.style.top = '200px';
    rayTracingToggle.style.left = '10px';
    
    const rayTracingLabel = document.createElement('label');
    rayTracingLabel.textContent = 'Ray Tracing';
    rayTracingLabel.style.position = 'absolute';
    rayTracingLabel.style.top = '200px';
    rayTracingLabel.style.left = '30px';
    rayTracingLabel.style.color = 'white';
    
    rayTracingToggle.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      this.hd2dIntegration.setRayTracingEnabled(enabled);
    });
    
    document.body.appendChild(rayTracingToggle);
    document.body.appendChild(rayTracingLabel);
  }
  
  private createPerformanceDisplay(): void {
    // Create performance display
    const performanceDiv = document.createElement('div');
    performanceDiv.style.position = 'absolute';
    performanceDiv.style.top = '10px';
    performanceDiv.style.right = '10px';
    performanceDiv.style.color = 'white';
    performanceDiv.style.fontFamily = 'monospace';
    performanceDiv.style.fontSize = '12px';
    performanceDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    performanceDiv.style.padding = '10px';
    performanceDiv.style.borderRadius = '5px';
    
    const updatePerformanceDisplay = () => {
      const status = this.hd2dIntegration.getSystemStatus();
      const metrics = this.hd2dIntegration.getPerformanceMetrics();
      
      performanceDiv.innerHTML = `
        <div>FPS: ${metrics.fps.toFixed(1)}</div>
        <div>Frame Time: ${metrics.frameTime.toFixed(2)}ms</div>
        <div>Quality: ${metrics.qualityLevel}</div>
        <div>Systems:</div>
        <div>  Graphics Manager: ${status.systems.graphicsManager ? '✓' : '✗'}</div>
        <div>  Cutting Edge: ${status.systems.cuttingEdge ? '✓' : '✗'}</div>
        <div>  Modern Rendering: ${status.systems.modernRendering ? '✓' : '✗'}</div>
        <div>  Enhancements: ${status.systems.enhancements ? '✓' : '✗'}</div>
        <div>  Asset Processor: ${status.systems.assetProcessor ? '✓' : '✗'}</div>
        <div>Capabilities:</div>
        <div>  DLSS: ${status.capabilities.dlss ? '✓' : '✗'}</div>
        <div>  FSR: ${status.capabilities.fsr ? '✓' : '✗'}</div>
        <div>  Ray Tracing: ${status.capabilities.rayTracing ? '✓' : '✗'}</div>
        <div>  Mesh Shaders: ${status.capabilities.meshShaders ? '✓' : '✗'}</div>
        <div>  HDR: ${status.capabilities.hdr ? '✓' : '✗'}</div>
      `;
    };
    
    // Update performance display every frame
    this.app.on('update', () => {
      updatePerformanceDisplay();
    });
    
    document.body.appendChild(performanceDiv);
  }
  
  // Example combat effects
  public triggerHitEffect(position: pc.Vec3, power: number = 1.0): void {
    this.hd2dIntegration.createHitEffect(position, power, 'normal');
  }
  
  public triggerParryEffect(position: pc.Vec3): void {
    this.hd2dIntegration.createParryEffect(position);
  }
  
  public triggerSuperEffect(character: pc.Entity, superData: any): void {
    this.hd2dIntegration.createSuperEffect(character, superData);
  }
  
  // Example asset processing
  public async processExampleAssets(): Promise<void> {
    console.log('Processing example assets...');
    
    // Process all assets in the app
    const assets = this.app.assets.filter(asset => 
      asset.type === 'texture' || asset.type === 'model' || asset.type === 'shader'
    );
    
    for (const asset of assets) {
      try {
        await this.hd2dIntegration.processAsset(asset);
        console.log(`Processed asset: ${asset.name}`);
      } catch (error) {
        console.error(`Failed to process asset ${asset.name}:`, error);
      }
    }
    
    // Get processing stats
    const stats = this.hd2dIntegration.getAssetProcessingStats();
    if (stats) {
      console.log('Asset processing stats:', stats);
    }
  }
  
  // Example system control
  public toggleSystem(system: 'cuttingEdge' | 'modernRendering' | 'enhancements' | 'assetProcessor'): void {
    const status = this.hd2dIntegration.getSystemStatus();
    const isEnabled = status.systems[system];
    
    if (isEnabled) {
      this.hd2dIntegration.disableSystem(system);
      console.log(`Disabled ${system} system`);
    } else {
      this.hd2dIntegration.enableSystem(system);
      console.log(`Enabled ${system} system`);
    }
  }
  
  public destroy(): void {
    console.log('Destroying HD-2D Usage Example...');
    
    // Clean up UI elements
    const controls = document.querySelectorAll('input, select, label, div');
    controls.forEach(control => {
      if (control.parentNode) {
        control.parentNode.removeChild(control);
      }
    });
    
    // Destroy HD-2D integration
    this.hd2dIntegration.destroy();
    
    console.log('HD-2D Usage Example destroyed');
  }
}

// Export for use in other files
export { HD2DUsageExample };