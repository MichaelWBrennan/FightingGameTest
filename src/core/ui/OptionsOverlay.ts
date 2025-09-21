export class OptionsOverlay {
  private container: HTMLDivElement;
  private visible = false;
  constructor(private services: any) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.left = '8px';
    this.container.style.bottom = '8px';
    this.container.style.width = '300px';
    this.container.style.background = 'rgba(0,0,0,0.7)';
    this.container.style.color = '#fff';
    this.container.style.padding = '10px';
    this.container.style.borderRadius = '8px';
    this.container.style.font = '12px system-ui';
    this.container.style.zIndex = '10005';
    this.container.style.display = 'none';

    const i18n: any = this.services?.resolve?.('i18n');
    const title = document.createElement('div'); title.textContent = i18n?.t?.('options') || 'Options'; title.style.fontWeight = 'bold'; title.style.marginBottom = '8px';
    const row = (label: string, el: HTMLElement) => { const d = document.createElement('div'); d.style.margin = '6px 0'; const l = document.createElement('div'); l.textContent = label; d.appendChild(l); d.appendChild(el); this.container.appendChild(d); };

    // Colorblind toggle
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.onchange = () => { try { const ui = this.services.resolve('ui'); ui?.setColorblindMode?.(cb.checked); } catch {} };
    row(i18n?.t?.('colorblind_mode') || 'Colorblind mode', cb);

    // Master volume
    const vol = document.createElement('input'); vol.type = 'range'; vol.min = '0'; vol.max = '100'; vol.value = '90'; vol.oninput = () => { try { const sfx = this.services.resolve('sfx'); sfx?.setVolume?.(parseInt(vol.value,10)/100); } catch {} };
    row(i18n?.t?.('master_volume') || 'Master volume', vol);

    // Connection badge toggle
    const badge = document.createElement('input'); badge.type = 'checkbox'; badge.checked = true; badge.onchange = () => { const el = document.getElementById('net-quality'); if (el) el.style.display = badge.checked ? 'block' : 'none'; };
    row(i18n?.t?.('show_connection_badge') || 'Show connection badge', badge);

    // UI scale / text size
    const scale = document.createElement('input'); scale.type = 'range'; scale.min = '80'; scale.max = '130'; scale.value = '100';
    scale.oninput = () => { try { document.documentElement.style.setProperty('--ui-scale', (parseInt(scale.value,10)/100).toString()); } catch {} };
    row('UI scale', scale);

    // High contrast
    const hc = document.createElement('input'); hc.type = 'checkbox'; hc.onchange = () => { try { document.body.classList.toggle('hc', hc.checked); } catch {} };
    row('High contrast', hc);

    const btn = document.createElement('button'); btn.textContent = 'Options (F2)'; btn.style.position = 'fixed'; btn.style.left = '8px'; btn.style.bottom = '8px'; btn.style.zIndex = '10004'; btn.onclick = () => this.toggle(); document.body.appendChild(btn);
    document.body.appendChild(this.container);
    window.addEventListener('keydown', (e) => { if (e.key === 'F2') this.toggle(); });
  }
  private toggle(): void { this.visible = !this.visible; this.container.style.display = this.visible ? 'block' : 'none'; }
}

