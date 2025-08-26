
/**
 * PS2 SDK Compatibility Layer
 * Converted from various PS2 SDK C files to TypeScript
 */

export interface EEKernelConfig {
  threadStackSize: number;
  maxThreads: number;
  timerResolution: number;
}

export interface ThreadState {
  id: number;
  priority: number;
  stackSize: number;
  status: 'running' | 'ready' | 'sleeping' | 'suspended';
  entryPoint: () => void;
}

export interface TimerState {
  id: number;
  interval: number;
  callback: () => void;
  repeating: boolean;
  active: boolean;
}

export class PS2SDKCompat {
  private threads: Map<number, ThreadState> = new Map();
  private timers: Map<number, TimerState> = new Map();
  private nextThreadId = 1;
  private nextTimerId = 1;
  private config: EEKernelConfig;

  constructor(config: Partial<EEKernelConfig> = {}) {
    this.config = {
      threadStackSize: 64 * 1024,
      maxThreads: 32,
      timerResolution: 1,
      ...config
    };
  }

  // Thread management (libkernel equivalent)
  createThread(entryPoint: () => void, priority = 0, stackSize?: number): number {
    if (this.threads.size >= this.config.maxThreads) {
      throw new Error('Maximum threads exceeded');
    }

    const id = this.nextThreadId++;
    const thread: ThreadState = {
      id,
      priority,
      stackSize: stackSize || this.config.threadStackSize,
      status: 'ready',
      entryPoint
    };

    this.threads.set(id, thread);
    return id;
  }

  startThread(threadId: number): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    thread.status = 'running';
    
    // Use Web Workers for actual threading in browser
    setTimeout(() => {
      try {
        thread.entryPoint();
      } catch (error) {
        console.error(`Thread ${threadId} error:`, error);
      }
    }, 0);

    return true;
  }

  suspendThread(threadId: number): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    thread.status = 'suspended';
    return true;
  }

  resumeThread(threadId: number): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    if (thread.status === 'suspended') {
      thread.status = 'ready';
      return true;
    }
    return false;
  }

  // Timer management
  createTimer(interval: number, callback: () => void, repeating = false): number {
    const id = this.nextTimerId++;
    const timer: TimerState = {
      id,
      interval,
      callback,
      repeating,
      active: false
    };

    this.timers.set(id, timer);
    return id;
  }

  startTimer(timerId: number): boolean {
    const timer = this.timers.get(timerId);
    if (!timer) return false;

    timer.active = true;
    
    const executeTimer = () => {
      if (!timer.active) return;
      
      timer.callback();
      
      if (timer.repeating) {
        setTimeout(executeTimer, timer.interval);
      } else {
        timer.active = false;
      }
    };

    setTimeout(executeTimer, timer.interval);
    return true;
  }

  stopTimer(timerId: number): boolean {
    const timer = this.timers.get(timerId);
    if (!timer) return false;

    timer.active = false;
    return true;
  }

  // Memory card functions (libmc equivalent)
  mcInit(): boolean {
    // Initialize memory card simulation using localStorage
    return typeof localStorage !== 'undefined';
  }

  mcWrite(port: number, slot: number, filename: string, data: ArrayBuffer): boolean {
    try {
      const key = `mc_${port}_${slot}_${filename}`;
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(data)));
      localStorage.setItem(key, base64Data);
      return true;
    } catch {
      return false;
    }
  }

  mcRead(port: number, slot: number, filename: string): ArrayBuffer | null {
    try {
      const key = `mc_${port}_${slot}_${filename}`;
      const base64Data = localStorage.getItem(key);
      if (!base64Data) return null;

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch {
      return null;
    }
  }

  // Gamepad functions (libpad2 equivalent)
  padInit(): boolean {
    return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
  }

  padGetState(port: number): any {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[port];
    
    if (!gamepad) {
      return { connected: false, buttons: [], axes: [] };
    }

    return {
      connected: gamepad.connected,
      buttons: gamepad.buttons.map(b => ({ pressed: b.pressed, value: b.value })),
      axes: Array.from(gamepad.axes)
    };
  }

  // Graphics functions (libgraph equivalent)
  graphicsInit(width: number, height: number): boolean {
    // Initialize WebGL context
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    
    const gl = canvas.getContext('webgl');
    return gl !== null;
  }

  // VU0 functions (libvu0 equivalent)
  vu0Init(): boolean {
    // VU0 simulation - use Web Workers for vector calculations
    return typeof Worker !== 'undefined';
  }

  // SIF RPC functions (sifrpc equivalent)
  sifInitRpc(): boolean {
    // Initialize RPC simulation
    return true;
  }

  sifBindRpc(clientData: any, serverId: number): boolean {
    // Simulate RPC binding
    return true;
  }

  sifCallRpc(clientData: any, funcNum: number, mode: number, send: any, sendSize: number, recv: any, recvSize: number): boolean {
    // Simulate RPC call
    return true;
  }

  // Utility functions
  getCurrentThreadId(): number {
    return 1; // Main thread
  }

  sleepThread(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getThreadCount(): number {
    return this.threads.size;
  }

  getActiveTimerCount(): number {
    return Array.from(this.timers.values()).filter(t => t.active).length;
  }
}

// Global instance for compatibility
export const ps2sdk = new PS2SDKCompat();
