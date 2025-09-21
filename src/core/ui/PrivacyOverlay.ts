export class PrivacyOverlay {
  private container: HTMLDivElement;
  constructor(private services: any) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '8px'; this.container.style.top = '8px'; this.container.style.width = '300px'; this.container.style.background = 'rgba(0,0,0,0.7)'; this.container.style.color = '#fff'; this.container.style.padding = '8px'; this.container.style.borderRadius = '6px'; this.container.style.zIndex = '10003'; this.container.style.display = 'none';
    const title = document.createElement('div'); title.textContent = 'Privacy'; title.style.fontWeight = 'bold'; title.style.marginBottom = '6px';
    const row = (label: string, el: HTMLElement) => { const d = document.createElement('div'); d.style.margin = '6px 0'; const l = document.createElement('div'); l.textContent = label; d.appendChild(l); d.appendChild(el); this.container.appendChild(d); };
    const analytics = document.createElement('input'); analytics.type = 'checkbox'; analytics.checked = true; analytics.onchange = () => { try { localStorage.setItem('analytics_enabled', analytics.checked ? '1' : '0'); } catch {} };
    row('Send analytics', analytics);
    const crash = document.createElement('input'); crash.type = 'checkbox'; crash.checked = true; crash.onchange = () => { try { localStorage.setItem('crash_enabled', crash.checked ? '1' : '0'); } catch {} };
    row('Send crash reports', crash);
    const btn = document.createElement('button'); btn.textContent = 'Privacy'; btn.style.position = 'fixed'; btn.style.left = '8px'; btn.style.top = '8px'; btn.style.zIndex = '10002'; btn.onclick = () => { this.container.style.display = this.container.style.display === 'none' ? 'block' : 'none'; };
    document.body.appendChild(btn); document.body.appendChild(this.container);
  }
}

