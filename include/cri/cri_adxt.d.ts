// Converted from sfiii-decomp/include/cri/cri_adxt.h

// Module: cri_adxt

export declare const ADXT_VER: string;

// Stream Controller, Stream Joint decoder, Audio Renderer typedefs
export type ADXSTM = any | null; // void*
export type ADXSJD = any | null; // void*
export type ADXRNA = any | null; // void*

export declare const TRUE: number;
export declare const FALSE: number;

// Macro Constants
export declare const ADXT_MAX_OBJ: number;
export declare const ADXT_MAX_DATASIZE: number;
export declare const ADXT_IBUF_XLEN: number; // Size of Extra area in input buffer - Removed initializer for ambient context
export declare const ADXT_OBUF_SIZE: number;
export declare const ADXT_OBUF_DIST: number;
export declare const ADXT_MAX_SFREQ: number;
export declare const ADXT_PLY_MEM: number;
export declare const ADXT_PLY_STM: number;

export declare function ADXT_CALC_IBUFSIZE0(nch: number, sfreq: number): number;
export declare function ADXT_CALC_IBUFSIZE(nch: number, nstm: number, sfreq: number): number;
export declare function ADXT_CALC_OBUFSIZE(nch: number): number;
export declare function ADXT_CALC_WORK(nch: number, stmflg: number, nstm: number, sfreq: number): number;
export declare function ADXT_CalcDataLen(sec: number, nch: number, sfreq: number): number;
export declare const ADXT_WORKSIZE_AHX: number;

export declare const ADXT_MAX_CDBSCT: number;
export declare const ADXT_MIN_CDBSCT: number;
export declare const ADXT_PREP_RDSCT: number;

// Status definitions
export declare const ADXT_STAT_STOP: number;
export declare const ADXT_STAT_DECINFO: number;
export declare const ADXT_STAT_PREP: number;
export declare const ADXT_STAT_PLAYING: number;
export declare const ADXT_STAT_DECEND: number;
export declare const ADXT_STAT_PLAYEND: number;
export declare const ADXT_STAT_ERROR: number;

// Error code definitions
export declare const ADXT_ERR_OK: number;
export declare const ADXT_ERR_SHRTBUF: number;
export declare const ADXT_ERR_SNDBLK: number;

// Filter mode definitions
export declare const ADXT_FLTMODE_CPU: number;
export declare const ADXT_FLTMODE_SCSP: number;

// Play mode definitions
export declare const ADXT_PMODE_FNAME: number;
export declare const ADXT_PMODE_AFS: number;
export declare const ADXT_PMODE_MEM: number;
export declare const ADXT_PMODE_SJ: number;
export declare const ADXT_PMODE_SLFILE: number;

// Error recovery mode definitions
export declare const ADXT_RMODE_NOACT: number;
export declare const ADXT_RMODE_STOP: number;
export declare const ADXT_RMODE_REPLAY: number;

// Panpot definitions
export declare const ADXT_PAN_LEFT: number;
export declare const ADXT_PAN_CENTER: number;
export declare const ADXT_PAN_RIGHT: number;
export declare const ADXT_PAN_AUTO: number;

// Channel number definitions
export declare const ADXT_CH_L: number;
export declare const ADXT_CH_R: number;

export declare const ADXT_MAX_NCH: number;

export declare const ADXT_DEF_SVRFREQ: number;
export declare const ADXT_DEF_OUTVOL: number;
export declare const ADXT_MIN_BUFDATA: number;
export declare const ADXT_EWAIT_PLY: number;
export declare const ADXT_EWAIT_NOTPLY: number;

export declare const ADXT_MAX_IDX: number;
export declare const ADXT_FMT_ADX: number;
export declare const ADXT_FMT_AHX: number;

