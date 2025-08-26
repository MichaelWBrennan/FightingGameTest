// TypeScript definitions converted from ./include/cri/private/libadxe/adx_rnap.h
#ifndef ADX_RNAP_H
#define ADX_RNAP_H





void ADXRNA_Init();
void ADXRNA_Finish();
ADXRNA ADXRNA_Create(SJ *, Sint32);
void ADXRNA_Destroy(ADXRNA rna);
void ADXRNA_EntryErrFunc(void (*)(void *, Char8 *), void *);
Sint32 ADXRNA_GetNumData(ADXRNA);
void ADXRNA_SetOutVol(ADXRNA, Sint32);
void ADXRNA_SetPlaySw(ADXRNA, Sint32);
void ADXRNA_SetTransSw(ADXRNA rna, Sint32 sw);
void ADXRNA_ExecServer();

#endif
