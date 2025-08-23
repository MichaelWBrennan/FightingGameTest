#ifndef	_AIXP_H_INCLUDED
#define	_AIXP_H_INCLUDED
/****************************************************************************/
/*																			*/
/*			$title$  AIX �Đ� ���C�u����									*/
/*																			*/
/*				2001.7.29		written M.Oshimi							*/
/*																			*/
/****************************************************************************/

/*	Version number of AIXP library 		*/
#define	AIXP_VER	"1.30"

#include "cri/ee/cri_xpt.h"
#include "sj.h"
#include "cri_adxt.h"

/*	�X�g���[���R���g���[��				*/
/*	Stream Controller					*/
#ifndef ADXSTM_DEFINED
#define ADXSTM_DEFINED
typedef	void	*ADXSTM;
#endif

/*	�X�g���[���W���C���g�f�R�[�_		*/
/*	Stream Joint decoder				*/
#ifndef AIXSJD_DEFINED
#define AIXSJD_DEFINED
typedef void	*AIXSJD;
#endif

/*	�I�[�f�B�I�����_��					*/
/*	Audio Renderer						*/
#ifndef ADXRNA_DEFINED
#define ADXRNA_DEFINED
typedef void	*ADXRNA;
#endif

/****************************************************************************/
/*		�萔�}�N��															*/
/*		MACRO CONSTANT														*/
/****************************************************************************/

/*	�ő哯��������						*/
/*	Maximum number of AIXP handle		*/
#define	AIXP_MAX_OBJ		(4)

/*	�ő�g���b�N��						*/
/*	Maximum number of AIXP handle		*/
#define	AIXP_MAX_TR			(32)

/*	�ő�t���[�Y��						*/
/*	Maximum number of AIXP handle		*/
#define	AIXP_MAX_PH			(32)

/*	�ő�T���v�����O���g��				*/
/*	Maximum sampling frequency			*/
#define	AIXP_MAX_SFREQ	(48000)

/*	$define$ AIX Talk�̓�����(AIXP_STAT_�`)	*/
/*	Status of AIX Talk							*/
#define	AIXP_STAT_STOP		(0)		/*	��~�� 								*/
									/*	During standstill					*/
#define AIXP_STAT_PREP		(1)		/*	�Đ������� 							*/
									/*	During play preparation				*/
#define AIXP_STAT_PLAYING	(2)		/*	�f�R�[�h���Đ��� 					*/
									/*	During decode and play				*/
#define AIXP_STAT_PLAYEND	(3)		/*	�Đ��I�� 							*/
									/*	Play end							*/
#define AIXP_STAT_ERROR		(4)		/*	�Đ��I�� 							*/
									/*	Play end							*/

/*	�ő�Đ��`�����l����				*/
/*	Maximum number of play channel		*/
#define	AIXP_MAX_NCH		(2)

/*	�T�[�o�֐��̌Ăяo�����p�x�̋K��l�@60�i��/�b�j				*/
/*	Default value of frequency called server function(times/sec)	*/
#define AIXP_DEF_SVRFREQ	(60)

/*	Default value of output volume(dB)	*/
#define	AIXP_DEF_OUTVOL		(0)

#define AIXP_CALC_WORK(nch, nstm, sfreq, ntr)	\
	((ADXT_CALC_IBUFSIZE(nch, nstm, sfreq) + ADXT_CALC_OBUFSIZE(nch)) * (ntr) + 64)

/*	���̓o�b�t�@�̃G�L�X�g���̈�̑傫��	*/
/*	Size of Extra area in input buffer		*/
#define AIXP_IBUF_XLEN (8*1024)

/*	AIX Talk �̏o�̓o�b�t�@�̑傫���@�i�T���v���P�ʁj	*/
/*	Output buffer size of AIX Talk (unit:sample)		*/
#define	AIXP_OBUF_SIZE	(0x2000)
#define DECODE_AHX
#ifdef DECODE_AHX
#define	AIXP_OBUF_DIST	(0x2060)
#else
#define	AIXP_OBUF_DIST	(0x2020)
#endif

