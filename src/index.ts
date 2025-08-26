
import * as pc from 'playcanvas';

// Initialize PlayCanvas application
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
    keyboard: new pc.Keyboard(window),
    gamepads: new pc.GamePads()
});

// Set canvas to fill window and automatically change resolution to be the same as the canvas size
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);

// Ensure canvas is resized when window is resized
window.addEventListener('resize', () => app.resizeCanvas());

console.log('Street Fighter III: 3rd Strike - PlayCanvas Edition');
console.log('TypeScript conversion complete - ready to start game development');

// Start the application
app.start();

export { app };
