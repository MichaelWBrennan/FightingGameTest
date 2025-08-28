import { CharacterData } from '../../../types/character';

export class DecompDataService {
  public async loadGroundTruthCharacter(): Promise<CharacterData | null> {
    try {
      const res = await fetch('/data/characters_decomp/sf3_ground_truth_seed.json');
      if (!res.ok) return null;
      const data = await res.json();
      return data as CharacterData;
    } catch {
      return null;
    }
  }
}

