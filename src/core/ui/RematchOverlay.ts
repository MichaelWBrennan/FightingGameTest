export class RematchOverlay {
  private container: HTMLDivElement;
  private onRematch?: () => void;
  private onExit?: () => void;
  constructor(onRematch: () => void, onExit: () => void, i18n?: { t(k: string): string }) {
    this.onRematch = onRematch; this.onExit = onExit;
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '50%'; this.container.style.top = '50%'; this.container.style.transform = 'translate(-50%,-50%)';
    this.container.style.padding = '10px 14px'; this.container.style.background = 'rgba(0,0,0,0.8)'; this.container.style.color = '#fff'; this.container.style.borderRadius = '8px'; this.container.style.zIndex = '10008'; this.container.style.display = 'none';
    const label = document.createElement('div'); label.textContent = (i18n?.t?.('rematch') || 'Rematch?'); label.style.fontWeight = 'bold'; label.style.marginBottom = '8px';
    const row = document.createElement('div'); row.style.display = 'flex'; row.style.gap = '8px';
    const yes = document.createElement('button'); yes.textContent = (i18n?.t?.('yes') || 'Yes'); yes.onclick = () => { this.hide(); this.onRematch?.(); };
    const no = document.createElement('button'); no.textContent = (i18n?.t?.('no') || 'No'); no.onclick = () => { this.hide(); this.onExit?.(); };
    row.appendChild(yes); row.appendChild(no);
    this.container.appendChild(label); this.container.appendChild(row); document.body.appendChild(this.container);
  }
  show(): void { this.container.style.display = 'block'; }
  hide(): void { this.container.style.display = 'none'; }
}

