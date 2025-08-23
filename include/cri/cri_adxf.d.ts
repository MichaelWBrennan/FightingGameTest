// Converted from sfiii-decomp/include/cri/cri_adxf.h

// Module: cri_adxf

export declare const ADXF_VER: string;
export declare const ADXF_FNAME_MAX: number;
export declare const ADXF_PART_MAX: number;
export declare const ADXF_FILE_MAX: number;
export declare const ADXF_OBJ_MAX: number;

export declare const ADXF_STAT_STOP: number;
export declare const ADXF_STAT_READING: number;
export declare const ADXF_STAT_READEND: number;
export declare const ADXF_STAT_ERROR: number;

export declare const ADXF_SEEK_SET: number;
export declare const ADXF_SEEK_CUR: number;
export declare const ADXF_SEEK_END: number;

export declare const ADXF_ERR_OK: number;
export declare const ADXF_ERR_FATAL: number;
export declare const ADXF_ERR_INTERNAL: number;
export declare const ADXF_ERR_PRM: number;
export declare const ADXF_ERR_AFS_FILE: number;
export declare const ADXF_ERR_FSIZE: number;

export declare const ADXF_DEF_SCT_SIZE: number;
export declare const ADXF_DEF_DMA_ALIGN: number;
export declare const ADXF_DEF_ALIGN_CALC: number;
export declare const ADXF_DEF_REQ_RD_SCT: number;
export declare const ADXF_CMD_HSTRY_MAX: number;
export declare const ADXF_CMD_OPEN: number;
export declare const ADXF_CMD_OPEN_AFS: number;
export declare const ADXF_CMD_CLOSE: number;
export declare const ADXF_CMD_READ_NW32: number;
export declare const ADXF_CMD_STOP: number;
export declare const ADXF_CMD_SEEK: number;
export declare const ADXF_CMD_STOP_NW: number;
export declare const ADXF_CMD_NUM_MAX: number;

export declare function ADXF_PTIF_CMN_SZ(n: number): number; // Approximation of macro
export declare function ADXF_CALC_PTINFO_REAL_SIZE(n: number): number;
export declare function ADXF_CALC_PTINFO_SIZE(n: number): number;
export declare function ADXF_CALC_ADD_PTINFO_SIZE(n: number): number;
export declare function ADXF_CALC_TMPBUF_SIZE(n: number): number;

// Typedefs need to be represented as interfaces or type aliases
// Assuming basic types like Sint8, Sint32, void*, Char8*, Uint16, Uint8 are imported or available globally

// ADXF handle
export interface ADX_FS {
    used: number;
    stat: number;
    sjflag: number;
    stopnw_flg: number;
    stm: any | null; // ADXSTM is a void*
    sj: any; // SJ is a void*
    fnsct: number;
    fsize: number;
    skpos: number;
    rdstpos: number;
    rqsct: number;
    rdsct: number;
    buf: number[] | null; // Sint8* is approximated as number[]
    bsize: number;
    rqrdsct: number;
    ofst: number;
    dir: any | null; // void*
    unk38: any | null; // const Char8*
    unk3C: number;
    unk40: number;
}
export type ADXF = ADX_FS | null;

// Partition information
export interface ADXF_PTINFO {
    next: any | null; // ADXF_PTINFO*
    size: number;
    nfile: number;
    nentry: number;
    type: number;
    rev: number;
    fname: string; // Char8[ADXF_FNAME_MAX]
    curdir: any | null; // void*
    ofst: number;
    top: number;
    file_sizes: number[]; // file_sizes[0]; dynamic array
}

// Postscript file information
export interface ADXF_ADD_INFO {
    flid: number;
    fnsct: number;
    ofst: number;
}

// Command history information
export interface ADXF_CMD_HSTRY {
    cmdid: number;
    fg: number;
    ncall: number;
    prm: number[]; // intptr_t[3]
}

// Function Declarations

// Library initialization and finalization
export declare function ADXF_Init(): void;
export declare function ADXF_Finish(): void;

