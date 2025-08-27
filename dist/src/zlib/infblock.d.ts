export interface InflateBlocksState {
    mode: number;
    last: number;
    bitk: number;
    bitb: number;
    hufts: any[];
    window: Uint8Array;
    end: number;
    read: number;
    write: number;
    check: number;
    checkfn?: (check: number, buf: Uint8Array, len: number) => number;
    sub: {
        left: number;
        trees: {
            table: number;
            index: number;
            blens?: number[];
            bb: number;
            tb?: any;
        };
        decode: {
            codes?: any;
        };
    };
}
export declare function inflateBlocksNew(z: any, c: any, w: number): InflateBlocksState | null;
export declare function inflateBlocksReset(s: InflateBlocksState, z: any, c: any): void;
export declare function inflateBlocks(s: InflateBlocksState, z: any, r: number): number;
export declare function inflateBlocksFree(s: InflateBlocksState, z: any): number;
export declare function inflateSetDictionary(s: InflateBlocksState, d: Uint8Array, n: number): void;
export declare function inflateBlocksSyncPoint(s: InflateBlocksState): boolean;
