// TypeScript definitions converted from ./include/port/sdl/sdl_app.h
#ifndef SDL_APP_H
#define SDL_APP_H

int SDLApp_Init();
void SDLApp_Quit();
int SDLApp_PollEvents();
void SDLApp_BeginFrame();
void SDLApp_EndFrame();

#endif
