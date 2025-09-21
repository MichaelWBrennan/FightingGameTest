export class TournamentOverlay {
  private container: HTMLDivElement;
  private list: HTMLDivElement;
  constructor(private svc: any) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed'; this.container.style.left = '8px'; this.container.style.top = '260px'; this.container.style.zIndex = '10003'; this.container.style.background = 'rgba(0,0,0,0.6)'; this.container.style.color = '#fff'; this.container.style.padding = '6px 8px'; this.container.style.borderRadius = '6px';
    const label = document.createElement('div'); label.textContent = 'Tournament'; label.style.fontWeight = 'bold';
    const input = document.createElement('textarea'); input.placeholder = 'player1\nplayer2\nplayer3'; input.style.width = '200px'; input.style.height = '80px';
    const gen = document.createElement('button'); gen.textContent = 'Generate'; gen.onclick = () => this.generate(input.value);
    this.list = document.createElement('div'); this.list.style.marginTop = '6px';
    this.container.appendChild(label); this.container.appendChild(input); this.container.appendChild(gen); this.container.appendChild(this.list);
    document.body.appendChild(this.container);
  }
  private generate(text: string): void { const players = (text||'').split(/\r?\n/).map(s => s.trim()).filter(Boolean); const pairs = this.svc.createBracket?.(players) || []; this.list.innerHTML = ''; for (const p of pairs) { const d = document.createElement('div'); d.textContent = `${p.a} vs ${p.b}`; this.list.appendChild(d); } }
}

