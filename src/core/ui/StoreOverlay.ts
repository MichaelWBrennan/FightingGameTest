export class StoreOverlay {
  private container: HTMLDivElement;
  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '50%'; this.container.style.top = '50%'; this.container.style.transform = 'translate(-50%,-50%)';
    this.container.style.width = '460px'; this.container.style.maxHeight = '70vh'; this.container.style.overflow = 'auto';
    this.container.style.background = 'rgba(0,0,0,0.85)'; this.container.style.color = '#fff'; this.container.style.padding = '12px'; this.container.style.borderRadius = '8px'; this.container.style.zIndex = '10007'; this.container.style.display = 'none';
    const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
    const i18n = services?.resolve?.('i18n');
    const title = document.createElement('div'); title.textContent = (i18n?.t?.('store') || 'Store'); title.style.fontWeight = 'bold'; title.style.marginBottom = '8px'; this.container.appendChild(title);
    const grid = document.createElement('div'); grid.style.display = 'grid'; (grid.style as any).gridTemplateColumns = 'repeat(2, 1fr)'; (grid.style as any).gap = '8px';
    const items = [ { id: 'costume_1', name: 'Costume A', price: '$2.99' }, { id: 'costume_2', name: 'Costume B', price: '$2.99' }, { id: 'colors', name: 'Color Pack', price: '$1.99' }, { id: 'stage', name: 'New Stage', price: '$3.99' } ];
    for (const it of items) {
      const card = document.createElement('div'); card.style.background = 'rgba(255,255,255,0.06)'; card.style.padding = '8px'; card.style.borderRadius = '6px';
      const name = document.createElement('div'); name.textContent = it.name; name.style.fontWeight = 'bold';
      const price = document.createElement('div'); price.textContent = it.price; price.style.opacity = '0.8';
      const buy = document.createElement('button'); buy.textContent = 'Buy'; buy.onclick = () => this.purchase(it.id);
      card.appendChild(name); card.appendChild(price); card.appendChild(buy); grid.appendChild(card);
    }
    this.container.appendChild(grid);
    const toggle = document.createElement('button'); toggle.textContent = `${i18n?.t?.('store') || 'Store'} (F10)`; toggle.style.position = 'fixed'; toggle.style.left = '8px'; toggle.style.top = '40px'; toggle.style.zIndex = '10007'; toggle.onclick = () => this.toggle();
    document.body.appendChild(toggle); document.body.appendChild(this.container);
    window.addEventListener('keydown', (e) => { if (e.key === 'F10') this.toggle(); });
  }
  private purchase(id: string): void {
    try {
      const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
      const ent = services?.resolve?.('entitlement');
      const ok = ent?.purchase?.(id);
      services?.resolve?.('analytics')?.track?.('purchase_attempt', { sku: id, ok: !!ok });
      alert(ok ? ('Purchased: ' + id) : 'Purchase failed');
    } catch {}
  }
  private toggle(): void { this.container.style.display = (this.container.style.display === 'none') ? 'block' : 'none'; }
}

