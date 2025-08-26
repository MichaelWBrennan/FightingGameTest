/**
 * Core type definitions for SF3:3S HD-2D Fighting Game System
 */
// PlayCanvas Mock Types (for compilation without actual PlayCanvas)
export var pc;
(function (pc) {
    class Vec3 {
        constructor(x = 0, y = 0, z = 0) {
            Object.defineProperty(this, "x", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "y", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "z", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }
    pc.Vec3 = Vec3;
    class Vec2 {
        constructor(x = 0, y = 0) {
            Object.defineProperty(this, "x", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "y", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.x = x;
            this.y = y;
        }
    }
    pc.Vec2 = Vec2;
    class Vec4 {
        constructor(x = 0, y = 0, z = 0, w = 0) {
            Object.defineProperty(this, "x", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "y", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "z", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "w", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
    }
    pc.Vec4 = Vec4;
    class Color {
        constructor(r = 1, g = 1, b = 1, a = 1) {
            Object.defineProperty(this, "r", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "g", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "b", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "a", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
    }
    pc.Color = Color;
    class Entity {
        constructor() {
            Object.defineProperty(this, "name", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "children", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "parent", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
        }
    }
    pc.Entity = Entity;
    class Application {
        constructor() {
            Object.defineProperty(this, "canvas", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "graphicsDevice", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "root", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
        }
    }
    pc.Application = Application;
    class StandardMaterial {
        constructor() {
            Object.defineProperty(this, "diffuse", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "emissive", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "opacity", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.diffuse = new Color(1, 1, 1, 1);
            this.emissive = new Color(0, 0, 0, 1);
            this.opacity = 1;
        }
    }
    pc.StandardMaterial = StandardMaterial;
    class Texture {
        constructor() {
            Object.defineProperty(this, "width", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "height", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.width = 256;
            this.height = 256;
        }
    }
    pc.Texture = Texture;
    class CurveSet {
        constructor() {
            // CurveSet implementation
        }
    }
    pc.CurveSet = CurveSet;
    pc.FILLMODE_FILL_WINDOW = 'FILLMODE_FILL_WINDOW';
    pc.RESOLUTION_AUTO = 'RESOLUTION_AUTO';
})(pc || (pc = {}));
//# sourceMappingURL=core.js.map