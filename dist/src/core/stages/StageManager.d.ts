import * as pc from 'playcanvas';
export declare class StageManager {
    private app;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
}
