// Lightweight netcode worker stub: receives control messages and echoes simple stats
// This is a scaffold for future offloading of rollback/netcode logic

type WorkerMsg =
  | { t: 'init' }
  | { t: 'push'; frame: number; bits: number }
  | { t: 'step' }
  | { t: 'shutdown' };

interface Stats { cur: number; rollbacks: number; frameDelay: number }

let currentFrame = 0;
let rollbacks = 0;
let frameDelay = 2;

function postStats(): void {
  const s: Stats = { cur: currentFrame, rollbacks, frameDelay };
  (postMessage as any)({ t: 'stats', s });
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e: MessageEvent<WorkerMsg>) => {
  const m = e.data;
  switch (m.t) {
    case 'init':
      currentFrame = 0; rollbacks = 0; frameDelay = 2; postStats();
      break;
    case 'push':
      // In full impl, we'd enqueue inputs; here we just acknowledge
      break;
    case 'step':
      currentFrame++;
      if (Math.random() < 0.01) rollbacks++; // placeholder noise
      postStats();
      break;
    case 'shutdown':
      try { (close as any)(); } catch {}
      break;
  }
};

