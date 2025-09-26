import * as pc from 'playcanvas';
import type { CharacterConfig, AnimationData, AnimationFrame, HitboxFrame, HurtboxFrame } from '../../../types/character';

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
					const startup = (move.startupFrames || move.startup || 4) | 0;
					const active = (move.activeFrames || move.active || 2) | 0;
					const recovery = (move.recoveryFrames || move.recovery || 8) | 0;
					const total = Math.max(1, startup + active + recovery);
					animations[key] = {
						frameCount: total,
						duration: Math.max(83, total * 16.6),
						loop: false
					};
				}
				// Populate frames with basic hurtbox each frame and hitbox during active frames
				const anim = animations[key];
				if (!anim.frames || anim.frames.length === 0) {
					anim.frames = [] as AnimationFrame[];
					for (let i = 0; i < anim.frameCount; i++) {
						const frames: AnimationFrame = {
							index: i,
							duration: Math.max(1, Math.floor((anim.duration / anim.frameCount)))
						};
						// Default standing hurtbox (local units relative to character position)
						const hb: HurtboxFrame = { x: -0.4, y: 0.0, width: 0.8, height: 1.6, vulnerability: 1 };
						frames.hurtboxes = [hb];
						// Add a simple forward hitbox during active window
						if (i >= ((move.startupFrames || move.startup || 4) | 0) && i < (((move.startupFrames || move.startup || 4) | 0) + ((move.activeFrames || move.active || 2) | 0))) {
							const atkW = 0.7, atkH = 0.6;
							const hit: HitboxFrame = { x: 0.5, y: 0.5, width: atkW, height: atkH, damage: (move.damage || 40) | 0, hitstun: (move.hitstun || 10) | 0, blockstun: (move.blockstun || 6) | 0 } as any;
							frames.hitboxes = [hit];
						}
						anim.frames.push(frames);
					}
				}
			}
		}
		(updated as any).animations = animations;
		return updated;
	}
}