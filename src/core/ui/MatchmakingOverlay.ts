export class MatchmakingOverlay {
  private bc: BroadcastChannel;
  private container: HTMLDivElement;
  private status: HTMLSpanElement;
  private inQueue = false;
  private myId = Math.random().toString(36).slice(2, 8);
  private paired = false;

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
    if (this.inQueue) this.bc.postMessage({ t: 'find', id: this.myId });
  }

  private onMsg(m: any): void {
    if (!this.inQueue || this.paired) return;
    if (m?.t === 'find' && m.id !== this.myId) {
      const session = (this.myId < m.id ? this.myId + m.id : m.id + this.myId);
      const host = this.myId < m.id; // Lower id hosts
      this.bc.postMessage({ t: 'offer', session, host, to: m.id, from: this.myId });
    }
    if (m?.t === 'offer' && m.to === this.myId && !this.paired) {
      this.paired = true;
      this.inQueue = false;
      this.status.textContent = `Match: ${m.session} (${m.host ? 'You host' : 'You join'})`;
      // Auto-connect using WebRTC transport via NetcodeService
      try {
        const services: any = (window as any).pc?.Application?.getApplication?._services || (document as any)._services || (window as any)._services;
        const net = services?.resolve?.('netcode');
        // dynamic import to stay compatible in browser
        (import('../netcode/BroadcastSignaling')).then(({ BroadcastSignaling }) => {
          try {
            const signaling = new BroadcastSignaling(m.session);
            const ice = [ { urls: ['stun:stun.l.google.com:19302'] } ] as any;
            net?.enableWebRTC(signaling, m.host, ice);
          } catch {}
        }).catch(() => {});
      } catch {}
    }
  }

  private uuid(): string { return Math.random().toString(36).slice(2, 10); }
}

