import * as pc from 'playcanvas';

export class TrainingOverlay {
  private app: pc.Application;
  private container: HTMLDivElement;
  private inputLabel: HTMLDivElement;
  private hitboxToggle = false;
  private paused = false;

  constructor(app: pc.Application) {
    this.app = app;
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.bottom = '8px';
    this.container.style.left = '8px';
    this.container.style.background = 'rgba(0,0,0,0.5)';
    this.container.style.color = '#fff';
    this.container.style.font = '12px monospace';
    this.container.style.padding = '6px 8px';
    this.container.style.borderRadius = '4px';
    this.container.style.zIndex = '10002';
    this.inputLabel = document.createElement('div');
    this.container.appendChild(this.inputLabel);
    document.body.appendChild(this.container);

    window.addEventListener('keydown', (e) => this.onKey(e));
    this.app.on('update', () => this.renderInputs());
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'F2') this.hitboxToggle = !this.hitboxToggle;
    if (e.key === 'F3') this.paused = !this.paused;
    if (e.key === 'F4') this.stepOne();
  }

  private renderInputs(): void {
    try {
      const services: any = (this.app as any)._services;
      const input = services?.resolve?.('input');
      if (!input) return;
      const p1 = input.getPlayerInputs(0);
      this.inputLabel.textContent = `P1: ${['up','down','left','right','lightPunch','mediumPunch','heavyPunch','lightKick','mediumKick','heavyKick']
        .filter(k => (p1 as any)[k]).join(' ')}`;
    } catch {}
  }

  stepOne(): void {
    try {
      const engine: any = (this.app as any);
      // Placeholder: could gate main update loop with paused flag
    } catch {}
  }

  get showHitboxes(): boolean { return this.hitboxToggle; }
  get isPaused(): boolean { return this.paused; }
}

