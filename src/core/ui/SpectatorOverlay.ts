export class SpectatorOverlay {
  private container: HTMLDivElement;
  private timeline: HTMLDivElement;
  private lastFrame = 0;
  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '50%'; this.container.style.bottom = '18px'; this.container.style.transform = 'translateX(-50%)';
    this.container.style.padding = '6px 8px'; this.container.style.background = 'rgba(0,0,0,0.6)'; this.container.style.color = '#fff'; this.container.style.borderRadius = '6px'; this.container.style.zIndex = '10005';
    this.timeline = document.createElement('div'); this.timeline.style.width = '420px'; this.timeline.style.height = '6px'; this.timeline.style.background = 'rgba(255,255,255,0.2)'; this.timeline.style.borderRadius = '3px';
    this.container.appendChild(this.timeline);
    document.body.appendChild(this.container);
    setInterval(() => this.pull(), 500);
  }
  setMarkers(events: Array<{ t: number; kind: string }>): void {
    this.timeline.innerHTML = '';
    for (const ev of events) {
      const dot = document.createElement('div'); dot.style.position = 'relative'; dot.style.left = `${Math.round(ev.t * 100)}%`; dot.style.width = '4px'; dot.style.height = '6px'; dot.style.background = ev.kind === 'ko' ? '#f55' : '#ff5'; dot.style.display = 'inline-block';
      this.timeline.appendChild(dot);
    }
  }

  private pull(): void {
    try {
      const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
      const combat = services?.resolve?.('combat');
      if (!combat) return;
      const events = combat.consumeTimeline?.();
      if (Array.isArray(events) && events.length) {
        const total = Math.max(this.lastFrame, events[events.length - 1].t || 0);
        const markers = events.map((e: any) => ({ t: (total ? (e.t / total) : 0), kind: e.kind }));
        this.setMarkers(markers);
        this.lastFrame = total;
      }
    } catch {}
  }
}

