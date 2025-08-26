// TypeScript definitions converted from ./include/cri/crimwsfd.h
/****************************************************************************
 *
 * CRI Middleware SDK
 *
 * Copyright (c) 2001,2002 CRI-MW
 *
 * Library  : MWSFD Library (CRI Sofdec)
 * Module   : Library User's Header
 * File     : crimwsfd.h
 * Date     : 2002-10-15
 * Version  : 2.31
 *
 ****************************************************************************/
#ifndef	INCLUDED_CRIMWSFD_H		/* Re-definition prevention */
#define	INCLUDED_CRIMWSFD_H

/*	Version No.	*/
#define	MWD_SFD_VER	"2.31"

/***************************************************************************
 *      Include file
 ***************************************************************************/



/***************************************************************************
 *      MACRO CONSTANT
 ***************************************************************************/
/* �����������g��  */
/* Vsync frequency */
#define MWSFD_VHZ_59_94		(59.94f)
#define MWSFD_VHZ_50_00		(50.00f)
#define MWSFD_VHZ_60_00		(60.00f)

/* �t�@�C���^�C�v		*/
/* File type			*/
#define	MWSFD_FTYPE_NON			(0)
#define	MWSFD_FTYPE_SFD			(1)
#define	MWSFD_FTYPE_MPV			(2)
#define MWSFD_FTYPE_VONLYSFD	(3)

/* �������[�h		*/
/* Composition Mode	*/
#define MWSFD_COMPO_AUTO		(0x00000000)	/* ����						*/
												/* Auto						*/
#define MWSFD_COMPO_OPAQ		(0x00000011)	/* �s����					*/
												/* opacity					*/
#define MWSFD_COMPO_ALPHFULL	(0x00000021)	/* �t��Alpha����			*/
												/* Full Alpha				*/
#define	MWSFD_COMPO_ALPHLUMI	(0x00000031)	/* ���~�i���X�L�[���� 		*/
												/* Luminance key alpha		*/
#define	MWSFD_COMPO_ALPH3		(0x00000041)	/* 3�l�A���t�@ 				*/
												/* 3-value alpha			*/
#define MWSFD_COMPO_Z			(0x00000101)	/* �y�l						*/
												/* Z value					*/

/* �������[�h	*/
/* Sync Mode	*/
#define MWSFD_SYNCMODE_NONE		(0)		/* ������		*/ /* No sync		*/
#define MWSFD_SYNCMODE_VSYNC	(1)		/* V-Sync����	*/ /* Sync Vint		*/
#define MWSFD_SYNCMODE_AUDIO	(2)		/* Audio ����	*/ /* Sync Audio	*/

/* Audio Volume MAX, MIN */
#define	MWSFD_OUTVOL_MAX		(0)		/* MAX Volume */
#define	MWSFD_OUTVOL_MIN		(-960)	/* MIN Volume */

/* Audio Channel	*/
#define MWSFD_CH_L				(0)		/* Left		*/
#define MWSFD_CH_R				(1)		/* Right	*/

/*	Panpot Value				*/
#define	MWSFD_PAN_LEFT			(-15)
#define	MWSFD_PAN_CENTER		(0)
#define	MWSFD_PAN_RIGHT			(15)
#define	MWSFD_PAN_AUTO			(-128)

/* �o�̓o�b�t�@���̃f�t�H���g�l 	*/
/* Default value of out-buffer size	*/
#define MWSFD_DFL_OUTBUFSIZE		(0)

/* �t���[���p�����[�^�̃o�b�t�@�ő吔	*/
/* Buffer max num of frame parameter	*/
#define MWSFD_FRMPRM_BUF_MAX		(4)


/* [for Compatibility] */
#define	MWD_PLY_FTYPE_NON		MWSFD_FTYPE_NON
#define	MWD_PLY_FTYPE_SFD		MWSFD_FTYPE_SFD
#define	MWD_PLY_FTYPE_MPV		MWSFD_FTYPE_MPV
#define MWD_PLY_COMPO_OPEQ		MWSFD_COMPO_OPAQ
#define MWD_PLY_SYNC_NONE		MWSFD_SYNCMODE_NONE
#define MWD_PLY_SYNC_VSYNC		MWSFD_SYNCMODE_VSYNC
#define MWD_PLY_SYNC_AUDIO		MWSFD_SYNCMODE_AUDIO
#define MWD_CH_L				MWSFD_CH_L
#define MWD_CH_R				MWSFD_CH_R
#define	MWD_PAN_LEFT			MWSFD_PAN_LEFT
#define	MWD_PAN_CENTER			MWSFD_PAN_CENTER
#define	MWD_PAN_RIGHT			MWSFD_PAN_RIGHT
#define	MWD_PAN_AUTO			MWSFD_PAN_AUTO

/***************************************************************************
 *      Process MACRO
 ***************************************************************************/
/* Convert mwGetTime()'s return-value to second	*/
#define	MWSFD_TIME2SEC(ncount, tscale)		((ncount) / (tscale))

