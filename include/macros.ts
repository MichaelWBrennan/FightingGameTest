// Equivalent of assembly .macro glabel label
// .global "\label"
// .type "\label", @function
// "\label":
export declare function glabel(label: string): void;

// Equivalent of assembly .macro dlabel label
// .global "\label"
// "\label":
export declare function dlabel(label: string): void;

// Equivalent of assembly .macro jlabel label
// .global "\label"
// "\label":
export declare function jlabel(label: string): void;