export class SpectatorOverlay {
  private container: HTMLDivElement;
  private timeline: HTMLDivElement;
  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '50%'; this.container.style.bottom = '18px'; this.container.style.transform = 'translateX(-50%)';
    this.container.style.padding = '6px 8px'; this.container.style.background = 'rgba(0,0,0,0.6)'; this.container.style.color = '#fff'; this.container.style.borderRadius = '6px'; this.container.style.zIndex = '10005';
    this.timeline = document.createElement('div'); this.timeline.style.width = '420px'; this.timeline.style.height = '6px'; this.timeline.style.background = 'rgba(255,255,255,0.2)'; this.timeline.style.borderRadius = '3px';
    this.container.appendChild(this.timeline);
    document.body.appendChild(this.container);
  }
  setMarkers(events: Array<{ t: number; kind: string }>): void {
    this.timeline.innerHTML = '';
    for (const ev of events) {
      const dot = document.createElement('div'); dot.style.position = 'relative'; dot.style.left = `${Math.round(ev.t * 100)}%`; dot.style.width = '4px'; dot.style.height = '6px'; dot.style.background = ev.kind === 'ko' ? '#f55' : '#ff5'; dot.style.display = 'inline-block';
      this.timeline.appendChild(dot);
    }
  }
}

