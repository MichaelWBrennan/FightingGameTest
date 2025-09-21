export class ChatOverlay {
  private container: HTMLDivElement;
  private list: HTMLDivElement;
  private input: HTMLInputElement;
  private bc: BroadcastChannel;
  constructor() {
    this.bc = new BroadcastChannel('fg-chat');
    let lastSent = 0;
    this.bc.onmessage = (e) => this.add(e.data?.name || 'Peer', this.filter(e.data?.text || ''));
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '8px'; this.container.style.top = '120px'; this.container.style.width = '260px'; this.container.style.background = 'rgba(0,0,0,0.6)'; this.container.style.color = '#fff'; this.container.style.borderRadius = '6px'; this.container.style.zIndex = '10004'; this.container.style.padding = '6px 8px';
    const title = document.createElement('div'); title.textContent = 'Chat'; title.style.fontWeight = 'bold'; title.style.marginBottom = '4px';
    this.list = document.createElement('div'); this.list.style.maxHeight = '180px'; this.list.style.overflow = 'auto'; this.list.style.font = '12px system-ui';
    const row = document.createElement('div'); row.style.display = 'flex'; row.style.gap = '6px'; row.style.marginTop = '4px';
    this.input = document.createElement('input'); this.input.placeholder = 'Say something'; this.input.style.flex = '1';
    const send = document.createElement('button'); send.textContent = 'Send'; send.onclick = () => this.send();
    row.appendChild(this.input); row.appendChild(send);
    this.container.appendChild(title); this.container.appendChild(this.list); this.container.appendChild(row);
    document.body.appendChild(this.container);
  }
  private add(name: string, text: string): void { const div = document.createElement('div'); div.textContent = `${name}: ${text}`; this.list.appendChild(div); this.list.scrollTop = this.list.scrollHeight; }
  private filter(t: string): string { const banned = [/\b(fool|idiot)\b/i]; let out = t; for (const r of banned) out = out.replace(r, '***'); return out; }
  private send(): void {
    const now = Date.now();
    // simple rate limit: 1 msg per 500ms
    // @ts-ignore
    if (this._last && now - this._last < 500) return; // drop
    // @ts-ignore
    this._last = now;
    const t = (this.input.value || '').trim(); if (!t) return; const ft = this.filter(t);
    this.add('You', ft); try { this.bc.postMessage({ text: ft, name: 'Peer' }); } catch {} this.input.value='';
  }
}

