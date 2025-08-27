/**
 * Modern Combat System - Data-driven, flexible, and extensible
 */
import * as pc from 'playcanvas';
export class ModernCombatSystem {
    constructor() {
        this.combatDatabase = new Map();
        this.activeHitboxes = new Map();
    }
    init(ecs) {
        this.loadCombatDatabase();
    }
    update(deltaTime, ecs) {
        this.updateHitboxes(deltaTime, ecs);
        this.processCollisions(ecs);
    }
    loadCombatDatabase() {
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
                    this.combatDatabase.set(moveName, moveData);
                });
            }
            catch (error) {
                console.warn(`Failed to load combat data from ${file}:`, error);
            }
        });
    }
    updateHitboxes(deltaTime, ecs) {
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
    processCollisions(ecs) {
        const combatEntities = ecs.query(['transform', 'combat']);
        for (let i = 0; i < combatEntities.length; i++) {
            for (let j = i + 1; j < combatEntities.length; j++) {
                const entityA = combatEntities[i];
                const entityB = combatEntities[j];
                this.checkCollision(entityA, entityB, ecs);
            }
        }
    }
    checkCollision(entityA, entityB, ecs) {
        const transformA = ecs.getComponent(entityA, 'transform');
        const transformB = ecs.getComponent(entityB, 'transform');
        const combatA = ecs.getComponent(entityA, 'combat');
        const combatB = ecs.getComponent(entityB, 'combat');
        if (!transformA || !transformB || !combatA || !combatB)
            return;
        // Modern AABB collision detection with swept testing
        for (const hitboxA of combatA.hitboxes) {
            if (!hitboxA.active)
                continue;
            for (const hitboxB of combatB.hitboxes) {
                if (!hitboxB.active)
                    continue;
                if (this.aabbCollision(transformA.position.clone().add(hitboxA.offset), hitboxA.size, transformB.position.clone().add(hitboxB.offset), hitboxB.size)) {
                    this.processHit(entityA, entityB, ecs);
                }
            }
        }
    }
    aabbCollision(posA, sizeA, posB, sizeB) {
        return (posA.x < posB.x + sizeB.x &&
            posA.x + sizeA.x > posB.x &&
            posA.y < posB.y + sizeB.y &&
            posA.y + sizeA.y > posB.y &&
            posA.z < posB.z + sizeB.z &&
            posA.z + sizeA.z > posB.z);
    }
    processHit(attacker, defender, ecs) {
        // Modern hit processing with events
        const app = pc.Application.getApplication();
        app.fire('combat:hit', {
            attacker,
            defender,
            timestamp: Date.now()
        });
    }
    // Public API for move execution
    executeMove(entity, moveName, ecs) {
        const moveData = this.combatDatabase.get(moveName);
        if (!moveData)
            return false;
        const combat = ecs.getComponent(entity, 'combat');
        if (!combat)
            return false;
        // Add hitbox to active hitboxes
        if (!this.activeHitboxes.has(entity)) {
            this.activeHitboxes.set(entity, []);
        }
        this.activeHitboxes.get(entity).push({
            data: moveData,
            frameCount: 0,
            entity
        });
        return true;
    }
}
//# sourceMappingURL=ModernCombatSystem.js.map