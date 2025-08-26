
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

export class ECSManager {
  private nextEntityId = 1;
  private entities = new Set<Entity>();
  private components = new Map<string, Map<Entity, Component>>();
  private systems: System[] = [];

  createEntity(): Entity {
    const entity = this.nextEntityId++;
    this.entities.add(entity);
    return entity;
  }

  destroyEntity(entity: Entity): void {
    this.entities.delete(entity);
    for (const componentMap of this.components.values()) {
      componentMap.delete(entity);
    }
  }

  addComponent<T extends Component>(entity: Entity, component: T): void {
    if (!this.components.has(component.type)) {
      this.components.set(component.type, new Map());
    }
    this.components.get(component.type)!.set(entity, component);
  }

  removeComponent(entity: Entity, componentType: string): void {
    this.components.get(componentType)?.delete(entity);
  }

  getComponent<T extends Component>(entity: Entity, componentType: string): T | undefined {
    return this.components.get(componentType)?.get(entity) as T;
  }

  hasComponent(entity: Entity, componentType: string): boolean {
    return this.components.get(componentType)?.has(entity) ?? false;
  }

  query(componentTypes: string[]): Entity[] {
    return Array.from(this.entities).filter(entity =>
      componentTypes.every(type => this.hasComponent(entity, type))
    );
  }

  addSystem(system: System): void {
    this.systems.push(system);
    system.init?.(this);
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime, this);
    }
  }
}

export interface System {
  init?(ecs: ECSManager): void;
  update(deltaTime: number, ecs: ECSManager): void;
}