// Partition loading (Immediate return type)
export declare function ADXF_LoadPartitionNw(ptid: number, fname: string, dir: any | null, ptinfo: any | null): number;
export declare function ADXF_LoadPartitionFromAfsNw(set_ptid: number, rd_ptid: number, rd_flid: number, ptinfo: any | null): number;
export declare function ADXF_LoadPtNwEx(ptid: number, fname: string, dir: any | null, ptinfo: any | null, tmpbuf: any | null, tbsize: number): number;
export declare function ADXF_LoadPtFromAfsNwEx(set_ptid: number, rd_ptid: number, rd_flid: number, ptinfo: any | null, tmpbuf: any | null, tbsize: number): number;

// Partition loading status acquisition
export declare function ADXF_GetPtStat(ptid: number): number;
export declare function ADXF_GetPtStatEx(ptid: number): number;

// Stopping partition information loading
export declare function ADXF_StopPtLd(): void;

// Getting partition information size
export declare function ADXF_GetPtinfoSize(ptid: number): number;

// File reading
export declare function ADXF_Open(fname: string, atr: any | null): ADXF;
export declare function ADXF_OpenAfs(ptid: number, flid: number): ADXF;
export declare function ADXF_Close(adxf: ADXF): void;
export declare function ADXF_CloseAll(): void;

// Stream Joint data read
export declare function ADXF_ReadSj(adxf: ADXF, nsct: number, sj: any): number; // SJ is void*

// Data read-in start
export declare function ADXF_ReadNw(adxf: ADXF, nsct: number, buf: any | null): number;

// Data read-in stop
export declare function ADXF_Stop(adxf: ADXF): number;
export declare function ADXF_StopNw(adxf: ADXF): number;

// Server function
export declare function ADXF_ExecServer(): void;

// Access pointer control
export declare function ADXF_Seek(adxf: ADXF, pos: number, type: number): number;
export declare function ADXF_Tell(adxf: ADXF): number;

// Information acquisition
export declare function ADXF_GetFsizeSct(adxf: ADXF): number;
export declare function ADXF_GetFsizeByte(adxf: ADXF): number;
export declare function ADXF_GetNumReqSct(adxf: ADXF, seekpos: { seekpos: number }): number; // Using object for output parameter
export declare function ADXF_GetNumReadSct(adxf: ADXF): number;
export declare function ADXF_GetStat(adxf: ADXF): number;
export declare function ADXF_GetFnameRange(ptid: number, flid: number, fname: string, ofst: { ofst: number }, fnsct: { fnsct: number }): number; // Using objects for output parameters
export declare function ADXF_GetFnameRangeEx(ptid: number, flid: number, fname: string, dir: any | null, ofst: { ofst: number }, fnsct: { fnsct: number }): number; // Using objects for output parameters

// Setting read request size
export declare function ADXF_SetReqRdSct(adxf: ADXF, nsct: number): void;

// File reading status acquisition
export declare function ADXF_GetStatRead(adxf: ADXF): number;

// ROFS related definitions and functions could be complex and might require separate handling.
// For now, just declaring constants and key structures.

// ROFS constants
export declare const ADXF_ROFS_VOLNAME_LEN: number;
export declare const ADXF_ROFS_VOLNAME_SIZ: number;
export declare const ADXF_ROFS_FNAME_LEN: number;
export declare const ADXF_ROFS_FNAME_SIZ: number;
export declare const ADXF_ROFS_DIRNAME_LEN: number;
export declare const ADXF_RPFS_DIRNAME_SIZ: number;

export declare function ADXF_CALC_LIBWORK_SIZ(max_open: number, max_volume: number, max_dirent: number): number;
export declare function ADXF_CALC_DIRREC_SIZ(n_dirent: number): number;

// ROFS structures might need interface definitions if their members become relevant

// ROFS Setup
export declare function ADXF_SetupRofs(sprmr: any): void;
export declare function ADXF_ShutdownRofs(): void;
export declare function ADXF_AddRofsVol(volname: string, imgname: string): number;
export declare function ADXF_DelRofsVol(volname: string): void;
export declare function ADXF_IsRofsVol(volname: string): boolean;
export declare function ADXF_SetDefDev(volname: string): void;