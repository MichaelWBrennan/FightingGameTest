export class TuningOverlay {
  private container: HTMLDivElement;
  constructor(private setLeniency: (ms: number) => void, private setVol: (vol: number) => void) {
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
    len.oninput = () => this.setLeniency(parseInt(len.value, 10));
    const vol = document.createElement('input'); vol.type = 'range'; vol.min = '0'; vol.max = '100'; vol.value = '90';
    vol.oninput = () => this.setVol(parseInt(vol.value, 10) / 100);
    const l1 = document.createElement('div'); l1.textContent = 'Leniency';
    const l2 = document.createElement('div'); l2.textContent = 'Volume';
    this.container.appendChild(l1); this.container.appendChild(len);
    this.container.appendChild(l2); this.container.appendChild(vol);
    document.body.appendChild(this.container);
  }
}

