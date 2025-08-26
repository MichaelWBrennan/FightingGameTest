import { CoachingData } from './CoachOverlay';

export const dummyCoachingData: CoachingData = {
  matchupDatabase: new Map([
    ['blitz_vs_vanguard', {
      characterA: 'blitz',
      characterB: 'vanguard',
      advantageRating: 1,
      keyStrategies: ['Use your speed to stay out of Vanguard\'s range.', 'Punish Vanguard\'s slow moves with quick combos.'],
      commonMistakes: ['Don\'t get cornered.', 'Be careful of Vanguard\'s command grab.'],
      frameTraps: [],
      punishWindows: [],
    }],
  ]),
  characterTips: new Map(),
  situationalTips: new Map(),
  frameData: new Map(),
  playerProgress: {
    weaknesses: [],
    strengths: [],
    focusAreas: [],
    recentImprovements: [],
  },
};