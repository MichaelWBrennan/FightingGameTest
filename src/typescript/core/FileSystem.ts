
/**
 * File System Manager for SF3:3S - Converted from GD3rd.c
 */

export enum DiskType {
  NO_DISC = 'SCECdNODISC',
  DETECT = 'SCECdDETCT', 
  PS2_CD = 'SCECdPS2CD',
  PS2_CDDA = 'SCECdPS2CDDA',
  PS2_DVD = 'SCECdPS2DVD'
}

export enum DiskError {
  NO_ERROR = 'SCECdErNO',
  CUD = 'SCECdErCUD',
  IPI = 'SCECdErIPI',
  ILI = 'SCECdErILI',
  READ = 'SCECdErREAD',
  TRAY_OPEN = 'SCECdErTRMOPN'
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

export class FileSystemManager {
  private static instance: FileSystemManager;
  private diskDriveErrorType: number = 0xFFFF;
  private adxFileHandle: ADXFileHandle | null = null;
  private appFileSizes: number[] = [];
  private readonly AFS_FILE_COUNT = 1000;

  public static getInstance(): FileSystemManager {
    if (!FileSystemManager.instance) {
      FileSystemManager.instance = new FileSystemManager();
    }
    return FileSystemManager.instance;
  }

  private constructor() {
    this.initializeFileSizes();
  }

  private initializeFileSizes(): void {
    // Initialize file sizes array - in original C this was populated from AFS data
    this.appFileSizes = new Array(this.AFS_FILE_COUNT).fill(0);
  }

  /**
   * Updates disk drive error status - converted from fsUpdateDiskDriveError()
   */
  public updateDiskDriveError(): void {
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
  public openFile(request: FileRequest): boolean {
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
  private getDiskType(): DiskType {
    // In a real implementation, this would interface with the CD system
    // For TypeScript/web version, we assume PS2_DVD
    return DiskType.PS2_DVD;
  }

  private getDiskError(): DiskError {
    // Mock implementation - assume no error
    return DiskError.NO_ERROR;
  }

  private openADXFile(partition: number, fileNumber: number): ADXFileHandle | null {
    // Mock ADXF_OpenAfs implementation
    return {
      isOpen: true,
      fileNumber,
      size: this.appFileSizes[fileNumber] || 0
    };
  }

  private closeADXFile(handle: ADXFileHandle): void {
    // Mock ADXF_Close implementation
    handle.isOpen = false;
  }

  public getDiskDriveErrorType(): number {
    return this.diskDriveErrorType;
  }

  public setAppFileSize(fileNumber: number, size: number): void {
    if (fileNumber >= 0 && fileNumber < this.AFS_FILE_COUNT) {
      this.appFileSizes[fileNumber] = size;
    }
  }
}
