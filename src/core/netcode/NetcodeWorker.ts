// Lightweight netcode worker stub: receives control messages and echoes simple stats
// This is a scaffold for future offloading of rollback/netcode logic

type WorkerMsg =
  | { t: 'init'; delay?: number; maxRb?: number }
  | { t: 'tick' }
  | { t: 'local'; bits: number }
  | { t: 'remote'; frame: number; bits: number }
  | { t: 'setDelay'; delay: number }
  | { t: 'saved'; frame: number; checksum: number; buf?: ArrayBuffer }
  | { t: 'shutdown' };

interface Stats { cur: number; rollbacks: number; frameDelay: number }

let currentFrame = 0;
let rollbacks = 0;
let frameDelay = 2;
let maxRollback = 10;
const localInputs = new Map<number, number>();
const remoteInputs = new Map<number, number>();
const predictedRemote = new Map<number, number>();
const snapshots = new Map<number, { frame: number; checksum: number; buf?: ArrayBuffer }>();

function postStats(): void {
  const s: Stats = { cur: currentFrame, rollbacks, frameDelay };
  (postMessage as any)({ t: 'stats', s });
}

 
function requestSave(frame: number): void { (postMessage as any)({ t: 'save', frame }); }
function requestLoad(frame: number): void {
  const cs = snapshots.get(frame);
  if (cs && cs.buf) (postMessage as any)({ t: 'load', frame, checksum: cs.checksum, cs: cs.buf }, [cs.buf]);
  else (postMessage as any)({ t: 'load', frame });
}
function requestStep(frame: number, localBits: number, remoteBits: number): void {
  (postMessage as any)({ t: 'step', frame, localBits, remoteBits });
}

function advanceOne(): void {
  // Save snapshot before stepping
  requestSave(currentFrame);
  const local = localInputs.get(currentFrame) ?? 0;
  let remote = remoteInputs.get(currentFrame);
  const pred = predictedRemote.get(currentFrame);
  if (remote == null) {
    const last = remoteInputs.get(currentFrame - 1);
    remote = last != null ? last : (pred != null ? pred : 0);
    predictedRemote.set(currentFrame, remote);
  }
  requestStep(currentFrame, local, remote);
  currentFrame++;
  // detect mismatch within window
  for (let f = Math.max(0, currentFrame - maxRollback); f < currentFrame; f++) {
    const r = remoteInputs.get(f);
    const p = predictedRemote.get(f);
    if (r != null && p != null && r !== p) {
      // rollback to f
      rollbacks++;
      requestLoad(f);
      for (let s = f; s < currentFrame; s++) {
        const l = localInputs.get(s) ?? 0;
        const rr = remoteInputs.get(s) ?? predictedRemote.get(s) ?? 0;
        requestStep(s, l, rr);
        if (remoteInputs.has(s)) predictedRemote.delete(s);
      }
      break;
    }
  }
}

 
self.onmessage = (e: MessageEvent<WorkerMsg>) => {
  const m = e.data;
  switch (m.t) {
    case 'init':
      currentFrame = 0; rollbacks = 0; frameDelay = m.delay ?? 2; maxRollback = m.maxRb ?? 10; postStats();
      break;
    case 'tick':
      advanceOne();
      postStats();
      break;
    case 'local': {
      const target = currentFrame + frameDelay;
      localInputs.set(target, m.bits >>> 0);
      break; }
    case 'remote':
      remoteInputs.set(m.frame | 0, m.bits >>> 0);
      break;
    case 'setDelay':
      frameDelay = Math.max(0, Math.min(10, Math.floor(m.delay)));
      break;
    case 'saved':
      snapshots.set(m.frame | 0, { frame: m.frame | 0, checksum: m.checksum | 0, buf: m.buf });
      break;
    case 'shutdown':
      try { (close as any)(); } catch {}
      break;
  }
};

