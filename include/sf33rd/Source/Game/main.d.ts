// TypeScript definitions converted from ./include/sf33rd/Source/Game/main.h
#ifndef MAIN_H
#define MAIN_H




export const INIT_TASK_NUM = 0;
export const ENTRY_TASK_NUM = 1;
export const RESET_TASK_NUM = 2;
export const MENU_TASK_NUM = 3;
export const PAUSE_TASK_NUM = 4;
export const GAME_TASK_NUM = 5;
export const SAVER_TASK_NUM = 6;
export const DEBUG_TASK_NUM = 9;

extern MPP mpp_w;             // size: 0x4C, address: 0x57A9F0
extern s32 system_init_level; // size: 0x4, address: 0x57AA3C

void AcrMain();
void cpInitTask();
void cpReadyTask(u16 num, void *func_adrs);
void cpExitTask(u16 num);
s32 mppGetFavoritePlayerNumber();

#endif
