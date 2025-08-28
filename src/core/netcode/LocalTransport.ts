import { Transport } from './RollbackNetcode';

export class LocalTransport implements Transport {
  private peer?: LocalTransport;
  public onRemoteInput?: (frame: number, bits: number) => void;

  connect(): void {}
  disconnect(): void {}
  setPeer(peer: LocalTransport) { this.peer = peer; }

  sendLocalInput(frame: number, bits: number): void {
    // deliver to peer immediately (same tick)
    this.peer?.onRemoteInput?.(frame, bits);
  }
}

