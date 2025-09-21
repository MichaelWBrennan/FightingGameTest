export class ReplayArchiveOverlay {
  private container: HTMLDivElement;
  private list: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '50%'; this.container.style.top = '50%'; this.container.style.transform = 'translate(-50%,-50%)';
    this.container.style.width = '420px'; this.container.style.maxHeight = '60vh'; this.container.style.overflow = 'auto';
    this.container.style.background = 'rgba(0,0,0,0.8)'; this.container.style.color = '#fff'; this.container.style.padding = '10px'; this.container.style.borderRadius = '8px'; this.container.style.zIndex = '10005'; this.container.style.display = 'none';
    const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
    const i18n = services?.resolve?.('i18n');
    const title = document.createElement('div'); title.textContent = (i18n?.t?.('replays') || 'Replays'); title.style.fontWeight = 'bold'; title.style.marginBottom = '6px'; this.container.appendChild(title);
    this.list = document.createElement('div'); this.list.style.display = 'flex'; this.list.style.flexDirection = 'column'; this.list.style.gap = '6px'; this.container.appendChild(this.list);
    const toggle = document.createElement('button'); toggle.textContent = `${i18n?.t?.('replays') || 'Replays'} (F9)`; toggle.style.position = 'fixed'; toggle.style.left = '8px'; toggle.style.top = '8px'; toggle.style.zIndex = '10004'; toggle.onclick = () => this.toggle();
    document.body.appendChild(toggle); document.body.appendChild(this.container);
    this.refresh();
    window.addEventListener('keydown', (e) => { if (e.key === 'F9') this.toggle(); });
  }

  private toggle(): void { this.container.style.display = (this.container.style.display === 'none') ? 'block' : 'none'; if (this.container.style.display === 'block') this.refresh(); }
  private getStore(): Array<any> { try { const s = localStorage.getItem('replays'); return s ? JSON.parse(s) : []; } catch { return []; } }
  private setStore(arr: Array<any>): void { try { localStorage.setItem('replays', JSON.stringify(arr)); } catch {} }
  addReplay(replay: any): void { const arr = this.getStore(); arr.unshift({ id: Date.now(), replay }); this.setStore(arr); this.refresh(); }
  private refresh(): void {
    this.list.innerHTML = '';
    const arr = this.getStore();
    if (arr.length === 0) { const empty = document.createElement('div'); empty.textContent = 'No replays yet'; empty.style.opacity = '0.7'; this.list.appendChild(empty); return; }
    for (const item of arr) {
      const row = document.createElement('div'); row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '6px';
      const label = document.createElement('div'); label.textContent = `${new Date(item.id).toLocaleString()}`; label.style.flex = '1';
      const play = document.createElement('button'); play.textContent = 'Play'; play.onclick = () => this.play(item.replay);
      const exp = document.createElement('button'); exp.textContent = 'Export'; exp.onclick = () => this.export(item.replay);
      const del = document.createElement('button'); del.textContent = 'Delete'; del.onclick = () => { const next = this.getStore().filter((x) => x.id !== item.id); this.setStore(next); this.refresh(); };
      row.appendChild(label); row.appendChild(play); row.appendChild(exp); row.appendChild(del);
      this.list.appendChild(row);
    }
  }
  private play(replay: any): void { try { const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services; services?.resolve?.('replay')?.play?.(replay); } catch {} }
  private export(replay: any): void { try { const blob = new Blob([JSON.stringify(replay)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `replay_${Date.now()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 0); } catch {} }
}