// ADX Talk Object Structure
export interface ADX_TALK {
    used: number;
    stat: number;
    pmode: number;
    maxnch: number;
    sjd: ADXSJD;
    stm: ADXSTM;
    adxt: ADXT[]; // Array of ADXT handles (size ADXT_MAX_TR)
    sjf: ADXSTM; // SJ typedef
    sji: ADXSTM; // SJ typedef
    sjo: ADXSTM[]; // SJ typedef array (size ADXT_MAX_NCH)
    ibuf: number[] | null; // Sint8*
    ibuflen: number;
    ibufxlen: number;
    obuf: number[] | null; // Sint16*
    obufsize: number;
    obufdist: number;
    svrfreq: number;
    maxsct: number;
    minsct: number;
    outvol: number;
    outpan: number[]; // Sint16[ADXT_MAX_NCH]
    unk46: number;
    maxdecsmpl: number;
    lpcnt: number;
    lp_skiplen: number;
    trp: number;
    wpos: number;
    mofst: number;
    ercode: number;
    edecpos: number;
    edeccnt: number;
    eshrtcnt: number;
    lpflg: number;
    autorcvr: number;
    fltmode: number;
    execflag: number;
    pstwait_flag: number;
    pstready_flag: number;
    pause_flag: number;
    amp: any | null; // void*
    ampsji: ADXSTM[]; // SJ typedef array (size ADXT_MAX_NCH)
    ampsjo: ADXSTM[]; // SJ typedef array (size ADXT_MAX_NCH)
    time_ofst: number;
    lesct: number;
    trpnsmpl: number;
    lsc: any | null; // void*
    lnkflg: number;
    rsv: number;
    rsv2: number;
    tvofst: number;
    svcnt: number;
    decofst: number;
    // Conditional members based on __EE__
    flush_nsmpl?: number;
    unkAC: number;
    padAD: number[]; // Sint8[1]
    unkB0: string; // Char8*
    padB4: number;
    padB8: number;
    padBC: number;
    padC0: number;
}
export type ADXT = ADX_TALK | null;

// SJ typedef, exported as an alias for ADXSTM
export type SJ = ADXSTM;

// Index data
export interface ADXT_IDX {
    nidx: number;
    top: number;
}

// Thread parameter structures
export interface ADXM_TPRM {
    prio_lock: number;
    prio_safe: number;
    prio_vsync: number;
    prio_main: number;
    prio_mwidle: number;
}
export interface ADXM_TPRM_EX {
    prio_lock: number;
    prio_safe: number;
    prio_usrvsync: number;
    prio_vsync: number;
    prio_main: number;
    prio_mwidle: number;
    prio_usridle: number;
}

// ADX header information structure
export interface ADXHINFO {
    fmt: number;
    sfreq: number;
    nch: number;
    bps: number;
    nsmpl: number;
    lptype: number;
    lpstart: number;
    lpend: number;
}

// Function Declarations

// Initialization and Termination
export declare function ADXT_Init(): void;
export declare function ADXT_Finish(): void;
export declare function ADXT_DestroyAll(): void;
export declare function ADXT_CloseAllHandles(): void;

// ADXT Handle Creation/Destruction
export declare function ADXT_Create(maxnch: number, work: any | null, worksize: number): ADXT;
export declare function ADXT_Destroy(adxt: ADXT): void;

// Play Start Functions
export declare function ADXT_StartAfs(adxt: ADXT, patid: number, fid: number): void;
export declare function ADXT_StartFname(adxt: ADXT, fname: string): void;
export declare function ADXT_StartSj(adxt: ADXT, sj: ADXSTM): void;
export declare function ADXT_StartMem(adxt: ADXT, adxdat: any | null): void;
export declare function ADXT_StartMem2(adxt: ADXT, adxdat: any | null, datlen: number): void;
export declare function ADXT_StartMemIdx(adxt: ADXT, acx: any | null, no: number): void;

// Play Control Functions
export declare function ADXT_Stop(adxt: ADXT): void;
export declare function ADXT_GetStat(adxt: ADXT): number;
export declare function ADXT_GetTime(adxt: ADXT, ncount: { ncount: number }, tscale: { tscale: number }): void;
export declare function ADXT_GetTimeReal(adxt: ADXT): number;
export declare function ADXT_GetNumSmpl(adxt: ADXT): number;
export declare function ADXT_GetSfreq(adxt: ADXT): number;
export declare function ADXT_GetNumChan(adxt: ADXT): number;
export declare function ADXT_GetHdrLen(adxt: ADXT): number;
export declare function ADXT_GetFmtBps(adxt: ADXT): number;

