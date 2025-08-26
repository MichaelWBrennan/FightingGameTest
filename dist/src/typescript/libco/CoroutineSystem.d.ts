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
export declare class CoroutineSystem {
    private coroutines;
    private nextId;
    private currentCoroutine;
    createCoroutine(func: CoroutineFunction): number;
    switchTo(coroutineId: number): any;
    yield(value?: any): void;
    deleteCoroutine(coroutineId: number): boolean;
    getCurrentCoroutine(): number | null;
    isCoroutineActive(coroutineId: number): boolean;
    getCoroutineCount(): number;
    getActiveCoroutines(): number[];
    private amd64Context;
    private x86Context;
    private armContext;
    initializePlatform(): string;
    createFiber(func: CoroutineFunction): number;
    switchToFiber(fiberId: number): any;
    makeContext(func: CoroutineFunction): number;
    swapContext(from: number, to: number): void;
    private jmpBuf;
    setjmp(coroutineId: number): number;
    longjmp(coroutineId: number, value: number): void;
}
export declare function exampleCoroutine(): Generator<string, void, unknown>;
export declare const coroutineSystem: CoroutineSystem;
//# sourceMappingURL=CoroutineSystem.d.ts.map