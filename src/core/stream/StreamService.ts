export class StreamService {
  private mediaStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor(private canvas: HTMLCanvasElement) {}

  startCapture(fps: number = 60): void {
    try { this.mediaStream = (this.canvas as any).captureStream?.(fps) || null; } catch { this.mediaStream = null; }
  }

  stopCapture(): void { this.mediaStream?.getTracks().forEach(t => t.stop()); this.mediaStream = null; }

  startRecording(mime: string = 'video/webm;codecs=vp9'): void {
    if (!this.mediaStream) this.startCapture();
    try {
      this.recorder = new MediaRecorder(this.mediaStream!, { mimeType: mime });
      this.chunks = [];
      this.recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) this.chunks.push(e.data); };
      this.recorder.onstop = () => { try { const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || 'video/webm' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'match.webm'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); } catch {} };
      this.recorder.start(1000);
    } catch {}
  }

  stopRecording(): void { try { this.recorder?.stop(); } catch {} }
}

