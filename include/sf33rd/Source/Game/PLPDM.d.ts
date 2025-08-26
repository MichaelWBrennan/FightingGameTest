// TypeScript definitions converted from ./include/sf33rd/Source/Game/PLPDM.h
#ifndef PLPDM_H
#define PLPDM_H




extern const u8 guard_kind[];
extern const s8 atsagct[];

void Player_damage(PLW *wk);
void subtract_dm_vital(PLW *wk);
void subtract_dm_vital_aiuchi(PLW *wk);
s32 setup_kuzureochi(PLW *wk);
void get_catch_off_data(PLW *wk, s16 ix);

#endif
