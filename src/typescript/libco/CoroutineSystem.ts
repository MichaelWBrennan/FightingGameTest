
/**
 * Coroutine System
 * Converted from libco C library to TypeScript using generators
 */

export interface CoroutineState {
  id: number;
  generator: Generator<any, any, any>;
  active: boolean;
  suspended: boolean;
  completed: boolean;
}

export type CoroutineFunction = () => Generator<any, any, any>;

export class CoroutineSystem {
  private coroutines: Map<number, CoroutineState> = new Map();
  private nextId = 1;
  private currentCoroutine: number | null = null;

  createCoroutine(func: CoroutineFunction): number {
    const id = this.nextId++;
    const generator = func();
    
    const state: CoroutineState = {
      id,
      generator,
      active: false,
      suspended: false,
      completed: false
    };

    this.coroutines.set(id, state);
    return id;
  }

  switchTo(coroutineId: number): any {
    const targetCoroutine = this.coroutines.get(coroutineId);
    if (!targetCoroutine || targetCoroutine.completed) {
      return null;
    }

    // Suspend current coroutine
    if (this.currentCoroutine !== null) {
      const current = this.coroutines.get(this.currentCoroutine);
      if (current) {
        current.active = false;
        current.suspended = true;
      }
    }

    // Activate target coroutine
    this.currentCoroutine = coroutineId;
    targetCoroutine.active = true;
    targetCoroutine.suspended = false;

    try {
      const result = targetCoroutine.generator.next();
      
      if (result.done) {
        targetCoroutine.completed = true;
        targetCoroutine.active = false;
        this.currentCoroutine = null;
      }

      return result.value;
    } catch (error) {
      console.error(`Coroutine ${coroutineId} error:`, error);
      targetCoroutine.completed = true;
      targetCoroutine.active = false;
      this.currentCoroutine = null;
      return null;
    }
  }

  yield(value?: any): void {
    // This is called from within a coroutine
    // The actual yielding is handled by the generator
  }

  deleteCoroutine(coroutineId: number): boolean {
    const coroutine = this.coroutines.get(coroutineId);
    if (!coroutine) return false;

    if (coroutine.active) {
      coroutine.generator.return(undefined);
    }

    this.coroutines.delete(coroutineId);
    
    if (this.currentCoroutine === coroutineId) {
      this.currentCoroutine = null;
    }

    return true;
  }

  getCurrentCoroutine(): number | null {
    return this.currentCoroutine;
  }

  isCoroutineActive(coroutineId: number): boolean {
    const coroutine = this.coroutines.get(coroutineId);
    return coroutine?.active || false;
  }

  getCoroutineCount(): number {
    return this.coroutines.size;
  }

  getActiveCoroutines(): number[] {
    return Array.from(this.coroutines.values())
      .filter(c => c.active)
      .map(c => c.id);
  }

  // Platform-specific implementations (converted from C files)
  
  // amd64 equivalent
  private amd64Context = {
    rsp: 0,
    rbp: 0,
    rip: 0
  };

  // x86 equivalent  
  private x86Context = {
    esp: 0,
    ebp: 0,
    eip: 0
  };

  // ARM equivalent
  private armContext = {
    r0: 0, r1: 0, r2: 0, r3: 0,
    r4: 0, r5: 0, r6: 0, r7: 0,
    sp: 0, lr: 0, pc: 0
  };

  // Platform detection and setup
  initializePlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('arm') || userAgent.includes('aarch64')) {
      return 'arm';
    } else if (userAgent.includes('x86_64') || userAgent.includes('amd64')) {
      return 'amd64';
    } else {
      return 'x86';
    }
  }

  // Fiber implementation for Windows compatibility
  createFiber(func: CoroutineFunction): number {
    return this.createCoroutine(func);
  }

  switchToFiber(fiberId: number): any {
    return this.switchTo(fiberId);
  }

  // ucontext implementation for POSIX compatibility
  makeContext(func: CoroutineFunction): number {
    return this.createCoroutine(func);
  }

  swapContext(from: number, to: number): void {
    this.switchTo(to);
  }

  // SJLJ (setjmp/longjmp) implementation
  private jmpBuf: Map<number, any> = new Map();

  setjmp(coroutineId: number): number {
    const coroutine = this.coroutines.get(coroutineId);
    if (coroutine) {
      this.jmpBuf.set(coroutineId, { 
        generator: coroutine.generator,
        position: 'current'
      });
      return 0;
    }
    return -1;
  }

  longjmp(coroutineId: number, value: number): void {
    const jmp = this.jmpBuf.get(coroutineId);
    if (jmp) {
      this.switchTo(coroutineId);
    }
  }
}

// Example usage helper functions
export function* exampleCoroutine(): Generator<string, void, unknown> {
  console.log('Coroutine started');
  yield 'first yield';
  console.log('After first yield');
  yield 'second yield';
  console.log('Coroutine ending');
}

// Global coroutine system instance
export const coroutineSystem = new CoroutineSystem();
