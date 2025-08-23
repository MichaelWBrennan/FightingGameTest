// Converted from sfiii-decomp/include/sf33rd/AcrSDK/MiddleWare/PS2/CapSndEng/eflSifRpc.h

// Assuming structs.h and types.h are handled implicitly or globally.
// import { u8, u32, s32 } from '../types'; // Adjust import path as needed

// Constants
export declare const THMONSENDBUF_MAX: number;
export declare const THMONRECVBUF_MAX: number;
export declare const COMMSENDBUF_MAX: number;
export declare const COMMRECVBUF_MAX: number;
export declare const STATSENDBUF_MAX: number;
export declare const STATRECVBUF_MAX: number;

// Structure for CSE_RPCBUFF
export interface CSE_RPCBUFF {
    CommSendBuf: Uint8Array; // u8 array
    CommRecvBuf: Uint8Array; // u8 array
    StatSendBuf: Uint8Array; // u8 array
    StatRecvBuf: Uint8Array; // u8 array
}

// External declarations for Sif client data and pointers
declare var ScdComm: any; // struct _sif_client_data
declare var ScdStat: any; // struct _sif_client_data
declare var ScdThMon: any; // struct _sif_client_data
declare var pScd: any;    // struct _sif_client_data *
declare var pSendBuf: any | null; // void *
declare var pRecvBuf: any | null; // void *
declare var SendBufSize: number; // u32
declare var RecvBufSize: number; // u32

// Global RpcBuff with alignment attribute
export declare var RpcBuff: CSE_RPCBUFF;
declare var ThMonSendBuf: Uint8Array; // u8 array, conditional on TARGET_PS2
declare var ThMonRecvBuf: Uint8Array; // u8 array, conditional on TARGET_PS2

// Function declarations
export declare function flSifRpcInit(): number; // s32
export declare function flSifRpcSend(CmdType: number, pData: any | null, DataSize: number): any | null; // u32, void*