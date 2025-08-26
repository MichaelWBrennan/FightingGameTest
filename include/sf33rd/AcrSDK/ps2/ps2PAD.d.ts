// TypeScript definitions converted from ./include/sf33rd/AcrSDK/ps2/ps2PAD.h
#ifndef PS2PAD_H
#define PS2PAD_H




extern TARPAD tarpad_root[2]; // size: 0x68, address: 0x57B040
extern PS2Slot ps2slot[2];

s32 flPS2PADModuleInit();
s32 tarPADInit();
void tarPADDestroy();
void flPADConfigSetACRtoXX(s32 padnum, s16 a, s16 b, s16 c);
void tarPADRead();

#endif