/* Convert mwGetTime()'s return-value to milli-second	*/
#define	MWSFD_TIME2MSEC(ncount, tscale)	((1000 * (ncount)) / (tscale))

/* [for Compatibility] */
#define	MWD_PLY_TIME2SEC(ncount, tscale)	MWSFD_TIME2SEC((ncount), (tscale))
#define	MWD_PLY_TIME2MSEC(ncount, tscale)	MWSFD_TIME2MSEC((ncount), (tscale))

/***************************************************************************
 *      Enum declaration
 ***************************************************************************/
/*	Status of MWPLY handles		*/
typedef	enum {
	MWSFD_STAT_STOP			= 0,		/*	stoped						*/
	MWSFD_STAT_PREP			= 1,		/*	preparing					*/
	MWSFD_STAT_PLAYING		= 2,		/*	playing						*/
	MWSFD_STAT_PLAYEND		= 3,		/*	end of playing				*/
	MWSFD_STAT_ERROR		= 4,		/*	error was occured			*/

	/* [for Compatibility] */
	MWE_PLY_STAT_STOP		= 0,		/*	stoped						*/
	MWE_PLY_STAT_PREP		= 1,		/*	preparing					*/
	MWE_PLY_STAT_PLAYING	= 2,		/*	playing						*/
	MWE_PLY_STAT_PLAYEND	= 3,		/*	end of playing				*/
	MWE_PLY_STAT_ERROR		= 4,		/*	error was occured			*/

	MWSFD_STAT_END
} MwsfdStat, MWE_PLY_STAT;

/* �f�R�[�h�T�[�o */
/* Decode Server  */
typedef enum {
	MWSFD_DEC_SVR_IDLE		= 0,	/* ���C���̗]�莞�ԂŃf�R�[�h����B */
									/* Decode in idel thread            */
	MWSFD_DEC_SVR_MAIN		= 1,	/* ���C���������Ńf�R�[�h����B		*/
									/* Decode in main thread            */

	MWSFD_DEC_SVR_END
} MwsfdDecSvr;

/* �f�R�[�h���ʃo�b�t�@�f�[�^�`��	*/
/* Decoder's output buffer data format	*/
typedef enum {
    MWSFD_BUFFMT_DEFAULT		= 0,	/* Default format		*/
    MWSFD_BUFFMT_MB_YCC420		= 1,	/* YCC 4:2:0 Macroblock */
    MWSFD_BUFFMT_MB_ARGB8888	= 2,	/* RGB 32bit Macroblock */
    MWSFD_BUFFMT_PLN_YCC420		= 3,	/* YCC 4:2:0 Plane      */
	/* [for Compatibility] */
    MWE_PLY_BUFFMT_MB_YCC420    = 1,	/* YCC 4:2:0 Macroblock */
    MWE_PLY_BUFFMT_MB_ARGB8888  = 2,	/* RGB 32bit Macroblock */
    MWE_PLY_BUFFMT_PLN_YCC420   = 3,	/* YCC 4:2:0 Plane      */
    MWSFD_BUFFMT_END
} MwsfdBufFmt, MWE_PLY_BUFFMT;

/* �s�N�`���^�C�v	*/
/* Picture type		*/
typedef enum {
    MWSFD_PTYPE_I			= 1,	/* I Picture */
    MWSFD_PTYPE_P			= 2,	/* P Picture */
    MWSFD_PTYPE_B			= 3,	/* B Picture */
    MWSFD_PTYPE_D			= 4,	/* D Picture */
	/* [for Compatibility] */
    MWE_PLY_PTYPE_I			= 1,	/* I Picture */
    MWE_PLY_PTYPE_P			= 2,	/* P Picture */
    MWE_PLY_PTYPE_B			= 3,	/* B Picture */
    MWE_PLY_PTYPE_D			= 4,	/* D Picture */
    MWSFD_PTYPE_END
} MwsfdPtype, MWE_PLY_PTYPE;

/* �t���[���擾�������[�h			*/
/* Sync mode of mwPlyGetCurFrm()	*/
typedef enum {
	MWSFD_FRMSYNC_TIME		= 0,	/* Sync with time	*/
	MWSFD_FRMSYNC_NONE		= 1,	/* No sync			*/

	MWSFD_FRMSYNC_END
} MwsfdFrmSync;

/* ���~�i���X�����̓��߃L�[				*/
/* Luminance alpha's transparence key	*/
typedef enum {
	MWSFD_LUMIKEY_BLACK		= 0,	/* Black key transparence */
	MWSFD_LUMIKEY_WHITE		= 1,	/* White key transparence */

	MWSFD_LUMIKEY_END
} MwsfdLumiKey;

