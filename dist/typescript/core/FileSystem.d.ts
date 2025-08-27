/**
 * File System Manager for SF3:3S - Converted from GD3rd.c
 */
export declare enum DiskType {
    NO_DISC = "SCECdNODISC",
    DETECT = "SCECdDETCT",
    PS2_CD = "SCECdPS2CD",
    PS2_CDDA = "SCECdPS2CDDA",
    PS2_DVD = "SCECdPS2DVD"
}
export declare enum DiskError {
    NO_ERROR = "SCECdErNO",
    CUD = "SCECdErCUD",
    IPI = "SCECdErIPI",
    ILI = "SCECdErILI",
    READ = "SCECdErREAD",
    TRAY_OPEN = "SCECdErTRMOPN"
}
export interface FileRequest {
    fnum: number;
    info: {
        number: number;
        size: number;
    };
}
export interface ADXFileHandle {
    isOpen: boolean;
    fileNumber: number;
    size: number;
}
export declare class FileSystemManager {
    private static instance;
    private diskDriveErrorType;
    private adxFileHandle;
    private appFileSizes;
    private readonly AFS_FILE_COUNT;
    static getInstance(): FileSystemManager;
    private constructor();
    private initializeFileSizes;
    /**
     * Updates disk drive error status - converted from fsUpdateDiskDriveError()
     */
    updateDiskDriveError(): void;
    /**
     * Opens a file from AFS archive - converted from fsOpen()
     */
    openFile(request: FileRequest): boolean;
    /**
     * Mock implementation of PlayStation 2 CD system calls
     */
    private getDiskType;
    private getDiskError;
    private openADXFile;
    private closeADXFile;
    getDiskDriveErrorType(): number;
    setAppFileSize(fileNumber: number, size: number): void;
}
