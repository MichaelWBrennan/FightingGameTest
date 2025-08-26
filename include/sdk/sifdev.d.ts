// TypeScript definitions converted from ./include/sdk/sifdev.h
#ifndef _SIFDEV_H_DEFS
#define _SIFDEV_H_DEFS

#if defined(_LANGUAGE_C_PLUS_PLUS) || defined(__cplusplus) || defined(c_plusplus)
extern "C" {
#endif

/* Flag for sceOpen() */
export const SCE_RDONLY = 0x0001;
export const SCE_WRONLY = 0x0002;
export const SCE_RDWR = 0x0003;
export const SCE_NBLOCK = 0x0010 /* Non-Blocking I/O */;
export const SCE_APPEND = 0x0100 /* append (writes guaranteed at the end) */;
export const SCE_CREAT = 0x0200  /* open with file create */;
export const SCE_TRUNC = 0x0400  /* open with truncation */;
export const SCE_EXCL = 0x0800   /* exclusive create */;
export const SCE_NOBUF = 0x4000  /* no device buffer and console interrupt */;
export const SCE_NOWAIT = 0x8000 /* asyncronous i/o */;

/* SCE local usage */
export const SCE_NOWBDC = 0x20000000 /* not write back d cashe */;

/* Seek Code */
#ifndef SCE_SEEK_SET
export const SCE_SEEK_SET = (0);
#endif
#ifndef SCE_SEEK_CUR
export const SCE_SEEK_CUR = (1);
#endif
#ifndef SCE_SEEK_END
export const SCE_SEEK_END = (2);
#endif

/* Ioctl Code */
export const SCE_FS_EXECUTING = 0x1;

/* devctl Code  system use */
export const FDIOC_BLKIO = (('F' << 8) | 1);

/* dev9 */
export const DDIOC_MODEL = (('D' << 8) | 1);
export const DDIOC_OFF = (('D' << 8) | 2);

/* hdd		*/
export const HIOCADDSUB = (('h' << 8) | 1);
export const HIOCDELSUB = (('h' << 8) | 2);
export const HIOCNSUB = (('h' << 8) | 3);
export const HIOCFLUSH = (('h' << 8) | 4);

export const HDIOC_MAXSECTOR = (('H' << 8) | 1);
export const HDIOC_TOTALSECTOR = (('H' << 8) | 2);
export const HDIOC_IDLE = (('H' << 8) | 3);
export const HDIOC_FLUSH = (('H' << 8) | 4);
export const HDIOC_SWAPTMP = (('H' << 8) | 5);
#define HDIOC_DEV9OFF (('H' << 8) | 6)
export const HDIOC_STATUS = (('H' << 8) | 7);
export const HDIOC_FORMATVER = (('H' << 8) | 8);
export const HDIOC_SMARTSTAT = (('H' << 8) | 9);
export const HDIOC_FREESECTOR = (('H' << 8) | 10);
export const HDIOC_IDLEIMM = (('H' << 8) | 11);

/* mount() flag 	*/
export const SCE_MT_RDWR = 0x00;
export const SCE_MT_RDONLY = 0x01;
export const SCE_MT_ROBUST = 0x02;
export const SCE_MT_ERRCHECK = 0x04;

/* pfs			 */
export const PIOCALLOC = (('p' << 8) | 1);
export const PIOCFREE = (('p' << 8) | 2);
export const PIOCATTRADD = (('p' << 8) | 3);
export const PIOCATTRDEL = (('p' << 8) | 4);
export const PIOCATTRLOOKUP = (('p' << 8) | 5);
export const PIOCATTRREAD = (('p' << 8) | 6);

export const PDIOC_ZONESZ = (('P' << 8) | 1);
export const PDIOC_ZONEFREE = (('P' << 8) | 2);
export const PDIOC_CLOSEALL = (('P' << 8) | 3);
export const PDIOC_GETFSCKSTAT = (('P' << 8) | 4);
export const PDIOC_CLRFSCKSTAT = (('P' << 8) | 5);

/* CD/DVD Ioctl           */
export const CIOCSTREAMPAUSE = (('c' << 8) | 13);
export const CIOCSTREAMRESUME = (('c' << 8) | 14);
export const CIOCSTREAMSTAT = (('c' << 8) | 15);

/* CD/DVD Devctl          */
export const CDIOC_READCLOCK = (('C' << 8) | 12);
export const CDIOC_GETDISKTYP = (('C' << 8) | 31);
export const CDIOC_GETERROR = (('C' << 8) | 32);
export const CDIOC_TRAYREQ = (('C' << 8) | 33);
export const CDIOC_STATUS = (('C' << 8) | 34);
export const CDIOC_POWEROFF = (('C' << 8) | 35);
export const CDIOC_MMODE = (('C' << 8) | 36);
export const CDIOC_DISKRDY = (('C' << 8) | 37);
export const CDIOC_STREAMINIT = (('C' << 8) | 39);
export const CDIOC_BREAK = (('C' << 8) | 40);

export const CDIOC_SPINNOM = (('C' << 8) | 128);
export const CDIOC_SPINSTM = (('C' << 8) | 129);
export const CDIOC_TRYCNT = (('C' << 8) | 130);
export const CDIOC_STANDBY = (('C' << 8) | 132);
export const CDIOC_STOP = (('C' << 8) | 133);
export const CDIOC_PAUSE = (('C' << 8) | 134);
export const CDIOC_GETTOC = (('C' << 8) | 135);
export const CDIOC_READDVDDUALINFO = (('C' << 8) | 137);
export const CDIOC_INIT = (('C' << 8) | 138);
export const CDIOC_FSCACHEINIT = (('C' << 8) | 149);
export const CDIOC_FSCACHEDELETE = (('C' << 8) | 151);
export const CDIOC_SEARCHFILE = (('C' << 8) | 153);

export const SCE_PAD_ADDRESS = 0x1;

/* Error codes */
#ifndef SCE_ENXIO
export const SCE_ENXIO = 6 /* No such device or address */;
#endif

#ifndef SCE_EBADF
export const SCE_EBADF = 9 /* Bad file number */;
#endif

#ifndef SCE_ENODEV
export const SCE_ENODEV = 19 /* No such device */;
#endif

#ifndef SCE_EINVAL
export const SCE_EINVAL = 22 /* Invalid argument */;
#endif

#ifndef SCE_EMFILE
export const SCE_EMFILE = 24 /* Too many open files */;
#endif

export const SCE_EBINDMISS = 0x10000;
export const SCE_ECALLMISS = 0x10001;
export const SCE_ETYPEMISS = 0x10002;
export const SCE_ELOADMISS = 0x10003;
export const SCE_EVERSIONMISS = 0x10004;

struct sce_stat {
    unsigned int st_mode;       /* �ե�����μ���(file/dir) */
                                /* �ȥ⡼��(R/W/X) */
    unsigned int st_attr;       /* �ǥХ�����¸��°�� */
    unsigned int st_size;       /* �ե����륵���� ���� 32 bit */
    unsigned char st_ctime[8];  /* �������� */
    unsigned char st_atime[8];  /* �ǽ����Ȼ��� */
    unsigned char st_mtime[8];  /* �ǽ��ѹ����� */
    unsigned int st_hisize;     /* �ե����륵���� ��� 32bit */
    unsigned int st_private[6]; /* ����¾ */
};

struct sce_dirent {
    struct sce_stat d_stat; /* �ե�����Υ��ơ����� */
    char d_name[256];       /* �ե�����̾(�ե�ѥ��ǤϤʤ�) */
    void *d_private;        /* ����¾ */
};

export const SCE_CST_MODE = 0x0001;
export const SCE_CST_ATTR = 0x0002;
export const SCE_CST_SIZE = 0x0004;
export const SCE_CST_CT = 0x0008;
export const SCE_CST_AT = 0x0010;
export const SCE_CST_MT = 0x0020;
export const SCE_CST_PRVT = 0x0040;

typedef enum { sceFsREADING, sceFsWRITING } sceFsRWTYPE; /* system use */

typedef struct {
    unsigned int lbn;
    unsigned int nblk;
    void *addr;
    unsigned int blksiz;
    sceFsRWTYPE type;
    unsigned int mode;
} sceFsDevctlBlkIO; /* system use */

extern int sceOpen(const char *filename, int flag, ...);
extern int sceClose(int fd);
extern int sceRead(int fd, void *buf, int nbyte);
extern int sceWrite(int fd, const void *buf, int nbyte);
extern int sceLseek(int fd, int offset, int where);
extern int sceIoctl(int fd, int req, void *);
extern int sceFsReset(void);

extern int sceDopen(const char *dirname);
extern int sceDclose(int fd);
extern int sceDread(int fd, struct sce_dirent *buf);
extern int sceRemove(const char *filename);
extern int sceMkdir(const char *dirname, int flag);
extern int sceRmdir(const char *dirname);
extern int sceGetstat(const char *name, struct sce_stat *buf);
extern int sceChstat(const char *name, struct sce_stat *buf, unsigned int cbit);
extern int sceFormat(const char *path, const char *blkdevname, void *arg, int arglen);
extern int sceChdir(const char *name);
extern int sceSync(const char *path, int flag);
extern int sceMount(const char *fsdevname, const char *blkdevname, int flag, void *arg, int arglen);
extern int sceUmount(const char *name);
extern long sceLseek64(int fd, long offset, int whence);
extern int sceDevctl(const char *devname, int cmd, const void *arg, unsigned int arglen, void *bufp,
                     unsigned int buflen);
extern int sceSymlink(const char *existing, const char *newname);
extern int sceReadlink(const char *path, char *buf, unsigned int bufsize);
extern int sceRename(const char *oldname, const char *newname);
extern int sceIoctl2(int fd, int request, const void *argp, unsigned int arglen, void *bufp, unsigned int buflen);
extern int sceFsInit(void);
extern int *scePowerOffHandler(void (*func)(void *), void *addr);

extern int sceFsSetIopBuf(unsigned int buffsize, unsigned int buffcnt);
extern int sceFsSetIopPrio(int wkthprio);

/* ------------------------------------------------------------------------- */
/*
    sceStdioConvertError
        convert to sceerrno from sce*** (sceOpen, sceWrite, sceRead ...) error.
*/

typedef enum SceStdioFunc { SCE_STDIO_FUNC_ANYTHING = 0 } SceStdioFunc;

#define SCE_STDIO_ERROR_ENCODE(err) SCE_ERROR_ENCODE(SCE_ERROR_PREFIX_STDIO, (err) & 0xffff)

export const SCE_STDIO_EBADF = SCE_STDIO_ERROR_ENCODE(SCE_EBADF);
export const SCE_STDIO_ENODEV = SCE_STDIO_ERROR_ENCODE(SCE_ENODEV);
export const SCE_STDIO_EINVAL = SCE_STDIO_ERROR_ENCODE(SCE_EINVAL);
export const SCE_STDIO_EMFILE = SCE_STDIO_ERROR_ENCODE(SCE_EMFILE);
export const SCE_STDIO_EIO = SCE_STDIO_ERROR_ENCODE(SCE_EIO);
export const SCE_STDIO_ENOMEM = SCE_STDIO_ERROR_ENCODE(SCE_ENOMEM);
export const SCE_STDIO_ENOTDIR = SCE_STDIO_ERROR_ENCODE(SCE_ENOTDIR);
export const SCE_STDIO_ENXIO = SCE_STDIO_ERROR_ENCODE(SCE_ENXIO);
export const SCE_STDIO_EACCES = SCE_STDIO_ERROR_ENCODE(SCE_EACCES);
export const SCE_STDIO_EINVAL = SCE_STDIO_ERROR_ENCODE(SCE_EINVAL);
export const SCE_STDIO_ENOENT = SCE_STDIO_ERROR_ENCODE(SCE_ENOENT);
export const SCE_STDIO_EBUSY = SCE_STDIO_ERROR_ENCODE(SCE_EBUSY);
export const SCE_STDIO_ENOSPC = SCE_STDIO_ERROR_ENCODE(SCE_ENOSPC);
export const SCE_STDIO_EFBIG = SCE_STDIO_ERROR_ENCODE(SCE_EFBIG);
export const SCE_STDIO_ENAMETOOLONG = SCE_STDIO_ERROR_ENCODE(SCE_ENAMETOOLONG);
export const SCE_STDIO_ELOOP = SCE_STDIO_ERROR_ENCODE(SCE_ELOOP);
export const SCE_STDIO_EROFS = SCE_STDIO_ERROR_ENCODE(SCE_EROFS);
export const SCE_STDIO_EISDIR = SCE_STDIO_ERROR_ENCODE(SCE_EISDIR);
export const SCE_STDIO_EEXIST = SCE_STDIO_ERROR_ENCODE(SCE_EEXIST);
export const SCE_STDIO_ENOTEMPTY = SCE_STDIO_ERROR_ENCODE(SCE_ENOTEMPTY);
export const SCE_STDIO_EVERSION = SCE_STDIO_ERROR_ENCODE(SCE_EVERSION);
export const SCE_STDIO_EDEVICE_BROKEN = SCE_STDIO_ERROR_ENCODE(SCE_EDEVICE_BROKEN);

int sceStdioConvertError(SceStdioFunc func, int ioerror);

/* ------------------------------------------------------------------------- */

/*
    Memory Card status
*/
export const SCE_STM_R = 0x0001;
export const SCE_STM_W = 0x0002;
export const SCE_STM_X = 0x0004;
export const SCE_STM_C = 0x0008;
export const SCE_STM_F = 0x0010;
export const SCE_STM_D = 0x0020;

/*
    HDD Pfs status macro
*/
/* Filetypes and Protection bits for pfs */
export const SCE_STM_FMT = (0xf << 12);
export const SCE_STM_FLNK = (0x4 << 12) /* symbolic link */;
export const SCE_STM_FREG = (0x2 << 12) /* regular file  */;
export const SCE_STM_FDIR = (0x1 << 12) /* directory 	 */;
#define SCE_STM_ISLNK(m) (((m) & SCE_STM_FMT) == SCE_STM_FLNK)
#define SCE_STM_ISREG(m) (((m) & SCE_STM_FMT) == SCE_STM_FREG)
#define SCE_STM_ISDIR(m) (((m) & SCE_STM_FMT) == SCE_STM_FDIR)

export const SCE_STM_SUID = 04000 /* set uid bit   */;
export const SCE_STM_SGID = 02000 /* set gid bit   */;
export const SCE_STM_SVTX = 01000 /* sticky bit    */;

export const SCE_STM_RWXU = 00700;
export const SCE_STM_RUSR = 00400;
export const SCE_STM_WUSR = 00200;
export const SCE_STM_XUSR = 00100;

export const SCE_STM_RWXG = 00070;
export const SCE_STM_RGRP = 00040;
export const SCE_STM_WGRP = 00020;
export const SCE_STM_XGRP = 00010;

export const SCE_STM_RWXO = 00007;
export const SCE_STM_ROTH = 00004;
export const SCE_STM_WOTH = 00002;
export const SCE_STM_XOTH = 00001;

export const SCE_STM_ALLUGO = (SCE_STM_SUID | SCE_STM_SGID | SCE_STM_SVTX | SCE_STM_RWXUGO);
export const SCE_STM_RWXUGO = (SCE_STM_RWXU | SCE_STM_RWXG | SCE_STM_RWXO);
export const SCE_STM_RUGO = (SCE_STM_RUSR | SCE_STM_RGRP | SCE_STM_ROTH);
export const SCE_STM_WUGO = (SCE_STM_WUSR | SCE_STM_WGRP | SCE_STM_WOTH);
export const SCE_STM_XUGO = (SCE_STM_XUSR | SCE_STM_XGRP | SCE_STM_XOTH);

export const SCE_FSTYPE_EMPTY = 0x0000;
export const SCE_FSTYPE_PFS = 0x0100;

extern int sceSifInitIopHeap(void);
extern void *sceSifAllocIopHeap(unsigned int);
extern int sceSifFreeIopHeap(void *);
extern int sceSifLoadIopHeap(const char *, void *);
extern void *sceSifAllocSysMemory(int, unsigned int, void *);
extern int sceSifFreeSysMemory(void *);

extern unsigned int sceSifQueryMemSize(void);
extern unsigned int sceSifQueryMaxFreeMemSize(void);
extern unsigned int sceSifQueryTotalFreeMemSize(void);
extern void *sceSifQueryBlockTopAddress(void *);
extern unsigned int sceSifQueryBlockSize(void *);

/* ee load file routine */
typedef struct {
    unsigned int epc;
    unsigned int gp;
    unsigned int sp;
    unsigned int dummy;
} sceExecData;

export const SCE_SIF_TYPECHAR = 0;
export const SCE_SIF_TYPESHORT = 1;
export const SCE_SIF_TYPEINT = 2;

export const RESIDENT_END = (0);
export const REMOVABLE_RESIDENT_END = (2);
export const NO_RESIDENT_END = (1);
export const FAREWELL_END = (1);

extern int sceSifLoadModule(const char *filename, int args, const char *argp);
extern int sceSifLoadModuleBuffer(const void *addr, int args, const char *argp);
extern int sceSifLoadStartModule(const char *filename, int args, const char *argp, int *result);
extern int sceSifLoadStartModuleBuffer(const void *addr, int args, const char *argp, int *result);
extern int sceSifLoadElf(const char *name, sceExecData *data);
extern int sceSifLoadElfPart(const char *name, const char *secname, sceExecData *data);
extern int sceSifStopModule(int modid, int args, const char *argp, int *result);
extern int sceSifUnloadModule(int modid);
extern int sceSifSearchModuleByName(const char *modulename);
extern int sceSifSearchModuleByAddress(const void *addr);

extern int sceSifLoadFileReset(void);

/* reboot notify handler */
typedef void (*sceSifRebootNotifyHandler)(int mode, void *data);

/* structure of reboot notify handler & data */
typedef struct {
    sceSifRebootNotifyHandler func;
    void *data;
    void *gp;      /* system use */
    void *reserve; /* system use */
} sceSifRebootNotifyData;

extern int sceSifRebootIop(const char *img);
extern int sceSifSyncIop(void);

/* setup IOP reboot notify handler & data buffer */
extern sceSifRebootNotifyData *sceSifSetRebootNotifyBuffer(sceSifRebootNotifyData *p, int size);

/* register IOP reboot notify handler */
extern int sceSifAddRebootNotifyHandler(unsigned int pos, sceSifRebootNotifyHandler pFunc, void *data);

/* un-register IOP reboot notify handler */
extern int sceSifRemoveRebootNotifyHandler(unsigned int pos);

export const IOP_IMAGE_FILE = "IOPRP300.IMG";
#define IOP_IMAGE_file "ioprp300.img"

/* extern int errno; */

#if defined(_LANGUAGE_C_PLUS_PLUS) || defined(__cplusplus) || defined(c_plusplus)
}
#endif

#endif /* _SIFDEV_H_DEFS */
