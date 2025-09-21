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
      const startFov = camera.fov;
      const startPos = cam.getPosition().clone();
      const startRot = cam.getEulerAngles().clone();
      const targetFov = Math.max(28, startFov - 14);
      const start = performance.now();
      const shakeMag = 0.04;
      const tick = () => {
        if (this.restoring) return;
        const now = performance.now();
        const t = Math.min(1, (now - start) / durationMs);
        const ease = (p: number) => 1 - Math.pow(1 - p, 3);
        camera.fov = startFov + (targetFov - startFov) * ease(t);
        const nudge = new pc.Vec3(
          (Math.random() - 0.5) * shakeMag,
          (Math.random() - 0.5) * shakeMag,
          0
        );
        cam.setPosition(startPos.x + nudge.x, startPos.y + nudge.y, startPos.z);
        cam.setEulerAngles(startRot.x, startRot.y, startRot.z);
        if (t < 1) requestAnimationFrame(tick); else this.restore(cam, startFov, startPos, startRot);
      };
      requestAnimationFrame(tick);
    } catch {}
  }

  private restore(cam: pc.Entity, fov: number, pos: pc.Vec3, rot: pc.Vec3): void {
    try {
      this.restoring = true;
      setTimeout(() => {
        try {
          if (cam && cam.camera) cam.camera.fov = fov;
          cam.setPosition(pos);
          cam.setEulerAngles(rot);
          this.restoring = false;
        } catch {}
      }, 350);
    } catch {}
  }
}

