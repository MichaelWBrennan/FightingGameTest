/**
 * File System Manager for SF3:3S - Converted from GD3rd.c
 */
export var DiskType;
(function (DiskType) {
    DiskType["NO_DISC"] = "SCECdNODISC";
    DiskType["DETECT"] = "SCECdDETCT";
    DiskType["PS2_CD"] = "SCECdPS2CD";
    DiskType["PS2_CDDA"] = "SCECdPS2CDDA";
    DiskType["PS2_DVD"] = "SCECdPS2DVD";
})(DiskType || (DiskType = {}));
export var DiskError;
(function (DiskError) {
    DiskError["NO_ERROR"] = "SCECdErNO";
    DiskError["CUD"] = "SCECdErCUD";
    DiskError["IPI"] = "SCECdErIPI";
    DiskError["ILI"] = "SCECdErILI";
    DiskError["READ"] = "SCECdErREAD";
    DiskError["TRAY_OPEN"] = "SCECdErTRMOPN";
})(DiskError || (DiskError = {}));
export class FileSystemManager {
    static getInstance() {
        if (!FileSystemManager.instance) {
            FileSystemManager.instance = new FileSystemManager();
        }
        return FileSystemManager.instance;
    }
    constructor() {
        Object.defineProperty(this, "diskDriveErrorType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0xFFFF
        });
        Object.defineProperty(this, "adxFileHandle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "appFileSizes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "AFS_FILE_COUNT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
        this.initializeFileSizes();
    }
    initializeFileSizes() {
        // Initialize file sizes array - in original C this was populated from AFS data
        this.appFileSizes = new Array(this.AFS_FILE_COUNT).fill(0);
    }
    /**
     * Updates disk drive error status - converted from fsUpdateDiskDriveError()
     */
    updateDiskDriveError() {
        let checkNext = false;
        const diskType = this.getDiskType();
        switch (diskType) {
            case DiskType.NO_DISC:
                this.diskDriveErrorType = 1;
                break;
            case DiskType.DETECT:
                this.diskDriveErrorType = 5;
                break;
            case DiskType.PS2_CD:
            case DiskType.PS2_CDDA:
            case DiskType.PS2_DVD:
                checkNext = true;
                break;
            default:
                this.diskDriveErrorType = 2;
                break;
        }
        if (!checkNext) {
            return;
        }
        const diskError = this.getDiskError();
        switch (diskError) {
            case DiskError.NO_ERROR:
                this.diskDriveErrorType = 0xFFFF;
                break;
            case DiskError.CUD:
            case DiskError.IPI:
            case DiskError.ILI:
            case DiskError.READ:
                this.diskDriveErrorType = 4;
                break;
            case DiskError.TRAY_OPEN:
                this.diskDriveErrorType = 0;
                break;
            default:
                this.diskDriveErrorType = 5;
                break;
        }
    }
    /**
     * Opens a file from AFS archive - converted from fsOpen()
     */
    openFile(request) {
        if (request.fnum >= this.AFS_FILE_COUNT) {
            return false;
        }
        if (this.appFileSizes[request.fnum] === 0) {
            return false;
        }
        if (this.adxFileHandle !== null) {
            this.closeADXFile(this.adxFileHandle);
        }
        this.adxFileHandle = this.openADXFile(0, request.fnum);
        if (this.adxFileHandle === null) {
            return false;
        }
        request.info.number = 1;
        request.info.size = this.appFileSizes[request.fnum];
        return true;
    }
    /**
     * Mock implementation of PlayStation 2 CD system calls
     */
    getDiskType() {
        // In a real implementation, this would interface with the CD system
        // For TypeScript/web version, we assume PS2_DVD
        return DiskType.PS2_DVD;
    }
    getDiskError() {
        // Mock implementation - assume no error
        return DiskError.NO_ERROR;
    }
    openADXFile(partition, fileNumber) {
        // Mock ADXF_OpenAfs implementation
        return {
            isOpen: true,
            fileNumber,
            size: this.appFileSizes[fileNumber] || 0
        };
    }
    closeADXFile(handle) {
        // Mock ADXF_Close implementation
        handle.isOpen = false;
    }
    getDiskDriveErrorType() {
        return this.diskDriveErrorType;
    }
    setAppFileSize(fileNumber, size) {
        if (fileNumber >= 0 && fileNumber < this.AFS_FILE_COUNT) {
            this.appFileSizes[fileNumber] = size;
        }
    }
}
//# sourceMappingURL=FileSystem.js.map