/* �t���[���t�H�[�}�b�g	*/
/* Frame Format			*/
typedef enum {
	MWSFD_FRMFMT_I_YCC420PLN	= 1, 	/* YCC420 Plane	*/

	MWSFD_FRMFMT_O_ARGB8888		= 101,	/* ARGB8888 	*/
	MWSFD_FRMFMT_O_YCC422		= 102,	/* YCC422 		*/
	MWSFD_FRMFMT_O_Y84C44		= 103,	/* Y8x4, C4x4	*/

    MWSFD_FRMFMT_END
} MwsfdFrmFmt;

/***************************************************************************
 *      Data type declaration
 ***************************************************************************/
/*	MWPLY handle	*/
#ifndef MWPLY_DEFINED
#define MWPLY_DEFINED

/*	Virtual function table	*/
typedef struct {
	struct MwsfdIf *vtbl;
} MW_PLY_OBJ;
typedef MW_PLY_OBJ *MWPLY;
#endif

/*	MWPLY Interface function  	*/
typedef struct MwsfdIf{
	void (*QueryInterface)();		/*	for COM compatibility	*/
	void (*AddRef)();				/*	for COM compatibility	*/
	void (*Release)();				/*	for COM compatibility	*/
	/*== Functions of MWPLY	====================================*/ 
	/*	V-sync function 										*/
	/*	This function is called by user while v-sync interrupt.	*/
	void (*VsyncHndl)(MWPLY mwply);
	/*	execute decoding one frame								*/
	/*	This function is called by user from main-loop.			*/ 
	Bool (*ExecSvrHndl)(MWPLY mwply);
	/*	destroy MWPLY handle									*/
	void (*Destroy)(MWPLY mwply);
	/*	start playback by file name 							*/
	void (*StartFname)(MWPLY mwply, Char8 *fname);
	/*	stop playback  											*/
	void (*Stop)(MWPLY mwply);
	/*	get status of MWPLY handle								*/
	MwsfdStat (*GetStat)(MWPLY mwply);
	/*	get playing time										*/
	/*	if playing movie is 30 fps, *tscale is 30 and 			*/
	/*		*ncount is total number of displayed frames			*/ 
	void (*GetTime)(MWPLY mwply, Sint32 *ncount, Sint32 *tscale);
	/*	Set pause switch.  sw=0(Continue), 1(Pause)				*/
	void (*Pause)(MWPLY mwply, Sint32 sw);
	/*	Set Output Volume (vol= 0 to -960)						*/
	void (*SetOutVol)(MWPLY mwply, Sint32 vol);
	/*	Get Output Volume (return value= 0 to -960)				*/
	Sint32 (*GetOutVol)(MWPLY mwply);
	/*	Set output panpot chno=0(Mono/Left),1(Right)			*/
	/*	pan = +15(Right),0(Center),-15(Left),-128(Auto)			*/
	void (*SetOutPan)(MWPLY mwply, Sint32 chno, Sint32 pan);
	/*	Get output panpot chno=0(Mono/Left),1(Right)			*/
	Sint32 (*GetOutPan)(MWPLY mwply, Sint32 chno);
	/*	start playing by stream joint							*/
	void (*StartSj)(MWPLY mwply, SJ sji);
	/*	start playing by memory									*/
	void (*StartMem)(MWPLY mwply, void *addr, Sint32 len);
} MwsfdIf;

/* Sofdec�̏������p�����[�^�\����							*/
/* Parameter structure of Sofdec initialization function	*/
typedef struct {
	Float32		vhz;			/* �����������g��[Hz]						*/
								/* Vsync frequency[Hz]						*/
	Sint32		disp_cycle;		/* �\���X�V����[v]				 			*/
								/* Display update cycle[v]					*/
	Sint32		disp_latency;	/* �\�����C�e���V[v]						*/
								/* Display latency[v]						*/
	MwsfdDecSvr	dec_svr;		/* �f�R�[�h�T�[�o				 			*/
								/* Decode Server							*/
	Sint32		rsv[4];			/* �\�� (�S��0��ݒ肵�ĉ�����) 			*/
								/* Reserved(Please set 0 in all of area)	*/
} MwsfdInitPrm, MWS_PLY_INIT_SFD;