// Volume and Panpot Settings
export declare function ADXT_SetOutPan(adxt: ADXT, ch: number, pan: number): void;
export declare function ADXT_GetOutPan(adxt: ADXT, ch: number): number;
export declare function ADXT_SetOutVol(adxt: ADXT, vol: number): void;
export declare function ADXT_GetOutVol(adxt: ADXT): number;

// Server Frequency and Reload Settings
export declare function ADXT_SetSvrFreq(adxt: ADXT, freq: number): void;
export declare function ADXT_SetReloadTime(adxt: ADXT, time: number, nch: number, sfreq: number): void;
export declare function ADXT_SetReloadSct(adxt: ADXT, minsct: number): void;

// Buffer Status Acquisition
export declare function ADXT_GetNumSctIbuf(adxt: ADXT): number;
export declare function ADXT_GetNumSmplObuf(adxt: ADXT, chno: number): number;
export declare function ADXT_GetIbufRemainTime(adxt: ADXT): number;
export declare function ADXT_IsIbufSafety(adxt: ADXT): number;

// Error Recovery Mode
export declare function ADXT_SetAutoRcvr(adxt: ADXT, rmode: number): void;

// Play Completion Check
export declare function ADXT_IsCompleted(adxt: ADXT): number;

// Handle Server Function
export declare function ADXT_ExecHndl(adxt: ADXT): void;
export declare function ADXT_ExecServer(): void;
export declare function ADXT_ExecFsSvr(): void;
export declare function ADXT_IsActiveFsSvr(): number;

// Error Code Handling
export declare function ADXT_GetErrCode(adxt: ADXT): number;
export declare function ADXT_ClearErrCode(adxt: ADXT): void;

// Loop Count and Flag
export declare function ADXT_GetLpCnt(adxt: ADXT): number;
export declare function ADXT_SetLpFlg(adxt: ADXT, flg: number): void;

// Input Stream Joint Acquisition
export declare function ADXT_GetInputSj(adxt: ADXT): ADXSTM;

// Play Start Wait Settings
export declare function ADXT_SetWaitPlayStart(adxt: ADXT, flg: number): void;
export declare function ADXT_IsReadyPlayStart(adxt: ADXT): number;

// Pause Functionality
export declare function ADXT_Pause(adxt: ADXT, sw: number): void;
export declare function ADXT_GetStatPause(adxt: ADXT): number;

// Direct Send Level
export declare function ADXT_SetDrctLvl(adxt: ADXT, drctlvl: number): void;
export declare function ADXT_GetDrctLvl(adxt: ADXT): number;

// Effect Settings
export declare function ADXT_SetFx(adxt: ADXT, fxch: number, fxlvl: number): void;
export declare function ADXT_GetFx(adxt: ADXT, fxch: number, fxlvl: number): void; // Note: The C function signature returns void, implying output parameters. This TS version mirrors that structure.

// Filter Settings
export declare function ADXT_SetFilter(adxt: ADXT, coff: number, q: number): void;
export declare function ADXT_GetFilter(adxt: ADXT, coff: { coff: number }, q: { q: number }): void; // Using object for output parameters

// Transpose Settings
export declare function ADXT_SetTranspose(adxt: ADXT, transps: number, detune: number): void;
export declare function ADXT_GetTranspose(adxt: ADXT, transps: { transps: number }, detune: { detune: number }): void; // Using object for output parameters

// Error Function Registration
export declare function ADXT_EntryErrFunc(adxt: ADXT, func: (obj: any, msg: string) => void, obj: any): void;

// Discard Sound Data
export declare function ADXT_DiscardSmpl(adxt: ADXT, nsmpl: number): number;

// Retry count setting
export declare function ADXT_SetNumRetry(num: number): void;

// Get Header Information
export declare function ADXT_GetHdrInfo(buf: string, bsize: number, hinfo: ADXHINFO): void;

// Get File Reading Status
export declare function ADXT_GetStatRead(adxt: ADXT): number;

