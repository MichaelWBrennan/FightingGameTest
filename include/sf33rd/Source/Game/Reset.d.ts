// TypeScript definitions converted from ./include/sf33rd/Source/Game/Reset.h
#ifndef RESET_H
#define RESET_H




extern u8 Reset_Status[2];

void Reset_Task(struct _TASK *task_ptr);
u8 nowSoftReset();

#endif
