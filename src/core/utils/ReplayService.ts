import { InputManager, PlayerInputs } from '../input/InputManager';
import { CombatSystem } from '../combat/CombatSystem';

interface ReplayFrame { f: number; p0: PlayerInputs; p1: PlayerInputs }
interface ReplayData { version: number; frames: ReplayFrame[]; meta: { date: string; winner?: string; duration?: number; characters?: string[] } }

export class ReplayService {
  private recording = false;
  private playing = false;
  private buffer: ReplayFrame[] = [];
  private playIndex = 0;
  private fileInput: HTMLInputElement | null = null;

  constructor(private input: InputManager, private combat: CombatSystem) {
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  isRecording(): boolean { return this.recording; }
  isPlaying(): boolean { return this.playing; }

  startRecording(): void {
    if (this.playing) return;
    this.buffer = [];
    this.recording = true;
  }

  stopRecording(): ReplayData | null {
    if (!this.recording) return null;
    this.recording = false;
    // Basic metadata stub
    const meta = { date: new Date().toISOString(), duration: this.buffer.length / 60, characters: [] as string[] };
    const rep = { version: 1, frames: this.buffer.slice(), meta };
    try { const services: any = (window as any).pc?.Application?.getApplication?._services || (window as any)._services; services?.resolve?.('analytics')?.track?.('replay_recorded', { frames: this.buffer.length }); services?.resolve?.('replayArchive')?.addReplay?.(rep); } catch {}
    return rep;
  }

  play(data: ReplayData): void {
    // Deterministic validation: frame sequence must be increasing by 1
    try {
      for (let i = 1; i < data.frames.length; i++) {
        if (data.frames[i].f !== data.frames[i-1].f + 1) { console.warn('[replay] non-sequential frame', data.frames[i-1].f, '->', data.frames[i].f); break; }
      }
    } catch {}
    this.playing = true; this.recording = false; this.buffer = data.frames || []; this.playIndex = 0;
  }

  stopPlayback(): void { this.playing = false; }

  update(): void {
    if (this.recording) {
      const f = this.combat.getCurrentFrame();
      const p0 = this.input.getPlayerInputs(0);
      const p1 = this.input.getPlayerInputs(1) || ({} as PlayerInputs);
      this.buffer.push({ f, p0: { ...p0 }, p1: { ...p1 } as any });
    } else if (this.playing) {
      if (this.playIndex >= this.buffer.length) { this.stopPlayback(); return; }
      const fr = this.buffer[this.playIndex++];
      const before = (this.combat as any).getCurrentFrame?.() || 0;
      this.combat.stepWithInputs(fr.p0, fr.p1);
      // Determinism check: optional lightweight checksum via combat adapter payload if exposed in future
      const after = (this.combat as any).getCurrentFrame?.() || 0;
      if (after !== before + 1) {
        // eslint-disable-next-line no-console
        console.warn('[replay] non-monotonic frame during playback');
      }
    }
  }

  exportRecording(): void {
    const data = this.stopRecording();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `replay_${Date.now()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    // Share code (local): store and print a short code
    try { const key = Math.random().toString(36).slice(2, 8); localStorage.setItem('replay:' + key, JSON.stringify(data)); console.log('[replay] share code:', key); } catch {}
  }

  importAndPlay(): void {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'application/json';
      this.fileInput.onchange = async () => {
        const file = this.fileInput!.files?.[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text) as ReplayData;
        this.play(data);
      };
    }
    this.fileInput.value = '';
    this.fileInput.click();
  }

  importByCode(code: string): void {
    try { const raw = localStorage.getItem('replay:' + code.trim()); if (!raw) return; const data = JSON.parse(raw) as ReplayData; this.play(data); } catch {}
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'F7') {
      if (this.recording) this.exportRecording(); else this.startRecording();
    }
    if (e.key === 'F8') this.exportRecording();
    if (e.key === 'F9') this.importAndPlay();
  }
}