// Filter callback registration
export declare function ADXT_EntryFltFunc(adxt: ADXT, f: (obj: any, ch: number, data: any | null, dtlen: number) => void, obj: any): void;

// Get Decoded Sample Number
export declare function ADXT_GetDecNumSmpl(adxt: ADXT): number;

// Seamless Continuous Play
export declare const ADXT_MAX_ENTRY_FILES: number;
export declare function ADXT_EntryFname(adxt: ADXT, fname: string): void;
export declare function ADXT_EntryAfs(adxt: ADXT, patid: number, fid: number): void;
export declare function ADXT_StartSeamless(adxt: ADXT): void;
export declare function ADXT_SetSeamlessLp(adxt: ADXT, flg: number): void;
export declare function ADXT_StartFnameLp(adxt: ADXT, fname: string): void;
export declare function ADXT_ReleaseSeamless(adxt: ADXT): void;
export declare function ADXT_GetNumFiles(adxt: ADXT): number;
export declare function ADXT_SetLnkSw(adxt: ADXT, sw: number): void;
export declare function ADXT_GetLnkSw(adxt: ADXT): number;
export declare function ADXT_ResetEntry(adxt: ADXT): void;

// Amplitude Extraction Function
export declare function ADXT_CalcAmpWork(maxnch: number): number;
export declare function ADXT_SetAmpWork(adxt: ADXT, work: any | null, wksize: number): void;
export declare function ADXT_GetAmplitude(adxt: ADXT, ch: number): number;
export declare function ADXT_GetAmplitude2(adxt: ADXT, ch: number, msec: number, msec2: { msec2: number }): number;

// Forced Header Insertion
export declare function ADXT_InsertHdrSfa(adxt: ADXT, nch: number, sfreq: number, nsmpl: number): void;

// Time Offset Setting
export declare function ADXT_SetTimeOfst(adxt: ADXT, ofst: number): void;

// Sofdec Extension Functions
export declare function ADXT_VsyncProc(): void;
export declare function ADXT_SetTimeMode(mode: number): void;
export declare function ADXT_IsHeader(adr: string, siz: number, hdrsiz: { hdrsiz: number }): number;
export declare function ADXT_IsEndcode(adr: string, siz: number, endsiz: { endsiz: number }): number;
export declare function ADXT_InsertSilence(adxt: ADXT, nch: number, nsmpl: number): number;
export declare function ADXT_SetOutputMono(flag: number): void;

// AHX Functions
export declare function ADXT_AttachAhx(adxt: ADXT, work: any | null, worksize: number): void;
export declare function ADXT_DetachAhx(adxt: ADXT): void;

// ADX Manager Functions
export declare function ADXM_SetupThrd(tprm: ADXM_TPRM): void;
export declare function ADXM_ShutdownThrd(): void;
export declare function ADXM_SetupThrdEx(tprm: ADXM_TPRM_EX): void;
export declare function ADXM_ShutdownThrdEx(): void;
export declare function ADXM_SetCbUsrVsync(func: (obj: any) => boolean, obj: any): void;
export declare function ADXM_SetCbUsrIdle(func: (obj: any) => boolean, obj: any): void;
export declare function ADXM_GotoUsrIdleBdr(): void;
export declare function ADXM_ExecSvrUsrVsync(): number;
export declare function ADXM_ExecSvrUsrIdle(): number;
export declare function ADXM_SetCbErr(fn: (obj: any, emsg: string) => void, obj: any): void;
export declare function ADXM_SetCbSleepMwIdle(fn: (obj: any) => void, obj: any): void;
export declare function ADXM_IsSetupThrd(): boolean;
export declare function ADXM_Lock(): void;
export declare function ADXM_Unlock(): void;
export declare function ADXM_GetLockLevel(): number;
export declare function ADXM_WaitVsync(): void;
export declare function ADXM_ExecVint(arg: number): number;
export declare function ADXM_ExecMain(): number;
export declare function ADXM_ExecSvrVsync(): number;
export declare function ADXM_ExecSvrMain(): number;
export declare function ADXM_ExecSvrMwIdle(): number;
export declare function ADXM_ExecSvrAll(): number;