/*	���̓o�b�t�@�ւ̓ǂݍ��ݗ�						*/
/*	Number of sectors to read into the input buffer	*/
#define AIXP_MAX_CDBSCT		(75)
#define AIXP_MIN_CDBSCT		(65)
#define AIXP_PREP_RDSCT		(25)

/*	�p���|�b�g�̐ݒ�l		*/
/*	Panpot parameter		*/
#define	AIXP_PAN_LEFT		(-15)
#define	AIXP_PAN_CENTER		(0)
#define	AIXP_PAN_RIGHT		(15)
#define	AIXP_PAN_AUTO		(-128)	/*	MONO/STE �ɂ���Ď����I�ɐ؂�ւ���	*/
									/*	Changes automatically by data		*/

/*	�X�e���I�Đ����̃`�����l���ԍ�		*/
/*	Channel number playing stereo data	*/
/*	AIXP_CH_L:left, AIXP_CH_R:right		*/
#define	AIXP_CH_L			(0)
#define	AIXP_CH_R			(1)

/*	5.1ch�Đ����̃X�s�[�J�ԍ�			*/
/*	Speaker number playing 5.1ch sound	*/
#define	AIXP_SPKID_FL		(0)		/* Front Left   */
#define	AIXP_SPKID_FR		(1)		/* Front Right  */
#define	AIXP_SPKID_BL		(2)		/* Back Left    */
#define	AIXP_SPKID_BR		(3)		/* Back Right   */
#define	AIXP_SPKID_FC		(4)		/* Front Center */
#define	AIXP_SPKID_LF		(5)		/* Low Freqency */
#define	AIXP_SPK_NUM		(6)
#define	AIXP_SPK_VOL_MAX	(0)
#define	AIXP_SPK_VOL_MIN	(-10000)

/****************************************************************************/
/*		�f�[�^�^															*/
/*      Data type declaration												*/
/****************************************************************************/

/*	AIX Talk �I�u�W�F�N�g�\����		*/
/*	Structure of AIX Talk object	*/
typedef	struct _aix_ply {
	Sint8	used;						/*	�g�p�����ۂ�					*/
	Sint8	stat;						/*	������						*/
	Sint8	maxnch;						/*	�ő�Đ��`�����l����			*/
	Sint8	maxntr;						/*	�ő�Đ��g���b�N��			*/
	AIXSJD	sjd;						/*	AIX�X�g���[���W���C���g�f�R�[�_	*/
	ADXSTM	stm;						/*	���̓X�g���[���R���g���[��		*/
	ADXT	adxt[AIXP_MAX_TR];			/*	ADXT�Đ���						*/
	SJ		sji;						/*	���̓X�g���[���W���C���g		*/
	SJ		sjo[AIXP_MAX_TR];			/*	�o�̓X�g���[���W���C���g		*/
	Sint8	*ibuf;						/*	���̓o�b�t�@					*/
	Sint32	ibufbsize;					/*	���̓o�b�t�@�T�C�Y�i�o�C�g�P��)	*/
	Sint32	ibufxsize;					/*	���̓o�b�t�@�G�N�X�g���T�C�Y	*/
	Sint8	*obuf[AIXP_MAX_TR];			/*	�o�̓o�b�t�@					*/
	Sint32	obufbsize;					/*	�o�̓o�b�t�@�T�C�Y�i�o�C�g�P�ʁj*/
	Sint32	obufxsize;					/*	�o�̓o�b�t�@�T�C�Y�i�o�C�g�P�ʁj*/
	Sint32	pause_flag;					/*	�|�[�Y�t���O					*/
	Sint8	lpsw;						/*	���[�v�X�C�b�`					*/
	Sint8	lnksw;						/*	�A���X�C�b�`					*/
	Sint16	rsv;						/*	���[�v�X�C�b�`					*/
	Sint32	lpcnt;						/*	���[�v�J�E���^					*/
	Sint32	curph;						/*	���ݍ۔w���̃t���[�Y�ԍ�		*/
	Sint32	stph;						/*	�Đ��J�n�t���[�Y�ԍ�			*/
	Sint32	lpsp;						/*	���[�v�X�^�[�g�t���[�Y�ԍ�		*/
	Sint32	lpep;						/*	���[�v�G���h�t���[�Y�ԍ�		*/
#ifdef	XPT_TGT_XB	/* M.W: 2001-09-01: DolbyDigital 5.1ch�Ή� */
	Sint32	spk_idx[AIXP_SPK_NUM];
#endif
} AIX_PLY;
typedef	AIX_PLY	*AIXP;

