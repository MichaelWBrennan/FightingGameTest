import type { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';

export interface TrainingDrill {
  id: string;
  name: string;
  type: 'combo' | 'defense' | 'mixup' | 'punish';
  character: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  objectives: TrainingObjective[];
  rewards: {
    experience: number;
    money: number;
  };
}

export interface TrainingObjective {
  id: string;
  name: string;
  type: 'hit' | 'block' | 'combo';
  target: string;
  count: number;
  current: number;
  completed: boolean;
}

export class AdvancedTrainingMode {
  private app: pc.Application;
  private trainingDrills: Map<string, TrainingDrill> = new Map();
  private activeDrill: TrainingDrill | null = null;

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeTrainingDrills();
  }

  private initializeTrainingDrills(): void {
    this.addTrainingDrill({
      id: 'combo_basic_1',
      name: 'Basic Combo Training',
      type: 'combo',
      character: 'ryu',
      difficulty: 'beginner',
      objectives: [
        {
          id: 'combo_basic_1_obj_1',
          name: 'Execute Basic Combo',
          type: 'combo',
          target: 'light_punch -> medium_punch -> heavy_punch',
          count: 10,
          current: 0,
          completed: false
        }
      ],
      rewards: {
        experience: 100,
        money: 200
      }
    });
  }

  public addTrainingDrill(drill: TrainingDrill): void {
    this.trainingDrills.set(drill.id, drill);
    Logger.info(`Added training drill: ${drill.name}`);
  }

  public startTrainingDrill(drillId: string): boolean {
    const drill = this.trainingDrills.get(drillId);
    if (!drill) return false;

    this.activeDrill = drill;
    Logger.info(`Started training drill: ${drill.name}`);
    return true;
  }

  public getTrainingDrills(): TrainingDrill[] {
    return Array.from(this.trainingDrills.values());
  }

  public destroy(): void {
    this.trainingDrills.clear();
  }
}