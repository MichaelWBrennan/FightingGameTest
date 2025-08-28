import * as pc from 'playcanvas';
import { CharacterConfig, CharacterData, AnimationData } from '../../../types/character';

export class ProceduralFrameGenerator {
	generateForCharacter(config: CharacterConfig): CharacterConfig {
		const updated: CharacterConfig = { ...config } as CharacterConfig;
		const animations: Record<string, AnimationData> = updated.animations || {};

		// Expand moves into animations if not present
		const moveGroups = [updated.moves as any, (updated as any).normals, (updated as any).specials, (updated as any).supers];
		for (const group of moveGroups) {
			if (!group) continue;
			for (const [name, move] of Object.entries<any>(group)) {
				const key = `move_${name}`;
				if (!animations[key]) {
					const total = (move.startupFrames || move.startup || 0) + (move.activeFrames || move.active || 0) + (move.recoveryFrames || move.recovery || 0);
					animations[key] = {
						frameCount: Math.max(1, total || 5),
						duration: Math.max(83, (total || 5) * 16.6),
						loop: false
					};
				}
			}
		}
		(updated as any).animations = animations;
		return updated;
	}
}