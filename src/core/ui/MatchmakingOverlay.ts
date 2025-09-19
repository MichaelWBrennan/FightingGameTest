export class MatchmakingOverlay {
  private bc: BroadcastChannel;
  private container: HTMLDivElement;
  private status: HTMLSpanElement;
  private inQueue = false;

  constructor() {
    this.bc = new BroadcastChannel('fg-queue');
    this.bc.onmessage = (e) => this.onMsg(e.data);
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.right = '8px';
    this.container.style.bottom = '56px';
    this.container.style.padding = '8px 10px';
    this.container.style.background = 'rgba(0,0,0,0.6)';
    this.container.style.color = '#fff';
    this.container.style.borderRadius = '6px';
    this.container.style.font = '12px system-ui';
    this.container.style.zIndex = '10003';
    const btn = document.createElement('button');
    btn.textContent = 'Quick Match';
    btn.onclick = () => this.toggleQueue();
    btn.style.marginRight = '8px';
    this.status = document.createElement('span');
    this.status.textContent = 'Idle';
    this.container.appendChild(btn);
    this.container.appendChild(this.status);
    document.body.appendChild(this.container);
  }

  private toggleQueue(): void {
    this.inQueue = !this.inQueue;
    this.status.textContent = this.inQueue ? 'Searching…' : 'Idle';
    if (this.inQueue) this.bc.postMessage({ t: 'find', id: this.uuid() });
  }

  private onMsg(m: any): void {
    if (!this.inQueue) return;
    if (m?.t === 'find') {
      // Pair immediately for demo: session = min(id,id2)+max(id,id2)
      const mine = 'me';
      const session = (mine < m.id ? mine + m.id : m.id + mine);
      this.bc.postMessage({ t: 'pair', session });
    }
    if (m?.t === 'pair') {
      this.status.textContent = 'Match found: ' + m.session;
      // consumer can use NetplayOverlay to host/join this session code
    }
  }

  private uuid(): string { return Math.random().toString(36).slice(2, 10); }
}

