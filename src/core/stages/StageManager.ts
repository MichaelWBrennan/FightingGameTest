import * as pc from 'playcanvas';

export class StageManager {
  private app: pc.Application;

  constructor(app: pc.Application) {
    this.app = app;
  }

  public async initialize(): Promise<void> {
    // Camera
    const camera = new pc.Entity('MainCamera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0, 0, 0),
      fov: 55,
      nearClip: 0.1,
      farClip: 1000
    });
    camera.setPosition(0, 2, 10);
    camera.lookAt(0, 1, 0);
    this.app.root.addChild(camera);

    // Light
    const light = new pc.Entity('DirectionalLight');
    light.addComponent('light', {
      type: pc.LIGHTTYPE_DIRECTIONAL,
      color: new pc.Color(1, 1, 1),
      intensity: 1.0,
      castShadows: false
    });
    light.setEulerAngles(45, 30, 0);
    this.app.root.addChild(light);

    // Test cube
    const box = new pc.Entity('TestBox');
    box.addComponent('render', { type: 'box' });
    box.setPosition(0, 0.5, 0);
    this.app.root.addChild(box);

    // Spot light pointed directly at the cube
    const spot = new pc.Entity('SpotLight');
    spot.addComponent('light', {
      type: pc.LIGHTTYPE_SPOT,
      color: new pc.Color(1, 1, 1),
      intensity: 1.5,
      range: 30,
      innerConeAngle: 20,
      outerConeAngle: 35,
      castShadows: false
    });
    spot.setPosition(0, 4, 8);
    spot.lookAt(box.getPosition());
    this.app.root.addChild(spot);
  }
}

