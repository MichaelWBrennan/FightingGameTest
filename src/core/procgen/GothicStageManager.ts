import { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';
import { RealTimeStageManager } from './RealTimeStageManager';
import { ProcStageOptions } from './ProceduralStageGenerator';

export interface GothicStageOptions extends ProcStageOptions {
  gothicIntensity?: 'subtle' | 'moderate' | 'intense' | 'extreme';
  gothicStyle?: 'dark_stalkers' | 'guilty_gear' | 'soul_calibur' | 'classic' | 'modern';
  gothicElements?: string[];
  lightingStyle?: 'dramatic' | 'moody' | 'ominous' | 'ethereal';
  particleDensity?: 'low' | 'medium' | 'high' | 'extreme';
}

export class GothicStageManager extends RealTimeStageManager {
  private gothicIntensity: string = 'moderate';
  private gothicStyle: string = 'classic';
  private lightingStyle: string = 'dramatic';
  private particleDensity: string = 'medium';

  constructor(app: pc.Application) {
    super(app);
    this.initializeGothicAssets();
  }

  public async generateGothicStage(options: GothicStageOptions = {}): Promise<any> {
    try {
      Logger.info('Generating gothic stage with options:', options);
      
      // Set gothic-specific options
      this.gothicIntensity = options.gothicIntensity || 'moderate';
      this.gothicStyle = options.gothicStyle || 'classic';
      this.lightingStyle = options.lightingStyle || 'dramatic';
      this.particleDensity = options.particleDensity || 'medium';
      
      // Generate base stage
      const stageData = await this.generateStage(options);
      
      // Apply gothic enhancements
      const enhancedStage = this.applyGothicEnhancements(stageData, options);
      
      Logger.info('Gothic stage generated successfully:', enhancedStage.name);
      return enhancedStage;
      
    } catch (error) {
      Logger.error('Error generating gothic stage:', error);
      throw error;
    }
  }

  private applyGothicEnhancements(stageData: any, options: GothicStageOptions): any {
    // Apply gothic lighting
    stageData.lighting = this.applyGothicLighting(stageData.lighting, options);
    
    // Apply gothic particles
    stageData.particles = this.applyGothicParticles(stageData.particles, options);
    
    // Apply gothic atmosphere
    stageData.atmosphere = this.applyGothicAtmosphere(stageData.atmosphere, options);
    
    // Apply gothic architecture details
    stageData.layers = this.applyGothicArchitecture(stageData.layers, options);
    
    // Apply gothic color scheme
    stageData.colors = this.applyGothicColorScheme(options);
    
    return stageData;
  }

  private applyGothicLighting(baseLighting: any, options: GothicStageOptions): any {
    const gothicLighting = {
      ...baseLighting,
      type: 'gothic',
      style: this.lightingStyle,
      intensity: this.getGothicLightingIntensity(),
      color: this.getGothicLightingColor(),
      shadows: true,
      fog: true,
      ambient: this.getGothicAmbientColor(),
      dramatic: this.lightingStyle === 'dramatic',
      moody: this.lightingStyle === 'moody',
      ominous: this.lightingStyle === 'ominous',
      ethereal: this.lightingStyle === 'ethereal'
    };

    // Add style-specific lighting effects
    switch (this.gothicStyle) {
      case 'dark_stalkers':
        gothicLighting.color = '#8B0000';
        gothicLighting.ambient = '#1A1A1A';
        gothicLighting.dramatic = true;
        break;
      case 'guilty_gear':
        gothicLighting.color = '#4B0082';
        gothicLighting.ambient = '#2F2F2F';
        gothicLighting.moody = true;
        break;
      case 'soul_calibur':
        gothicLighting.color = '#8B4513';
        gothicLighting.ambient = '#2F2F2F';
        gothicLighting.ominous = true;
        break;
      case 'classic':
        gothicLighting.color = '#8B0000';
        gothicLighting.ambient = '#2F2F2F';
        gothicLighting.dramatic = true;
        break;
      case 'modern':
        gothicLighting.color = '#4B0082';
        gothicLighting.ambient = '#1A1A1A';
        gothicLighting.ethereal = true;
        break;
    }

    return gothicLighting;
  }

  private applyGothicParticles(baseParticles: any, options: GothicStageOptions): any {
    const densityMultiplier = this.getParticleDensityMultiplier();
    
    const gothicParticles = {
      ...baseParticles,
      ash: this.generateAsh(Math.floor(30 * densityMultiplier)),
      embers: this.generateEmbers(Math.floor(20 * densityMultiplier)),
      mist: this.generateGothicMist(Math.floor(15 * densityMultiplier)),
      batSwarm: this.generateBatSwarm(Math.floor(8 * densityMultiplier)),
      ghostlyWisp: this.generateGhostlyWisp(Math.floor(10 * densityMultiplier)),
      dust: this.generateDust(Math.floor(20 * densityMultiplier)),
      gothicLeaves: this.generateGothicLeaves(Math.floor(25 * densityMultiplier)),
      steam: this.generateSteam(Math.floor(15 * densityMultiplier)),
      clockwork: this.generateClockwork(Math.floor(10 * densityMultiplier))
    };

    // Add style-specific particles
    switch (this.gothicStyle) {
      case 'dark_stalkers':
        gothicParticles.darkEnergy = this.generateDarkEnergy(Math.floor(15 * densityMultiplier));
        gothicParticles.vampireMist = this.generateVampireMist(Math.floor(12 * densityMultiplier));
        break;
      case 'guilty_gear':
        gothicParticles.steam = this.generateSteam(Math.floor(20 * densityMultiplier));
        gothicParticles.mechanical = this.generateMechanical(Math.floor(15 * densityMultiplier));
        break;
      case 'soul_calibur':
        gothicParticles.ancientDust = this.generateAncientDust(Math.floor(18 * densityMultiplier));
        gothicParticles.spiritualEnergy = this.generateSpiritualEnergy(Math.floor(12 * densityMultiplier));
        break;
    }

    return gothicParticles;
  }

  private applyGothicAtmosphere(baseAtmosphere: any, options: GothicStageOptions): any {
    const gothicAtmosphere = {
      ...baseAtmosphere,
      type: 'gothic',
      intensity: this.getGothicIntensityMultiplier(),
      effects: [
        { type: 'gothic_fog', intensity: 0.7 * this.getGothicIntensityMultiplier() },
        { type: 'dramatic_lighting', intensity: 0.8 * this.getGothicIntensityMultiplier() },
        { type: 'gothic_ambience', intensity: 0.6 * this.getGothicIntensityMultiplier() },
        { type: 'gothic_mystery', intensity: 0.5 * this.getGothicIntensityMultiplier() }
      ]
    };

    // Add style-specific atmosphere
    switch (this.gothicStyle) {
      case 'dark_stalkers':
        gothicAtmosphere.effects.push(
          { type: 'vampire_aura', intensity: 0.8 },
          { type: 'dark_energy', intensity: 0.6 }
        );
        break;
      case 'guilty_gear':
        gothicAtmosphere.effects.push(
          { type: 'steam_effects', intensity: 0.7 },
          { type: 'mechanical_ambience', intensity: 0.5 }
        );
        break;
      case 'soul_calibur':
        gothicAtmosphere.effects.push(
          { type: 'ancient_mystery', intensity: 0.9 },
          { type: 'spiritual_presence', intensity: 0.7 }
        );
        break;
    }

    return gothicAtmosphere;
  }

  private applyGothicArchitecture(layers: any, options: GothicStageOptions): any {
    // Enhance existing layers with gothic details
    if (layers.midBackground && layers.midBackground.elements) {
      layers.midBackground.elements = layers.midBackground.elements.map((element: any) => {
        return {
          ...element,
          gothic: true,
          gothicStyle: this.gothicStyle,
          gothicIntensity: this.gothicIntensity
        };
      });
    }

    if (layers.nearBackground && layers.nearBackground.elements) {
      layers.nearBackground.elements = layers.nearBackground.elements.map((element: any) => {
        return {
          ...element,
          gothic: true,
          gothicStyle: this.gothicStyle,
          gothicIntensity: this.gothicIntensity
        };
      });
    }

    return layers;
  }

  private applyGothicColorScheme(options: GothicStageOptions): any {
    const colorSchemes: Record<string, any> = {
      dark_stalkers: {
        primary: '#8B0000',
        secondary: '#1A1A1A',
        accent: '#FF4500',
        background: '#000000'
      },
      guilty_gear: {
        primary: '#4B0082',
        secondary: '#2F2F2F',
        accent: '#8A2BE2',
        background: '#1A1A1A'
      },
      soul_calibur: {
        primary: '#8B4513',
        secondary: '#2F2F2F',
        accent: '#DAA520',
        background: '#1A1A1A'
      },
      classic: {
        primary: '#8B0000',
        secondary: '#2F2F2F',
        accent: '#FFD700',
        background: '#1A1A1A'
      },
      modern: {
        primary: '#4B0082',
        secondary: '#1A1A1A',
        accent: '#8A2BE2',
        background: '#000000'
      }
    };

    return colorSchemes[this.gothicStyle] || colorSchemes.classic;
  }

  private getGothicLightingIntensity(): number {
    const intensities: Record<string, number> = {
      subtle: 0.3,
      moderate: 0.5,
      intense: 0.7,
      extreme: 0.9
    };
    return intensities[this.gothicIntensity] || 0.5;
  }

  private getGothicLightingColor(): string {
    const colors: Record<string, string> = {
      dark_stalkers: '#8B0000',
      guilty_gear: '#4B0082',
      soul_calibur: '#8B4513',
      classic: '#8B0000',
      modern: '#4B0082'
    };
    return colors[this.gothicStyle] || '#8B0000';
  }

  private getGothicAmbientColor(): string {
    const colors: Record<string, string> = {
      dark_stalkers: '#1A1A1A',
      guilty_gear: '#2F2F2F',
      soul_calibur: '#2F2F2F',
      classic: '#2F2F2F',
      modern: '#1A1A1A'
    };
    return colors[this.gothicStyle] || '#2F2F2F';
  }

  private getGothicIntensityMultiplier(): number {
    const multipliers: Record<string, number> = {
      subtle: 0.5,
      moderate: 1.0,
      intense: 1.5,
      extreme: 2.0
    };
    return multipliers[this.gothicIntensity] || 1.0;
  }

  private getParticleDensityMultiplier(): number {
    const multipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      extreme: 2.0
    };
    return multipliers[this.particleDensity] || 1.0;
  }

  private initializeGothicAssets(): void {
    // Pre-create gothic-specific materials
    this.createGothicMaterials();
    
    // Pre-create gothic-specific meshes
    this.createGothicMeshes();
  }

  private createGothicMaterials(): void {
    const gothicStyles = ['dark_stalkers', 'guilty_gear', 'soul_calibur', 'classic', 'modern'];
    
    for (const style of gothicStyles) {
      const material = new pc.StandardMaterial();
      material.diffuse = this.hexToColor(this.getGothicLightingColor());
      material.emissive = this.hexToColor(this.getGothicAmbientColor());
      material.update();
      
      this.assetCache[`gothic_material_${style}`] = {
        id: `gothic_material_${style}`,
        type: 'material',
        data: material,
        loaded: true,
        material: material
      };
    }
  }

  private createGothicMeshes(): void {
    // Create gothic-specific meshes
    const gothicMeshes = {
      gothic_arch: pc.createBox(this.app.graphicsDevice, { width: 2, height: 4, depth: 1 }),
      gothic_spire: pc.createCylinder(this.app.graphicsDevice, { radius: 0.5, height: 8 }),
      gothic_gargoyle: pc.createSphere(this.app.graphicsDevice, { radius: 1 }),
      gothic_tombstone: pc.createBox(this.app.graphicsDevice, { width: 1, height: 2, depth: 0.5 }),
      gothic_cross: pc.createBox(this.app.graphicsDevice, { width: 0.5, height: 3, depth: 0.5 })
    };
    
    for (const [name, mesh] of Object.entries(gothicMeshes)) {
      this.assetCache[`gothic_mesh_${name}`] = {
        id: `gothic_mesh_${name}`,
        type: 'mesh',
        data: mesh,
        loaded: true,
        mesh: mesh
      };
    }
  }

  // Gothic-specific particle generation methods
  private generateDarkEnergy(count: number): any[] {
    const particles: any[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: this.rand(-40, 40),
        y: this.rand(-25, 25),
        size: this.rand(3, 8),
        color: '#8B0000',
        opacity: this.rand(0.5, 0.9),
        lifetime: this.rand(2000, 6000),
        energy: true
      });
    }
    return particles;
  }

  private generateVampireMist(count: number): any[] {
    const particles: any[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: this.rand(-50, 50),
        y: this.rand(-30, 30),
        size: this.rand(15, 30),
        color: '#4B0082',
        opacity: this.rand(0.3, 0.7),
        lifetime: this.rand(4000, 8000),
        vampire: true
      });
    }
    return particles;
  }

  private generateMechanical(count: number): any[] {
    const particles: any[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: this.rand(-40, 40),
        y: this.rand(-25, 25),
        size: this.rand(2, 6),
        color: '#C0C0C0',
        lifetime: this.rand(1000, 3000),
        mechanical: true
      });
    }
    return particles;
  }

  private generateAncientDust(count: number): any[] {
    const particles: any[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: this.rand(-50, 50),
        y: this.rand(-30, 30),
        size: this.rand(1, 4),
        color: '#8B4513',
        lifetime: this.rand(3000, 7000),
        ancient: true
      });
    }
    return particles;
  }

  private generateSpiritualEnergy(count: number): any[] {
    const particles: any[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: this.rand(-40, 40),
        y: this.rand(-25, 25),
        size: this.rand(4, 10),
        color: '#DAA520',
        opacity: this.rand(0.4, 0.8),
        lifetime: this.rand(3000, 6000),
        spiritual: true
      });
    }
    return particles;
  }

  // Helper methods
  private rand(min: number, max: number): number {
    return min + (max - min) * Math.random();
  }

  private hexToColor(hex: string): pc.Color {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return new pc.Color(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      );
    }
    return new pc.Color(1, 1, 1);
  }

  // Access to parent class methods
  private generateAsh(count: number): any[] {
    return this.generateAsh(count);
  }

  private generateEmbers(count: number): any[] {
    return this.generateEmbers(count);
  }

  private generateGothicMist(count: number): any[] {
    return this.generateGothicMist(count);
  }

  private generateBatSwarm(count: number): any[] {
    return this.generateBatSwarm(count);
  }

  private generateGhostlyWisp(count: number): any[] {
    return this.generateGhostlyWisp(count);
  }

  private generateDust(count: number): any[] {
    return this.generateDust(count);
  }

  private generateGothicLeaves(count: number): any[] {
    return this.generateGothicLeaves(count);
  }

  private generateSteam(count: number): any[] {
    return this.generateSteam(count);
  }

  private generateClockwork(count: number): any[] {
    return this.generateClockwork(count);
  }
}