/****************************************************************************/
/*		�֐��̐錾															*/
/*      Function Declaration												*/
/****************************************************************************/

#ifdef __cplusplus
extern "C" {
#endif

/* $func$ AIX Talk �̏�����
 * [���@��] void AIXP_Init(void);
 * [���@��] �Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] AIX Talk ������������B
 *			�ϐ��̈�̏��������s���B
 *  Initialization of AIX Talk
 * [Inputs  ] None
 * [Outputs ] None
 * [Return  ] None
 * [Function] Initializes AIX Talk. Initializes variable.
 */
void AIXP_Init(void);

/* $func$ AIX Talk�̏I��
 * [���@��] void AIXP_Finish(void);
 * [���@��] �Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] AIX Talk �̏I������������B
 *  Termination of AIX Talk
 * [Inputs  ] None
 * [Outputs ] None
 * [Return  ] None
 * [Function] Finalizes AIX Talk.
 */
void AIXP_Finish(void);

/*	$func$ AIXP�n���h�� �̐���
 * [���@��] AIXP AIXP_Create(Sint32 maxnch, void *work, Sint32 worksize);
 * [���@��] maxntr	: �ő�g���b�N��
 *			maxnch	: �ő�Đ��`�����l�����i���m�����݂̂P�F�X�e���I�Q�j
 *			work	: ���[�N�̈�
 *			worksize: ���[�N�̈�̃T�C�Y
 * [�o�@��] �Ȃ�
 * [�֐��l] AIXP�n���h��
 * [�@�@�\] AIXP�n���h���𐶐�����B
 *			work�̈�̃T�C�Y�́AAIXP_CALC_WORK�}�N���ɂ���ċ��߂�B
 *  Creation of AIXP handle
 * [Inputs  ] maxntr  : Number of maximum tracks
 *			  maxnch  : Number of maximum channels(monoral:1, stereo:2)
 *			  work    : Working area
 *			  worksize: Size of working area(byte)
 * [Outputs ] None
 * [Return  ] AIXP handle
 * [Function] Creates AIXP handle.
 * [Remarks ] You calculate size of working area used 'AIXP_CALC_WORK' macro. 
 */
AIXP AIXP_Create(Sint32 maxntr, Sint32 maxnch, void *work, Sint32 worksize);

/* $func$ AIXP�n���h�� �̏���
 * [���@��] void AIXP_Destroy(AIXP aixp);
 * [���@��] AIXP	: AIXP�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] �w�肳�ꂽ AIXP�n���h������������B
 *  Destroy of AIXP handle
 * [Inputs  ] AIXP   : AIXP handle
 * [Outputs ] None
 * [Return  ] None
 * [Function] Destroys specified AIXP handle.
 */
void AIXP_Destroy(AIXP aixp);

/* $func$ �t�@�C�����w��ɂ��Đ��̊J�n
 * [���@��] void AIXP_StartFname(AIXP aixp, Char8 *fname, void *atr);
 * [���@��] AIXP	: AIXP�n���h��
 *			fname	: �t�@�C����
 *			atr		: �f�B���N�g�����
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] fname �Ŏw�肳�ꂽ�`�c�w�t�@�C���̍Đ����J�n����B
 *  Play start of AIX data specified file name
 * [Inputs  ] AIXP	: AIXP handle
 *			  fname	: File name
 *			  atr	: Directry Information
 * [Outputs ] None
 * [Return  ] None
 * [Function] Starts to play AIX file when you specify file name.
 */
void AIXP_StartFname(AIXP aixp, Char8 *fname, void *atr);

#ifdef	XPT_TGT_XB	/* M.W: 2001-09-01: DolbyDigital 5.1ch�Ή� */
/* $func$ �t�@�C�����w��ɂ��Đ��̊J�n(DolbyDigital 5.1ch�p)
 * [���@��] void AIXP_StartFnameDolbyDigital(AIXP aixp, Sint8 *fname);
 * [���@��] AIXP	: AIXP�n���h��
 *			fname	: �t�@�C����
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] fname �Ŏw�肳�ꂽ�`�c�w�t�@�C���̍Đ���5.1ch�o�͂ŊJ�n����B
 *  Play start of AIX data specified file name
 * [Inputs  ] AIXP	: AIXP handle
 *			  fname	: File name
 * [Outputs ] None
 * [Return  ] None
 * [Function] Starts to play AIX file when you specify file name with 5.1ch.
 */
void AIXP_StartFnameDolbyDigital(AIXP aixp, Char8 *fname, void *atr);

/* $func$ �X�s�[�J�[�ʃ{�����[���w��(DolbyDigital 5.1ch�p)
 * [���@��] void AIXP_SetOutVolDolbyDigital(AIXP aixp, Sint32 spkid, Sint32 vol);
 * [���@��] AIXP	: AIXP�n���h��
 *			spkid	: �X�s�[�J�[ID
 *			vol		: �{�����[��
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] spkid �Ŏw�肳�ꂽ�X�s�[�J�[�̃{�����[����ݒ肷��B
 *  Setting volumes to speaker(for DolbyDigital 5.1ch)
 * [Inputs  ] AIXP	: AIXP handle
 *			  spkid	: Speaker ID
 *			  vol	: Volume
 * [Outputs ] None
 * [Return  ] None
 * [Function] Setting volumes specified by spkid.
 */
void AIXP_SetOutVolDolbyDigital(AIXP aixp, Sint32 spkid, Sint32 vol);
#endif

/* $func$ FID �w��ɂ��Đ��̊J�n
 * [���@��] void AIXP_StartAfs(AIXP aixp, Sint32 patid, Sint32 fid);
 * [���@��] AIXP	: AIXP�n���h��
 *			patid	: �p�[�e�B�V�������ʎq
 *			fid		: �t�@�C�����ʎq
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] �p�[�e�B�V�������ʎq�ƃt�@�C�����ʎq�Ŏw�肳�ꂽ�`�c�w�t�@�C����
 *			�Đ����J�n����B
 *  Play start of AIX data by specified file ID
 * [Inputs  ] AIXP	: AIXP handl
 *			  patid	: Partition ID
 *			  fid	: File ID
 * [Outputs ] None
 * [Return  ] None
 * [Function] Starts to play AIX file when you specify partition ID and file ID.
 */
void AIXP_StartAfs(AIXP aixp, Sint32 patid, Sint32 fid);

/* $func$ �X�g���[���W���C���g�ɂ��Đ��̊J�n
 * [���@��] void AIXP_StartSj(AIXP aixp, SJ sj);
 * [���@��] AIXP	: AIXP�n���h��
 *			sj		: �X�g���[���W���C���g
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] �X�g���[���W���C���g���瓾����f�[�^���Đ�����B
 *  Play start of AIX data from Stream Joint
 * [Inputs  ] AIXP	: AIXP handle
 *			  sj	: Stream Joint
 * [Outputs ] None
 * [Return  ] None
 * [Function] Starts to play AIX file when you specify Stream Joint.
 */
void AIXP_StartSj(AIXP aixp, SJ sj);

/* $func$ �������w��ɂ��Đ��̊J�n
 * [���@��] void AIXP_StartMem(AIXP aixp, void *aixdat, Sint32 datlen);
 * [���@��] AIXP	: AIXP�n���h��
 *			aixdat	: �`�c�w�f�[�^�̃A�h���X
 *			datlen	: �`�c�w�f�[�^�̑傫��
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] aixdata �Ŏw�肳�ꂽ�`�c�w�f�[�^���Đ�����B
 *  Play start of AIX data on memory
 * [Inputs  ] AIXP	: AIXP handle
 *			  aixdat: Address of AIX data
 *			  datlen: Length of playing AIX data
 * [Outputs ] None
 * [Return  ] None
 * [Function] Starts to play AIX data on memory. Plays to specified length.
 */
void AIXP_StartMem(AIXP aixp, void *aixdat, Sint32 datlen);

/* $func$ �Đ��̒�~
 * [���@��] void AIXP_Stop(AIXP aixp);
 * [���@��] AIXP	: AIXP�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] �`�c�w�̍Đ����~����B
 *  Play stop
 * [Inputs  ] AIXP	: AIXP handle
 * [Outputs ] None
 * [Return  ] None
 * [Function] Stops to play AIX data.
 */
void AIXP_Stop(AIXP aixp);

/* $func$ ��Ԃ̎擾
 * [���@��] Sint32 AIXP_GetStat( AIXP aixp );
 * [���@��] AIXP	: AIXP�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] ���݂� AIXP�n���h���̏�Ԃ�\���萔
 * 				AIXP_STAT_STOP	 :	��~��
 *				AIXP_STAT_DECINFO:	�`�c�w �̃w�b�_���擾��
 *				AIXP_STAT_PREP	 :	�Đ�������
 *				AIXP_STAT_PLAYING:	�f�R�[�h���Đ���
 *				AIXP_STAT_DECEND :	�f�R�[�h�I��
 *				AIXP_STAT_PLAYEND:	�Đ��I��
 * [�@�@�\] ���݂�AIXP�n���h���̏�Ԃ��擾����B
 *  Get status
 * [Inputs  ] AIXP	: AIXP handle
 * [Outputs ] None
 * [Return  ] Status of AIXP handle
 * [Function] Obtains status of AIXP handle.
 */
Sint32 AIXP_GetStat(AIXP aixp);

/* $func$ ADXT�n���h���̎擾
 * [���@��] ADXT AIXP_GetAdxt(AIXP aixp, Sint32 trno);
 * [���@��] AIXP	: AIXP�n���h��
 *			trno	: �g���b�N�ԍ�
 * [�o�@��] �Ȃ�
 * [�֐��l] adxt	: ADXT�n���h��
 * [�@�@�\] ADXT�n���h�����擾����B
 *  Getting a ADXT handle of specified track
 * [Inputs  ] AIXP	: AIXP handle
 *			  trno	: Track No.
 * [Outputs ] None
 * [Return  ] ADXT handle
 * [Function] Obtains a ADXT handle of specified track.
 */
ADXT AIXP_GetAdxt(AIXP aixp, Sint32 trno);

/*	$func$ �ēǂݍ��݊J�n���Ԃ̐ݒ�
 * [���@��] void AIXP_SetReloadTime(AIXP aixp,float time,Sint32 nch,Sint32 sfreq);
 * [���@��] AIXP	: AIXP�n���h��
 *			time	: �ēǂݍ��݊J�n����
 *			nch		: �`�����l����
 *			sfreq	: �T���v�����O���g��
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] ���̓o�b�t�@�ւ̍ēǂݍ��݊J�n���Ԃ�ݒ肷��B
 *			�b�c�o�b�t�@���̗ʂ� time �b��菭�Ȃ��Ȃ�Ƃb�c����
 *			�f�[�^��ǂݍ��ށB
 *  Set the time of start sector to reload
 * [Inputs  ] AIXP	: AIXP handle
 *			  time  : start remain time
 *			  nch   : number of channel
 *			  sfreq : sampling frequency
 * [Outputs ] None
 * [Return  ] None
 * [Function] Sets of the time of start sector to reload into input buffer.
 *			 Reads data from CD-ROM when a quantity of data in the input 
 *			 buffer becomes less than 'time' [second].
 */
void AIXP_SetReloadTime(AIXP aixp, float time, Sint32 nch, Sint32 sfreq);

/*	$func$ ���̓o�b�t�@���Đ�����
 * [���@��] float AIXP_GetIbufRemainTime(AIXP aixp);
 * [���@��] AIXP	: AIXP�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �Đ��\���ԁ@(�P�ʁF�b)
 * [�@�@�\] ���̓o�b�t�@�ɂ���f�[�^�ōĐ��\�Ȏ��Ԃ��擾����B
 *			AIX�f�[�^�̂ݑΉ��B
 * [Inputs  ] AIXP	: AIXP handle
 * [Outputs ] None
 * [Return  ] Playable time (sec)
 * [Function] Obtains playable time using only data in input buffer.
 *			  You can use this function only playing AIX data.
 */
float AIXP_GetIbufRemainTime(AIXP aixp);

/*	$func$ �e�n���h���̃T�[�o�֐��@�i������Ԃ̍X�V)
 * [���@��] Sint32 AIXP_ExecHndl(AIXP aixp);
 * [���@��] AIXP	: AIXP�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] �e�n���h���̓�����Ԃ��X�V����B
 *			AIXP_ExecServer������Ăяo�����B
 *  Server function of each handle
 * [Inputs  ] AIXP	: AIXP handle
 * [Outputs ] None
 * [Return  ] None
 * [Function] Update the inside status.
 *			  This function is called from 'AIXP_ExecServer' function.
 */
void AIXP_ExecHndl(AIXP aixp);

/*	$func$ �T�[�o�֐��@�i������Ԃ̍X�V)
 * [���@��] Sint32 AIXP_ExecServer(void);
 * [���@��] �Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] ���C�u�����̓�����Ԃ��X�V����B
 *			V-Sync ���ɌĂяo���Ȃ���΂Ȃ�Ȃ��B
 *  Server function
 * [Inputs  ] None
 * [Outputs ] None
 * [Return  ] None
 * [Function] Update the inside status of library.
 */
void AIXP_ExecServer(void);

/*	$func$ ���[�v�����񐔂̎擾
 * [���@��] Sint32 AIXP_GetLpCnt(AIXP aixp);
 * [���@��] AIXP	: AIXP�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] ���[�v������
 * [�@�@�\] ���[�v�����񐔂��擾����B
 *  Get the number of times played a loop
 * [Inputs  ] AIXP	: AIXP handle
 * [Outputs ] None
 * [Return  ] Number of times played a loop
 * [Function] Obtains the number of times that played a loop.
 */
Sint32 AIXP_GetLpCnt(AIXP aixp);

/*	$func$ ���[�v�X�C�b�`�̐ݒ�
 * [���@��] void AIXP_SetLpSw(AIXP aixp, Sint32 flg);
 * [���@��] aixp	: AIXP�n���h��
 *			flg		: 1=���[�v����A0=���[�v���Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] ���[�v���邩�ۂ���ݒ肷��B
 */
void AIXP_SetLpSw(AIXP aixp, Sint32 sw);

/*	$func$ �t���[�Y�����N�X�C�b�`�̐ݒ�
 * [���@��] void AIXP_SetLpSw(AIXP aixp, Sint32 flg);
 * [���@��] aixp	: AIXP�n���h��
 *			flg		: 1=�A������A0=�A�����Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] �t���[�Y��A���Đ����邩�ۂ���ݒ肷��B
 */
void AIXP_SetLnkSw(AIXP aixp, Sint32 sw);

/*	$func$ �Đ��J�n�t���[�Y�ԍ��̐ݒ�
 * [���@��] void AIXP_SetPhraseNo(AIXP aixp, Sint32 phno);
 * [���@��] aixp	: AIXP�n���h��
 *			phno	: �t���[�Y�ԍ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] �Đ��J�n�t���[�Y�ԍ���ݒ肷��B
 */
void AIXP_SetStartPh(AIXP aixp, Sint32 phno);

/*	$func$ �Đ��J�n�t���[�Y�ԍ��̎擾
 * [���@��] Sint32 AIXP_GetStartPh(AIXP aixp)
 * [���@��] aixp	: AIXP�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �t���[�Y�ԍ�
 * [�@�@�\] �Đ��J�n�t���[�Y�ԍ����擾����B
 */
Sint32 AIXP_GetStartPho(AIXP aixp);

/*	$func$ ���[�v�J�n�t���[�Y�ԍ��̐ݒ�
 * [���@��] void AIXP_SetPhraseNo(AIXP aixp, Sint32 phno);
 * [���@��] aixp	: AIXP�n���h��
 *			phno	: �t���[�Y�ԍ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] ���[�v���̊J�n�t���[�Y�ԍ���ݒ肷��B
 */
void AIXP_SetLpStartPh(AIXP aixp, Sint32 phno);

/*	$func$ ���[�v�X�^�[�g�t���[�Y�ԍ��̎擾
 * [���@��] Sint32 AIXP_GetStartPh(AIXP aixp)
 * [���@��] aixp	: AIXP�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �t���[�Y�ԍ�
 * [�@�@�\] ���[�v�X�^�[�g�t���[�Y�ԍ����擾����B
 */
Sint32 AIXP_GetLpStartPho(AIXP aixp);

/*	$func$ ���[�v�G���h�t���[�Y�ԍ��̐ݒ�
 * [���@��] void AIXP_SetPhraseNo(AIXP aixp, Sint32 phno);
 * [���@��] aixp	: AIXP�n���h��
 *			phno	: �t���[�Y�ԍ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] ���[�v�G���h�t���[�Y�ԍ���ݒ肷��B
 */
void AIXP_SetLpEndPh(AIXP aixp, Sint32 phno);

/*	$func$ ���[�v�G���h�t���[�Y�ԍ��̎擾
 * [���@��] Sint32 AIXP_GetStartPh(AIXP aixp)
 * [���@��] aixp	: AIXP�n���h��
 * [�o�@��] �Ȃ�
 * [�֐��l] �t���[�Y�ԍ�
 * [�@�@�\] ���[�v�G���h�t���[�Y�ԍ����擾����B
 */
Sint32 AIXP_GetLpEndPho(AIXP aixp);

/*	$func$ �ꎞ��~�̐ݒ�
 * [���@��] void AIXP_Pause(AIXP aixp, Sint32 sw);
 * [���@��] AIXP	: AIXP�n���h��
 *			sw		: 1=�ꎞ��~�A0=�ĊJ
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] �ꎞ��~���邩�ۂ���ݒ肷��B
 *  Pause/Continue
 * [Inputs  ] AIXP	: AIXP handle
 *			  sw	: 1=pause, 0=continue
 * [Outputs ] None
 * [Return  ] None
 * [Function] Stops temporarily by a specified switch and release temporary 
 *			  standstill.
 */
void AIXP_Pause(AIXP aixp, Sint32 sw);

/*			�������m�����o�̓X�C�b�`�̐ݒ�	
[��  ��]	void AIXP_SetOutoputMono(Sint32 flag);
[��  ��]	Sint32 flag		�������m�����o�̓t���O(OFF:0, ON:1)
[�߂�l]	�Ȃ�					
[�@  �\]	�X�e���I�f�[�^�������I�Ƀ��m�����f�[�^�Ƃ��ďo�͂���B
[���@�l]	
*/
void AIXP_SetOutputMono(Sint32 flag);

#ifdef __cplusplus
}
#endif

#endif

/* end of file */
