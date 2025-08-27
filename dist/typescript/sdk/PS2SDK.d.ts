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
export declare class PS2SDKCompat {
    private threads;
    private timers;
    private nextThreadId;
    private nextTimerId;
    private config;
    constructor(config?: Partial<EEKernelConfig>);
    createThread(entryPoint: () => void, priority?: number, stackSize?: number): number;
    startThread(threadId: number): boolean;
    suspendThread(threadId: number): boolean;
    resumeThread(threadId: number): boolean;
    createTimer(interval: number, callback: () => void, repeating?: boolean): number;
    startTimer(timerId: number): boolean;
    stopTimer(timerId: number): boolean;
    mcInit(): boolean;
    mcWrite(port: number, slot: number, filename: string, data: ArrayBuffer): boolean;
    mcRead(port: number, slot: number, filename: string): ArrayBuffer | null;
    padInit(): boolean;
    padGetState(port: number): any;
    graphicsInit(width: number, height: number): boolean;
    vu0Init(): boolean;
    sifInitRpc(): boolean;
    sifBindRpc(clientData: any, serverId: number): boolean;
    sifCallRpc(clientData: any, funcNum: number, mode: number, send: any, sendSize: number, recv: any, recvSize: number): boolean;
    getCurrentThreadId(): number;
    sleepThread(ms: number): Promise<void>;
    getThreadCount(): number;
    getActiveTimerCount(): number;
}
export declare const ps2sdk: PS2SDKCompat;
