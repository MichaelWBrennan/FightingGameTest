// TypeScript definitions converted from ./include/port/sdl/sdl_message_renderer.h
#ifndef SDL_MESSAGE_RENDERER_H
#define SDL_MESSAGE_RENDERER_H



extern SDL_Texture *message_canvas;

void SDLMessageRenderer_Initialize(SDL_Renderer *renderer);
void SDLMessageRenderer_BeginFrame();

void SDLMessageRenderer_CreateTexture(int width, int height, void *pixels, int format);
void SDLMessageRenderer_DrawTexture(int x0, int y0, int x1, int y1, int u0, int v0, int u1, int v1, unsigned int color);

#endif
