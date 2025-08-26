export declare const ZLIB_VERSION = "1.1.4";
export declare const z_errmsg: string[];
export declare function zlibVersion(): string;
export declare function zError(err: number): string;
export declare function zmemcpy(dest: Uint8Array, source: Uint8Array, len: number): void;
export declare function zmemcmp(s1: Uint8Array, s2: Uint8Array, len: number): number;
export declare function zmemzero(dest: Uint8Array, len: number): void;
export declare function zcalloc(opaque: any, items: number, size: number): Uint8Array;
export declare function zcfree(opaque: any, ptr: any): void;
//# sourceMappingURL=zutil.d.ts.map