/* �n���h�������p�����[�^�\����				*/
/* Parameter structure of handle creation	*/
typedef struct {
	Sint32	ftype;				/* �Đ�����X�g���[���̎�� 				*/
								/* File type								*/
	Sint32	max_bps;			/* �ő�̃r�b�g�X�g���[���ʁ@(bit/sec)		*/
								/* Maximum number of bit per second			*/
	Sint32	max_width;			/* �Đ��摜�T�C�Y�̍ő啝					*/
								/* Maximum width of video stream			*/
	Sint32	max_height;			/* �Đ��摜�T�C�Y�̍ő卂��					*/
								/* Maximum height of video stream			*/
	Sint32	nfrm_pool_wk;		/* �V�X�e���̈�̃t���[���v�[�����i�ʏ�3)	*/
								/* �t���[�����������������ꍇ�́A���̒l��	*/
								/* ���₵�Ă��������B						*/
								/* Number of frame pools in system memory.	*/
								/* Normaly this number is 3. If frame is 	*/
								/* droped,you have to increase this number.*/
	Sint32	max_stm;			/* �����ǂݍ��݃X�g���[����(ADX�܂�)		*/
								/* �l��0�̏ꍇ�̓f�t�H���g�l(1)�Ƃ݂Ȃ��B	*/
								/* The number of maximum streams playing 	*/
								/* at the same time. 						*/
								/* This number include ADXT/ADXF streams.	*/
								/* If the value is zero then assume 1.		*/
	Sint8	*work;				/* ���[�N�̈�								*/
								/* Address of working area					*/
	Sint32	wksize;				/* ���[�N�̈�T�C�Y							*/
								/* Size of working area						*/
	Sint32  compo_mode;			/* �������[�h								*/
								/* Composition mode							*/
	MwsfdBufFmt		buffmt;		/* �f�R�[�h�o�̓t���[���o�b�t�@�f�[�^�`��	*/
								/* �l��0�̏ꍇ�̓f�t�H���g�`���Ƃ݂Ȃ��B	*/
								/* Buffer format of decoder	output			*/
								/* If the value is 0 then assume defualt.	*/
	Sint32	rsv[2];				/* �\�� (�S��0��ݒ肵�ĉ�����) 			*/
								/* Reserved(Please set 0 in all of area)	*/
} MwsfdCrePrm, MWS_PLY_CPRM_SFD;

/* �t���[�����\���� */
/* Frame Information  */
typedef struct {
	Uint8			*bufadr;			/* �f�R�[�h���ʃo�b�t�@�A�h���X		*/
										/* Decoder's output buffer address	*/
	MwsfdBufFmt		buffmt;				/* �f�R�[�h���ʃo�b�t�@�f�[�^�`��	*/
										/* Decoder's output buffer format	*/
	Sint32			width;				/* ���s�N�Z����						*/
										/* Width by the pixel				*/
	Sint32			height;				/* �c�s�N�Z����						*/
										/* Height by the pixel				*/
	Sint32			x_mb;				/* ���}�N���u���b�N��				*/
										/* Width by the macroblock			*/
	Sint32			y_mb;				/* �c�}�N���u���b�N��				*/
										/* Height by the macroblock			*/
	MwsfdPtype		ptype;				/* �s�N�`���^�C�v					*/
										/* Picture type						*/
	Sint32			fps;				/* �t���[�����[�g[fps * 1000]		*/
										/* Frame rate [fps * 1000]			*/
	Sint32			fno;				/* �t���[���ԍ�						*/
										/* Count of frames					*/
	Sint32			time;				/* �\������							*/
										/* Time of disp						*/
	Sint32			tunit;				/* �\�������P��						*/
										/* Unit of display time				*/
	Sint32			concat_cnt;			/* �A��������						*/
										/* Count of concatenation			*/
	Sint32			fno_per_file;		/* �t�@�C�����̃t���[���ԍ�			*/
										/* Count of frames per file			*/
	Sint32			time_per_file;		/* �t�@�C�����̍Đ�����				*/
										/* Playtime per file				*/
	Sint32			errcnt;				/* �f�[�^�G���[������				*/
										/* Count of data error				*/
	Sint32			rcvcnt;				/* �f�[�^�G���[�񕜉�				*/
										/* Count of error recovery			*/
} MwsfdFrmObj, MWS_PLY_FRM;

/* �Đ����\���� 		*/
/* Playback information	*/
typedef struct {
	Sint32	drop_frm_cnt;		/* Count of drop frame 						*/
	Sint32	skip_dec_cnt;		/* Count of skip decode						*/
	Sint32	skip_disp_cnt;		/* Count of skip frame was not obtatined	*/
	Sint32	skip_emptyb_cnt;	/* Count of skip empty-Bpicture 			*/
	Sint32	no_supply_cnt;		/* Count of data supply shortage			*/
} MwsfdPlyInf;

/* �t�@�C���w�b�_���		*/
/* File header information	*/
typedef struct {
	Bool		playable;		/* TRUE: playable, FALSE: not playable	*/
	Sint32		ftype;			/* File type (MWSFD_FTYPE_ )			*/
	Sint32		width;			/* Width by the pixel					*/
	Sint32		height;			/* Height by the pixel					*/
	Sint32		fps;			/* Frame rate [fps * 1000]				*/
	Sint32		a_sfreq;		/* Audio: sampling freqency 			*/
	Sint32		a_nch;			/* Audio: number of channel 			*/
	Sint32		frmnum;			/* Total video frames					*/
} MwsfdHdrInf;

/* YCbCr�v���[�����\���� */
/* YCbCr Plane Information */
typedef struct {
	Uint8 		*y_ptr;		/* Y  Buffer Pointer */
	Uint8 		*cb_ptr;	/* Cb Buffer Pointer */
	Uint8 		*cr_ptr;	/* Cr Buffer Pointer */
	Sint32		y_width;	/* Y  Buffer width   */
	Sint32		cb_width;	/* Cb Buffer width   */
	Sint32		cr_width;	/* Cr Buffer width   */
} MwsfdYccPlane, MWS_PLY_YCC_PLANE;

