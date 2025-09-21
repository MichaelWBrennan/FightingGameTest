export class PartyOverlay {
  private container: HTMLDivElement;
  constructor(private party: any) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '8px'; this.container.style.top = '160px'; this.container.style.zIndex = '10003'; this.container.style.background = 'rgba(0,0,0,0.6)'; this.container.style.color = '#fff'; this.container.style.padding = '6px 8px'; this.container.style.borderRadius = '6px';
    const services: any = (window as any)._services || (window as any).pc?.Application?.getApplication?._services;
    const i18n = services?.resolve?.('i18n');
    const label = document.createElement('div'); label.textContent = (i18n?.t?.('party') || 'Party'); label.style.fontWeight = 'bold';
    const code = document.createElement('div'); code.textContent = `${i18n?.t?.('your_code') || 'Your code'}: ${this.party.getId?.() || ''}`;
    const row = document.createElement('div'); row.style.display = 'flex'; row.style.gap = '6px'; row.style.marginTop = '4px';
    const input = document.createElement('input'); input.placeholder = (i18n?.t?.('enter_code') || 'Enter code'); input.style.flex = '1';
    const join = document.createElement('button'); join.textContent = (i18n?.t?.('join') || 'Join'); join.onclick = () => { const c = (input.value||'').trim(); if (c) this.party.join?.(c); };
    row.appendChild(input); row.appendChild(join);
    this.container.appendChild(label); this.container.appendChild(code); this.container.appendChild(row);
    document.body.appendChild(this.container);
  }
}

