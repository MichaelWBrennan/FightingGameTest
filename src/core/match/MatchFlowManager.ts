import * as pc from 'playcanvas';
import { ProceduralStageGenerator } from '../procgen/ProceduralStageGenerator';
import { StageSaveSystem, SavedStage, StageSaveOptions } from '../stages/StageSaveSystem';
import { RealTimeStageManager } from '../procgen/RealTimeStageManager';

export interface MatchResult {
  winner: string;
  loser: string;
  duration: number;
  rounds: number;
  stageData: any;
  generationParams: any;
  matchId: string;
  timestamp: Date;
}

export interface StageSavePrompt {
  stageData: any;
  generationParams: any;
  matchResult: MatchResult;
  isVisible: boolean;
}

export class MatchFlowManager {
  private app: pc.Application;
  private stageGenerator: ProceduralStageGenerator;
  private stageSaveSystem: StageSaveSystem;
  private realTimeStageManager: RealTimeStageManager;
  private currentStageData: any = null;
  private currentGenerationParams: any = null;
  private currentMatchId: string = '';
  private savePrompt: StageSavePrompt | null = null;

  constructor(app: pc.Application) {
    this.app = app;
    this.stageGenerator = new ProceduralStageGenerator();
    this.stageSaveSystem = new StageSaveSystem(app);
    this.realTimeStageManager = new RealTimeStageManager(app);
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for match start events
    this.app.on('match:start', this.onMatchStart.bind(this));
    
    // Listen for match end events
    this.app.on('match:end', this.onMatchEnd.bind(this));
    
    // Listen for stage save events
    this.app.on('stage:save_requested', this.onStageSaveRequested.bind(this));
    this.app.on('stage:save_cancelled', this.onStageSaveCancelled.bind(this));
  }

  private onMatchStart(event: any): void {
    const { matchId, players } = event;
    this.currentMatchId = matchId;
    
    // Auto-generate a random stage for the match
    this.generateRandomStage();
  }

  private onMatchEnd(event: any): void {
    const { winner, loser, duration, rounds } = event;
    
    const matchResult: MatchResult = {
      winner,
      loser,
      duration,
      rounds,
      stageData: this.currentStageData,
      generationParams: this.currentGenerationParams,
      matchId: this.currentMatchId,
      timestamp: new Date()
    };

    // Show stage save prompt after match
    this.showStageSavePrompt(matchResult);
  }

  private generateRandomStage(): void {
    // Generate random parameters for stage generation
    const themes = [
      'training', 'urban', 'arcane_tower', 'divine_cathedral', 'elemental_realm',
      'shadow_keep', 'nature_sanctuary', 'crystal_cavern', 'void_dimension',
      'celestial_plane', 'infernal_abyss', 'primal_forest', 'gothic_cathedral',
      'gothic_graveyard', 'gothic_castle', 'gothic_ruins', 'gothic_forest',
      'gothic_laboratory', 'gothic_clocktower'
    ];
    
    const sizes = ['small', 'medium', 'large', 'huge'];
    const atmospheres = ['peaceful', 'tense', 'mysterious', 'epic', 'intimate'];
    const weathers = ['none', 'rain', 'snow', 'fog', 'storm', 'magical'];
    const timesOfDay = ['dawn', 'day', 'dusk', 'night', 'eternal'];
    
    const generationParams = {
      seed: Math.floor(Math.random() * 1000000),
      theme: themes[Math.floor(Math.random() * themes.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      atmosphere: atmospheres[Math.floor(Math.random() * atmospheres.length)],
      hazards: Math.random() > 0.5,
      interactiveElements: Math.floor(Math.random() * 6),
      weather: weathers[Math.floor(Math.random() * weathers.length)],
      timeOfDay: timesOfDay[Math.floor(Math.random() * timesOfDay.length)]
    };

    // Generate the stage
    this.currentGenerationParams = generationParams;
    this.currentStageData = this.stageGenerator.generate(generationParams);
    
    // Load the stage in real-time
    this.realTimeStageManager.generateStage(generationParams);
    
    this.app.fire('stage:generated', { 
      stageData: this.currentStageData, 
      generationParams 
    });
  }

  private showStageSavePrompt(matchResult: MatchResult): void {
    this.savePrompt = {
      stageData: this.currentStageData,
      generationParams: this.currentGenerationParams,
      matchResult,
      isVisible: true
    };

    this.app.fire('ui:show_stage_save_prompt', { 
      prompt: this.savePrompt 
    });
  }

  private onStageSaveRequested(event: any): void {
    const { name, description, tags, isFavorite } = event;
    
    if (!this.savePrompt) return;

    const saveOptions: StageSaveOptions = {
      name,
      description,
      tags,
      isFavorite,
      matchId: this.savePrompt.matchResult.matchId,
      playerId: this.savePrompt.matchResult.winner
    };

    const stageId = this.stageSaveSystem.saveStage(
      this.savePrompt.stageData,
      this.savePrompt.generationParams,
      saveOptions
    );

    this.app.fire('ui:hide_stage_save_prompt');
    this.app.fire('stage:saved_successfully', { 
      stageId, 
      stageName: name 
    });

    this.savePrompt = null;
  }

  private onStageSaveCancelled(): void {
    this.app.fire('ui:hide_stage_save_prompt');
    this.savePrompt = null;
  }

  public getCurrentStageData(): any {
    return this.currentStageData;
  }

  public getCurrentGenerationParams(): any {
    return this.currentGenerationParams;
  }

  public getStageSaveSystem(): StageSaveSystem {
    return this.stageSaveSystem;
  }

  public getSavePrompt(): StageSavePrompt | null {
    return this.savePrompt;
  }

  public regenerateStage(): void {
    this.generateRandomStage();
  }

  public regenerateStageWithParams(params: any): void {
    this.currentGenerationParams = { ...params };
    this.currentStageData = this.stageGenerator.generate(params);
    this.realTimeStageManager.generateStage(params);
    
    this.app.fire('stage:regenerated', { 
      stageData: this.currentStageData, 
      generationParams: this.currentGenerationParams 
    });
  }

  public getAvailableThemes(): string[] {
    return [
      'training', 'urban', 'arcane_tower', 'divine_cathedral', 'elemental_realm',
      'shadow_keep', 'nature_sanctuary', 'crystal_cavern', 'void_dimension',
      'celestial_plane', 'infernal_abyss', 'primal_forest', 'gothic_cathedral',
      'gothic_graveyard', 'gothic_castle', 'gothic_ruins', 'gothic_forest',
      'gothic_laboratory', 'gothic_clocktower'
    ];
  }

  public getAvailableSizes(): string[] {
    return ['small', 'medium', 'large', 'huge'];
  }

  public getAvailableAtmospheres(): string[] {
    return ['peaceful', 'tense', 'mysterious', 'epic', 'intimate'];
  }

  public getAvailableWeathers(): string[] {
    return ['none', 'rain', 'snow', 'fog', 'storm', 'magical'];
  }

  public getAvailableTimesOfDay(): string[] {
    return ['dawn', 'day', 'dusk', 'night', 'eternal'];
  }

  public destroy(): void {
    this.stageSaveSystem.destroy();
    this.realTimeStageManager.destroy();
  }
}