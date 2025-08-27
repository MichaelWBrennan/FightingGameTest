/**
 * Modern Entity Component System
 * Replaces old object-oriented hierarchy with data-driven design
 */
export interface Component {
    readonly type: string;
}
export interface Transform extends Component {
    type: 'transform';
    position: pc.Vec3;
    rotation: pc.Quat;
    scale: pc.Vec3;
}
export interface Health extends Component {
    type: 'health';
    current: number;
    maximum: number;
    regeneration: number;
}
export interface Combat extends Component {
    type: 'combat';
    damage: number;
    attackSpeed: number;
    hitboxes: Array<{
        offset: pc.Vec3;
        size: pc.Vec3;
        active: boolean;
    }>;
}
export interface Movement extends Component {
    type: 'movement';
    velocity: pc.Vec3;
    acceleration: pc.Vec3;
    maxSpeed: number;
    friction: number;
}
export interface Animation extends Component {
    type: 'animation';
    currentState: string;
    states: Map<string, AnimationState>;
    blendTime: number;
}
export interface AnimationState {
    name: string;
    duration: number;
    looping: boolean;
    events: Array<{
        frame: number;
        event: string;
        data?: any;
    }>;
}
export type Entity = number;
export type ComponentType = Transform | Health | Combat | Movement | Animation;
export declare class ECSManager {
    private nextEntityId;
    private entities;
    private components;
    private systems;
    createEntity(): Entity;
    destroyEntity(entity: Entity): void;
    addComponent<T extends Component>(entity: Entity, component: T): void;
    removeComponent(entity: Entity, componentType: string): void;
    getComponent<T extends Component>(entity: Entity, componentType: string): T | undefined;
    hasComponent(entity: Entity, componentType: string): boolean;
    query(componentTypes: string[]): Entity[];
    addSystem(system: System): void;
    update(deltaTime: number): void;
}
export interface System {
    init?(ecs: ECSManager): void;
    update(deltaTime: number, ecs: ECSManager): void;
}
