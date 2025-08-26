// TypeScript definitions converted from ./include/sf33rd/AcrSDK/common/pltim2.h
#ifndef PLTIM2_H
#define PLTIM2_H




s32 plTIM2GetMipmapTextureNum(void *lpbas);
s32 plTIM2SetContextFromImage(plContext *dst, void *lpbas);
s32 plTIM2SetPaletteContextFromImage(plContext *dst, void *lpbas);
u8 *plTIM2GetPixelAddressFromImage(void *lpbas, s32 Mipmap);
u8 *plTIM2GetPaletteAddressFromImage(void *lpbas);

#endif
