export class PartyOverlay {
  private container: HTMLDivElement;
  constructor(private party: any) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '8px'; this.container.style.top = '160px'; this.container.style.zIndex = '10003'; this.container.style.background = 'rgba(0,0,0,0.6)'; this.container.style.color = '#fff'; this.container.style.padding = '6px 8px'; this.container.style.borderRadius = '6px';
    const label = document.createElement('div'); label.textContent = 'Party'; label.style.fontWeight = 'bold';
    const code = document.createElement('div'); code.textContent = `Your code: ${this.party.getId?.() || ''}`;
    const row = document.createElement('div'); row.style.display = 'flex'; row.style.gap = '6px'; row.style.marginTop = '4px';
    const input = document.createElement('input'); input.placeholder = 'Enter code'; input.style.flex = '1';
    const join = document.createElement('button'); join.textContent = 'Join'; join.onclick = () => { const c = (input.value||'').trim(); if (c) this.party.join?.(c); };
    row.appendChild(input); row.appendChild(join);
    this.container.appendChild(label); this.container.appendChild(code); this.container.appendChild(row);
    document.body.appendChild(this.container);
  }
}

