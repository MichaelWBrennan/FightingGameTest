// Converted from sfiii-decomp/include/cri/cri_aixp.h

// Module: cri_aixp

// Importing common types from ADXT, as AIXP seems to depend on it.
// Assuming ADXT_MAX_NCH, ADXSTM, SJ, ADXRNA are available from ADXT module.
import { ADXSTM, ADXSJD, ADXRNA, ADXT } from './cri_adxt';

// AIXP Version
export declare const AIXP_VER: string;

// Macro Constants
export declare const AIXP_MAX_OBJ: number;
export declare const AIXP_MAX_TR: number;
export declare const AIXP_MAX_PH: number;
export declare const AIXP_MAX_SFREQ: number;

// Status definitions
export declare const AIXP_STAT_STOP: number;
export declare const AIXP_STAT_PREP: number;
export declare const AIXP_STAT_PLAYING: number;
export declare const AIXP_STAT_PLAYEND: number;
export declare const AIXP_STAT_ERROR: number;

// Channel and Track definitions
export declare const AIXP_MAX_NCH: number;

// Default values
export declare const AIXP_DEF_SVRFREQ: number;
export declare const AIXP_DEF_OUTVOL: number;

// Buffer size definitions
export declare function AIXP_CALC_WORK(nch: number, nstm: number, sfreq: number, ntr: number): number;
export declare const AIXP_IBUF_XLEN: number;
export declare const AIXP_OBUF_SIZE: number;
export declare const AIXP_OBUF_DIST: number;

// Read request definitions
export declare const AIXP_MAX_CDBSCT: number;
export declare const AIXP_MIN_CDBSCT: number;
export declare const AIXP_PREP_RDSCT: number;

// Panpot definitions
export declare const AIXP_PAN_LEFT: number;
export declare const AIXP_PAN_CENTER: number;
export declare const AIXP_PAN_RIGHT: number;
export declare const AIXP_PAN_AUTO: number;

// Speaker ID definitions for 5.1ch
export declare const AIXP_SPKID_FL: number;
export declare const AIXP_SPKID_FR: number;
export declare const AIXP_SPKID_BL: number;
export declare const AIXP_SPKID_BR: number;
export declare const AIXP_SPKID_FC: number;
export declare const AIXP_SPKID_LF: number;
export declare const AIXP_SPK_NUM: number;
export declare const AIXP_SPK_VOL_MAX: number;
export declare const AIXP_SPK_VOL_MIN: number;

// AIX Talk Object Structure
export interface AIX_PLY {
    used: number;
    stat: number;
    maxnch: number;
    maxntr: number;
    sjd: ADXSJD;
    stm: ADXSTM;
    adxt: ADXT[]; // Array of ADXT handles (size AIXP_MAX_TR)
    sji: ADXSTM; // Typedef SJ
    sjo: ADXSTM[]; // Typedef SJ array (size AIXP_MAX_TR)
    ibuf: number[] | null; // Sint8*
    ibufbsize: number;
    ibufxsize: number;
    obuf: number[] | null; // Sint8*
    obufbsize: number;
    obufxsize: number;
    pause_flag: number;
    lpsw: number;
    lnksw: number;
    rsv: number;
    lpcnt: number;
    curph: number;
    stph: number;
    lpsp: number;
    lpep: number;
    // Conditional member for XPT_TGT_XB (DolbyDigital 5.1ch)
    spk_idx?: number[]; // Sint32[AIXP_SPK_NUM]
}
export type AIXP = AIX_PLY | null;

// Function Declarations

// Initialization and Termination
export declare function AIXP_Init(): void;
export declare function AIXP_Finish(): void;

// AIXP Handle Creation/Destruction
export declare function AIXP_Create(maxnch: number, work: any | null, worksize: number): AIXP;
export declare function AIXP_Destroy(aixp: AIXP): void;

// Play Start Functions
export declare function AIXP_StartFname(aixp: AIXP, fname: string, atr: any | null): void;
// DolbyDigital 5.1ch specific functions (conditional)
// export declare function AIXP_StartFnameDolbyDigital(aixp: AIXP, fname: string): void;
// export declare function AIXP_SetOutVolDolbyDigital(aixp: AIXP, spkid: number, vol: number): void;
export declare function AIXP_StartAfs(aixp: AIXP, patid: number, fid: number): void;
export declare function AIXP_StartSj(aixp: AIXP, sj: ADXSTM): void; // ADXSTM is used for SJ typedef
export declare function AIXP_StartMem(aixp: AIXP, aixdat: any | null, datlen: number): void;

// Play Control Functions
export declare function AIXP_Stop(aixp: AIXP): void;
export declare function AIXP_GetStat(aixp: AIXP): number;
export declare function AIXP_GetAdxt(aixp: AIXP, trno: number): ADXT;

// Reload and Time Settings
export declare function AIXP_SetReloadTime(aixp: AIXP, time: number, nch: number, sfreq: number): void;
export declare function AIXP_GetIbufRemainTime(aixp: AIXP): number;

// Handle Server Function
export declare function AIXP_ExecHndl(aixp: AIXP): void;
export declare function AIXP_ExecServer(): void;

// Loop Count and Switch
export declare function AIXP_GetLpCnt(aixp: AIXP): number;
export declare function AIXP_SetLpSw(aixp: AIXP, sw: number): void;
export declare function AIXP_SetLnkSw(aixp: AIXP, sw: number): void;

// Phrase Number Settings
export declare function AIXP_SetStartPh(aixp: AIXP, phno: number): void;
export declare function AIXP_GetStartPho(aixp: AIXP): number;
export declare function AIXP_SetLpStartPh(aixp: AIXP, phno: number): void;
export declare function AIXP_GetLpStartPho(aixp: AIXP): number;
export declare function AIXP_SetLpEndPh(aixp: AIXP, phno: number): void;
export declare function AIXP_GetLpEndPho(aixp: AIXP): number;

// Pause Functionality
export declare function AIXP_Pause(aixp: AIXP, sw: number): void;

// Output Mono Setting
export declare function AIXP_SetOutputMono(flag: number): void;

// SFDEX specific functions (commented out as not directly translatable without context)
// export declare function ADXT_InsertHdrSfa(adxt: ADXT, nch: number, sfreq: number, nsmpl: number): void;
// export declare function ADXT_SetTimeOfst(adxt: ADXT, ofst: number): void;
// export declare function ADXT_VsyncProc(): void;
// export declare function ADXT_SetTimeMode(mode: number): void;
// export declare function ADXT_IsHeader(adr: string, siz: number, hdrsiz: { hdrsiz: number }): number;
// export declare function ADXT_IsEndcode(adr: string, siz: number, endsiz: { endsiz: number }): number;
// export declare function ADXT_InsertSilence(adxt: ADXT, nch: number, nsmpl: number): number;

// AHX Functions (These might need separate import if AHX is a separate module)
// export declare function ADXT_AttachAhx(adxt: ADXT, work: any | null, worksize: number): void;
// export declare function ADXT_DetachAhx(adxt: ADXT): void;

// ADX Manager Functions (These seem related to ADXT, possibly external)
// export declare function ADXM_SetupThrd(tprm: ADXM_TPRM): void;
// export declare function ADXM_ShutdownThrd(): void;
// etc.