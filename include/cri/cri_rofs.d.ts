// Converted from sfiii-decomp/include/cri/cri_rofs.h

// Module: cri_rofs

// ROFS Version
export declare const ROFS_VERSION_STR: string;

// Constants
export declare const ROFS_SCT_LEN: number;
export declare const ROFS_ATR_DIRECTORY: number;

// Volume and Filename Lengths
export declare const ROFS_VOLNAME_LEN: number;
export declare const ROFS_VOLNAME_SIZ: number;
export declare const ROFS_FNAME_LEN: number;
export declare const ROFS_FNAME_SIZ: number;
export declare const ROFS_DIRNAME_LEN: number;
export declare const RPFS_DIRNAME_SIZ: number;
export declare const ROFS_VOLID_SIZ: number;

// Work buffer definitions
export declare const ROFS_WKBUF_NUM: number;
export declare const ROFS_WKBUF_SIZ: number;

// Enum definitions
export declare enum RofsStat {
    ROFS_STAT_IDLE = 0,
    ROFS_STAT_COMPLETE = 1,
    ROFS_STAT_TRANS = 2,
    ROFS_STAT_ERR = 3,
    ROFS_STAT_NUM
}

export declare enum RofsSeek {
    ROFS_SEEK_SET = 0,
    ROFS_SEEK_CUR = 1,
    ROFS_SEEK_END = 2,
    ROFS_SEEK_NUM
}

export declare enum RofsErr {
    ROFS_ERR_OK = 0,
    ROFS_ERR_NG = -1,
    ROFS_ERR_PRM = -100,
    ROFS_ERR_ILLHDL = -101,
    ROFS_ERR_NOHNDL = -102,
    ROFS_ERR_VOLNAME = -103,
    ROFS_ERR_REGVOLNAME = -104,
    ROFS_ERR_VOLUME = -105,
    ROFS_ERR_NOTDIR = -106,
    ROFS_ERR_NOTFOUND = -107,
    ROFS_ERR_ILLDIRBUF = -108,
    ROFS_ERR_DIROVER = -109,
    ROFS_ERR_BUSY = -200,
    ROFS_ERR_TOUT = -201,
    ROFS_ERR_PRIMITIVE = -202,
    ROFS_ERR_INIT = -203,
    ROFS_ERR_REQRD = -204,
    ROFS_ERR_SEEK = -205,
    ROFS_ERR_OPEN = -206,
    ROFS_ERR_READ = -207,
    ROFS_ERR_INTERNAL = -1000
}

// Macro function declarations
export declare function ROFS_GET_LIBWORK_SIZ(max_open: number, max_volume: number, max_dirent: number): number;
export declare function ROFS_GET_DIRREC_SIZ(n_dirent: number): number;
export declare function ROFS_IS_ATR_DIRECTORY(finf: any): boolean; // finf is likely RofsFileInf*
export declare function ROFS_ALIGN_64BYTE(ptr: any): number;

// Typedefs and Structures

// Work area pointer
export type RofsWork = any; // Should be a specific struct, `RofsStWrok`

// Primitive function table
export interface RofsPfsTbl {
    pfs_execserver?: () => void;
    pfs_reserve01?: (errfunc: RofsErrFunc, obj: any) => void;
    pfs_reserve02?: (fname: string) => number;
    pfs_reserve03?: () => number;
    pfs_reserve04?: (fname: string, dir_buf: RofsDirRecBuf | null, size: number) => any | null;
    pfs_reserve05?: (dir_buf: RofsDirRecBuf | null) => void;
    pfs_seek?: (rofs: Rofs, nsct: number, sk_mode: RofsSeek) => number;
    pfs_tell?: (rofs: Rofs) => number;
    pfs_reqrd?: (rofs: Rofs, nsct: number, buf: Uint8Array) => number;
    pfs_reserve07?: (rofs: Rofs, nsct: number, buf: Uint8Array) => number;
    pfs_stoptr?: (rofs: Rofs) => void;
    pfs_getstat?: (rofs: Rofs) => RofsStat;
    pfs_getsctlen?: (rofs: Rofs) => number;
    pfs_reserve08?: (rofs: Rofs, nsct: number) => void;
    pfs_getnumtr?: (rofs: Rofs) => number;
    pfs_reserve09?: (fname: string) => number;
    pfs_reserve10?: (fname: string) => number;
    pfs_reserve11?: () => number;
    pfs_reserve12?: (fname: string, dir_buf: RofsDirRecBuf | null, size: number) => number;
    pfs_reserve13?: (dir_buf: RofsDirRecBuf | null) => number;
    pfs_reserve14?: (dirname: string) => number;
    pfs_reserve15?: (fname: string) => number;
    pfs_reserve16?: (volname: string) => number;
    pfs_reserve17?: (volname: string, fileinf: RofsFileInf, num: number) => number;
    pfs_reserve18?: (volname: string, img_hn: any | null) => RofsErr;
    pfs_reserve19?: (volname: string) => RofsErr;
    pfs_getnumtr64?: (rofs: Rofs) => number;
}

