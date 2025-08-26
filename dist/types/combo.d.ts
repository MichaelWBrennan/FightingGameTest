import { PlayerAction } from './input';
export interface ComboStep {
    action: PlayerAction;
    timingWindow?: number;
}
export interface ComboTrial {
    id: string;
    characterId: string;
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    combo: ComboStep[];
}
//# sourceMappingURL=combo.d.ts.map