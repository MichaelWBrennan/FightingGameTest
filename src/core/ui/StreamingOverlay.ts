import { StreamService } from '../stream/StreamService';

export class StreamingOverlay {
  private container: HTMLDivElement;
  private svc: StreamService;
  private recording = false;

  constructor(canvas: HTMLCanvasElement) {
    this.svc = new StreamService(canvas);
    const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
    const i18n = services?.resolve?.('i18n');
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.right = '8px'; this.container.style.top = '8px';
    this.container.style.padding = '6px 8px'; this.container.style.background = 'rgba(0,0,0,0.6)'; this.container.style.color = '#fff'; this.container.style.borderRadius = '6px'; this.container.style.font = '12px system-ui'; this.container.style.zIndex = '10003';
    const btnCap = document.createElement('button'); btnCap.textContent = (i18n?.t?.('capture') || 'Capture'); btnCap.onclick = () => this.toggleCapture(); btnCap.style.marginRight = '6px';
    const btnRec = document.createElement('button'); btnRec.textContent = (i18n?.t?.('record') || 'Record'); btnRec.onclick = () => this.toggleRecord(btnRec);
    this.container.appendChild(btnCap); this.container.appendChild(btnRec);
    document.body.appendChild(this.container);
  }

  private toggleCapture(): void {
    try { this.svc.startCapture(); } catch {}
  }

  private toggleRecord(btn: HTMLButtonElement): void {
    this.recording = !this.recording;
    if (this.recording) { this.svc.startRecording(); btn.textContent = 'Stop'; }
    else { this.svc.stopRecording(); btn.textContent = 'Record'; }
  }
}

