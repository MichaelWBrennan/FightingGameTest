// TypeScript definitions converted from ./include/sf33rd/Source/Game/debug/OBJTEST.h
#ifndef OBJTEST_H
#define OBJTEST_H




export const OT_PULREQ_MAX = 51;
export const OT_PULPARA_MAX = 53;
export const OT_PULREQ_XX_MAX = 32;

extern PPWORK_SUB_SUB ot_pulreq_xx[OT_PULREQ_XX_MAX];
extern PULREQ ot_pulreq[OT_PULREQ_MAX];
extern PULPARA ot_pulpara[OT_PULPARA_MAX];

void ot_make_curr_vib_data();

#endif
