export class TuningOverlay {
  private container: HTMLDivElement;
  constructor(private hooks: { setLeniency: (ms: number) => void; setVol: (vol: number) => void; setSocd?: (p: 'neutral'|'last') => void; setNegEdge?: (ms: number) => void; setJitterBuffer?: (frames: number) => void }) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.right = '8px';
    this.container.style.top = '56px';
    this.container.style.background = 'rgba(0,0,0,0.6)';
    this.container.style.color = '#fff';
    this.container.style.padding = '8px 10px';
    this.container.style.borderRadius = '6px';
    this.container.style.font = '12px system-ui';
    this.container.style.zIndex = '10003';
    const len = document.createElement('input'); len.type = 'range'; len.min = '60'; len.max = '400'; len.value = '250';
    len.oninput = () => this.hooks.setLeniency(parseInt(len.value, 10));
    const vol = document.createElement('input'); vol.type = 'range'; vol.min = '0'; vol.max = '100'; vol.value = '90';
    vol.oninput = () => this.hooks.setVol(parseInt(vol.value, 10) / 100);
    const socd = document.createElement('select');
    const optN = document.createElement('option'); optN.value = 'neutral'; optN.text = 'SOCD: Neutral';
    const optL = document.createElement('option'); optL.value = 'last'; optL.text = 'SOCD: Last Wins';
    socd.appendChild(optN); socd.appendChild(optL);
    socd.onchange = () => this.hooks.setSocd?.(socd.value as any);
    const neg = document.createElement('input'); neg.type = 'range'; neg.min = '0'; neg.max = '200'; neg.value = '60';
    neg.oninput = () => this.hooks.setNegEdge?.(parseInt(neg.value, 10));
    const jit = document.createElement('input'); jit.type = 'range'; jit.min = '0'; jit.max = '4'; jit.value = '1';
    jit.oninput = () => this.hooks.setJitterBuffer?.(parseInt(jit.value, 10));
    const l1 = document.createElement('div'); l1.textContent = 'Leniency';
    const l2 = document.createElement('div'); l2.textContent = 'Volume';
    const l3 = document.createElement('div'); l3.textContent = 'SOCD Policy';
    const l4 = document.createElement('div'); l4.textContent = 'Negative-edge (ms)';
    const l5 = document.createElement('div'); l5.textContent = 'Jitter buffer (frames)';
    this.container.appendChild(l1); this.container.appendChild(len);
    this.container.appendChild(l2); this.container.appendChild(vol);
    this.container.appendChild(l3); this.container.appendChild(socd);
    this.container.appendChild(l4); this.container.appendChild(neg);
    this.container.appendChild(l5); this.container.appendChild(jit);
    document.body.appendChild(this.container);
  }
}

