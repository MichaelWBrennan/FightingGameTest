export class BoxEditorOverlay {
  private container: HTMLDivElement;
  private area: HTMLTextAreaElement;
  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.right = '8px'; this.container.style.bottom = '8px'; this.container.style.width = '320px'; this.container.style.background = 'rgba(0,0,0,0.7)'; this.container.style.color = '#fff'; this.container.style.zIndex = '10006'; this.container.style.padding = '8px'; this.container.style.borderRadius = '6px';
    const title = document.createElement('div'); title.textContent = 'Box Editor'; title.style.fontWeight = 'bold'; title.style.marginBottom = '6px';
    this.area = document.createElement('textarea'); this.area.style.width = '100%'; this.area.style.height = '120px'; this.area.placeholder = '{ "move_lightPunch": { "frames": [ { "hitboxes": [ {"x":0.5,"y":0.5,"width":0.8,"height":0.8} ] } ] } }';
    const apply = document.createElement('button'); apply.textContent = 'Apply'; apply.onclick = () => this.apply();
    this.container.appendChild(title); this.container.appendChild(this.area); this.container.appendChild(apply);
    this.container.style.display = 'none';
    const toggle = document.createElement('button'); toggle.textContent = 'Box Editor (F12)'; toggle.style.position = 'fixed'; toggle.style.right = '8px'; toggle.style.bottom = '8px'; toggle.style.zIndex = '10006'; toggle.onclick = () => this.toggle();
    document.body.appendChild(toggle); document.body.appendChild(this.container);
    window.addEventListener('keydown', (e) => { if (e.key === 'F12') this.toggle(); });
  }
  private toggle(): void { this.container.style.display = this.container.style.display === 'none' ? 'block' : 'none'; }
  private apply(): void {
    try {
      const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
      const chars = services?.resolve?.('characters');
      const active = chars?.getActiveCharacters?.() || [];
      const data = JSON.parse(this.area.value || '{}');
      for (const k of Object.keys(data)) {
        const c = active[0]; if (!c) continue; const anims = (c.config as any).animations || ((c.config as any).animations = {});
        anims[k] = data[k];
      }
    } catch {}
  }
}

