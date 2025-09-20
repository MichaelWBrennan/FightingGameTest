export class InputRemapOverlay {
  private container: HTMLDivElement;
  private mapping: Record<string, string> = {};
  private onChange: (map: Record<string, string>) => void;

  constructor(onChange: (map: Record<string, string>) => void) {
    this.onChange = onChange;
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.left = '8px';
    this.container.style.bottom = '56px';
    this.container.style.background = 'rgba(0,0,0,0.6)';
    this.container.style.color = '#fff';
    this.container.style.padding = '8px 10px';
    this.container.style.borderRadius = '6px';
    this.container.style.font = '12px system-ui';
    this.container.style.zIndex = '10003';
    const btn = document.createElement('button');
    btn.textContent = 'Remap LP';
    btn.onclick = () => this.capture('lightPunch');
    this.container.appendChild(btn);
    document.body.appendChild(this.container);
  }

  private capture(action: string): void {
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      this.mapping[action] = e.code;
      window.removeEventListener('keydown', onKey, true);
      this.onChange(this.mapping);
    };
    window.addEventListener('keydown', onKey, true);
  }
}

