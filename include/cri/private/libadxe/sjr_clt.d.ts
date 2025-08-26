// TypeScript definitions converted from ./include/cri/private/libadxe/sjr_clt.h
#ifndef SJR_CLT_H
#define SJR_CLT_H



void SJRMT_Init();
void *SJUNI_CreateRmt(Sint32, Sint8 *, Sint32);
void SJRMT_Destroy(void *);
void SJRMT_Finish();

#endif
