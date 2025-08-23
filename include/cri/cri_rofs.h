/***********************************************************************
 *
 *  Software Library
 *  Copyright (c) 2001,2002 CRI-MW
 *
 *      Read Only File System
 *
 *  Module  : Library Header File
 *  File    : cri_rofs.h
 *  Author  : Nagayasu Takuya
 *  Modify  : Mikoshiba Kengo
 *  Date    : 2002-10-10
 *  Version : 1.320
 *  Notes   : 
 ***********************************************************************/

/*---------------------------------------------------------------------*/
#ifndef _CRI_ROFS_H_
#define _CRI_ROFS_H_

/*****************************************************************************
 *      �C���N���[�h�t�@�C��
 *****************************************************************************/

/*---------------------------------------------------------------------*/
#ifdef __cplusplus
extern "C" {
#endif /* __cplusplus */

#include <cri_xpt.h>

#ifndef CRI_XPT_H
	Please include "cri_xpt.h"		/* �\�h�� : �G���[���N�������� */
#endif

/*****************************************************************************
 *      �萔�}�N��
 *****************************************************************************/

/* ROFS Version */
#define ROFS_VERSION_STR		"1.32"		/* Version number */

/* �Z�N�^�� */
#define ROFS_SCT_LEN			(2048)

/* �t�@�C������ */
#define ROFS_ATR_DIRECTORY		(0x02)	/* �f�B���N�g�� */

/* �ő啶���� */
#define ROFS_VOLNAME_LEN		(8)		/* �{�����[�����̕����� */
#define ROFS_VOLNAME_SIZ		(ROFS_VOLNAME_LEN + 1)	/* ������T�C�Y */

#define ROFS_FNAME_LEN			(31)	/* �t�@�C�����̕����� */
#define ROFS_FNAME_SIZ			(ROFS_FNAME_LEN + 1)	/* ������T�C�Y */

#define ROFS_DIRNAME_LEN		(31)	/* �f�B���N�g�����̕����� */
#define RPFS_DIRNAME_SIZ		(ROFS_DIRNAME_LEN+1)	/* ������T�C�Y */

#define ROFS_VOLID_SIZ			(8)		/* �{�����[��ID�T�C�Y */

/* ��ƃo�b�t�@ */
#define ROFS_WKBUF_NUM			(2)
#define ROFS_WKBUF_SIZ			(ROFS_SCT_LEN * ROFS_WKBUF_NUM + 64)

/*****************************************************************************
 *      �񋓒萔
 *****************************************************************************/

/* �t�@�C���n���h����� */
typedef enum {
	ROFS_STAT_IDLE		= (0),			/* Idle status */
	ROFS_STAT_COMPLETE	= (1),			/* Tranfer complete status */
	ROFS_STAT_TRANS		= (2),			/* During transfer status */
	ROFS_STAT_ERR		= (3),			/* Error outbreak status */
	ROFS_STAT_NUM
} RofsStat;

/* �V�[�N���[�h */
typedef enum {
	ROFS_SEEK_SET		= (0),			/* Top of file */
	ROFS_SEEK_CUR		= (1),			/* Current position */
	ROFS_SEEK_END		= (2),			/* End of file */
	ROFS_SEEK_NUM
} RofsSeek;

/* �G���[�R�[�h */
typedef enum {
	ROFS_ERR_OK			= (0),			/* ����I�� */
	ROFS_ERR_NG			= (-1),			/* ���s */

	ROFS_ERR_PRM		= (-100),		/* �p�����[�^�̐ݒ�G���[ */
	ROFS_ERR_ILLHDL		= (-101),		/* �t�@�C���n���h�����s�� */
	ROFS_ERR_NOHNDL		= (-102),		/* �t�@�C���n���h���ɋ󂫂��Ȃ� */
	ROFS_ERR_VOLNAME	= (-103),		/* �s���ȃ{�����[���� */
	ROFS_ERR_REGVOLNAME	= (-104),		/* �o�^�ς݂̃{�����[���� */
	ROFS_ERR_VOLUME		= (-105),		/* �{�����[���̖����G���[ */
	ROFS_ERR_NOTDIR		= (-106),		/* �f�B���N�g���łȂ����̂��w�肵�� */
	ROFS_ERR_NOTFOUND	= (-107),		/* ���݂��Ȃ��t�@�C�� */
	ROFS_ERR_ILLDIRBUF	= (-108),		/* �s���ȃf�B���N�g�����R�[�h */
	ROFS_ERR_DIROVER	= (-109),		/* �f�B���N�g���G���g���̍ő吔���I�[�o�[���� */

	ROFS_ERR_BUSY		= (-200),		/* ���̃R�}���h�����s�� */
	ROFS_ERR_TOUT		= (-201),		/* ���������Ń^�C���A�E�g���������� */
	ROFS_ERR_PRIMITIVE	= (-202),		/* �v���~�e�B�u�֐��G���[ */
	ROFS_ERR_INIT		= (-203),		/* �������G���[ */
	ROFS_ERR_REQRD		= (-204),		/* �ǂݍ��ݗv���G���[ */
	ROFS_ERR_SEEK		= (-205),		/* �V�[�N�G���[ */
	ROFS_ERR_OPEN		= (-206),		/* �t�@�C���I�[�v���G���[ */
	ROFS_ERR_READ		= (-207),		/* �ǂݍ��݃G���[ */

	ROFS_ERR_INTERNAL	= (-1000)		/* �����G���[ */
} RofsErr;

/*****************************************************************************
 *      �����}�N��
 *****************************************************************************/
/* ���C�u������Ɨ̈�T�C�Y */
#define ROFS_GET_LIBWORK_SIZ(max_open, max_volume, max_dirent) \
	(sizeof(RofsWork)+((max_open)+1)*sizeof(RofsHandle)+\
	(ROFS_GET_DIRREC_SIZ(max_dirent)+sizeof(RofsVolume))*(max_volume)+8)

/* �f�B���N�g�����R�[�h�̈�T�C�Y */
#define ROFS_GET_DIRREC_SIZ(n_dirent) \
	(sizeof(RofsDirRec)-sizeof(RofsDirRecEnt)+(n_dirent)*sizeof(RofsDirRecEnt))

/* �f�B���N�g���̔��� */
#define ROFS_IS_ATR_DIRECTORY(finf) \
	(((finf)->fatr & ROFS_ATR_DIRECTORY)?TRUE:FALSE)

/* �|�C���^��64byte���E�ɍ��킹�� */
#define ROFS_ALIGN_64BYTE(ptr)		(((Sint32)(ptr)+63) & 0xffffffc0)

/*****************************************************************************
 *      �f�[�^�^�̒�`
 *****************************************************************************/

/* ���[�N�̈� */
typedef struct RofsStWrok		RofsWork;

/* �v���~�e�B�u�֐� */
typedef struct RofsPfsIfTbl		RofsPfsTbl;

/* �f�o�C�X�R���g���[���֐� */
typedef struct RfpfsDevIfTbl	RofsDevTbl;

/* ���C�u�����C���^�[�t�F�[�X */
typedef struct RfmaiLibIfTbl	RofsLif;

/* �f�B���N�g�����R�[�h�G���g�� */
typedef struct {
	Uint32	fsize;						/* file size lower */
	Uint32	fsize_ex;					/* file size upper */
	Sint32	fad;						/* fad */
	Uint8	fatr;						/* file attribute */
	Uint8	sid;						/* filename search id */
	Char8	fname[ROFS_FNAME_SIZ];		/* filename */
	Uint8	pad[2];						/* align padding */
} RofsDirRecEnt;	/* 48 bytes */

/* �f�B���N�g�����R�[�h */
typedef struct {
	Sint32	dir_num;					/* number of record */
	Sint32	max_ent;					/* max entry of directory record */
	Sint32	dir_fad;					/* fad of directory record */
	Char8	volname[ROFS_VOLNAME_SIZ];	/* volume name */
	Uint8	pad[3];						/* align padding */
	RofsDirRecEnt	dirrec_tbl[1];		/* record table */
} RofsDirRec;		/* 24 bytes */
typedef RofsDirRec	*RofsDirRecBuf;

/* �{�����[���Ǘ��\���� */
typedef struct {
	void	*img_hn;					/* file handle of the CVM file */
	Sint32	zisb;						/* ZONE0�C���[�W�f�[�^�J�n�ʒu(0�̏ꍇDVD-ROM���ړǂ�) */
	Sint32	ptbl_cba;					/* cba of path table */
	Sint32	ptbl_size;					/* size of path table */
	RofsDirRecBuf	curdir;				/* current directory handle */
	Sint16	req_cnt;					/* request counter */
	Char8	volname[ROFS_VOLNAME_SIZ];	/* volume name */
	Uint8	pad[1];						/* align padding */
	/* 2002-09-26 Ver.1.30 miko { : CVM�t�H�[�}�b�g�ύX */
	Uint32	flags;						/* flags */
	Uint8	vol_id[ROFS_VOLID_SIZ];		/* volume id */
	/* } */
} RofsVolume;		/* 44 bytes */

/* ROFS File Handle */
typedef struct {
	Uint32		fsize;					/* file size lower */
	Uint32		fsize_ex;				/* file size upper */
	RofsWork	*wk;					/* pointer of lib work */
	Sint32		fid;					/* file id */
	Sint32		fad;					/* fad */
	Sint32		ofs;					/* offset */
	Sint32		fsctsize;				/* sctor size of the file */
	RofsVolume	*vol;					/* image file volume */
	Sint32		rsize;					/* reading size */
	Sint32		trns_seg;				/* �]���σu���b�N�P�� */
	Sint32		trns_ofs;				/* �]���σo�C�g�P�� */
	Sint32		trns_unit;				/* �]���P��(�u���b�N) */
	Uint8		*rdadr;					/* �ǂݍ��݃A�h���X */
	Sint16		used;					/* used flag */
	Sint16		act;					/* handle act */
	Sint16		stat;					/* handle status(RofsStat) */
	Sint16		err;					/* error status */
} RofsHandle;		/* 72 bytes */
typedef RofsHandle	*Rofs;

/* ROFS Work Area */
struct RofsStWrok {
	Bool			f_init;				/* �������t���O */
	Sint32			max_open;			/* max open files */
	Sint32			max_volume;
	Sint32			max_dirent;
	Sint32			worksiz;
	Uint32			exec_server_cnt;	/* counter */
	Rofs			syshdl;				/* handle for system command */
	Rofs			hndtbl;				/* handle */
	RofsVolume		*vollist;			/* �{�����[����񃊃X�g */
	RofsVolume		*curvol;			/* �f�t�H���g�{�����[����� */
	RofsDirRecBuf	dirbuf;				/* �f�B���N�g�����R�[�h�̊J�n�ʒu */
	RofsPfsTbl		*pfs;				/* �v���~�e�B�u�֐� */
	RofsDevTbl		*dev;				/* �f�o�C�X�R���g���[���֐� */
	RofsLif			*liftbl;			/* ���C�u�����C���^�[�t�F�[�X */
	void	(*g_errcb)(void *, Char8 *, Sint32);	/* error callback */
	void			*g_errcb_1st;		/* error callback 1st arg. */
	Uint32			*sctbuf;			/* sector buffer addres */
	Uint32	sct_load_buf[ROFS_WKBUF_SIZ / 4];	/* sector buffer */
	RofsHandle		hndlist[1];			/* handle table */
}; /* 68 + 4160 + (72 * (handle num + 1)) */

/* ���C�u�������������  */
typedef struct {
	Sint32	max_open;					/* �����ɃI�[�v���ł���ő�t�@�C���� */
	Sint32	max_volume;					/* �����ɓo�^�ł���ő�{�����[���� */
	Sint32	max_dirent;					/* �f�B���N�g���Ɋi�[����ő�t�@�C���� */
	void	*rofs_work;					/* ���C�u������Ɨ̈�̐擪�A�h���X */
} RofsInitPara;

/* �t�@�C����� */
typedef struct {
	Uint32	fsize;						/* file size lower */
	Uint32	fsize_ex;					/* file size upper */
	Char8	*fname;						/* �t�@�C���� */
	Uint8	fatr;						/* �t�@�C������ */
	Uint8	pad[3];						/* align padding */
} RofsFileInf;		/* 16 bytes */

/* �{�����[����� */
typedef struct {
	Char8	*volname;					/* �{�����[���� */
	void	*fhn;						/* �{�����[���̃t�@�C���n���h�� */
} RofsVolumeInf;

/* �G���[�R�[���o�b�N�֐� */
typedef void (*RofsErrFunc)(void *obj, Char8 *msg, Sint32 errcode);

/* �v���~�e�B�u�֐��e�[�u�� */
struct RofsPfsIfTbl {
	void		(*pfs_execserver)(void);
	void		(*pfs_reserve01)(RofsErrFunc, void *);
	Sint32		(*pfs_reserve02)(Sint8 *);
	Sint32		(*pfs_reserve03)(void);
	void		*(*pfs_reserve04)(Sint8 *, void *, Sint32);
	void		(*pfs_reserve05)(void *);
	Sint32		(*pfs_seek)(void *, Sint32, RofsSeek);
	Sint32		(*pfs_tell)(void *);
	Sint32		(*pfs_reqrd)(void *, Sint32, void *);
	Sint32		(*pfs_reserve07)(void *, Sint32, void *);
	void		(*pfs_stoptr)(void *);
	Sint32		(*pfs_getstat)(void *);
	Sint32		(*pfs_getsctlen)(void *);
	void		(*pfs_reserve08)(void *, Sint32);
	Sint32		(*pfs_getnumtr)(void *);
	Sint32		(*pfs_reserve09)(Sint8 *);
	Sint32		(*pfs_reserve10)(Sint8 *);
	Sint32		(*pfs_reserve11)(void);
	Sint32		(*pfs_reserve12)(Sint8 *, void *, Sint32);
	Sint32		(*pfs_reserve13)(void *);
	Sint32		(*pfs_reserve14)(Sint8 *);
	Sint32		(*pfs_reserve15)(Sint8 *);
	Sint32		(*pfs_reserve16)(Sint8 *);
	Sint32		(*pfs_reserve17)(Sint8 *, void *);
	Sint32		(*pfs_reserve18)(void *, Sint32, Sint32, Sint32);
	Sint32		(*pfs_reserve19)(void *, Sint32, Sint32, Sint32);
	/* 2002-09-11 Ver.1.22a miko { : 64bit�Ή� */
	Sint64		(*pfs_getnumtr64)(void *);
	/* } miko */
};

/*****************************************************************************
 *      �ϐ��錾
 *****************************************************************************/

/*****************************************************************************
 *      �֐��錾
 *****************************************************************************/

/*============================================================================
 *      ���C�u�����������^�I��
 *===========================================================================*/
/* �t�@�C���V�X�e���̏�����
 * [���@��] init_para	: ���C�u�����������p�����[�^
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 
 * (a) ���C�u������Ɨ̈�� ROFS_GET_LIBWORK_SIZ�}�N�� �ŋ��߂邱�ƁB
 * (b) init_para.max_dirent �́A"."��".."�̂Q�������Z���邱�ƁB			*/
RofsErr		ROFS_Init(RofsInitPara *init_para);

/* �t�@�C���V�X�e���̏I��
 * [���@��] �Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 																*/
void		ROFS_Finish(void);

/* �v���~�e�B�u�֐��̓o�^
 * [���@��] pfs_tbl		: �v���~�e�B�u�֐��e�[�u��
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 
 * (a) �f�t�H���g�ł�CRI-MW�W���̊֐����o�^����Ă���B						*/
RofsErr		ROFS_SetPfsFuncTbl(RofsPfsTbl *pfs_tbl);

/*============================================================================
 *      �{�����[������
 *===========================================================================*/
/* �{�����[���̒ǉ�
 * [���@��] volname		: �{�����[����
 *			img_hn		: �I�[�v���ς݃{�����[���̃n���h���i�t�@�C���n���h���j
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 
 * (a) �{�����[����"ROFS"�̓��C�u�����\��Ȃ̂Ŏg�p�s�B					*/
RofsErr		ROFS_AddVolume(Char8 *volname, void *img_hn);

/* �{�����[���̍폜
 * [���@��] volname		: �{�����[����
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 																*/
RofsErr		ROFS_DelVolume(Char8 *volname);

/* �f�t�H���g�{�����[���̐ݒ�
 * [���@��] volname		: �{�����[����
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 																*/
RofsErr		ROFS_SetDefVolume(Char8 *volname);

/* �f�t�H���g�{�����[���̎擾
 * [���@��] �Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �{�����[����
 * [���@�l] 																*/
Char8		*ROFS_GetDefVolume(void);

/* �{�����[���n���h���̐؂�ւ�
 * [���@��] volname		: �{�����[����
 *			img_hn		: �I�[�v���ς݃{�����[���̃n���h���i�t�@�C���n���h���j
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 																*/
RofsErr		ROFS_SwitchImgHn(Char8 *volname, void *img_hn);

/*============================================================================
 *      �t�@�C������
 *===========================================================================*/
/* �t�@�C���̃I�[�v��
 * [���@��] fname		: �t�@�C����
 *			dir_buf		: �f�B���N�g�����R�[�h
 * [�o�@��] �Ȃ�
 * [�֐��l] ROFS�n���h��
 * [���@�l] 
 * (a) dir_buf �� NULL �̏ꍇ�́A�J�����g�f�B���N�g�����R�[�h���Q�Ƃ���B	*/
Rofs		ROFS_Open(Char8 *fname, void *dir_buf);

/* �Z�N�^�w��ɂ��t�@�C���̃I�[�v��
 * [���@��] volname		: �{�����[����
 *			stsct		: �擪�Z�N�^�ԍ�
 *			nsct		: �Z�N�^��
 * [�o�@��] �Ȃ�
 * [�֐��l] ROFS�n���h��
 * [���@�l] 																*/
Rofs		ROFS_OpenRange(Char8 *volname, Sint32 stsct, Sint32 nsct);

/* �t�@�C���̃N���[�Y
 * [���@��] rofs		: ROFS�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [���@�l] 																*/
void		ROFS_Close(Rofs rofs);

/* �t�@�C�����݈ʒu�̈ړ�
 * [���@��] rofs		: ROFS�n���h��
 *			nsct		: �V�[�N�J�n�ʒu����̈ړ��Z�N�^��
 *			sk_mode		: �V�[�N���[�h
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [���@�l] 																*/
Sint32		ROFS_Seek(Rofs rofs, Sint32 nsct, RofsSeek sk_mode);

/* �t�@�C�����݈ʒu�̎擾
 * [���@��] rofs		: ROFS�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �t�@�C���擪����̃Z�N�^��
 * [���@�l] 																*/
Sint32		ROFS_Tell(Rofs rofs);

/* �ǂݍ��݂̗v��
 * [���@��] rofs		: ROFS�n���h��
 *			nsct		: �Z�N�^��
 * [�o�@��] buf			: �ǂݍ��ݐ�o�b�t�@
 * [�֐��l] �v�����󂯕t�����Z�N�^��
 * [���@�l] 
 * (a) buf �̐擪��64byte���E�ɑ����Ă������ƁB								*/
Sint32		ROFS_ReqRd(Rofs rofs, Sint32 nsct, void *buf);

/* �]���̒�~
 * [���@��] rofs		: ROFS�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [���@�l] 																*/
void		ROFS_StopTr(Rofs rofs);

/* �T�[�o�����̎��s
 * [���@��] �Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [���@�l] 
 * (a) ADX��ADXF_SetupRofs�֐����g���Ă���ꍇ�́A�{�֐����g��Ȃ����ƁB
 *	   �����݂�ADX�Ƃ̕��p�K�{�B�P�̂ł͓��삵�Ȃ��̂ŁA�{�֐��͎g��Ȃ��B	*/
void		ROFS_ExecServer(void);

/*============================================================================
 *      ���̎擾
 *===========================================================================*/
/* �t�@�C���n���h����Ԃ̎擾
 * [���@��] rofs		: ROFS�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �X�e�[�^�X
 * [���@�l] 																*/
RofsStat	ROFS_GetStat(Rofs rofs);

/* �t�@�C���T�C�Y�̎擾
 * [���@��] fname		: �t�@�C����
 * [�o�@��] �Ȃ�
 * [�֐��l] �t�@�C���T�C�Y�i�o�C�g���j
 * [���@�l] 
 * (a) ���l�̏ꍇ�̓T�C�Y�ł͖����A�G���[�������B
 * (b) �t�@�C���T�C�Y��2GB�ȏ�̏ꍇ 0x7fffffff ��Ԃ��B					*/
Sint32		ROFS_GetFileSiz(Char8 *fname);

/* �Z�N�^���̎擾
 * [���@��] �Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Z�N�^���i�o�C�g���j
 * [���@�l] 																*/
Sint32		ROFS_GetSctLen(void);

/* �]���ς݃T�C�Y�̎擾
 * [���@��] rofs		: ROFS�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �]���ς݃f�[�^�T�C�Y�i�o�C�g���j
 * [���@�l] 																*/
Sint32		ROFS_GetNumTr(Rofs rofs);

/* �{�����[�����̎擾
 * [���@��] volname		: �{�����[����
 * [�o�@��] volinf		: �{�����[�����
 * [�֐��l] �G���[
 * [���@�l] 																*/
RofsErr		ROFS_GetVolumeInf(Char8 *volname, RofsVolumeInf *volinf);

/*============================================================================
 *      �f�B���N�g������
 *===========================================================================*/
/* �f�B���N�g�����R�[�h�̓ǂݍ���
 * [���@��] dirname		: �f�B���N�g����
 *			n_dirent	: ���R�[�h���̏��
 * [�o�@��] dir_buf		: �f�B���N�g�����R�[�h
 * [�֐��l] �G���[
 * [���@�l] 
 * (a) �������A�B
 * (b) n_dirent �����ۂ̃��R�[�h�������̏ꍇ�́AROFS_ERR_DIROVER ���Ԃ�B	*/
RofsErr		ROFS_LoadDir(Char8 *dirname, void *dir_buf, Sint32 n_dirent);

/* �J�����g�f�B���N�g���̐ݒ�
 * [���@��] volname		: �{�����[����
 *			dir_buf		: �f�B���N�g�����R�[�h
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 																*/
RofsErr		ROFS_SetDir(Char8 *volname, void *dir_buf);

/* �J�����g�f�B���N�g���̐ݒ�(ISO9660�f�B���N�g�����R�[�h) 
 * [���@��] volname		: �{�����[����
 *			dir_buf		: �f�B���N�g�����R�[�h
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 
 * (a) �T���v���v���O�����Q��												*/
RofsErr		ROFS_SetIsoDir(Char8 *volname, void *dir_buf);

/* �J�����g�f�B���N�g���̕ύX
 * [���@��] dirname		: �f�B���N�g����
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 
 * (a) �������A�B
 * (b) n_dirent �����ۂ̃��R�[�h�������̏ꍇ�́AROFS_ERR_DIROVER ���Ԃ�B	*/
RofsErr		ROFS_ChangeDir(Char8 *dirname);

/* �t�@�C���̑��ݔ���
 * [���@��] fname		: �t�@�C����
 * [�o�@��] �Ȃ�
 * [�֐��l] �L���iTRUE = �L , FALSE = ���j
 * [���@�l] 																*/
Bool		ROFS_IsExistFile(Char8 *fname);

/* �t�@�C�����̎擾
 * [���@��] volname		: �{�����[����
 * [�o�@��] �Ȃ�
 * [�֐��l] �t�@�C�����i"."��".."�������f�B���N�g���̐����܂ށj
 * [���@�l] 																*/
Sint32		ROFS_GetNumFiles(Char8 *volname);

/* �f�B���N�g�����̎擾
 * [���@��] volname		: �{�����[����
 *			num			: ���R�[�h���̏��
 * [�o�@��] flist		: �t�@�C�����i���R�[�h�����̔z��j
 * [�֐��l] ���R�[�h��
 * [���@�l] 																*/
Sint32		ROFS_GetDirInf(Char8 *volname, RofsFileInf *flist, Sint32 num);

/*============================================================================
 *      �G���[����
 *===========================================================================*/
/* �G���[�R�[���o�b�N�֐��̓o�^
 * [���@��] errfunc		: �G���[�R�[���o�b�N�֐�
 *			obj			: �G���[�I�u�W�F�N�g
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [���@�l] 																*/
void		ROFS_EntryErrFunc(RofsErrFunc errfunc, void *obj);

/* �Ō�ɔ��������G���[���擾����
 * [���@��] �Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �G���[
 * [���@�l] 																*/
RofsErr		ROFS_GetLastError(void);

/*============================================================================
 *      64bit�Ή�
 *===========================================================================*/
/* �]���ς݃T�C�Y�̎擾 / 64bit��
 * [���@��] rofs		: ROFS�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �]���ς݃f�[�^�T�C�Y�i�o�C�g���j
 * [���@�l] 																*/
Sint64		ROFS_GetNumTr64(Rofs rofs);

/* �t�@�C���T�C�Y�̎擾 / 64bit�� / PS2�ł̂�
 * [���@��] fname		: �t�@�C����
 * [�o�@��] �Ȃ�
 * [�֐��l] �t�@�C���T�C�Y�i�o�C�g���j
 * (a) ���l�̏ꍇ�̓T�C�Y�ł͖����A�G���[�������B
 * (c) PS2�ȊO�̋@��ł�0x7fffffff���傫�ȃT�C�Y�͕Ԃ��Ȃ��B
 * (b) �t�@�C���T�C�Y��2GB�ȏ�̏ꍇ 0x7fffffffffffffff ��Ԃ��B			*/
Sint64		ROFS_GetFileSiz64(Char8 *fname);

/*============================================================================
 *      ���̑�
 *===========================================================================*/
/* �o�[�W����������̎擾 */
const Char8	*ROFS_GetVersionStr(void);

/*****************************************************************************
 *      �ϐ���`
 *****************************************************************************/

/*****************************************************************************
 *      �֐���`
 *****************************************************************************/

#ifdef __cplusplus
}
#endif /* __cplusplus */

#endif /* _CRI_ROFS_H_ */

/* end of file */
