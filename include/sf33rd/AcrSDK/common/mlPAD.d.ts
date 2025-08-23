// Converted from sfiii-decomp/include/sf33rd/AcrSDK/common/mlPAD.h

// Assuming structs.h and types.h are handled implicitly or globally.
declare type FLPAD = any;
declare type FLPAD_CONFIG = any;
declare type PAD_STICK = any;
declare type u32 = number;
declare type s32 = number;
declare type u8 = number;

// Function declarations
export declare function flpad_ram_clear(adrs_int: u32, xx: s32): void;
export declare function flPADInitialize(): s32;
export declare function flPADWorkClear(): void;
export declare function flPADConfigSet(adrs: FLPAD_CONFIG, padnum: s32): void;
export declare function flPADGetALL(): void;
export declare function flPADACRConf(): void;
export declare function padconf_setup_depth(deps: Uint8[], num: number, iodat: u32): void;
export declare function flupdate_pad_stick_dir(st: PAD_STICK): void;
export declare function flupdate_pad_button_data(pad: FLPAD, data: u32): void;
export declare function flupdate_pad_on_cnt(pad: FLPAD): void;
export declare function flPADSetRepeatSw(pad: FLPAD, IOdata: number, ctr: number, times: number): void;