// Device control function table
export type RofsDevTbl = any; // Should be a specific struct, `RfpfsDevIfTbl`

// Library interface
export type RofsLif = any; // Should be a specific struct, `RfmaiLibIfTbl`

// Directory record entry
export interface RofsDirRecEnt {
    fsize: number;
    fsize_ex: number;
    fad: number;
    fatr: number;
    sid: number;
    fname: string;
    pad: Uint8Array;
}

// Directory record
export interface RofsDirRec {
    dir_num: number;
    max_ent: number;
    dir_fad: number;
    volname: string;
    pad: Uint8Array;
    dirrec_tbl: RofsDirRecEnt[];
}
export type RofsDirRecBuf = RofsDirRec | null;

// Volume information
export interface RofsVolume {
    img_hn: any | null;
    zisb: number;
    ptbl_cba: number;
    ptbl_size: number;
    curdir: RofsDirRecBuf;
    req_cnt: number;
    volname: string;
    pad: Uint8Array;
    flags: number;
    vol_id: Uint8Array;
}

// ROFS File Handle
export interface RofsHandle {
    fsize: number;
    fsize_ex: number;
    wk: RofsWork | null;
    fid: number;
    fad: number;
    ofs: number;
    fsctsize: number;
    vol: RofsVolume | null;
    rsize: number;
    trns_seg: number;
    trns_ofs: number;
    trns_unit: number;
    rdadr: Uint8Array;
    used: number;
    act: number;
    stat: RofsStat;
    err: RofsErr;
}
export type Rofs = RofsHandle | null;

// ROFS Initialize Parameter
export interface RofsInitPara {
    max_open: number;
    max_volume: number;
    max_dirent: number;
    rofs_work: RofsWork | null;
}

// ROFS File Information
export interface RofsFileInf {
    fsize: number;
    fsize_ex: number;
    fname: string | null;
    fatr: number;
    pad: Uint8Array;
}

// ROFS Volume Information
export interface RofsVolumeInf {
    volname: string | null;
    fhn: any | null;
}

// ROFS Error Callback Function
export type RofsErrFunc = (obj: any, msg: string, errcode: RofsErr) => void;

// Function Declarations

// Initialization and Finalization
export declare function ROFS_Init(init_para: RofsInitPara): RofsErr;
export declare function ROFS_Finish(): RofsErr;
export declare function ROFS_SetPfsFuncTbl(pfs_tbl: RofsPfsTbl): RofsErr;

// Volume Management
export declare function ROFS_AddVolume(volname: string, img_hn: any | null): RofsErr;
export declare function ROFS_DelVolume(volname: string): RofsErr;
export declare function ROFS_SetDefVolume(volname: string): RofsErr;
export declare function ROFS_GetDefVolume(): string | null;
export declare function ROFS_SwitchImgHn(volname: string, img_hn: any | null): RofsErr;

// File Operations
export declare function ROFS_Open(fname: string, dir_buf: RofsDirRecBuf | null): Rofs;
export declare function ROFS_OpenRange(volname: string, stsct: number, nsct: number): Rofs;
export declare function ROFS_Close(rofs: Rofs): void;
export declare function ROFS_Seek(rofs: Rofs, nsct: number, sk_mode: RofsSeek): number;
export declare function ROFS_Tell(rofs: Rofs): number;
export declare function ROFS_ReqRd(rofs: Rofs, nsct: number, buf: Uint8Array): number;
export declare function ROFS_StopTr(rofs: Rofs): void;

// Status Acquisition
export declare function ROFS_GetStat(rofs: Rofs): RofsStat;
export declare function ROFS_GetFileSiz(fname: string): number;
export declare function ROFS_GetSctLen(): number;
export declare function ROFS_GetNumTr(rofs: Rofs): number;
export declare function ROFS_GetVolumeInf(volname: string, volinf: RofsVolumeInf): RofsErr;

// Directory Operations
export declare function ROFS_LoadDir(dirname: string, dir_buf: Uint8Array, n_dirent: number): RofsErr;
export declare function ROFS_SetDir(volname: string, dir_buf: RofsDirRecBuf): RofsErr;
export declare function ROFS_SetIsoDir(volname: string, dir_buf: RofsDirRecBuf): RofsErr;
export declare function ROFS_ChangeDir(dirname: string): RofsErr;
export declare function ROFS_IsExistFile(fname: string): boolean;
export declare function ROFS_GetNumFiles(volname: string): number;
export declare function ROFS_GetDirInf(volname: string, flist: RofsFileInf, num: number): number;

// Error Handling
export declare function ROFS_EntryErrFunc(errfunc: RofsErrFunc, obj: any): void;
export declare function ROFS_GetLastError(): RofsErr;

// 64bit Support
export declare function ROFS_GetNumTr64(rofs: Rofs): number;
export declare function ROFS_GetFileSiz64(fname: string): number;

// Version Information
export declare function ROFS_GetVersionStr(): string | null;