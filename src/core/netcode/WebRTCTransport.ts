import type { Transport } from './RollbackNetcode';

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
  private tokenBucket = { capacity: 16384, tokens: 16384, refillRate: 4096, last: performance.now() };
  private lastRecvFrame: number = -1;
  private outOfOrder = 0;
  private lossSuspect = 0;
  private closed = false;
  // Simple resequencer/jitter window
  private pendingInputs: Map<number, number> = new Map();
  private deliveredFrame: number = -1;
  private jitterWindowFrames = 1;
  private lastDeliveredBits: number = 0;

  public onRemoteInput?: (frame: number, bits: number) => void;
  public onCtrlMessage?: (msg: any) => void;
  public onConnectionStateChange?: (state: string) => void;
  private key?: CryptoKey;
  private outQueue: RTCMsg[] = [];
  private drainTimer?: any;

  constructor(
    private isOfferer: boolean,
    private signaling: { send(s: any): void; on(cb: (s: any) => void): void },
    iceServers: RTCIceServer[] = [ { urls: ['stun:stun.l.google.com:19302'] } ]
  ) {
    this.pc = new RTCPeerConnection({ iceServers });
    this.pc.onicecandidate = (e) => { if (e.candidate) this.signaling.send({ ice: e.candidate }); };
    this.pc.oniceconnectionstatechange = () => {
      const st = this.pc.iceConnectionState;
      this.onConnectionStateChange?.(st);
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
      if (this.drainTimer) clearInterval(this.drainTimer);
      this.drainTimer = setInterval(() => this.drain(), 8);
    };
    dc.onclose = () => { if (this.pingTimer) clearInterval(this.pingTimer); if (this.drainTimer) clearInterval(this.drainTimer); this.tryReconnect(); };
    dc.onerror = () => { this.tryReconnect(); };
  }

  private setupReliableChannel(dc: RTCDataChannel): void {
    this.reliable = dc;
    dc.onmessage = (e) => this.onCtrl(e.data);
  }

  private createAndSendOffer(): void {
    this.pc.createOffer().then(o => this.pc.setLocalDescription(o)).then(() => this.signaling.send({ sdp: this.pc.localDescription })).catch(() => {});
  }

  private send(m: RTCMsg): void { this.outQueue.push(m); }

  private async drain(): Promise<void> {
    if (!this.dc || this.dc.readyState !== 'open') return;
    if (this.outQueue.length === 0) return;
    const now = performance.now();
    const elapsed = Math.max(0, now - this.tokenBucket.last);
    this.tokenBucket.tokens = Math.min(this.tokenBucket.capacity, this.tokenBucket.tokens + (elapsed * this.tokenBucket.refillRate) / 1000);
    this.tokenBucket.last = now;
    // Process a few messages per tick to keep latency low
    for (let i = 0; i < 4 && this.outQueue.length > 0; i++) {
      const m = this.outQueue[0];
      try {
        // Serialize
        const json = JSON.stringify(m);
        if (this.key) {
          const enc = await this.encrypt(json);
          const length = enc.byteLength;
          if (this.tokenBucket.tokens >= length) {
            this.dc.send(enc);
            this.tokenBucket.tokens -= length;
            this.bytesTx += length;
            this.outQueue.shift();
          } else {
            // Drop low-priority pings under congestion
            if ((m as any).t === 'p') { this.outQueue.shift(); }
            break;
          }
        } else {
          const length = json.length;
          if (this.tokenBucket.tokens >= length) {
            this.dc.send(json);
            this.tokenBucket.tokens -= length;
            this.bytesTx += length;
            this.outQueue.shift();
          } else {
            if ((m as any).t === 'p') { this.outQueue.shift(); }
            break;
          }
        }
      } catch {
        // Drop malformed
        this.outQueue.shift();
      }
    }
  }

  private async onMessage(d: any): Promise<void> {
    try {
      let text: string | null = null;
      if (typeof d === 'string') {
        text = d;
        this.bytesRx += d.length;
      } else if (typeof d?.byteLength === 'number') {
        const ab: ArrayBuffer = d as ArrayBuffer;
        const dec = this.key ? await this.decrypt(ab) : null;
        if (dec !== null) { text = dec; this.bytesRx += ab.byteLength; }
        else {
          // Fallback: assume UTF-8 string payload
          const s = new TextDecoder().decode(ab);
          text = s; this.bytesRx += ab.byteLength;
        }
      }
      if (!text) return;
      const m = JSON.parse(text) as RTCMsg;
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

  // Simple AES-GCM transport encryption with PSK
  async setPreSharedKey(psk: string): Promise<void> {
    try {
      const enc = new TextEncoder();
      const keyData = await crypto.subtle.digest('SHA-256', enc.encode(psk));
      this.key = await crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['encrypt','decrypt']);
    } catch {}
  }
  // Encrypted payload format: [4 bytes magic 'F','G','E','C'][12 bytes IV][ciphertext]
  private async encrypt(s: string): Promise<ArrayBuffer> {
    if (!this.key) throw new Error('No key');
    const magic = new Uint8Array([0x46,0x47,0x45,0x43]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(s);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, data);
    const out = new Uint8Array(4 + 12 + (ct as ArrayBuffer).byteLength);
    out.set(magic, 0);
    out.set(iv, 4);
    out.set(new Uint8Array(ct as ArrayBuffer), 16);
    return out.buffer;
  }
  private async decrypt(buf: ArrayBuffer): Promise<string | null> {
    try {
      if (!this.key) return null;
      const u8 = new Uint8Array(buf);
      if (u8.byteLength < 16) return null;
      if (!(u8[0] === 0x46 && u8[1] === 0x47 && u8[2] === 0x45 && u8[3] === 0x43)) return null;
      const iv = u8.slice(4, 16);
      const ct = u8.slice(16);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, this.key!, ct);
      return new TextDecoder().decode(new Uint8Array(pt));
    } catch { return null; }
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
      } else {
        this.onCtrlMessage?.(m);
      }
    } catch {}
  }

  public sendClockProbe(): void {
    try { this.reliable?.send(JSON.stringify({ t: 'clock', phase: 'req', ts: performance.now() })); } catch {}
  }

  public sendControl(msg: any): void { try { this.reliable?.send(JSON.stringify(msg)); } catch {} }
  public getIsOfferer(): boolean { return this.isOfferer; }
  public restartIce(): void {
    try {
      (this.pc as any).restartIce?.();
      if (this.isOfferer) this.createAndSendOffer(); else this.signaling.send({ renegotiate: true });
    } catch { this.tryReconnect(); }
  }

  private handleRemoteInput(frame: number, bits: number): void {
    // Deliver in order if possible; otherwise buffer briefly up to jitterWindowFrames
    if (frame <= this.deliveredFrame + 1) {
      // in-order or immediate next
      this.deliveredFrame = Math.max(this.deliveredFrame, frame);
      this.onRemoteInput?.(frame, bits);
      this.lastDeliveredBits = bits;
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
      // Packet loss concealment: if bits look empty, reuse last delivered
      const plcBits = (bits === 0 && this.lastDeliveredBits !== 0) ? this.lastDeliveredBits : bits;
      this.onRemoteInput?.(frame, plcBits);
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
  disconnect(): void { try { this.closed = true; if (this.pingTimer) clearInterval(this.pingTimer); this.dc?.close(); this.reliable?.close(); this.pc.close(); } catch {} }
  sendLocalInput(frame: number, bits: number): void { this.send({ t: 'i', f: frame, b: bits }); }
  getRttMs(): number { return this.rttMs; }
  getJitterMs(): number { return this.jitterMs; }
  getOutOfOrderCount(): number { return this.outOfOrder; }
  getLossSuspectCount(): number { return this.lossSuspect; }
  getBytesTx(): number { return this.bytesTx; }
  getBytesRx(): number { return this.bytesRx; }
  setJitterWindow(frames: number): void { this.jitterWindowFrames = Math.max(0, Math.min(6, Math.floor(frames))); }
}

