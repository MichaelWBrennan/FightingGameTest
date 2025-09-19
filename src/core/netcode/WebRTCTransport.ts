import { Transport } from './RollbackNetcode';

type RTCMsg = { t: 'i'; f: number; b: number } | { t: 'p'; ts: number };

export class WebRTCTransport implements Transport {
  private pc: RTCPeerConnection;
  private dc?: RTCDataChannel;
  private interval?: any;

  public onRemoteInput?: (frame: number, bits: number) => void;

  constructor(private isOfferer: boolean, private signaling: { send(s: any): void; on(cb: (s: any) => void): void }) {
    this.pc = new RTCPeerConnection({ iceServers: [] });
    this.pc.onicecandidate = (e) => { if (e.candidate) this.signaling.send({ ice: e.candidate }); };
    if (isOfferer) {
      const dc = this.pc.createDataChannel('fg', { ordered: true, maxRetransmits: 0 });
      this.setupDataChannel(dc);
      this.pc.createOffer().then(o => this.pc.setLocalDescription(o)).then(() => this.signaling.send({ sdp: this.pc.localDescription })).catch(() => {});
    } else {
      this.pc.ondatachannel = (e) => this.setupDataChannel(e.channel);
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
        }
      } catch {}
    });
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    this.dc = dc;
    dc.onmessage = (e) => this.onMessage(e.data);
    dc.onopen = () => {
      this.interval = setInterval(() => {
        this.send({ t: 'p', ts: performance.now() });
      }, 500);
    };
    dc.onclose = () => { if (this.interval) clearInterval(this.interval); };
  }

  private send(m: RTCMsg): void {
    try { this.dc?.send(JSON.stringify(m)); } catch {}
  }

  private onMessage(d: any): void {
    try {
      const m = typeof d === 'string' ? JSON.parse(d) as RTCMsg : JSON.parse(new TextDecoder().decode(d)) as RTCMsg;
      if (m.t === 'i') {
        this.onRemoteInput?.(m.f, m.b);
      }
      // 'p' messages are currently ignored; could be used for RTT
    } catch {}
  }

  connect(): void {}
  disconnect(): void { try { this.pc.close(); } catch {} }
  sendLocalInput(frame: number, bits: number): void { this.send({ t: 'i', f: frame, b: bits }); }
}

