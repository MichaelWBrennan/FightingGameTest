// TypeScript definitions converted from ./include/cri/private/libadxe/adx_bahx.h
#ifndef ADX_BAHX_H
#define ADX_BAHX_H





void ADXB_SetAc3InSj(ADXB adxb, SJ sj);
void ADXB_SetAhxInSj(ADXB adxb, SJ sj);
Sint32 ADXB_CheckAc3(void *);
Sint32 ADXB_DecodeHeaderAc3(ADXB, void *, Sint32);
void ADXB_ExecOneAc3(ADXB adxb);
void ADXB_ExecOneAhx(ADXB adxb);

#endif
