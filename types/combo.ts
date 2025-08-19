import { PlayerAction } from './input';

export interface ComboStep {
  action: PlayerAction;
  timingWindow?: number; // in frames
}

export interface ComboTrial {
  id: string;
  characterId: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  combo: ComboStep[];
}
