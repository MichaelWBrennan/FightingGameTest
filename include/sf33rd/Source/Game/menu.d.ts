// TypeScript definitions converted from ./include/sf33rd/Source/Game/menu.h
#ifndef MENU_H
#define MENU_H




void Menu_Task(struct _TASK *task_ptr);
void Menu_Init(struct _TASK *task_ptr);
void Setup_Pad_or_Stick();
u16 Check_Menu_Lever(u8 PL_id, s16 type);
void Menu_Common_Init();
s32 Load_Replay_MC_Sub(struct _TASK *task_ptr, s16 PL_id);
void Setup_Replay_Sub(s16 type, s16 char_type, s16 master_player, s16 /* unused */);
void Setup_Save_Replay_2nd(struct _TASK *task_ptr, s16 /* unused */);
s32 Setup_Final_Cursor_Pos(s8 cursor_x, s16 dir);
void Default_Training_Data(s32 flag);

#endif
