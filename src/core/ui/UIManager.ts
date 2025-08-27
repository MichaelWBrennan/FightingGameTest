import * as pc from 'playcanvas';

export class UIManager {
  private app: pc.Application;

  constructor(app: pc.Application) {
    this.app = app;
  }

  public async initialize(): Promise<void> {
    // Minimal UI init for core engine
  }
}

