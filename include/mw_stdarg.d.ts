// Converted from sfiii-decomp/include/mw_stdarg.h

// For compatibility with GCC's implementation of variable argument lists.
// Reroutes macros to Metrowerks compiler interpretation.

// Basic type for va_list
export type va_list = any | null; // char*

// Type class enumeration (approximation)
export declare const enum TypeClass {
  __no_type_class = -1,
  __void_type_class,
  __integer_type_class,
  __char_type_class,
  __enumeral_type_class,
  __boolean_type_class,
  __pointer_type_class,
  __reference_type_class,
  __offset_type_class,
  __real_type_class,
  __complex_type_class,
  __function_type_class,
  __method_type_class,
  __record_type_class,
  __union_type_class,
  __array_type_class,
  __string_type_class,
  __set_type_class,
  __file_type_class,
  __lang_type_class
}

// Macro definitions for va_list manipulation.
// These are approximations as direct macro translation is complex.

export declare function __va_rounded_size(__TYPE: any): number;
export declare const __va_reg_size: number;

export declare function va_start(ap: va_list, __LASTARG: any): void;
export declare function va_end(ap: va_list): void;
export declare function __va_next_addr(ap: va_list, __type: any): void;
export declare function va_arg(ap: va_list, __type: any): any;
export declare function __va_copy(dest: va_list, src: va_list): void;

// Note: The __builtin_next_arg and __builtin_args_info functions are compiler intrinsics
// and cannot be directly represented in TypeScript declarations. Their behavior
// is assumed to be handled by the runtime environment when these declarations are used.
// Also, __builtin_classify_type is similarly treated.