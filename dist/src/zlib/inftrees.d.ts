export interface InflateHuft {
    bits: number;
    exop: number;
    base: number;
}
export declare function huftBuild(b: number[], n: number, s: number, d: number[] | null, e: number[] | null, t: {
    tree: InflateHuft[] | null;
}, m: {
    value: number;
}, hp: InflateHuft[], hn: {
    value: number;
}, v: number[]): number;
export declare function inflateTreesBits(c: number[], bb: {
    value: number;
}, tb: {
    tree: InflateHuft[] | null;
}, hp: InflateHuft[], z: any): number;
export declare function inflateTreesDynamic(nl: number, nd: number, c: number[], bl: {
    value: number;
}, bd: {
    value: number;
}, tl: {
    tree: InflateHuft[] | null;
}, td: {
    tree: InflateHuft[] | null;
}, hp: InflateHuft[], z: any): number;
export declare function inflateTreesFixed(bl: {
    value: number;
}, bd: {
    value: number;
}, tl: {
    tree: InflateHuft[] | null;
}, td: {
    tree: InflateHuft[] | null;
}, z: any): number;
