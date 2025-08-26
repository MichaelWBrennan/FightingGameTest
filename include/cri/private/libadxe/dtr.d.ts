// TypeScript definitions converted from ./include/cri/private/libadxe/dtr.h
#ifndef DTR_H
#define DTR_H






DTR DTR_Create(SJ sj, SJ arg1);
void DTR_Destroy(DTR dtr);
void DTR_Start(DTR dtr);
void DTR_Stop(DTR dtr);
Sint32 DTR_GetStat(DTR dtr);
void DTR_ExecServer();

#endif
