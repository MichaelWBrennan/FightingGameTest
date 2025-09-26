import * as pc from 'playcanvas';

export interface InputFrame {
  frame: number;
  inputs: InputState;
  timestamp: number;
}

export interface InputState {
  // Directional inputs
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  
  // Attack buttons
  light: boolean;
  medium: boolean;
  heavy: boolean;
  special: boolean;
  
  // System buttons
  block: boolean;
  grab: boolean;
  dash: boolean;
  burst: boolean;
  
  // Analog values (for pressure-sensitive inputs)
  pressure: number;
  
  // Input quality metrics
  precision: number;
  consistency: number;
}

export interface InputBuffer {
  maxFrames: number;
  inputs: InputFrame[];
  currentFrame: number;
}

export interface InputSequence {
  name: string;
  inputs: string[];
  strictTiming: boolean;
  allowBuffering: boolean;
  maxBufferFrames: number;
  difficulty: number;
}

export class AdvancedInputSystem {
  private app: pc.Application;
  private inputBuffer: InputBuffer;
  private inputHistory: InputFrame[] = [];
  private currentInputs: InputState;
  private previousInputs: InputState;
  private inputSequences: Map<string, InputSequence> = new Map();
  private frameData: Map<string, any> = new Map();
  
  // Input precision tracking
  private inputPrecision: number = 1.0;
  private inputConsistency: number = 1.0;
  private inputStreak: number = 0;
  
  // Advanced input features
  private negativeEdge: boolean = true;
  private inputLeniency: number = 2; // frames
  private bufferWindow: number = 3; // frames
  private plinkWindow: number = 2; // frames for plinking
  
  constructor(app: pc.Application) {
    this.app = app;
    this.initializeInputSystem();
    this.setupInputSequences();
    this.setupEventListeners();
  }

  private initializeInputSystem(): void {
    this.inputBuffer = {
      maxFrames: 60, // 1 second at 60fps
      inputs: [],
      currentFrame: 0
    };
    
    this.currentInputs = this.createEmptyInputState();
    this.previousInputs = this.createEmptyInputState();
  }

  private createEmptyInputState(): InputState {
    return {
      up: false, down: false, left: false, right: false,
      light: false, medium: false, heavy: false, special: false,
      block: false, grab: false, dash: false, burst: false,
      pressure: 0, precision: 1.0, consistency: 1.0
    };
  }

  private setupInputSequences(): void {
    // Quarter circle forward
    this.addInputSequence({
      name: 'qcf',
      inputs: ['down', 'down-right', 'right'],
      strictTiming: false,
      allowBuffering: true,
      maxBufferFrames: 15,
      difficulty: 2
    });

    // Quarter circle back
    this.addInputSequence({
      name: 'qcb',
      inputs: ['down', 'down-left', 'left'],
      strictTiming: false,
      allowBuffering: true,
      maxBufferFrames: 15,
      difficulty: 2
    });

    // Dragon punch motion
    this.addInputSequence({
      name: 'dp',
      inputs: ['right', 'down', 'down-right'],
      strictTiming: true,
      allowBuffering: true,
      maxBufferFrames: 10,
      difficulty: 3
    });

    // Half circle forward
    this.addInputSequence({
      name: 'hcf',
      inputs: ['left', 'down-left', 'down', 'down-right', 'right'],
      strictTiming: false,
      allowBuffering: true,
      maxBufferFrames: 20,
      difficulty: 4
    });

    // 360 motion
    this.addInputSequence({
      name: '360',
      inputs: ['up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'],
      strictTiming: false,
      allowBuffering: true,
      maxBufferFrames: 30,
      difficulty: 5
    });

    // Charge motions
    this.addInputSequence({
      name: 'charge_back',
      inputs: ['hold_left', 'right'],
      strictTiming: true,
      allowBuffering: false,
      maxBufferFrames: 0,
      difficulty: 3
    });

    this.addInputSequence({
      name: 'charge_down',
      inputs: ['hold_down', 'up'],
      strictTiming: true,
      allowBuffering: false,
      maxBufferFrames: 0,
      difficulty: 3
    });
  }

