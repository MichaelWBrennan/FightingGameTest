/**
 * Modern Entity Component System
 * Replaces old object-oriented hierarchy with data-driven design
 */
export class ECSManager {
    constructor() {
        this.nextEntityId = 1;
        this.entities = new Set();
        this.components = new Map();
        this.systems = [];
    }
    createEntity() {
        const entity = this.nextEntityId++;
        this.entities.add(entity);
        return entity;
    }
    destroyEntity(entity) {
        this.entities.delete(entity);
        for (const componentMap of this.components.values()) {
            componentMap.delete(entity);
        }
    }
    addComponent(entity, component) {
        if (!this.components.has(component.type)) {
            this.components.set(component.type, new Map());
        }
        this.components.get(component.type).set(entity, component);
    }
    removeComponent(entity, componentType) {
        this.components.get(componentType)?.delete(entity);
    }
    getComponent(entity, componentType) {
        return this.components.get(componentType)?.get(entity);
    }
    hasComponent(entity, componentType) {
        return this.components.get(componentType)?.has(entity) ?? false;
    }
    query(componentTypes) {
        return Array.from(this.entities).filter(entity => componentTypes.every(type => this.hasComponent(entity, type)));
    }
    addSystem(system) {
        this.systems.push(system);
        system.init?.(this);
    }
    update(deltaTime) {
        for (const system of this.systems) {
            system.update(deltaTime, this);
        }
    }
}
//# sourceMappingURL=EntitySystem.js.map