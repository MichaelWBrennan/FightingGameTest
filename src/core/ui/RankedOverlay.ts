export class RankedOverlay {
  private bc: BroadcastChannel;
  private container: HTMLDivElement;
  private status: HTMLDivElement;
  private inQueue = false;
  private myId = Math.random().toString(36).slice(2, 8);
  private mmr = 1000;
  private region = 'NA';

  constructor() {
    this.bc = new BroadcastChannel('fg-ranked');
    this.bc.onmessage = (e) => this.onMsg(e.data);
    const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
    const i18n = services?.resolve?.('i18n');
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.right = '8px'; this.container.style.bottom = '120px';
    this.container.style.padding = '8px 10px'; this.container.style.background = 'rgba(0,0,0,0.6)'; this.container.style.color = '#fff'; this.container.style.borderRadius = '6px'; this.container.style.font = '12px system-ui'; this.container.style.zIndex = '10003';
    const btn = document.createElement('button'); btn.textContent = (i18n?.t?.('ranked') || 'Ranked'); btn.onclick = () => this.toggleQueue(); btn.style.marginRight = '8px';
    this.status = document.createElement('div'); this.status.textContent = (i18n?.t?.('idle') || 'Idle'); this.status.style.display = 'inline-block';
    this.container.appendChild(btn); this.container.appendChild(this.status); document.body.appendChild(this.container);
    try {
      const services: any = (window as any).pc?.Application?.getApplication?._services || (window as any)._services;
      const mms = services?.resolve?.('matchmakingService');
      const p = mms?.getProfile?.(); this.mmr = p?.mmr ?? 1000; this.region = p?.region || 'NA';
    } catch {}
  }

  private toggleQueue(): void {
    this.inQueue = !this.inQueue;
    const services: any = (window as any).pc?.Application?.getApplication?._services || (window as any)._services;
    const analytics = services?.resolve?.('analytics'); analytics?.track?.(this.inQueue ? 'ranked_search' : 'ranked_stop');
    this.status.textContent = this.inQueue ? 'Searching…' : 'Idle';
    if (this.inQueue) this.bc.postMessage({ t: 'find', id: this.myId, mmr: this.mmr, region: this.region });
  }

  private onMsg(m: any): void {
    if (!this.inQueue) return;
    if (m?.t === 'find' && m.id !== this.myId) {
      const mmrDiff = Math.abs((m.mmr|0) - (this.mmr|0));
      if (m.region !== this.region && mmrDiff > 200) return;
      if (mmrDiff > 400) return;
      const session = (this.myId < m.id ? this.myId + m.id : m.id + this.myId);
      const host = this.myId < m.id; // Lower id hosts
      this.bc.postMessage({ t: 'offer', session, host, to: m.id, from: this.myId });
    }
    if (m?.t === 'offer' && m.to === this.myId) {
      this.inQueue = false; this.status.textContent = `Match: ${m.session} (${m.host ? 'You host' : 'You join'})`;
      try {
        const services: any = (window as any).pc?.Application?.getApplication?._services || (window as any)._services;
        const net = services?.resolve?.('netcode'); services?.resolve?.('analytics')?.track?.('ranked_match', { session: m.session, host: m.host });
        (import('../netcode/BroadcastSignaling')).then(({ BroadcastSignaling }) => { try { const signaling = new BroadcastSignaling(m.session); const ice = [ { urls: ['stun:stun.l.google.com:19302'] } ] as any; net?.enableWebRTC(signaling, m.host, ice); } catch {} }).catch(() => {});
      } catch {}
    }
  }
}