  private setupEventListeners(): void {
    this.app.on('input:frame_update', this.updateInputs.bind(this));
    this.app.on('input:sequence_detected', this.onSequenceDetected.bind(this));
  }

  public updateInputs(): void {
    this.previousInputs = { ...this.currentInputs };
    this.currentInputs = this.pollInputs();
    
    // Add to input history
    const inputFrame: InputFrame = {
      frame: this.inputBuffer.currentFrame,
      inputs: { ...this.currentInputs },
      timestamp: Date.now()
    };
    
    this.inputHistory.push(inputFrame);
    this.inputBuffer.inputs.push(inputFrame);
    
    // Maintain buffer size
    if (this.inputBuffer.inputs.length > this.inputBuffer.maxFrames) {
      this.inputBuffer.inputs.shift();
    }
    
    // Check for input sequences
    this.checkInputSequences();
    
    // Update input quality metrics
    this.updateInputQuality();
    
    this.inputBuffer.currentFrame++;
  }

  private pollInputs(): InputState {
    const inputs = this.createEmptyInputState();
    
    // Keyboard input polling
    if (typeof window !== 'undefined') {
      const keys = window as any;
      
      // Directional inputs
      inputs.up = keys.KeyW || keys.ArrowUp;
      inputs.down = keys.KeyS || keys.ArrowDown;
      inputs.left = keys.KeyA || keys.ArrowLeft;
      inputs.right = keys.KeyD || keys.ArrowRight;
      
      // Attack buttons
      inputs.light = keys.KeyJ || keys.Space;
      inputs.medium = keys.KeyK;
      inputs.heavy = keys.KeyL;
      inputs.special = keys.KeyI;
      
      // System buttons
      inputs.block = keys.KeyU;
      inputs.grab = keys.KeyO;
      inputs.dash = keys.KeyP;
      inputs.burst = keys.KeyB;
      
      // Pressure sensitivity (simulated)
      inputs.pressure = this.calculatePressure(inputs);
    }
    
    return inputs;
  }

  private calculatePressure(inputs: InputState): number {
    let pressure = 0;
    if (inputs.light) pressure += 0.3;
    if (inputs.medium) pressure += 0.6;
    if (inputs.heavy) pressure += 1.0;
    if (inputs.special) pressure += 0.8;
    return Math.min(pressure, 1.0);
  }

  private checkInputSequences(): void {
    for (const [name, sequence] of this.inputSequences) {
      if (this.isSequenceInputted(sequence)) {
        this.app.fire('input:sequence_detected', { 
          sequence: name, 
          inputs: sequence.inputs,
          difficulty: sequence.difficulty
        });
      }
    }
  }

  private isSequenceInputted(sequence: InputSequence): boolean {
    const recentInputs = this.inputBuffer.inputs.slice(-sequence.maxBufferFrames);
    let inputIndex = 0;
    
    for (const frame of recentInputs) {
      const currentInput = this.getDirectionalInput(frame.inputs);
      
      if (currentInput === sequence.inputs[inputIndex]) {
        inputIndex++;
        if (inputIndex === sequence.inputs.length) {
          return true;
        }
      } else if (sequence.strictTiming && currentInput !== 'neutral') {
        // Reset if strict timing and wrong input
        inputIndex = 0;
      }
    }
    
    return false;
  }

  private getDirectionalInput(inputs: InputState): string {
    if (inputs.up && inputs.right) return 'up-right';
    if (inputs.up && inputs.left) return 'up-left';
    if (inputs.down && inputs.right) return 'down-right';
    if (inputs.down && inputs.left) return 'down-left';
    if (inputs.up) return 'up';
    if (inputs.down) return 'down';
    if (inputs.left) return 'left';
    if (inputs.right) return 'right';
    return 'neutral';
  }

