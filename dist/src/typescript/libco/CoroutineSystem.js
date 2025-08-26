/**
 * Coroutine System
 * Converted from libco C library to TypeScript using generators
 */
export class CoroutineSystem {
    constructor() {
        Object.defineProperty(this, "coroutines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "nextId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "currentCoroutine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // Platform-specific implementations (converted from C files)
        // amd64 equivalent
        Object.defineProperty(this, "amd64Context", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                rsp: 0,
                rbp: 0,
                rip: 0
            }
        });
        // x86 equivalent  
        Object.defineProperty(this, "x86Context", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                esp: 0,
                ebp: 0,
                eip: 0
            }
        });
        // ARM equivalent
        Object.defineProperty(this, "armContext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                r0: 0, r1: 0, r2: 0, r3: 0,
                r4: 0, r5: 0, r6: 0, r7: 0,
                sp: 0, lr: 0, pc: 0
            }
        });
        // SJLJ (setjmp/longjmp) implementation
        Object.defineProperty(this, "jmpBuf", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    createCoroutine(func) {
        const id = this.nextId++;
        const generator = func();
        const state = {
            id,
            generator,
            active: false,
            suspended: false,
            completed: false
        };
        this.coroutines.set(id, state);
        return id;
    }
    switchTo(coroutineId) {
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
        }
        catch (error) {
            console.error(`Coroutine ${coroutineId} error:`, error);
            targetCoroutine.completed = true;
            targetCoroutine.active = false;
            this.currentCoroutine = null;
            return null;
        }
    }
    yield(value) {
        // This is called from within a coroutine
        // The actual yielding is handled by the generator
    }
    deleteCoroutine(coroutineId) {
        const coroutine = this.coroutines.get(coroutineId);
        if (!coroutine)
            return false;
        if (coroutine.active) {
            coroutine.generator.return(undefined);
        }
        this.coroutines.delete(coroutineId);
        if (this.currentCoroutine === coroutineId) {
            this.currentCoroutine = null;
        }
        return true;
    }
    getCurrentCoroutine() {
        return this.currentCoroutine;
    }
    isCoroutineActive(coroutineId) {
        const coroutine = this.coroutines.get(coroutineId);
        return coroutine?.active || false;
    }
    getCoroutineCount() {
        return this.coroutines.size;
    }
    getActiveCoroutines() {
        return Array.from(this.coroutines.values())
            .filter(c => c.active)
            .map(c => c.id);
    }
    // Platform detection and setup
    initializePlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('arm') || userAgent.includes('aarch64')) {
            return 'arm';
        }
        else if (userAgent.includes('x86_64') || userAgent.includes('amd64')) {
            return 'amd64';
        }
        else {
            return 'x86';
        }
    }
    // Fiber implementation for Windows compatibility
    createFiber(func) {
        return this.createCoroutine(func);
    }
    switchToFiber(fiberId) {
        return this.switchTo(fiberId);
    }
    // ucontext implementation for POSIX compatibility
    makeContext(func) {
        return this.createCoroutine(func);
    }
    swapContext(from, to) {
        this.switchTo(to);
    }
    setjmp(coroutineId) {
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
    longjmp(coroutineId, value) {
        const jmp = this.jmpBuf.get(coroutineId);
        if (jmp) {
            this.switchTo(coroutineId);
        }
    }
}
// Example usage helper functions
export function* exampleCoroutine() {
    console.log('Coroutine started');
    yield 'first yield';
    console.log('After first yield');
    yield 'second yield';
    console.log('Coroutine ending');
}
// Global coroutine system instance
export const coroutineSystem = new CoroutineSystem();
//# sourceMappingURL=CoroutineSystem.js.map