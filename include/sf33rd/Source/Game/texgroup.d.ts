// TypeScript definitions converted from ./include/sf33rd/Source/Game/texgroup.h
#ifndef TEXGROUP_H
#define TEXGROUP_H




extern TEX_GRP_LD texgrplds[100]; // size: 0x4B0, address: 0x6B49D0
extern const TexGroupData texgrpdat[100];

void q_ldreq_texture_group(REQ *curr);
void Init_texgrplds_work();
void checkSelObjFileLoaded();
s32 load_any_texture_patnum(u16 patnum, u8 kokey, u8 _unused);
void purge_texture_group_of_this(u16 patnum);
void purge_texture_group(u8 grp);
void purge_player_texture(s16 id);
void reservMemKeySelObj();

#endif