  private updateInputQuality(): void {
    // Calculate input precision based on timing consistency
    const recentFrames = this.inputHistory.slice(-60); // Last second
    if (recentFrames.length < 10) return;
    
    let totalPrecision = 0;
    let totalConsistency = 0;
    
    for (let i = 1; i < recentFrames.length; i++) {
      const current = recentFrames[i];
      const previous = recentFrames[i - 1];
      
      // Calculate precision based on input changes
      const inputChanges = this.countInputChanges(previous.inputs, current.inputs);
      const expectedChanges = this.getExpectedInputChanges(previous.inputs, current.inputs);
      
      if (expectedChanges > 0) {
        totalPrecision += inputChanges / expectedChanges;
      }
      
      // Calculate consistency based on frame timing
      const frameDelta = current.timestamp - previous.timestamp;
      const expectedDelta = 1000 / 60; // 60fps
      const timingError = Math.abs(frameDelta - expectedDelta) / expectedDelta;
      totalConsistency += 1 - timingError;
    }
    
    this.inputPrecision = Math.max(0, Math.min(1, totalPrecision / (recentFrames.length - 1)));
    this.inputConsistency = Math.max(0, Math.min(1, totalConsistency / (recentFrames.length - 1)));
    
    // Update input streak
    if (this.inputPrecision > 0.8) {
      this.inputStreak++;
    } else {
      this.inputStreak = 0;
    }
  }

  private countInputChanges(prev: InputState, curr: InputState): number {
    let changes = 0;
    if (prev.light !== curr.light) changes++;
    if (prev.medium !== curr.medium) changes++;
    if (prev.heavy !== curr.heavy) changes++;
    if (prev.special !== curr.special) changes++;
    if (prev.block !== curr.block) changes++;
    if (prev.grab !== curr.grab) changes++;
    if (prev.dash !== curr.dash) changes++;
    if (prev.burst !== curr.burst) changes++;
    return changes;
  }

  private getExpectedInputChanges(prev: InputState, curr: InputState): number {
    // This would be based on game state and expected inputs
    return 1; // Simplified for now
  }

  public addInputSequence(sequence: InputSequence): void {
    this.inputSequences.set(sequence.name, sequence);
  }

  public getInputBuffer(): InputFrame[] {
    return [...this.inputBuffer.inputs];
  }

  public getCurrentInputs(): InputState {
    return { ...this.currentInputs };
  }

  public getInputQuality(): { precision: number; consistency: number; streak: number } {
    return {
      precision: this.inputPrecision,
      consistency: this.inputConsistency,
      streak: this.inputStreak
    };
  }

  public isInputPressed(input: keyof InputState): boolean {
    return this.currentInputs[input] && !this.previousInputs[input];
  }

  public isInputHeld(input: keyof InputState): boolean {
    return this.currentInputs[input] && this.previousInputs[input];
  }

  public isInputReleased(input: keyof InputState): boolean {
    return !this.currentInputs[input] && this.previousInputs[input];
  }

  public getInputDuration(input: keyof InputState): number {
    let duration = 0;
    for (let i = this.inputHistory.length - 1; i >= 0; i--) {
      if (this.inputHistory[i].inputs[input]) {
        duration++;
      } else {
        break;
      }
    }
    return duration;
  }

  public onSequenceDetected(event: any): void {
    const { sequence, inputs, difficulty } = event;
    console.log(`Input sequence detected: ${sequence}`, inputs);
    
    // Fire event for combo system
    this.app.fire('combo:sequence_input', { 
      sequence, 
      inputs, 
      difficulty,
      precision: this.inputPrecision,
      consistency: this.inputConsistency
    });
  }

  public destroy(): void {
    this.inputHistory = [];
    this.inputSequences.clear();
    this.frameData.clear();
  }
}