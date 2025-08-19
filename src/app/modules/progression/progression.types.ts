export interface Mastery {
  userId: string;
  characterId: string;
  level: number;
  xp: number;
  prestige: number;
  unlockedCosmetics: string[];
}

export interface Objective {
  id: string;
  userId: string;
  description: string;
  xpReward: number;
  isComplete: boolean;
  isDaily: boolean;
  isWeekly: boolean;
}

export interface XPGrant {
  userId: string;
  characterId?: string;
  amount: number;
  reason: string;
}
