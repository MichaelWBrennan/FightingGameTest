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
    try { const i18n: any = (app as any)._services?.resolve?.('i18n'); title.textContent = i18n?.t?.('netplay_title') || 'Netplay (WebRTC)'; } catch { title.textContent = 'Netplay (WebRTC)'; }
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    this.container.appendChild(title);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '6px';
    row.style.marginBottom = '6px';
    this.sessionInput = document.createElement('input');
    try { const i18n: any = (app as any)._services?.resolve?.('i18n'); this.sessionInput.placeholder = i18n?.t?.('netplay_session_ph') || 'Session code (e.g. abc123)'; } catch { this.sessionInput.placeholder = 'Session code (e.g. abc123)'; }
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
    try { const i18n: any = (app as any)._services?.resolve?.('i18n'); hostBtn.textContent = i18n?.t?.('host') || 'Host'; } catch { hostBtn.textContent = 'Host'; }
    hostBtn.style.flex = '1';
    const joinBtn = document.createElement('button');
    try { const i18n: any = (app as any)._services?.resolve?.('i18n'); joinBtn.textContent = i18n?.t?.('join') || 'Join'; } catch { joinBtn.textContent = 'Join'; }
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

    // TURN/PSK inputs and WS signaling
    const turnRow = document.createElement('div'); turnRow.style.display = 'flex'; turnRow.style.gap = '6px'; turnRow.style.marginTop = '6px';
    const turn = document.createElement('input'); turn.placeholder = 'TURN url'; turn.style.flex = '1'; turnRow.appendChild(turn);
    const turnUser = document.createElement('input'); turnUser.placeholder = 'TURN user'; turnUser.style.flex = '1'; turnRow.appendChild(turnUser);
    const turnPass = document.createElement('input'); turnPass.placeholder = 'TURN pass'; turnPass.type = 'password'; turnPass.style.flex = '1'; turnRow.appendChild(turnPass);
    const psk = document.createElement('input'); psk.placeholder = 'PSK (optional)'; psk.style.flex = '1'; turnRow.appendChild(psk);
    this.container.appendChild(turnRow);
    const wsRow = document.createElement('div'); wsRow.style.display = 'flex'; wsRow.style.gap = '6px'; wsRow.style.marginTop = '6px';
    const wsUrl = document.createElement('input'); wsUrl.placeholder = 'WS signaling url'; wsUrl.style.flex = '2'; wsRow.appendChild(wsUrl);
    const wsTok = document.createElement('input'); wsTok.placeholder = 'Token'; wsTok.style.flex = '1'; wsRow.appendChild(wsTok);
    this.container.appendChild(wsRow);

    this.statusEl = document.createElement('div');
    this.statusEl.style.marginTop = '8px';
    this.statusEl.style.opacity = '0.85';
    this.container.appendChild(this.statusEl);

    // Reconnect/Restart ICE controls
    const recRow = document.createElement('div'); recRow.style.display = 'flex'; recRow.style.gap = '6px'; recRow.style.marginTop = '6px';
    const btnResync = document.createElement('button'); btnResync.textContent = 'Resync';
    const btnIce = document.createElement('button'); btnIce.textContent = 'Restart ICE';
    btnResync.onclick = () => { try { const net: any = (this.app as any)._services?.resolve?.('netcode'); (net as any)?.requestResync?.(); } catch {} };
    btnIce.onclick = () => { try { const net: any = (this.app as any)._services?.resolve?.('netcode'); const tr: any = (net as any)?._getTransport?.(); tr?.restartIce?.(); } catch {} };
    recRow.appendChild(btnResync); recRow.appendChild(btnIce);
    this.container.appendChild(recRow);

    const toggleBtn = document.createElement('button');
    try { const i18n: any = (app as any)._services?.resolve?.('i18n'); toggleBtn.textContent = i18n?.t?.('netplay_toggle') || 'Netplay (F6)'; } catch { toggleBtn.textContent = 'Netplay (F6)'; }
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

    hostBtn.onclick = () => this.start(true, turn.value, psk.value, wsUrl.value, wsTok.value);
    joinBtn.onclick = () => this.start(false, turn.value, psk.value, wsUrl.value, wsTok.value);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F6') this.toggle();
    });
  }

  private toggle(): void {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }

  private async start(isOfferer: boolean, turnUrl?: string, psk?: string, ws?: string, tok?: string): Promise<void> {
    const session = (this.sessionInput.value || '').trim();
    if (!session) { try { const i18n: any = (this.app as any)._services?.resolve?.('i18n'); this.setStatus(i18n?.t?.('enter_session') || 'Enter a session code'); } catch { this.setStatus('Enter a session code'); } return; }
    localStorage.setItem('netplay_session', session);
    try {
      const services: any = (this.app as any)._services;
      const net = services?.resolve?.('netcode');
      if (!net) { try { const i18n: any = (this.app as any)._services?.resolve?.('i18n'); this.setStatus(i18n?.t?.('netcode_unavailable') || 'Netcode service not available'); } catch { this.setStatus('Netcode service not available'); } return; }
      let signaling: any = new BroadcastSignaling(session);
      try { if ((ws || '').trim()) { const mod = await import('../netcode/WsSignaling'); signaling = new mod.WsSignaling(ws!, tok || undefined); } } catch {}
      // Read TURN fields directly from DOM
      const form = this.container.querySelectorAll('input');
      const tu = (form?.[1] as HTMLInputElement | undefined)?.value || undefined;
      const tp = (form?.[2] as HTMLInputElement | undefined)?.value || undefined;
      const ice = turnUrl ? [{ urls: [turnUrl], username: tu as any, credential: tp as any }] : undefined as any;
      net.enableWebRTC(signaling, isOfferer, ice, psk);
      try { const analytics = services?.resolve?.('analytics'); analytics?.track?.('netplay_start', { session, host: !!isOfferer, turn: !!turnUrl, psk: !!psk }); } catch {}
      try { const i18n: any = (this.app as any)._services?.resolve?.('i18n'); this.setStatus(isOfferer ? (i18n?.t?.('hosting_wait') || 'Hosting… Waiting for peer.') : (i18n?.t?.('joining') || 'Joining…')); } catch { this.setStatus(isOfferer ? 'Hosting… Waiting for peer.' : 'Joining…'); }
    } catch (e) {
      this.setStatus('Failed to start: ' + (e as any)?.message);
    }
  }

  private setStatus(text: string): void { this.statusEl.textContent = text; }
}

