export class ReconnectOverlay {
  private container: HTMLDivElement;
  private label: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '50%'; this.container.style.top = '50%'; this.container.style.transform = 'translate(-50%,-50%)';
    this.container.style.padding = '10px 14px'; this.container.style.background = 'rgba(0,0,0,0.7)'; this.container.style.color = '#fff'; this.container.style.borderRadius = '8px'; this.container.style.zIndex = '10006'; this.container.style.display = 'none';
    this.label = document.createElement('div'); this.label.textContent = 'Reconnecting…'; this.container.appendChild(this.label);
    const btn = document.createElement('button'); btn.textContent = 'Restart ICE'; btn.style.marginTop = '8px'; btn.onclick = () => this.restartIce();
    this.container.appendChild(btn);
    document.body.appendChild(this.container);
    // Listen to ICE state via transport events (polling fallback)
    setInterval(() => this.pollState(), 500);
  }

  private pollState(): void {
    try {
      const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
      const net = services?.resolve?.('netcode'); const tr = net?._getTransport?.();
      const st = tr?.pc?.iceConnectionState || tr?.pc?.connectionState;
      const bad = st === 'disconnected' || st === 'failed';
      this.container.style.display = bad ? 'block' : 'none';
      if (bad) this.label.textContent = `Connection: ${st}`;
    } catch {}
  }

  private restartIce(): void { try { const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services; const tr = services?.resolve?.('netcode')?._getTransport?.(); tr?.restartIce?.(); } catch {} }
}

