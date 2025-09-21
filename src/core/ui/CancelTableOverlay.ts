export class CancelTableOverlay {
  private container: HTMLDivElement;
  private table: HTMLTextAreaElement;
  private character: string | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.right = '8px'; this.container.style.top = '80px';
    this.container.style.padding = '8px'; this.container.style.background = 'rgba(0,0,0,0.7)'; this.container.style.color = '#fff'; this.container.style.borderRadius = '6px'; this.container.style.zIndex = '10005';
    const title = document.createElement('div'); title.textContent = 'Cancel Table'; title.style.fontWeight = 'bold'; title.style.marginBottom = '4px'; this.container.appendChild(title);
    this.table = document.createElement('textarea'); this.table.style.width = '300px'; this.table.style.height = '120px'; this.table.placeholder = '{ "lightPunch": ["mediumPunch", "hadoken"], "any": ["hadoken"] }';
    this.container.appendChild(this.table);
    const row = document.createElement('div'); row.style.marginTop = '6px';
    const btnApply = document.createElement('button'); btnApply.textContent = 'Apply'; btnApply.onclick = () => this.apply();
    row.appendChild(btnApply); this.container.appendChild(row);
    const toggle = document.createElement('button'); toggle.textContent = 'Cancel Table (F11)'; toggle.style.position = 'fixed'; toggle.style.right = '8px'; toggle.style.top = '50px'; toggle.style.zIndex = '10005'; toggle.onclick = () => this.toggle();
    document.body.appendChild(toggle); document.body.appendChild(this.container); this.container.style.display = 'none';
    window.addEventListener('keydown', (e) => { if (e.key === 'F11') this.toggle(); });
  }

  setCharacter(id: string, currentTable?: any): void {
    this.character = id; this.table.value = currentTable ? JSON.stringify(currentTable, null, 2) : '';
  }

  private apply(): void {
    try {
      const json = JSON.parse(this.table.value || '{}');
      const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
      const chars = services?.resolve?.('characters');
      if (!chars) return;
      const active = chars.getActiveCharacters?.() || [];
      const c = active[0];
      if (c && c.config && c.config.moves) {
        Object.keys(c.config.moves).forEach(k => { const mv = c.config.moves[k]; if (json[k]) (mv as any).cancelTable = json[k]; });
      }
    } catch {}
  }

  private toggle(): void { this.container.style.display = this.container.style.display === 'none' ? 'block' : 'none'; }
}

