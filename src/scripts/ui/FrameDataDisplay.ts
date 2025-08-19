import * as pc from 'playcanvas';

export class FrameDataDisplay extends pc.ScriptType {
  private textElement!: pc.Entity;

  public initialize(): void {
    this.textElement = new pc.Entity('FrameDataText');
    this.textElement.addComponent('element', {
      type: 'text',
      text: 'Frame Data:',
      fontSize: 24,
      color: new pc.Color(1, 1, 1),
      alignment: new pc.Vec2(0.5, 0.5),
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(this.textElement);

    this.app.on('debug:framedata', this.onFrameData, this);
  }

  private onFrameData(data: any): void {
    if (this.textElement.element) {
      this.textElement.element.text = `
        Move: ${data.moveName}
        Startup: ${data.startup}
        Active: ${data.active}
        Recovery: ${data.recovery}
        On Block: ${data.onBlock}
        On Hit: ${data.onHit}
      `;
    }
  }

  public destroy(): void {
    this.app.off('debug:framedata', this.onFrameData, this);
  }
}

pc.registerScript(FrameDataDisplay, 'frameDataDisplay');
