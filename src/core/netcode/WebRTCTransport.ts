import { Transport } from './RollbackNetcode';

type RTCMsg = { t: 'i'; f: number; b: number } | { t: 'p'; ts: number; echo?: boolean } | { t: 'renegotiate' };

export class WebRTCTransport implements Transport {
  private pc: RTCPeerConnection;
  private dc?: RTCDataChannel;
  private reliable?: RTCDataChannel;
  private pingTimer?: any;
  private rttMs = 0;
  private jitterMs = 0;
  private lastRttMs = 0;
  private bytesTx = 0;
  private bytesRx = 0;
  private lastRecvFrame: number = -1;
  private outOfOrder = 0;
  private lossSuspect = 0;
  private closed = false;
  // Simple resequencer/jitter window
  private pendingInputs: Map<number, number> = new Map();
  private deliveredFrame: number = -1;
  private jitterWindowFrames = 1;

  public onRemoteInput?: (frame: number, bits: number) => void;

  constructor(
    private isOfferer: boolean,
    private signaling: { send(s: any): void; on(cb: (s: any) => void): void },
    iceServers: RTCIceServer[] = [ { urls: ['stun:stun.l.google.com:19302'] } ]
  ) {
    this.pc = new RTCPeerConnection({ iceServers });
    this.pc.onicecandidate = (e) => { if (e.candidate) this.signaling.send({ ice: e.candidate }); };
    this.pc.oniceconnectionstatechange = () => {
      const st = this.pc.iceConnectionState;
      if (st === 'failed' || st === 'disconnected') {
        this.tryReconnect();
      }
    };
    if (isOfferer) {
      const dc = this.pc.createDataChannel('fg', { ordered: true, maxRetransmits: 0 });
      this.setupDataChannel(dc);
      // reliable control channel for config/clock sync
      this.reliable = this.pc.createDataChannel('ctrl', { ordered: true });
      this.setupReliableChannel(this.reliable);
      this.createAndSendOffer();
    } else {
      this.pc.ondatachannel = (e) => {
        if (e.channel.label === 'fg') this.setupDataChannel(e.channel);
        else if (e.channel.label === 'ctrl') this.setupReliableChannel(e.channel);
      };
    }
    this.signaling.on(async (msg) => {
      try {
        if (msg.sdp) {
          await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          if (msg.sdp.type === 'offer') {
            const ans = await this.pc.createAnswer();
            await this.pc.setLocalDescription(ans);
            this.signaling.send({ sdp: this.pc.localDescription });
          }
        } else if (msg.ice) {
          await this.pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        } else if (msg.renegotiate && !this.isOfferer) {
          // remote asks us to renegotiate
          const ans = await this.pc.createAnswer();
          await this.pc.setLocalDescription(ans);
          this.signaling.send({ sdp: this.pc.localDescription });
        }
      } catch {}
    });
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    this.dc = dc;
    dc.binaryType = 'arraybuffer';
    dc.onmessage = (e) => this.onMessage(e.data);
    dc.onopen = () => {
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.pingTimer = setInterval(() => {
        this.send({ t: 'p', ts: performance.now(), echo: false });
      }, 500);
    };
    dc.onclose = () => { if (this.pingTimer) clearInterval(this.pingTimer); this.tryReconnect(); };
    dc.onerror = () => { this.tryReconnect(); };
  }

  private setupReliableChannel(dc: RTCDataChannel): void {
    dc.onmessage = (e) => this.onCtrl(e.data);
  }

  private createAndSendOffer(): void {
    this.pc.createOffer().then(o => this.pc.setLocalDescription(o)).then(() => this.signaling.send({ sdp: this.pc.localDescription })).catch(() => {});
  }

  private send(m: RTCMsg): void {
    try {
      const payload = JSON.stringify(m);
      this.dc?.send(payload);
      this.bytesTx += payload.length;
    } catch {}
  }

