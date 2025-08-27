/**
 * PS2 SDK Compatibility Layer
 * Converted from various PS2 SDK C files to TypeScript
 */
export class PS2SDKCompat {
    constructor(config = {}) {
        this.threads = new Map();
        this.timers = new Map();
        this.nextThreadId = 1;
        this.nextTimerId = 1;
        this.config = {
            threadStackSize: 64 * 1024,
            maxThreads: 32,
            timerResolution: 1,
            ...config
        };
    }
    // Thread management (libkernel equivalent)
    createThread(entryPoint, priority = 0, stackSize) {
        if (this.threads.size >= this.config.maxThreads) {
            throw new Error('Maximum threads exceeded');
        }
        const id = this.nextThreadId++;
        const thread = {
            id,
            priority,
            stackSize: stackSize || this.config.threadStackSize,
            status: 'ready',
            entryPoint
        };
        this.threads.set(id, thread);
        return id;
    }
    startThread(threadId) {
        const thread = this.threads.get(threadId);
        if (!thread)
            return false;
        thread.status = 'running';
        // Use Web Workers for actual threading in browser
        setTimeout(() => {
            try {
                thread.entryPoint();
            }
            catch (error) {
                console.error(`Thread ${threadId} error:`, error);
            }
        }, 0);
        return true;
    }
    suspendThread(threadId) {
        const thread = this.threads.get(threadId);
        if (!thread)
            return false;
        thread.status = 'suspended';
        return true;
    }
    resumeThread(threadId) {
        const thread = this.threads.get(threadId);
        if (!thread)
            return false;
        if (thread.status === 'suspended') {
            thread.status = 'ready';
            return true;
        }
        return false;
    }
    // Timer management
    createTimer(interval, callback, repeating = false) {
        const id = this.nextTimerId++;
        const timer = {
            id,
            interval,
            callback,
            repeating,
            active: false
        };
        this.timers.set(id, timer);
        return id;
    }
    startTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer)
            return false;
        timer.active = true;
        const executeTimer = () => {
            if (!timer.active)
                return;
            timer.callback();
            if (timer.repeating) {
                setTimeout(executeTimer, timer.interval);
            }
            else {
                timer.active = false;
            }
        };
        setTimeout(executeTimer, timer.interval);
        return true;
    }
    stopTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer)
            return false;
        timer.active = false;
        return true;
    }
    // Memory card functions (libmc equivalent)
    mcInit() {
        // Initialize memory card simulation using localStorage
        return typeof localStorage !== 'undefined';
    }
    mcWrite(port, slot, filename, data) {
        try {
            const key = `mc_${port}_${slot}_${filename}`;
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(data)));
            localStorage.setItem(key, base64Data);
            return true;
        }
        catch {
            return false;
        }
    }
    mcRead(port, slot, filename) {
        try {
            const key = `mc_${port}_${slot}_${filename}`;
            const base64Data = localStorage.getItem(key);
            if (!base64Data)
                return null;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
        catch {
            return null;
        }
    }
    // Gamepad functions (libpad2 equivalent)
    padInit() {
        return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
    }
    padGetState(port) {
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
    graphicsInit(width, height) {
        // Initialize WebGL context
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        document.body.appendChild(canvas);
        const gl = canvas.getContext('webgl');
        return gl !== null;
    }
    // VU0 functions (libvu0 equivalent)
    vu0Init() {
        // VU0 simulation - use Web Workers for vector calculations
        return typeof Worker !== 'undefined';
    }
    // SIF RPC functions (sifrpc equivalent)
    sifInitRpc() {
        // Initialize RPC simulation
        return true;
    }
    sifBindRpc(clientData, serverId) {
        // Simulate RPC binding
        return true;
    }
    sifCallRpc(clientData, funcNum, mode, send, sendSize, recv, recvSize) {
        // Simulate RPC call
        return true;
    }
    // Utility functions
    getCurrentThreadId() {
        return 1; // Main thread
    }
    sleepThread(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getThreadCount() {
        return this.threads.size;
    }
    getActiveTimerCount() {
        return Array.from(this.timers.values()).filter(t => t.active).length;
    }
}
// Global instance for compatibility
export const ps2sdk = new PS2SDKCompat();
//# sourceMappingURL=PS2SDK.js.map