// TypeScript definitions converted from ./include/cri/private/libadxe/adx_errs.h
#ifndef ADX_ERRS_H
#define ADX_ERRS_H



void ADXERR_Init();
void ADXERR_Finish();
void ADXERR_CallErrFunc1(Sint8 *);
void ADXERR_CallErrFunc2(Sint8 *, Sint8 *);
void ADXERR_ItoA2(Sint32, Sint32, Sint8 *, Sint32);

#endif // ADX_ERRS_H
