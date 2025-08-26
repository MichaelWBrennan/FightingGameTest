// TypeScript definitions converted from ./include/cri/private/libadxe/dtx.h
#ifndef DTX_H
#define DTX_H







extern Sint32 dtx_send_sw;

void DTX_Init();
DTX DTX_Create(Sint32 id, void *eewk, void *iopwk, Sint32 wklen);
void DTX_Destroy(DTX dtx);
void DTX_SetRcvCbf(DTX dtx, void (*func)(), void *object);
void DTX_SetSndCbf(DTX dtx, void (*func)(), void *object);
intptr_t DTX_CallUrpc(Uint32 call_id, intptr_t *snd_buf, Sint32 snd_buf_len, intptr_t *rcv_buf, Sint32 rcv_buf_len);
void DTX_Finish();
void DTX_ExecServer();

#endif
