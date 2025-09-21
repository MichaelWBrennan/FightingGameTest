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
    // Controls: pause/step for spectators
    const row = document.createElement('div'); row.style.marginTop = '6px';
    const pause = document.createElement('button'); pause.textContent = 'Pause';
    const step = document.createElement('button'); step.textContent = 'Step'; step.style.marginLeft = '6px';
    row.appendChild(pause); row.appendChild(step); this.container.appendChild(row);
    pause.onclick = () => { try { const svc: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services; svc?.resolve?.('spectate')?.broadcast?.({ ctrl: 'pause' }); } catch {} };
    step.onclick = () => { try { const svc: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services; svc?.resolve?.('spectate')?.broadcast?.({ ctrl: 'step' }); } catch {} };
    // Listen to remote spectate events (if any)
    try {
      const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
      const spectate = services?.resolve?.('spectate');
      spectate?.on?.((e: any) => {
        if (!e || typeof e !== 'object') return;
        if (typeof e.t === 'number' && e.kind) {
          const total = Math.max(1, e.t);
          this.setMarkers([{ t: 1, kind: e.kind }]);
        }
      });
    } catch {}
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

