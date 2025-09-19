import { BroadcastSignaling } from '../netcode/BroadcastSignaling';

export class NetplayOverlay {
  private container: HTMLDivElement;
  private sessionInput: HTMLInputElement;
  private statusEl: HTMLDivElement;
  private visible = false;
  private app: any;

  constructor(app: any) {
    this.app = app;
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.right = '8px';
    this.container.style.bottom = '8px';
    this.container.style.width = '260px';
    this.container.style.padding = '10px';
    this.container.style.background = 'rgba(0,0,0,0.65)';
    this.container.style.color = '#fff';
    this.container.style.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    this.container.style.borderRadius = '8px';
    this.container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.35)';
    this.container.style.zIndex = '10003';
    this.container.style.display = 'none';

    const title = document.createElement('div');
    title.textContent = 'Netplay (WebRTC)';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    this.container.appendChild(title);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '6px';
    row.style.marginBottom = '6px';
    this.sessionInput = document.createElement('input');
    this.sessionInput.placeholder = 'Session code (e.g. abc123)';
    this.sessionInput.value = localStorage.getItem('netplay_session') || '';
    this.sessionInput.style.flex = '1';
    this.sessionInput.style.padding = '6px 8px';
    this.sessionInput.style.borderRadius = '4px';
    this.sessionInput.style.border = '1px solid rgba(255,255,255,0.15)';
    row.appendChild(this.sessionInput);
    this.container.appendChild(row);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';
    const hostBtn = document.createElement('button');
    hostBtn.textContent = 'Host';
    hostBtn.style.flex = '1';
    const joinBtn = document.createElement('button');
    joinBtn.textContent = 'Join';
    joinBtn.style.flex = '1';
    [hostBtn, joinBtn].forEach(b => {
      b.style.cursor = 'pointer';
      b.style.border = 'none';
      b.style.padding = '8px 10px';
      b.style.borderRadius = '6px';
      b.style.background = 'rgba(80,120,255,0.85)';
      b.style.color = '#fff';
      b.onmouseenter = () => { b.style.background = 'rgba(80,120,255,1)'; };
      b.onmouseleave = () => { b.style.background = 'rgba(80,120,255,0.85)'; };
    });
    actions.appendChild(hostBtn);
    actions.appendChild(joinBtn);
    this.container.appendChild(actions);

    this.statusEl = document.createElement('div');
    this.statusEl.style.marginTop = '8px';
    this.statusEl.style.opacity = '0.85';
    this.container.appendChild(this.statusEl);

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Netplay (F6)';
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.right = '8px';
    toggleBtn.style.bottom = '8px';
    toggleBtn.style.zIndex = '10002';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.border = 'none';
    toggleBtn.style.padding = '8px 10px';
    toggleBtn.style.borderRadius = '6px';
    toggleBtn.style.background = 'rgba(20,20,24,0.7)';
    toggleBtn.style.color = '#fff';
    toggleBtn.onclick = () => this.toggle();

    document.body.appendChild(toggleBtn);
    document.body.appendChild(this.container);

    hostBtn.onclick = () => this.start(true);
    joinBtn.onclick = () => this.start(false);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F6') this.toggle();
    });
  }

  private toggle(): void {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }

  private start(isOfferer: boolean): void {
    const session = (this.sessionInput.value || '').trim();
    if (!session) { this.setStatus('Enter a session code'); return; }
    localStorage.setItem('netplay_session', session);
    try {
      const services: any = (this.app as any)._services;
      const net = services?.resolve?.('netcode');
      if (!net) { this.setStatus('Netcode service not available'); return; }
      const signaling = new BroadcastSignaling(session);
      net.enableWebRTC(signaling, isOfferer);
      this.setStatus(isOfferer ? 'Hosting… Waiting for peer.' : 'Joining…');
    } catch (e) {
      this.setStatus('Failed to start: ' + (e as any)?.message);
    }
  }

  private setStatus(text: string): void { this.statusEl.textContent = text; }
}

