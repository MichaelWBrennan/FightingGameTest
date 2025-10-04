import * as pc from 'playcanvas';

export class CameraCinematics {
  private app: pc.Application;
  private restoring = false;

  constructor(app: pc.Application) { this.app = app; }

  koCinematic(durationMs: number = 1800): void {
    try {
      const cam = this.app.root.findByName('MainCamera');
      if (!cam || !cam.camera) return;
      const camera = cam.camera;
      const isOrtho = camera.projection === pc.PROJECTION_ORTHOGRAPHIC;
      const startFov = camera.fov;
      const startOrtho = camera.orthoHeight;
      const startPos = cam.getPosition().clone();
      const startRot = cam.getEulerAngles().clone();
      const targetFov = Math.max(28, startFov - 14);
      const targetOrtho = startOrtho * 0.86;
      const start = performance.now();
      const shakeMag = 0.04;
      const tick = () => {
        if (this.restoring) return;
        const now = performance.now();
        const t = Math.min(1, (now - start) / durationMs);
        const ease = (p: number) => 1 - Math.pow(1 - p, 3);
        if (isOrtho) {
          camera.orthoHeight = startOrtho + (targetOrtho - startOrtho) * ease(t);
        } else {
          camera.fov = startFov + (targetFov - startFov) * ease(t);
        }
        const nudge = new pc.Vec3(
          (Math.random() - 0.5) * shakeMag,
          (Math.random() - 0.5) * shakeMag,
          0
        );
        cam.setPosition(startPos.x + nudge.x, startPos.y + nudge.y, startPos.z);
        cam.setEulerAngles(startRot.x, startRot.y, startRot.z);
        if (t < 1) requestAnimationFrame(tick); else this.restore(cam, startFov, startOrtho, startPos, startRot);
      };
      requestAnimationFrame(tick);
    } catch {}
  }

  private restore(cam: pc.Entity, fov: number, ortho: number, pos: pc.Vec3, rot: pc.Vec3): void {
    try {
      this.restoring = true;
      setTimeout(() => {
        try {
          if (cam && cam.camera) {
            if (cam.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) cam.camera.orthoHeight = ortho; else cam.camera.fov = fov;
          }
          cam.setPosition(pos);
          cam.setEulerAngles(rot);
          this.restoring = false;
        } catch {}
      }, 350);
    } catch {}
  }

  superCinematic(durationMs: number = 1200): void {
    try {
      const cam = this.app.root.findByName('MainCamera');
      if (!cam || !cam.camera) return;
      const camera = cam.camera;
      const isOrtho = camera.projection === pc.PROJECTION_ORTHOGRAPHIC;
      const startFov = camera.fov;
      const startOrtho = camera.orthoHeight;
      const startPos = cam.getPosition().clone();
      const startRot = cam.getEulerAngles().clone();
      const targetFov = Math.max(26, startFov - 18);
      const targetOrtho = startOrtho * 0.8;
      const start = performance.now();
      const tilt = 4;
      const tick = () => {
        if (this.restoring) return;
        const now = performance.now();
        const t = Math.min(1, (now - start) / durationMs);
        const ease = (p: number) => 1 - Math.pow(1 - p, 3);
        if (isOrtho) {
          camera.orthoHeight = startOrtho + (targetOrtho - startOrtho) * ease(t);
        } else {
          camera.fov = startFov + (targetFov - startFov) * ease(t);
        }
        cam.setEulerAngles(startRot.x + tilt * ease(t), startRot.y, startRot.z);
        if (t < 1) requestAnimationFrame(tick); else this.restore(cam, startFov, startOrtho, startPos, startRot);
      };
      requestAnimationFrame(tick);
    } catch {}
  }
}

