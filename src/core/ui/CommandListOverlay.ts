export class CommandListOverlay {
  private container: HTMLDivElement;
  private visible = false;
  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.left = '8px';
    this.container.style.top = '56px';
    this.container.style.width = '320px';
    this.container.style.maxHeight = '60vh';
    this.container.style.overflow = 'auto';
    this.container.style.background = 'rgba(0,0,0,0.7)';
    this.container.style.color = '#fff';
    this.container.style.padding = '8px 10px';
    this.container.style.borderRadius = '6px';
    this.container.style.font = '12px system-ui';
    this.container.style.display = 'none';
    this.container.style.zIndex = '10004';
    document.body.appendChild(this.container);
    window.addEventListener('keydown', (e) => { if (e.key === 'F1') this.toggle(); });
  }
  private toggle(): void { this.visible = !this.visible; this.container.style.display = this.visible ? 'block' : 'none'; }
  public setCommands(list: Array<{ name: string; input: string }>): void {
    this.container.innerHTML = '';
    const h = document.createElement('div'); h.textContent = 'Command List'; h.style.fontWeight = 'bold'; h.style.marginBottom = '6px';
    this.container.appendChild(h);
    list.forEach(cmd => { const row = document.createElement('div'); row.textContent = `${cmd.name}: ${cmd.input}`; row.style.margin = '2px 0'; this.container.appendChild(row); });
  }
}

