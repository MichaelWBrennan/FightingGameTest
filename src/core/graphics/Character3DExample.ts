import * as pc from 'playcanvas';
import { CharacterModelManager } from './CharacterModelManager';
import { CharacterAnimationSystem } from './CharacterAnimationSystem';

export class Character3DExample {
  private app: pc.Application;
  private modelManager: CharacterModelManager;
  private animationSystem: CharacterAnimationSystem;
  private characters: string[] = [];

  constructor(app: pc.Application) {
    this.app = app;
    this.modelManager = new CharacterModelManager(app);
    this.animationSystem = new CharacterAnimationSystem(app);
    this.setupExample();
  }

  private setupExample(): void {
    // Get all generated characters
    const allCharacters = this.modelManager.getAllCharacterData();
    
    // Position characters in a line
    allCharacters.forEach((character, index) => {
      const characterId = character.id;
      const x = (index - 5.5) * 3; // Space characters 3 units apart
      const y = 0;
      const z = 0;
      
      // Set character position
      this.modelManager.setCharacterPosition(characterId, new pc.Vec3(x, y, z));
      
      // Create animations for this character
      this.animationSystem.createIdleAnimation(characterId);
      this.animationSystem.createWalkAnimation(characterId);
      this.animationSystem.createAttackAnimation(characterId, 'punch');
      this.animationSystem.createAttackAnimation(characterId, 'kick');
      
      // Start with idle animation
      this.animationSystem.playAnimation(characterId, 'idle', { loop: true });
      
      this.characters.push(characterId);
    });
    
    // Set up camera to view all characters
    this.setupCamera();
    
    // Set up lighting
    this.setupLighting();
    
    // Start animation loop
    this.startAnimationLoop();
  }

  private setupCamera(): void {
    const camera = new pc.Entity('Camera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.1, 0.1, 0.1),
      projection: pc.PROJECTION_PERSPECTIVE,
      fov: 60,
      nearClip: 0.1,
      farClip: 1000
    });
    
    // Position camera to view all characters
    camera.setPosition(0, 5, 15);
    camera.lookAt(0, 0, 0);
    
    this.app.root.addChild(camera);
    this.app.setCamera(camera);
  }

  private setupLighting(): void {
    // Directional light
    const light = new pc.Entity('DirectionalLight');
    light.addComponent('light', {
      type: pc.LIGHTTYPE_DIRECTIONAL,
      color: new pc.Color(1, 1, 1),
      intensity: 1.0,
      castShadows: true
    });
    light.setEulerAngles(45, 30, 0);
    this.app.root.addChild(light);
    
    // Ambient light
    const ambientLight = new pc.Entity('AmbientLight');
    ambientLight.addComponent('light', {
      type: pc.LIGHTTYPE_AMBIENT,
      color: new pc.Color(0.3, 0.3, 0.3),
      intensity: 0.5
    });
    this.app.root.addChild(ambientLight);
  }

  private startAnimationLoop(): void {
    this.app.on('update', (deltaTime: number) => {
      // Update all character animations
      this.characters.forEach(characterId => {
        this.animationSystem.updateAnimation(characterId, deltaTime);
      });
    });
  }

  public getCharacterInfo(): Array<{
    id: string;
    name: string;
    theme: string;
    fightingStyle: string;
    position: pc.Vec3;
  }> {
    return this.characters.map(characterId => {
      const characterData = this.modelManager.getCharacterData(characterId);
      const config = this.modelManager.getCharacterConfig(characterId);
      
      return {
        id: characterId,
        name: characterData?.name || 'Unknown',
        theme: characterData?.theme || 'Unknown',
        fightingStyle: characterData?.fightingStyle || 'Unknown',
        position: config?.position || new pc.Vec3(0, 0, 0)
      };
    });
  }

  public playCharacterAnimation(characterId: string, animationName: string): void {
    this.animationSystem.playAnimation(characterId, animationName);
  }

  public getCharacterStats(): {
    total: number;
    active: number;
    byTheme: Record<string, number>;
    byFightingStyle: Record<string, number>;
  } {
    return this.modelManager.getCharacterStats();
  }

  public destroy(): void {
    this.modelManager.destroy();
    this.animationSystem.destroy();
    this.characters = [];
  }
}