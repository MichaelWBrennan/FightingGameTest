// TypeScript definitions converted from ./include/cri/private/libadxe/lsc_err.h
#ifndef LSC_ERR_H
#define LSC_ERR_H



void LSC_EntryErrFunc(void (*)(void *, Char8 *), void *);
void LSC_CallErrFunc(const Char8 *format, ...);

#endif
