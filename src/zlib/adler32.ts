
/* adler32.ts -- compute the Adler-32 checksum of a data stream
 * Converted from C to TypeScript
 */

const BASE = 65521; // largest prime smaller than 65536
const NMAX = 5552;
// NMAX is the largest n such that 255n(n+1)/2 + (n+1)(BASE-1) <= 2^32-1

export function adler32(adler: number, buf: Uint8Array | null, len: number): number {
    let s1 = adler & 0xffff;
    let s2 = (adler >>> 16) & 0xffff;
    let k: number;

    if (buf === null) return 1;

    let bufIndex = 0;
    while (len > 0) {
        k = len < NMAX ? len : NMAX;
        len -= k;
        while (k >= 16) {
            // DO16 equivalent
            for (let i = 0; i < 16; i++) {
                s1 += buf[bufIndex++];
                s2 += s1;
            }
            k -= 16;
        }
        if (k !== 0) {
            do {
                s1 += buf[bufIndex++];
                s2 += s1;
            } while (--k);
        }
        s1 %= BASE;
        s2 %= BASE;
    }
    return (s2 << 16) | s1;
}