/* �t���[���p�����[�^�\����		*/
/* Frame Parameter structure 	*/
typedef struct {
	MwsfdFrmFmt	frmfmt;						/* Frame format		*/
	Sint32		width;						/* Buffer width 	*/
	Sint32		height;						/* Buffer height 	*/
	Sint32		rsv;						/* Reserved			*/
	Uint8		*buf[MWSFD_FRMPRM_BUF_MAX];	/* Buffer address 	*/
} MwsfdFrmPrm;

/*	Malloc Function	*/
typedef void *(*MwsfdMallocFn)(void *obj, Uint32 size);

/*	Free Function	*/
typedef void (*MwsfdFreeFn)(void *obj, void *ptr);

/***************************************************************************
 *      Function Declaration
 ***************************************************************************/

#ifdef __cplusplus
extern "C" {
#endif

/*=========================================================================*
 *		��{�Đ�����
 *      Basic functions
 *=========================================================================*/
/* MWSFD(Sofdec)���C�u�����̏�����	*/
/* Initialization of Sofdec library	*/
void mwPlyInitSfdFx(MwsfdInitPrm *iprm);

/* MWSFD(Sofdec)���C�u�����̏I��	*/
/* Termination of Sofdec library 	*/
void mwPlyFinishSfdFx(void);

/* ��Ɨ̈�T�C�Y�̌v�Z										*/
/* Calculation of working area size from create parameter	*/
Sint32 mwPlyCalcWorkCprmSfd(MwsfdCrePrm *cprm);

/* MWSFD�n���h���̐���				*/
/* Create MWPLY handle for Sofdec	*/
MWPLY mwPlyCreateSofdec(MwsfdCrePrm *cprm);

/* �Đ��n���h���̏���						*/
/* Destroy MWPLY handle						*/
/* [MwsfdIf] void mwPlyDestroy(MWPLY mwply); */
#define mwPlyDestroy(mwply)		(*(mwply)->vtbl->Destroy)((mwply))

/* �Đ��J�n�i�t�@�C������̍Đ��j								*/
/* Start playing by file name 									*/
/* [MwsfdIf] void mwPlyStartFname(MWPLY mwply, Char8 *fname);	*/
#define mwPlyStartFname(mwply, fname)	(*(mwply)->vtbl->StartFname)((mwply), (fname))

/* �Đ���~									*/
/* Stop playing  							*/
/* [MwsfdIf] void mwPlyStop(MWPLY mwply);	*/
#define mwPlyStop(mwply)	(*(mwply)->vtbl->Stop)((mwply))

/* �|�[�Y�^�|�[�Y����									*/
/* Set pause switch.  sw=0(Continue), 1(Pause)			*/
/* [MwsfdIf] void mwPlyPause(MWPLY mwply, Sint32 sw);	*/
#define	mwPlyPause(mwply, sw)	(*(mwply)->vtbl->Pause)((mwply), (sw))

/* �n���h����Ԃ̎擾								*/
/* Get status of MWPLY handle						*/
/* [MwsfdIf] MwsfdStat mwPlyGetStat(MWPLY mwply);	*/
#define mwPlyGetStat(mwply)		(*(mwply)->vtbl->GetStat)((mwply))

/* �Đ��T���v�����̎擾														*/
/* Get playing time															*/
/* If playing movie is 30 fps, *tscale is 30 and *ncount is total number of */
/*  displayed frames														*/
/* [MwsfdIf] void mwPlyGetTime(MWPLY mwply, Sint32 *ncount, Sint32 *tscale);	*/
#define mwPlyGetTime(mwply, ncount, tscale)	\
							(*(mwply)->vtbl->GetTime)((mwply), (ncount), (tscale))

/* �t���[���̎擾           */
/* Get frame buffer pointer */
void mwPlyGetCurFrm(MWPLY mwply, MwsfdFrmObj *frm);

/* �t���[���̉�� 			*/
/* Release frame buffer		*/
void mwPlyRelCurFrm(MWPLY mwply);

/* �A�C�h���X���b�h�ւ̐ؑ� 	*/
/* Switch to Idle Thread 		*/
void mwPlySwitchToIdle(void);

/*=========================================================================*
 *		�I�[�f�B�I�ݒ�
 *      Set audio option
 *=========================================================================*/
/* �I�[�f�B�I�X�g���[���`���l���̐ݒ�	*/
/* Set audio stream channel 			*/
void mwPlySetAudioCh(MWPLY mwply, Sint32 ch);

/* �����o�̓X�C�b�`�̐ݒ�			*/
/* Set audio output switch			*/
void mwPlySetAudioSw(MWPLY mwply, Sint32 sw);

/* �I�[�f�B�I�o�̓{�����[���̐ݒ�							*/
/* Set Output Volume (vol= 0 to -960)						*/
/* [MwsfdIf] void mwPlySetOutVol(MWPLY mwply, Sint32 vol);	*/
#define mwPlySetOutVol(mwply, vol)		(*(mwply)->vtbl->SetOutVol)((mwply), (vol))

/* �I�[�f�B�I�o�̓{�����[���̎擾				*/
/* Get Output Volume (return value= 0 to -960)	*/
/* [MwsfdIf] Sint32 mwPlyGetOutVol(MWPLY mwply);	*/
#define mwPlyGetOutVol(mwply)			(*(mwply)->vtbl->GetOutVol)((mwply))

/* �I�[�f�B�I�o�̓p���|�b�g�̐ݒ�										*/
/* Set output panpot c=0(Mono/Left),1(Right)							*/
/* p = +15(Right),0(Center),-15(Left),-128(Auto)						*/
/* [MwsfdIf] void mwPlySetOutPan(MWPLY mwply, Sint32 chno, Sint32 pan);	*/
#define mwPlySetOutPan(mwply, c, p)		(*(mwply)->vtbl->SetOutPan)((mwply), (c), (p))

/* �I�[�f�B�I�o�̓p���|�b�g�̎擾								*/
/* Get output panpot c=0(Mono/Left),1(Right)					*/
/* [MwsfdIf] Sint32 mwPlyGetOutPan(MWPLY mwply, Sint32 chno);	*/
#define mwPlyGetOutPan(mwply, c)		(*(mwply)->vtbl->GetOutPan)((mwply), (c))

/*=========================================================================*
 *		���擾
 *		Information
 *=========================================================================*/
/* ���t���[�����̎擾 				*/
/* Get the number of movie frame	*/
Sint32 mwPlyGetTotalFrmNum(MWPLY mwply);

/* ���t���[���擾�\�₢���킹				*/
/* Determine whether next frame is ready	*/
Bool mwPlyIsNextFrmReady(MWPLY mwply);

/* �������[�h�̎擾			*/
/* Get synchronization mode	*/
Sint32 mwPlyGetSyncMode(MWPLY mwply);

/* �t���[���擾�������[�h�̎擾				*/
/* Get frame obtain synchronization mode	*/
MwsfdFrmSync mwPlyGetFrmSync(MWPLY mwply);

/* �|�[�Y��Ԃ̎擾 */
/* Get pause ON/OFF	*/
Bool mwPlyIsPause(MWPLY mwply);

/* �Đ����̎擾 			*/
/* Get playback information	*/
void mwPlyGetPlyInf(MWPLY mwply, MwsfdPlyInf *plyinf);

/* �R�}���������t���[�����̎擾	*/
/* Get number of droped frame	*/
Sint32 mwPlyGetNumDropFrm(MWPLY mwply);

/* �f�R�[�h���������t���[�����̎擾				*/
/* Get number of frames was skipped to decode	*/
Sint32 mwPlyGetNumSkipDec(MWPLY mwply);

/* �\���i�̃X�L�b�v�񐔂̎擾					*/
/* Get number of frames was skipped to obtain	*/
Sint32 mwPlyGetNumSkipDisp(MWPLY mwply);

/* �X�L�b�v�����G���v�e�BB�s�N�`�������̎擾	*/
/* Get the number of skipped empty-B picture	*/
Sint32 mwPlyGetNumSkipEmptyB(MWPLY mwply);

/* �f�R�[�h�����S�s�N�`�����̎擾	*/
/* Get Number of Decoded Frames 	*/
Sint32 mwPlyGetNumTotalDec(MWPLY mwply);

/* �f�R�[�h�ςݕێ��t���[�����̎擾	*/
/* Get Number of Pooled Frames 		*/
Sint32 mwPlyGetNumDecPool(MWPLY mwply);

/* �T�[�o��؂�₢���킹							*/
/* Determine whether process is in server border	*/
Bool mwPlyIsSvrBdr(void);

/* �t�@�C�����̎擾			*/
/* Get file header information	*/
void mwPlyGetHdrInf(Sint8 *buf, Sint32 bsize, MwsfdHdrInf *hdrinf);

/* �I�[�f�B�I�X�g���[���`���l�����̎擾		*/
/* Get the number of audio channel streams	*/
Sint32 mwPlyGetNumAudioCh(MWPLY mwply);

/* �r�f�I�X�g���[���`���l�����̎擾			*/
/* Get the number of video channel streams	*/
Sint32 mwPlyGetNumVideoCh(MWPLY mwply);

/*=========================================================================*
 *		�ǉ��ݒ�
 *		Additional setting
 *=========================================================================*/
/* �������[�h�̐ݒ�			*/
/* Set synchronization mode	*/
void mwPlySetSyncMode(MWPLY mwply, Sint32 mode);

/* �t���[���擾�������[�h�̐ݒ�				*/
/* Set frame obtain synchronization mode	*/
void mwPlySetFrmSync(MWPLY mwply, MwsfdFrmSync frmsync);

/* B-Picture�f�R�[�h�̃X�L�b�v�ݒ� 	*/
/* Set B-Picture skip decode 		*/
void mwPlySetBpicSkip(MWPLY mwply, Bool sw);

/* �G���v�e�BB�s�N�`���̃f�R�[�h�X�L�b�v�ݒ� 	*/
/* Set empty-B picture skip decode				*/
void mwPlySetEmptyBpicSkip(MWPLY mwply, Bool sw);

/* �Đ����ԏ���̐ݒ�i�f�t�H���g�� 9����57�� 0�b�j			*/
/* Set playback limit time (default = 09-57-00(HH-MM-SS))	*/
void mwPlySetLimitTime(MWPLY mwply, Sint32 sec);

/* �r�f�I�X�g���[���`���l���̐ݒ�	*/
/* Set video stream channel 		*/
void mwPlySetVideoCh(MWPLY mwply, Sint32 ch);

/*=========================================================================*
 *		�V�[�����X���[�v�Đ�
 *      Seamless loop playback
 *=========================================================================*/
/* �V�[�����X���[�v�Đ��̊J�n	*/
/* Start semaless loop playback	*/
void mwPlyStartFnameLp(MWPLY mwply, Char8 *fname);

/* �V�[�����X���[�v�Đ��̉���		*/
/* Release semaless loop playback	*/
void mwPlyReleaseLp(MWPLY mwply);

/* FID �w��ɂ��V�[�����X���[�v�Đ��̊J�n	  			*/
/* Start semaless loop playback by specified file ID	*/
void mwPlyStartAfsLp(MWPLY mwply, Sint32 patid, Sint32 fid);

/*=========================================================================*
 *		�V�[�����X�A���Đ�
 *      Seamless continuous playback
 *=========================================================================*/
/* �V�[�����X�A���Đ��t�@�C���̓o�^				*/
/* Entry file of Seamless continuous playback	*/
void mwPlyEntryFname(MWPLY mwply, Char8 *fname);

/* �V�[�����X�A���Đ��̊J�n				*/
/* Start seamless continuous playback	*/
void mwPlyStartSeamless(MWPLY mwply);

/* �V�[�����X�A���Đ��̉���				*/
/* Release seamless continuous playback	*/
void mwPlyReleaseSeamless(MWPLY mwply);

/*	�V�[�����X���[�v�Đ��̐ݒ�	*/
/*	Set semaless loop play   	*/
void mwPlySetSeamlessLp(MWPLY mwply, Sint32 flg);

/* �V�[�����X�A���Đ��t�@�C���̓o�^ (AFS)			*/
/* Entry file of Seamless continuous playback (AFS)	*/
void mwPlyEntryAfs(MWPLY mwply, Sint32 patid, Sint32 fid);

/* ���ݓo�^����Ă���t�@�C�����̎擾			*/
/* Get number of file entried seamless loop 	*/
Sint32 mwPlyGetNumSlFiles(MWPLY mwply);

/* �V�[�����X�A���Đ��ɓo�^���Ă���t�@�C�����̎擾	*/
/* Get file name of entried seamless				*/
Char8 *mwPlyGetSlFname(MWPLY mwply, Sint32 stm_no);

/*=========================================================================*
 *		���̑��̍Đ�����
 *      Other playback functions
 *=========================================================================*/
/* FID �w��ɂ��Đ��̊J�n 				*/
/* Start AFS palyback by specified file ID	*/
void mwPlyStartAfs(MWPLY mwply, Sint32 patid, Sint32 fid);

/* SJ�ɂ��Đ��̊J�n								*/
/* Start playing by stream joint					*/
/* [MwsfdIf] void mwPlyStartSj(MWPLY mwply, SJ sji);	*/
#define mwPlyStartSj(mwply, sji)     (*(mwply)->vtbl->StartSj)((mwply), (sji))

/* �A�h���X�w�胁�����ɂ��Đ��J�n										*/
/* Start playing by memory												*/
/* [MwsfdIf] void mwPlyStartMem(MWPLY mwply, void *addr, Sint32 len);	*/
#define	mwPlyStartMem(mwply, addr, len)		\
								   (*(mwply)->vtbl->StartMem)((mwply), (addr), (len))

/*=========================================================================*
 *		Sofdec F/X�@�\�i�t���[���ϊ��^�����j
 *      Sofdec F/X related (Frame conversion / Composition mode)
 *=========================================================================*/
/* ARGB8888�t�H�[�}�b�g�ւ̕ϊ�	*/
/* Convert to ARGB8888 			*/
void mwPlyFxCnvFrmARGB8888(MWPLY mwply, MwsfdFrmObj *frm, Uint8 *out);
/* YUV422�t�H�[�}�b�g�ϊ�	*/
/* Convert to YUV422 		*/
void mwPlyFxCnvFrmYUV422(MWPLY mwply, MwsfdFrmObj *frm, Uint8 *out);
/* Y84C44�t�H�[�}�b�g�ϊ�	*/
/* Convert to Y84C44 		*/
void mwPlyFxCnvFrmY84C44(MWPLY mwply, MwsfdFrmObj *frm, Uint8 *yout, Uint8 *cout);

/* �o�̓o�b�t�@�T�C�Y�̐ݒ� */
/* Set size of out buffer 	*/
void mwPlyFxSetOutBufSize(MWPLY mwply, Sint32 width, Sint32 height);
/* �o�̓o�b�t�@�T�C�Y�̎擾 */
/* Get size of out buffer 	*/
void mwPlyFxGetOutBufSize(MWPLY mwply, Sint32 *width, Sint32 *height);

/* �������[�h�̐ݒ� 	*/
/* Set composition mode	*/
void mwPlyFxSetCompoMode(MWPLY mwply, Sint32 mode);
/* �������[�h�̎擾 */
/* Get composition mode	*/
Sint32 mwPlyFxGetCompoMode(MWPLY mwply);

/* ���~�i���X�L�[�p�����[�^�̐ݒ�		*/
/* Set luminance key alpha parameter	*/
void mwPlyFxSetLumiPrm(MWPLY mwply, Sint32 in_th, Sint32 out_th, MwsfdLumiKey key);
/* ���~�i���X�L�[�p�����[�^�̎擾 		*/
/* Get luminance key alpha parameter	*/
void mwPlyFxGetLumiPrm(MWPLY mwply, Sint32 *in_th, Sint32 *out_th, MwsfdLumiKey *key);

/* 16bit-�y�o�b�t�@�ւ̕ϊ� 		*/
/* Convert to 16bit depth Z-value	*/
void mwPlyFxCnvFrmZ16(MWPLY mwply, MwsfdFrmObj *frm, Uint8 *zout);
/* 32bit-�y�o�b�t�@�ւ̕ϊ� 					*/
/* Convert to 32bit depth Z-value	*/
void mwPlyFxCnvFrmZ32(MWPLY mwply, MwsfdFrmObj *frm, Uint8 *zout);

/* �y�N���b�v�̐ݒ� */
/* Set Z-clip		*/
void mwPlyFxSetZclip(MWPLY mwply, Float32 znear, Float32 zfar);
/* �y�N���b�v�̎擾 */
/* Get Z-clip		*/
void mwPlyFxGetZclip(MWPLY mwply, Float32 *znear, Float32 *zfar);

/*=========================================================================*
 *		���̑�
 *      Other functions
 *=========================================================================*/
/* YCbCr�v���[���̌v�Z        */
/* Calculation of YCbCr plane */
void mwPlyCalcYccPlane(Uint8 *bufptr, Sint32 width, Sint32 height, 
						MwsfdYccPlane *ycc);

/* ADXT�n���h���̎擾	*/
/* Get ADXT handle		*/
ADXT mwPlyGetAdxtHn(MWPLY mwply);

/* ���̓X�g���[���W���C���g�̎擾	*/
/* Get SJ of Input          		*/
SJ mwPlyGetInputSj(MWPLY mwply);

/* �r�f�I�f�R�[�_�n���h���̎擾	*/
/* Get Video decoder handle		*/
void *mwPlyGetSfdHn(MWPLY mwply);

/* Malloc�^Free �֐��̓o�^ */
void mwPlySetMallocFn(MwsfdMallocFn mallocfn, MwsfdFreeFn freefn, void *obj);

/* �n���h������Vsync���� 									*/
/* V-sync function 											*/
/* This function is called by user while v-sync interrupt.	*/
/* [MwsfdIf] void mwPlyVsyncHndl(MWPLY mwply);				*/
#define mwPlyVsyncHndl(mwply)			(*(mwply)->vtbl->VsyncHndl)((mwply))

/* �n���h�����̃T�[�o���� 							*/
/* Execute decoding one frame						*/
/* This function is called by user from main-loop.	*/
/* [MwsfdIf] Bool mwPlyExecSvrHndl(MWPLY mwply);		*/
#define mwPlyExecSvrHndl(mwply)			(*(mwply)->vtbl->ExecSvrHndl)((mwply))

/*=========================================================================*
 *		�폜���ꂽ�t���[���ϊ��֐�
 *      Deleted frame conversion functions
 *-------------------------------------------------------------------------*
 *	Please use mwPlyFxCnvFrm***** functions.
 *=========================================================================*/
/*
void mwPlyInitYcc420plnToArgb8888(void);
void mwPlyCnvFrm(MwsfdFrmPrm *in, MwsfdFrmPrm *out);
void mwPlyYcc420plnToArgb8888(Uint8 *frm, Uint8 *prgb, Uint32 width, 
								Uint32 height, Uint32 pitch);
void mwPlyYcc420plnToYcc422pix2(Uint8 *frm, Uint8 *pycc, Uint32 width, 
								Uint32 height, Uint32 pitch);
 */


#ifdef __cplusplus
}
#endif

#endif	/* INCLUDED_CRIMWSFD_H */
