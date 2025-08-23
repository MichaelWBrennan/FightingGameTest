// Converted from sfiii-decomp/include/sf33rd/AcrSDK/MiddleWare/PS2/CapSndEng/eflSpuMap.h

// Assuming structs.h and types.h are handled implicitly or globally.

// Constants
export declare const SPUBANK_MAX: number;

// Structure for PSPUMAP_PAGE
export interface PSPUMAP_PAGE {
    BankSize: number[]; // u32[SPUBANK_MAX]
}

// Structure for PSPUMAP
export interface PSPUMAP {
    Head: {
        TagStrings: string[]; // s8[8] - approximation
        Tag: number; // u64 - approximation
        NumPages: number; // u32
        ___dummy___: number; // u32
    };
    Page: PSPUMAP_PAGE[]; // PSPUMAP_PAGE[] - dynamic array
}

// Structure for CURRMAP
export interface CURRMAP {
    BankAddr: number[]; // u32[SPUBANK_MAX]
    BankSize: number[]; // u32[SPUBANK_MAX]
    EEA_Addr: number[]; // u32[2]
}

// Global variables
export declare var CurrMap: CURRMAP;
export declare var pSpuMap: PSPUMAP | null;
export declare var SpuTopAddr: number;
export declare var CurrPage: number;

// Function declarations
export declare function flSpuMapInit(pMap: PSPUMAP | null): number; // s32
export declare function flSpuMapChgPage(page: number): number; // u32
export declare function flSpuMapGetBankAddr(bank: number): number; // u32