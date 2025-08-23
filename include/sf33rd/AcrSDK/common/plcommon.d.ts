// Converted from sfiii-decomp/include/sf33rd/AcrSDK/common/plcommon.h

// Assuming types.h is handled implicitly or globally.
declare type s32 = number;
declare type u32 = number;
declare type u8 = number;
declare type s8 = string; // Approximation for s8*
declare type uintptr_t = number;

// Structure for PixelFormat
export interface PixelFormat {
    rl: s32;
    rs: s32;
    rm: s32;
    gl: s32;
    gs: s32; // Corrected from S32 to s32
    gm: s32;
    bl: s32;
    bs: s32;
    bm: s32;
    al: s32;
    as: s32;
    am: s32;
}

// Structure for plContext
export interface plContext {
    desc: u32;
    width: s32;
    height: s32;
    pitch: s32;
    ptr: Uint8Array | null; // void*
    bitdepth: s32;
    pixelformat: PixelFormat;
}

// Structure for FLTexture
export interface FLTexture {
    flag: u32;
    desc: u32;
    size: u32;
    bitdepth: u32;
    block_size: number;
    block_align: number;
    tbp: number;
    tw: number;
    th: number;
    width: number;
    height: number;
    format: u32;
    mem_handle: u32;
    dma_width: number;
    dma_height: number;
    lock_ptr: uintptr_t;
    tex_num: u32;
    be_flag: number;
    vram_on_flag: number;
    dma_type: number;
    lock_flag: u8;
    wkVram: any | null;
}

// Function declarations
export declare function plAPXGetMipmapTextureNum(lpbas: any): s32;
export declare function plAPXGetPaletteNum(lpbas: any): s32;
export declare function plAPXSetContextFromImage(dst: plContext, lpbas: any): s32;
export declare function plAPXSetPaletteContextFromImage(dst: plContext, lpbas: any): s32;
export declare function plAPXGetPixelAddressFromImage(lpbas: any, Mipmap: s32): Uint8Array | null;
export declare function plAPXGetPaletteAddressFromImage(lpbas: any, index: s32): Uint8Array | null;