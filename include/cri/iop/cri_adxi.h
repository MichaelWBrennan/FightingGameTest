#ifndef	_ADXT_H_INCLUDED
#define	_ADXT_H_INCLUDED
/****************************************************************************/
/*																			*/
/*			$title$ �`�c�w�f�[�^�Đ� ���C�u����								*/
/*					ADXI (ADX IOP) Library									*/
/*																			*/
/*				2000.11.20		written S.Hosaka							*/
/*																			*/
/****************************************************************************/

/*	Version number of ADXT library 		*/
#define ADXI_VER_MAJOR	(8)
#define ADXI_VER_MINOR	(34)
#define	ADXI_VER	"8.34"

#include "cri/ee/cri_xpt.h"

/****************************************************************************/
/*		�萔�}�N��															*/
/*		MACRO CONSTANT														*/
/****************************************************************************/

/****************************************************************************/
/*		�f�[�^�^															*/
/*      Data type declaration												*/
/****************************************************************************/

/****************************************************************************/
/*		�֐��̐錾															*/
/*      Function Declaration												*/
/****************************************************************************/

#ifdef __cplusplus
extern "C" {
#endif

/* $func$ �T�E���h�̃Z�b�g�A�b�v
 * [���@��] void ADXI_SetupSnd(Sint32 core_no);
 * [���@��] core_no:CORE�ԍ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] �T�E���h�̃Z�b�g�A�b�v����B
 *  Setup of sound system
 * [Inputs  ] core_no:CORE No.
 * [Outputs ] None
 * [Return  ] None
 * [Function] Setups sound system.
 */
void ADXI_SetupSnd(Sint32 core_no);

/* $func$ IOP���W���[������ADX���C�u�����̏�����
 * [���@��] void ADXI_Init(void);
 * [���@��] �Ȃ�
 * [�o�@��] �Ȃ�
 * [�֐��l] �Ȃ�
 * [�@�@�\] IOP���W���[������ADX���C�u����������������B
 *  Initalization ADX library for IOP module
 * [Inputs  ] None
 * [Outputs ] None
 * [Return  ] None
 * [Function] Initalizes ADX library for IOP module.
 */
void ADXI_Init(void);

/*	$func$ �T�[�o�֐��@�i������Ԃ̍X�V)
 * [���@��] void ADXI_ExecServer(void);
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
void ADXI_ExecServer(void);


#ifdef __cplusplus
}
#endif

#endif

/* end of file */
