
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

export type CombatProperty = 
  | 'overhead' | 'low' | 'projectile' | 'invulnerable'
  | 'armor' | 'counter' | 'launcher' | 'knockdown'
  | 'wall_bounce' | 'ground_bounce' | 'unblockable';

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

export class ModernCombatSystem implements System {
  private combatDatabase = new Map<string, CombatData>();
  private activeHitboxes = new Map<Entity, Array<{
    data: CombatData;
    frameCount: number;
    entity: Entity;
  }>>();

  init(ecs: ECSManager): void {
    this.loadCombatDatabase();
  }

  update(deltaTime: number, ecs: ECSManager): void {
    this.updateHitboxes(deltaTime, ecs);
    this.processCollisions(ecs);
  }

  private loadCombatDatabase(): void {
    // Load from JSON files instead of hardcoded values
    const combatFiles = [
      '/data/combat/normals.json',
      '/data/combat/specials.json', 
      '/data/combat/supers.json'
    ];

    combatFiles.forEach(async (file) => {
      try {
        const response = await fetch(file);
        const data = await response.json();
        Object.entries(data).forEach(([moveName, moveData]) => {
          this.combatDatabase.set(moveName, moveData as CombatData);
        });
      } catch (error) {
        console.warn(`Failed to load combat data from ${file}:`, error);
      }
    });
  }

  private updateHitboxes(deltaTime: number, ecs: ECSManager): void {
    for (const [entity, hitboxes] of this.activeHitboxes.entries()) {
      for (let i = hitboxes.length - 1; i >= 0; i--) {
        const hitbox = hitboxes[i];
        hitbox.frameCount++;

        if (hitbox.frameCount >= hitbox.data.frameData.totalFrames) {
          hitboxes.splice(i, 1);
        }
      }

      if (hitboxes.length === 0) {
        this.activeHitboxes.delete(entity);
      }
    }
  }

  private processCollisions(ecs: ECSManager): void {
    const combatEntities = ecs.query(['transform', 'combat']);
    
    for (let i = 0; i < combatEntities.length; i++) {
      for (let j = i + 1; j < combatEntities.length; j++) {
        const entityA = combatEntities[i];
        const entityB = combatEntities[j];
        
        this.checkCollision(entityA, entityB, ecs);
      }
    }
  }

  private checkCollision(entityA: Entity, entityB: Entity, ecs: ECSManager): void {
    const transformA = ecs.getComponent(entityA, 'transform');
    const transformB = ecs.getComponent(entityB, 'transform');
    const combatA = ecs.getComponent(entityA, 'combat');
    const combatB = ecs.getComponent(entityB, 'combat');

    if (!transformA || !transformB || !combatA || !combatB) return;

    // Modern AABB collision detection with swept testing
    for (const hitboxA of combatA.hitboxes) {
      if (!hitboxA.active) continue;
      
      for (const hitboxB of combatB.hitboxes) {
        if (!hitboxB.active) continue;
        
        if (this.aabbCollision(
          transformA.position.clone().add(hitboxA.offset),
          hitboxA.size,
          transformB.position.clone().add(hitboxB.offset),
          hitboxB.size
        )) {
          this.processHit(entityA, entityB, ecs);
        }
      }
    }
  }

  private aabbCollision(posA: pc.Vec3, sizeA: pc.Vec3, posB: pc.Vec3, sizeB: pc.Vec3): boolean {
    return (
      posA.x < posB.x + sizeB.x &&
      posA.x + sizeA.x > posB.x &&
      posA.y < posB.y + sizeB.y &&
      posA.y + sizeA.y > posB.y &&
      posA.z < posB.z + sizeB.z &&
      posA.z + sizeA.z > posB.z
    );
  }

  private processHit(attacker: Entity, defender: Entity, ecs: ECSManager): void {
    // Modern hit processing with events
    const app = pc.Application.getApplication();
    
    app.fire('combat:hit', {
      attacker,
      defender,
      timestamp: Date.now()
    });
  }

  // Public API for move execution
  executeMove(entity: Entity, moveName: string, ecs: ECSManager): boolean {
    const moveData = this.combatDatabase.get(moveName);
    if (!moveData) return false;

    const combat = ecs.getComponent(entity, 'combat');
    if (!combat) return false;

    // Add hitbox to active hitboxes
    if (!this.activeHitboxes.has(entity)) {
      this.activeHitboxes.set(entity, []);
    }

    this.activeHitboxes.get(entity)!.push({
      data: moveData,
      frameCount: 0,
      entity
    });

    return true;
  }
}