  private onMessage(d: any): void {
    try {
      const raw = typeof d === 'string' ? d : (typeof d?.byteLength === 'number' ? new TextDecoder().decode(d) : String(d));
      this.bytesRx += (raw?.length || 0);
      const m = JSON.parse(raw) as RTCMsg;
      if (m.t === 'i') {
        // track basic ordering/loss metrics
        if (this.lastRecvFrame >= 0 && m.f > this.lastRecvFrame + 1) this.lossSuspect += (m.f - this.lastRecvFrame - 1);
        if (this.lastRecvFrame >= 0 && m.f <= this.lastRecvFrame) this.outOfOrder++;
        this.lastRecvFrame = Math.max(this.lastRecvFrame, m.f);
        this.handleRemoteInput(m.f, m.b);
      } else if (m.t === 'p') {
        const now = performance.now();
        if (m.echo) {
          const newRtt = Math.max(0, now - m.ts);
          const diff = Math.abs(newRtt - this.lastRttMs);
          // RFC3550-inspired jitter EWMA
          this.jitterMs = this.jitterMs + (diff - this.jitterMs) * 0.25;
          this.lastRttMs = newRtt;
          this.rttMs = newRtt;
        } else {
          this.send({ t: 'p', ts: m.ts, echo: true });
        }
      }
    } catch {}
  }

  private onCtrl(d: any): void {
    try {
      const m = typeof d === 'string' ? JSON.parse(d) : JSON.parse(String(d));
      if (m?.t === 'clock') {
        // simple two-way clock sync: measure RTT/2 offset
        const now = performance.now();
        if (m.phase === 'req') {
          this.reliable?.send(JSON.stringify({ t: 'clock', phase: 'resp', ts: m.ts, now }));
        } else if (m.phase === 'final') {
          // other side computes; nothing to do here for now
        }
      }
    } catch {}
  }

  public sendClockProbe(): void {
    try { this.reliable?.send(JSON.stringify({ t: 'clock', phase: 'req', ts: performance.now() })); } catch {}
  }

  private handleRemoteInput(frame: number, bits: number): void {
    // Deliver in order if possible; otherwise buffer briefly up to jitterWindowFrames
    if (frame <= this.deliveredFrame + 1) {
      // in-order or immediate next
      this.deliveredFrame = Math.max(this.deliveredFrame, frame);
      this.onRemoteInput?.(frame, bits);
      this.flushPending();
      return;
    }
    const gap = frame - (this.deliveredFrame + 1);
    if (gap <= this.jitterWindowFrames) {
      this.pendingInputs.set(frame, bits);
      this.flushPending();
    } else {
      // Gap too large: don't hold up sim, deliver now
      this.deliveredFrame = Math.max(this.deliveredFrame, frame);
      this.onRemoteInput?.(frame, bits);
      // Best effort: flush any contiguous ones waiting
      this.flushPending();
    }
    // Prevent unbounded growth
    if (this.pendingInputs.size > 64) this.pendingInputs.clear();
  }

  private flushPending(): void {
    let next = this.deliveredFrame + 1;
    while (this.pendingInputs.has(next)) {
      const bits = this.pendingInputs.get(next)!;
      this.pendingInputs.delete(next);
      this.onRemoteInput?.(next, bits);
      this.deliveredFrame = next;
      next++;
    }
  }

  private tryReconnect(): void {
    if (this.closed) return;
    try {
      if (this.isOfferer) {
        // renegotiate by creating a fresh data channel and offer
        if (!this.dc || this.dc.readyState !== 'open') {
          const dc = this.pc.createDataChannel('fg', { ordered: true, maxRetransmits: 0 });
          this.setupDataChannel(dc);
          this.signaling.send({ renegotiate: true });
          this.createAndSendOffer();
        }
      } else {
        this.signaling.send({ renegotiate: true });
      }
    } catch {}
  }

  connect(): void {}
  disconnect(): void { try { this.closed = true; if (this.pingTimer) clearInterval(this.pingTimer); this.dc?.close(); this.pc.close(); } catch {} }
  sendLocalInput(frame: number, bits: number): void { this.send({ t: 'i', f: frame, b: bits }); }
  getRttMs(): number { return this.rttMs; }
  getJitterMs(): number { return this.jitterMs; }
  getOutOfOrderCount(): number { return this.outOfOrder; }
  getLossSuspectCount(): number { return this.lossSuspect; }
  getBytesTx(): number { return this.bytesTx; }
  getBytesRx(): number { return this.bytesRx; }
  setJitterWindow(frames: number): void { this.jitterWindowFrames = Math.max(0, Math.min(6, Math.floor(frames))); }
}

