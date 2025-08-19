import * as pc from 'playcanvas';
import { ISystem } from "../../../types/core";

export class SceneManager implements ISystem {
  private app: pc.Application;
  public mainScene!: pc.Entity;
  public camera!: pc.Entity;
  public keyLight!: pc.Entity;
  public rimLight!: pc.Entity;
  public accentLight!: pc.Entity;
  public backgroundContainer!: pc.Entity;
  public midgroundContainer!: pc.Entity;
  public backgroundLayers: pc.Entity[] = [];
  public leftBoundary!: pc.Entity;
  public rightBoundary!: pc.Entity;
  public groundBoundary!: pc.Entity;
  public stageGround!: pc.Entity;
  public particleContainer!: pc.Entity;

  constructor(app: pc.Application) {
    this.app = app;
  }

  public initialize(): void {
    this.mainScene = this.app.root.findByName('MainScene') as pc.Entity;
    if (!this.mainScene) {
      this.mainScene = new pc.Entity('MainScene');
      this.app.root.addChild(this.mainScene);
    }
    this.createDefaultEntities();
    this.setupLighting();
  }

  private createDefaultEntities(): void {
    this.createStageBoundaries();
    this.createStageGround();
  }

  private createStageBoundaries(): void {
    this.leftBoundary = new pc.Entity('LeftBoundary');
    this.leftBoundary.addComponent('collision', {
        type: 'box',
        halfExtents: new pc.Vec3(0.1, 10, 5)
    });
    this.leftBoundary.setPosition(-12, 0, 0);
    this.mainScene.addChild(this.leftBoundary);

    this.rightBoundary = new pc.Entity('RightBoundary');
    this.rightBoundary.addComponent('collision', {
        type: 'box',
        halfExtents: new pc.Vec3(0.1, 10, 5)
    });
    this.rightBoundary.setPosition(12, 0, 0);
    this.mainScene.addChild(this.rightBoundary);

    this.groundBoundary = new pc.Entity('GroundBoundary');
    this.groundBoundary.addComponent('collision', {
        type: 'box',
        halfExtents: new pc.Vec3(15, 0.1, 5)
    });
    this.groundBoundary.setPosition(0, -5, 0);
    this.mainScene.addChild(this.groundBoundary);
  }

  private createStageGround(): void {
    this.stageGround = new pc.Entity('StageGround');
    this.stageGround.addComponent('render', {
        type: 'plane'
    });
    this.stageGround.setPosition(0, -5, -1);
    this.stageGround.setLocalScale(30, 1, 10);
    this.mainScene.addChild(this.stageGround);
  }

  private setupLighting(): void {
    this.keyLight = new pc.Entity('KeyLight');
    this.keyLight.addComponent('light', {
        type: pc.LIGHTTYPE_DIRECTIONAL,
        color: new pc.Color(1.0, 0.95, 0.8),
        intensity: 1.2,
        castShadows: true,
        shadowBias: 0.0005,
        shadowDistance: 50,
        shadowResolution: 2048
    });
    this.keyLight.setEulerAngles(45, -30, 0);
    this.mainScene.addChild(this.keyLight);

    this.rimLight = new pc.Entity('RimLight');
    this.rimLight.addComponent('light', {
        type: pc.LIGHTTYPE_DIRECTIONAL,
        color: new pc.Color(0.6, 0.8, 1.0),
        intensity: 0.8,
        castShadows: false
    });
    this.rimLight.setEulerAngles(-45, 150, 0);
    this.mainScene.addChild(this.rimLight);

    this.accentLight = new pc.Entity('AccentLight');
    this.accentLight.addComponent('light', {
        type: pc.LIGHTTYPE_SPOT,
        color: new pc.Color(1.0, 0.7, 0.3),
        intensity: 0,
        range: 20,
        innerConeAngle: 20,
        outerConeAngle: 35,
        castShadows: true
    });
    this.accentLight.setPosition(0, 8, 5);
    this.accentLight.lookAt(0, 0, 0);
    this.mainScene.addChild(this.accentLight);
  }

  public destroy(): void {
    this.mainScene.destroy();
  }
}
