import * as pc from 'playcanvas';
import { ISystem } from "../../../types/core";
export declare class SceneManager implements ISystem {
    private app;
    mainScene: pc.Entity;
    camera: pc.Entity;
    keyLight: pc.Entity;
    rimLight: pc.Entity;
    accentLight: pc.Entity;
    backgroundContainer: pc.Entity;
    midgroundContainer: pc.Entity;
    backgroundLayers: pc.Entity[];
    leftBoundary: pc.Entity;
    rightBoundary: pc.Entity;
    groundBoundary: pc.Entity;
    stageGround: pc.Entity;
    particleContainer: pc.Entity;
    constructor(app: pc.Application);
    initialize(): void;
    private createDefaultEntities;
    private createStageBoundaries;
    private createStageGround;
    private setupLighting;
    destroy(): void;
}
//# sourceMappingURL=SceneManager.d.ts.map