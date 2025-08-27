/**
 * Modern Combat System - Data-driven, flexible, and extensible
 */
import * as pc from 'playcanvas';
import { ECSManager, System, Entity } from '../core/EntitySystem';
export interface CombatData {
    frameData: {
        startup: number;
        active: number;
        recovery: number;
        totalFrames: number;
    };
    damage: {
        base: number;
        scaling: number;
        type: 'physical' | 'energy' | 'true';
    };
    hitbox: {
        offset: pc.Vec3;
        size: pc.Vec3;
        activeFrames: number[];
    };
    properties: Set<CombatProperty>;
    cancels: string[];
    meter: {
        cost: number;
        gain: number;
    };
}
export type CombatProperty = 'overhead' | 'low' | 'projectile' | 'invulnerable' | 'armor' | 'counter' | 'launcher' | 'knockdown' | 'wall_bounce' | 'ground_bounce' | 'unblockable';
export interface HitResult {
    hit: boolean;
    blocked: boolean;
    counter: boolean;
    damage: number;
    hitstun: number;
    blockstun: number;
    pushback: number;
    knockdown: boolean;
    launcher: boolean;
}
export declare class ModernCombatSystem implements System {
    private combatDatabase;
    private activeHitboxes;
    init(ecs: ECSManager): void;
    update(deltaTime: number, ecs: ECSManager): void;
    private loadCombatDatabase;
    private updateHitboxes;
    private processCollisions;
    private checkCollision;
    private aabbCollision;
    private processHit;
    executeMove(entity: Entity, moveName: string, ecs: ECSManager): boolean;
}
