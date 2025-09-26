export interface ProcStageOptions {
	seed?: number;
	theme?: 'training' | 'gothic' | 'urban' | 'arcane_tower' | 'divine_cathedral' | 'elemental_realm' | 'shadow_keep' | 'nature_sanctuary' | 'crystal_cavern' | 'void_dimension' | 'celestial_plane' | 'infernal_abyss' | 'primal_forest';
	size?: 'small' | 'medium' | 'large' | 'huge';
	atmosphere?: 'peaceful' | 'tense' | 'mysterious' | 'epic' | 'intimate';
	hazards?: boolean;
	interactiveElements?: number;
	weather?: 'none' | 'rain' | 'snow' | 'fog' | 'storm' | 'magical';
	timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night' | 'eternal';
}

export class ProceduralStageGenerator {
	private rng: () => number;

	constructor(seed: number = Date.now()) {
		this.rng = mulberry32(seed >>> 0);
	}

	generate(opts: ProcStageOptions = {}): any {
		const theme = opts.theme || 'training';
		const size = opts.size || 'medium';
		const atmosphere = opts.atmosphere || 'peaceful';
		const hazards = opts.hazards || false;
		const interactiveElements = opts.interactiveElements || 0;
		const weather = opts.weather || 'none';
		const timeOfDay = opts.timeOfDay || 'day';

		// Generate base stage structure
		let stage: any;
		switch (theme) {
			case 'urban':
				stage = this.urban();
				break;
			case 'gothic':
				stage = this.gothic();
				break;
			case 'arcane_tower':
				stage = this.arcaneTower();
				break;
			case 'divine_cathedral':
				stage = this.divineCathedral();
				break;
			case 'elemental_realm':
				stage = this.elementalRealm();
				break;
			case 'shadow_keep':
				stage = this.shadowKeep();
				break;
			case 'nature_sanctuary':
				stage = this.natureSanctuary();
				break;
			case 'crystal_cavern':
				stage = this.crystalCavern();
				break;
			case 'void_dimension':
				stage = this.voidDimension();
				break;
			case 'celestial_plane':
				stage = this.celestialPlane();
				break;
			case 'infernal_abyss':
				stage = this.infernalAbyss();
				break;
			case 'primal_forest':
				stage = this.primalForest();
				break;
			default:
				stage = this.training();
		}

		// Apply size scaling
		stage = this.applySizeScaling(stage, size);

		// Apply atmosphere effects
		stage = this.applyAtmosphere(stage, atmosphere);

		// Add hazards if enabled
		if (hazards) {
			stage = this.addHazards(stage, theme);
		}

		// Add interactive elements
		if (interactiveElements > 0) {
			stage = this.addInteractiveElements(stage, interactiveElements, theme);
		}

		// Apply weather effects
		if (weather !== 'none') {
			stage = this.applyWeather(stage, weather);
		}

		// Apply time of day
		stage = this.applyTimeOfDay(stage, timeOfDay);

		// Add procedural details
		stage = this.addProceduralDetails(stage, theme);

		return stage;
	}

	private training(): any {
		return {
			name: 'Training (Procedural)',
			layers: {
				skybox: { type: 'gradient', elements: [] },
				farBackground: { type: 'mountains', elements: this.mountains(3) },
				midBackground: { type: 'buildings', elements: this.buildings(4) },
				nearBackground: { type: 'trees', elements: this.trees(3) },
				playground: { type: 'stage_floor', elements: [{ type: 'platform', x: 0, y: -5, width: 40, height: 2 }] }
			}
		};
	}

	private gothic(): any {
		return {
			name: 'Gothic (Procedural)',
			layers: {
				skybox: { type: 'stormy_sky', elements: [{ type: 'plane', name: 'stormy_sky' }] },
				farBackground: { type: 'mountains', elements: this.mountains(2) },
				midBackground: { type: 'castle', elements: this.buildings(3) },
				nearBackground: { type: 'gargoyles', elements: this.trees(2) },
				playground: { type: 'cobblestone', elements: [{ type: 'platform', x: 0, y: -5, width: 40, height: 2 }] }
			}
		};
	}

	private urban(): any {
		return {
			name: 'Urban (Procedural)',
			layers: {
				skybox: { type: 'cityscape', elements: [] },
				farBackground: { type: 'cityscape', elements: this.buildings(5) },
				midBackground: { type: 'street', elements: this.buildings(3) },
				nearBackground: { type: 'crowd', elements: this.buildings(2) },
				playground: { type: 'street_stage', elements: [{ type: 'asphalt', x: 0, y: -5, width: 50, height: 3 }] }
			}
		};
	}

	private mountains(n: number) {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) arr.push({ type: 'mountain', x: (i - n/2) * 100, y: -20 + this.rand(-5,5), width: this.rand(30,50), height: this.rand(20,30), color: '#4A5568' });
		return arr;
	}
	private buildings(n: number) {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) arr.push({ type: 'building', x: (i - n/2) * 80, y: -10, width: this.rand(20,60), height: this.rand(40,120), color: '#6B7280' });
		return arr;
	}
	private trees(n: number) {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) arr.push({ type: 'tree', x: (i - n/2) * 60, y: -6, scale: this.rand(1.0, 2.0), sway: true });
		return arr;
	}
	// Fantasy Stage Generators
	private arcaneTower(): any {
		return {
			name: 'Arcane Tower (Procedural)',
			layers: {
				skybox: { type: 'mystical_sky', elements: this.mysticalSky() },
				farBackground: { type: 'floating_islands', elements: this.floatingIslands(3) },
				midBackground: { type: 'tower_structure', elements: this.towerStructures(2) },
				nearBackground: { type: 'magical_objects', elements: this.magicalObjects(4) },
				playground: { type: 'arcane_platform', elements: this.arcanePlatform() }
			},
			lighting: {
				type: 'mystical',
				color: '#8A2BE2',
				intensity: 0.8,
				shadows: true
			},
			particles: {
				sparkles: this.generateSparkles(20),
				magicOrbs: this.generateMagicOrbs(8)
			}
		};
	}

	private divineCathedral(): any {
		return {
			name: 'Divine Cathedral (Procedural)',
			layers: {
				skybox: { type: 'heavenly_sky', elements: this.heavenlySky() },
				farBackground: { type: 'celestial_clouds', elements: this.celestialClouds(4) },
				midBackground: { type: 'cathedral_structure', elements: this.cathedralStructures(3) },
				nearBackground: { type: 'divine_statues', elements: this.divineStatues(3) },
				playground: { type: 'sacred_ground', elements: this.sacredGround() }
			},
			lighting: {
				type: 'divine',
				color: '#FFD700',
				intensity: 1.0,
				shadows: true
			},
			particles: {
				lightRays: this.generateLightRays(12),
				divineGlow: this.generateDivineGlow(6)
			}
		};
	}

	private elementalRealm(): any {
		return {
			name: 'Elemental Realm (Procedural)',
			layers: {
				skybox: { type: 'elemental_sky', elements: this.elementalSky() },
				farBackground: { type: 'elemental_mountains', elements: this.elementalMountains(4) },
				midBackground: { type: 'elemental_structures', elements: this.elementalStructures(3) },
				nearBackground: { type: 'elemental_effects', elements: this.elementalEffects(5) },
				playground: { type: 'elemental_platform', elements: this.elementalPlatform() }
			},
			lighting: {
				type: 'elemental',
				color: this.getElementalColor(),
				intensity: 0.9,
				shadows: true
			},
			particles: {
				elementalParticles: this.generateElementalParticles(15),
				elementalSwirls: this.generateElementalSwirls(6)
			}
		};
	}

	private shadowKeep(): any {
		return {
			name: 'Shadow Keep (Procedural)',
			layers: {
				skybox: { type: 'shadowy_sky', elements: this.shadowySky() },
				farBackground: { type: 'dark_mountains', elements: this.darkMountains(3) },
				midBackground: { type: 'keep_structure', elements: this.keepStructures(2) },
				nearBackground: { type: 'shadow_creatures', elements: this.shadowCreatures(4) },
				playground: { type: 'shadow_platform', elements: this.shadowPlatform() }
			},
			lighting: {
				type: 'shadowy',
				color: '#4B0082',
				intensity: 0.3,
				shadows: true
			},
			particles: {
				shadowMist: this.generateShadowMist(10),
				darkOrbs: this.generateDarkOrbs(6)
			}
		};
	}

	private natureSanctuary(): any {
		return {
			name: 'Nature Sanctuary (Procedural)',
			layers: {
				skybox: { type: 'natural_sky', elements: this.naturalSky() },
				farBackground: { type: 'forest_hills', elements: this.forestHills(4) },
				midBackground: { type: 'ancient_trees', elements: this.ancientTrees(5) },
				nearBackground: { type: 'wildlife', elements: this.wildlife(6) },
				playground: { type: 'natural_ground', elements: this.naturalGround() }
			},
			lighting: {
				type: 'natural',
				color: '#90EE90',
				intensity: 0.7,
				shadows: true
			},
			particles: {
				leaves: this.generateLeaves(25),
				pollen: this.generatePollen(15)
			}
		};
	}

	private crystalCavern(): any {
		return {
			name: 'Crystal Cavern (Procedural)',
			layers: {
				skybox: { type: 'cavern_ceiling', elements: this.cavernCeiling() },
				farBackground: { type: 'crystal_formations', elements: this.crystalFormations(6) },
				midBackground: { type: 'crystal_clusters', elements: this.crystalClusters(4) },
				nearBackground: { type: 'gem_stalactites', elements: this.gemStalactites(8) },
				playground: { type: 'crystal_floor', elements: this.crystalFloor() }
			},
			lighting: {
				type: 'crystal',
				color: '#FF69B4',
				intensity: 0.8,
				shadows: true
			},
			particles: {
				crystalShards: this.generateCrystalShards(20),
				gemSparkles: this.generateGemSparkles(12)
			}
		};
	}

	private voidDimension(): any {
		return {
			name: 'Void Dimension (Procedural)',
			layers: {
				skybox: { type: 'void_space', elements: this.voidSpace() },
				farBackground: { type: 'void_structures', elements: this.voidStructures(3) },
				midBackground: { type: 'dimensional_portals', elements: this.dimensionalPortals(2) },
				nearBackground: { type: 'void_entities', elements: this.voidEntities(4) },
				playground: { type: 'void_platform', elements: this.voidPlatform() }
			},
			lighting: {
				type: 'void',
				color: '#000000',
				intensity: 0.2,
				shadows: false
			},
			particles: {
				voidParticles: this.generateVoidParticles(15),
				dimensionRifts: this.generateDimensionRifts(3)
			}
		};
	}

	private celestialPlane(): any {
		return {
			name: 'Celestial Plane (Procedural)',
			layers: {
				skybox: { type: 'starry_sky', elements: this.starrySky() },
				farBackground: { type: 'celestial_bodies', elements: this.celestialBodies(5) },
				midBackground: { type: 'heavenly_structures', elements: this.heavenlyStructures(3) },
				nearBackground: { type: 'angelic_figures', elements: this.angelicFigures(4) },
				playground: { type: 'cloud_platform', elements: this.cloudPlatform() }
			},
			lighting: {
				type: 'celestial',
				color: '#87CEEB',
				intensity: 1.2,
				shadows: true
			},
			particles: {
				stars: this.generateStars(30),
				cosmicDust: this.generateCosmicDust(20)
			}
		};
	}

	private infernalAbyss(): any {
		return {
			name: 'Infernal Abyss (Procedural)',
			layers: {
				skybox: { type: 'hellish_sky', elements: this.hellishSky() },
				farBackground: { type: 'volcanic_mountains', elements: this.volcanicMountains(4) },
				midBackground: { type: 'infernal_structures', elements: this.infernalStructures(3) },
				nearBackground: { type: 'demonic_figures', elements: this.demonicFigures(5) },
				playground: { type: 'lava_platform', elements: this.lavaPlatform() }
			},
			lighting: {
				type: 'infernal',
				color: '#FF4500',
				intensity: 1.1,
				shadows: true
			},
			particles: {
				ember: this.generateEmber(25),
				lavaSparks: this.generateLavaSparks(15)
			}
		};
	}

	private primalForest(): any {
		return {
			name: 'Primal Forest (Procedural)',
			layers: {
				skybox: { type: 'wild_sky', elements: this.wildSky() },
				farBackground: { type: 'primal_mountains', elements: this.primalMountains(3) },
				midBackground: { type: 'ancient_forest', elements: this.ancientForest(6) },
				nearBackground: { type: 'primal_creatures', elements: this.primalCreatures(5) },
				playground: { type: 'wild_ground', elements: this.wildGround() }
			},
			lighting: {
				type: 'primal',
				color: '#8B4513',
				intensity: 0.6,
				shadows: true
			},
			particles: {
				forestDust: this.generateForestDust(20),
				primalSpirits: this.generatePrimalSpirits(8)
			}
		};
	}

	// Asset Generation Methods
	private mysticalSky(): any[] {
		return [{ type: 'mystical_sky', x: 0, y: 0, width: 200, height: 100, color: '#4B0082' }];
	}

	private floatingIslands(n: number): any[] {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) {
			arr.push({
				type: 'floating_island',
				x: (i - n/2) * 120,
				y: -30 + this.rand(-10, 10),
				width: this.rand(40, 80),
				height: this.rand(20, 40),
				color: '#8A2BE2'
			});
		}
		return arr;
	}

	private towerStructures(n: number): any[] {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) {
			arr.push({
				type: 'tower',
				x: (i - n/2) * 100,
				y: -20,
				width: this.rand(30, 60),
				height: this.rand(60, 120),
				color: '#6A0DAD'
			});
		}
		return arr;
	}

	private magicalObjects(n: number): any[] {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) {
			arr.push({
				type: 'magical_object',
				x: (i - n/2) * 80,
				y: -10 + this.rand(-5, 5),
				scale: this.rand(0.8, 1.5),
				objectType: this.getRandomMagicalObject()
			});
		}
		return arr;
	}

	private arcanePlatform(): any[] {
		return [{
			type: 'arcane_platform',
			x: 0,
			y: -5,
			width: 50,
			height: 3,
			color: '#8A2BE2',
			pattern: 'arcane_circles'
		}];
	}

	private heavenlySky(): any[] {
		return [{ type: 'heavenly_sky', x: 0, y: 0, width: 200, height: 100, color: '#87CEEB' }];
	}

	private celestialClouds(n: number): any[] {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) {
			arr.push({
				type: 'celestial_cloud',
				x: (i - n/2) * 100,
				y: -40 + this.rand(-10, 10),
				width: this.rand(60, 100),
				height: this.rand(30, 50),
				color: '#FFFFFF'
			});
		}
		return arr;
	}

	private cathedralStructures(n: number): any[] {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) {
			arr.push({
				type: 'cathedral',
				x: (i - n/2) * 120,
				y: -25,
				width: this.rand(50, 80),
				height: this.rand(80, 140),
				color: '#F5F5DC'
			});
		}
		return arr;
	}

	private divineStatues(n: number): any[] {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) {
			arr.push({
				type: 'divine_statue',
				x: (i - n/2) * 90,
				y: -8,
				scale: this.rand(1.0, 2.0),
				statueType: this.getRandomDivineStatue()
			});
		}
		return arr;
	}

	private sacredGround(): any[] {
		return [{
			type: 'sacred_ground',
			x: 0,
			y: -5,
			width: 50,
			height: 3,
			color: '#FFD700',
			pattern: 'divine_symbols'
		}];
	}

	// Size scaling
	private applySizeScaling(stage: any, size: string): any {
		const scaleFactors: Record<string, number> = {
			small: 0.7,
			medium: 1.0,
			large: 1.5,
			huge: 2.0
		};
		
		const scale = scaleFactors[size] || 1.0;
		
		// Scale all elements
		Object.values(stage.layers).forEach((layer: any) => {
			if (layer.elements) {
				layer.elements.forEach((element: any) => {
					element.x *= scale;
					element.y *= scale;
					element.width *= scale;
					element.height *= scale;
					if (element.scale) element.scale *= scale;
				});
			}
		});
		
		return stage;
	}

	// Atmosphere effects
	private applyAtmosphere(stage: any, atmosphere: string): any {
		stage.atmosphere = {
			type: atmosphere,
			effects: this.getAtmosphereEffects(atmosphere)
		};
		return stage;
	}

	private getAtmosphereEffects(atmosphere: string): any[] {
		const effects: Record<string, any[]> = {
			peaceful: [{ type: 'gentle_breeze', intensity: 0.3 }],
			tense: [{ type: 'electric_charge', intensity: 0.7 }],
			mysterious: [{ type: 'mystical_mist', intensity: 0.5 }],
			epic: [{ type: 'dramatic_lighting', intensity: 1.0 }],
			intimate: [{ type: 'soft_glow', intensity: 0.4 }]
		};
		return effects[atmosphere] || [];
	}

	// Hazards
	private addHazards(stage: any, theme: string): any {
		stage.hazards = this.generateHazards(theme);
		return stage;
	}

	private generateHazards(theme: string): any[] {
		const hazardCount = Math.floor(this.rand(2, 5));
		const hazards: any[] = [];
		
		for (let i = 0; i < hazardCount; i++) {
			hazards.push({
				type: this.getRandomHazard(theme),
				x: this.rand(-20, 20),
				y: this.rand(-10, 10),
				damage: this.rand(10, 30),
				active: this.rand(0, 1) > 0.5
			});
		}
		
		return hazards;
	}

	private getRandomHazard(theme: string): string {
		const hazards: Record<string, string[]> = {
			arcane_tower: ['magic_trap', 'energy_field', 'arcane_mine'],
			divine_cathedral: ['holy_ground', 'divine_judgment', 'sacred_fire'],
			elemental_realm: ['lava_pool', 'ice_spike', 'lightning_storm'],
			shadow_keep: ['shadow_trap', 'dark_portal', 'void_creature'],
			nature_sanctuary: ['thorn_bush', 'poison_cloud', 'wild_animal'],
			crystal_cavern: ['crystal_spike', 'gem_explosion', 'crystal_trap'],
			void_dimension: ['void_rift', 'dimensional_tear', 'null_field'],
			celestial_plane: ['divine_lightning', 'angelic_judgment', 'cosmic_storm'],
			infernal_abyss: ['lava_geyser', 'demon_spawn', 'hellfire'],
			primal_forest: ['beast_attack', 'wild_magic', 'nature_wrath']
		};
		
		const themeHazards = hazards[theme] || ['generic_hazard'];
		return themeHazards[Math.floor(this.rand(0, themeHazards.length))];
	}

	// Interactive elements
	private addInteractiveElements(stage: any, count: number, theme: string): any {
		stage.interactiveElements = this.generateInteractiveElements(count, theme);
		return stage;
	}

	private generateInteractiveElements(count: number, theme: string): any[] {
		const elements: any[] = [];
		
		for (let i = 0; i < count; i++) {
			elements.push({
				type: this.getRandomInteractiveElement(theme),
				x: this.rand(-25, 25),
				y: this.rand(-15, 15),
				interaction: this.getRandomInteraction(),
				effect: this.getRandomEffect()
			});
		}
		
		return elements;
	}

	private getRandomInteractiveElement(theme: string): string {
		const elements: Record<string, string[]> = {
			arcane_tower: ['magic_crystal', 'spell_book', 'arcane_altar'],
			divine_cathedral: ['holy_relic', 'prayer_altar', 'divine_font'],
			elemental_realm: ['elemental_shrine', 'crystal_orb', 'elemental_font'],
			shadow_keep: ['shadow_altar', 'dark_crystal', 'void_portal'],
			nature_sanctuary: ['druid_circle', 'nature_shrine', 'wild_crystal'],
			crystal_cavern: ['gem_altar', 'crystal_pedestal', 'mineral_vein'],
			void_dimension: ['void_anchor', 'dimensional_gate', 'null_crystal'],
			celestial_plane: ['star_altar', 'cosmic_crystal', 'heavenly_font'],
			infernal_abyss: ['demon_altar', 'hellfire_crystal', 'infernal_shrine'],
			primal_forest: ['beast_totem', 'wild_shrine', 'primal_crystal']
		};
		
		const themeElements = elements[theme] || ['generic_element'];
		return themeElements[Math.floor(this.rand(0, themeElements.length))];
	}

	private getRandomInteraction(): string {
		const interactions = ['activate', 'collect', 'destroy', 'heal', 'buff', 'debuff'];
		return interactions[Math.floor(this.rand(0, interactions.length))];
	}

	private getRandomEffect(): string {
		const effects = ['health_boost', 'damage_boost', 'speed_boost', 'magic_boost', 'shield', 'invisibility'];
		return effects[Math.floor(this.rand(0, effects.length))];
	}

	// Weather effects
	private applyWeather(stage: any, weather: string): any {
		stage.weather = {
			type: weather,
			particles: this.generateWeatherParticles(weather),
			effects: this.getWeatherEffects(weather)
		};
		return stage;
	}

	private generateWeatherParticles(weather: string): any[] {
		const particleCount = Math.floor(this.rand(20, 50));
		const particles: any[] = [];
		
		for (let i = 0; i < particleCount; i++) {
			particles.push({
				type: weather,
				x: this.rand(-50, 50),
				y: this.rand(-30, 30),
				size: this.rand(1, 5),
				speed: this.rand(0.5, 2.0),
				lifetime: this.rand(1000, 5000)
			});
		}
		
		return particles;
	}

	private getWeatherEffects(weather: string): any[] {
		const effects: Record<string, any[]> = {
			rain: [{ type: 'wet_surfaces', intensity: 0.8 }],
			snow: [{ type: 'cold_effect', intensity: 0.6 }],
			fog: [{ type: 'visibility_reduction', intensity: 0.4 }],
			storm: [{ type: 'lightning_strikes', intensity: 1.0 }],
			magical: [{ type: 'magic_enhancement', intensity: 0.7 }]
		};
		return effects[weather] || [];
	}

	// Time of day
	private applyTimeOfDay(stage: any, timeOfDay: string): any {
		stage.timeOfDay = {
			type: timeOfDay,
			lighting: this.getTimeOfDayLighting(timeOfDay),
			colors: this.getTimeOfDayColors(timeOfDay)
		};
		return stage;
	}

	private getTimeOfDayLighting(timeOfDay: string): any {
		const lighting: Record<string, any> = {
			dawn: { intensity: 0.6, color: '#FFA500' },
			day: { intensity: 1.0, color: '#FFFFFF' },
			dusk: { intensity: 0.7, color: '#FF6347' },
			night: { intensity: 0.3, color: '#4169E1' },
			eternal: { intensity: 0.8, color: '#8A2BE2' }
		};
		return lighting[timeOfDay] || lighting.day;
	}

	private getTimeOfDayColors(timeOfDay: string): any {
		const colors: Record<string, any> = {
			dawn: { primary: '#FFA500', secondary: '#FFD700' },
			day: { primary: '#87CEEB', secondary: '#FFFFFF' },
			dusk: { primary: '#FF6347', secondary: '#FF4500' },
			night: { primary: '#191970', secondary: '#4169E1' },
			eternal: { primary: '#4B0082', secondary: '#8A2BE2' }
		};
		return colors[timeOfDay] || colors.day;
	}

	// Procedural details
	private addProceduralDetails(stage: any, theme: string): any {
		stage.details = {
			decoration: this.generateDecorations(theme),
			ambient: this.generateAmbientEffects(theme),
			sound: this.generateSoundEffects(theme)
		};
		return stage;
	}

	private generateDecorations(theme: string): any[] {
		const decorationCount = Math.floor(this.rand(5, 15));
		const decorations: any[] = [];
		
		for (let i = 0; i < decorationCount; i++) {
			decorations.push({
				type: this.getRandomDecoration(theme),
				x: this.rand(-30, 30),
				y: this.rand(-20, 20),
				scale: this.rand(0.5, 1.5),
				rotation: this.rand(0, 360)
			});
		}
		
		return decorations;
	}

	private getRandomDecoration(theme: string): string {
		const decorations: Record<string, string[]> = {
			arcane_tower: ['magic_rune', 'crystal_orb', 'arcane_symbol'],
			divine_cathedral: ['holy_symbol', 'divine_light', 'angelic_feather'],
			elemental_realm: ['elemental_crystal', 'nature_emblem', 'primal_totem'],
			shadow_keep: ['shadow_rune', 'dark_crystal', 'void_symbol'],
			nature_sanctuary: ['leaf_cluster', 'flower_petal', 'wooden_carving'],
			crystal_cavern: ['gem_fragment', 'crystal_shard', 'mineral_formation'],
			void_dimension: ['void_symbol', 'dimensional_rift', 'null_crystal'],
			celestial_plane: ['star_fragment', 'cosmic_dust', 'heavenly_light'],
			infernal_abyss: ['demon_skull', 'hellfire_ember', 'infernal_rune'],
			primal_forest: ['beast_fang', 'wild_flower', 'primal_totem']
		};
		
		const themeDecorations = decorations[theme] || ['generic_decoration'];
		return themeDecorations[Math.floor(this.rand(0, themeDecorations.length))];
	}

	private generateAmbientEffects(theme: string): any[] {
		return [{
			type: 'ambient_' + theme,
			intensity: this.rand(0.3, 0.8),
			duration: this.rand(5000, 15000)
		}];
	}

	private generateSoundEffects(theme: string): any[] {
		return [{
			type: 'ambient_sound',
			sound: theme + '_ambient',
			volume: this.rand(0.2, 0.6),
			loop: true
		}];
	}

	// Helper methods for specific themes
	private getElementalColor(): string {
		const colors = ['#FF4500', '#00BFFF', '#32CD32', '#FFD700'];
		return colors[Math.floor(this.rand(0, colors.length))];
	}

	private getRandomMagicalObject(): string {
		const objects = ['crystal_ball', 'magic_staff', 'spell_book', 'arcane_crystal', 'mystical_orb'];
		return objects[Math.floor(this.rand(0, objects.length))];
	}

	private getRandomDivineStatue(): string {
		const statues = ['angel_statue', 'divine_warrior', 'holy_saint', 'celestial_being'];
		return statues[Math.floor(this.rand(0, statues.length))];
	}

	// Particle generation methods
	private generateSparkles(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-50, 50),
				y: this.rand(-30, 30),
				size: this.rand(1, 3),
				color: '#FFD700',
				lifetime: this.rand(1000, 3000)
			});
		}
		return particles;
	}

	private generateMagicOrbs(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-40, 40),
				y: this.rand(-20, 20),
				size: this.rand(5, 15),
				color: '#8A2BE2',
				lifetime: this.rand(2000, 8000)
			});
		}
		return particles;
	}

	private generateLightRays(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-30, 30),
				y: this.rand(-40, 40),
				width: this.rand(2, 8),
				height: this.rand(20, 60),
				color: '#FFD700',
				opacity: this.rand(0.3, 0.8)
			});
		}
		return particles;
	}

	private generateDivineGlow(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-35, 35),
				y: this.rand(-25, 25),
				size: this.rand(8, 20),
				color: '#FFFFFF',
				intensity: this.rand(0.5, 1.0)
			});
		}
		return particles;
	}

	private generateElementalParticles(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-45, 45),
				y: this.rand(-25, 25),
				size: this.rand(2, 6),
				color: this.getElementalColor(),
				lifetime: this.rand(1500, 4000)
			});
		}
		return particles;
	}

	private generateElementalSwirls(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-40, 40),
				y: this.rand(-20, 20),
				size: this.rand(10, 25),
				color: this.getElementalColor(),
				rotation: this.rand(0, 360),
				speed: this.rand(0.5, 2.0)
			});
		}
		return particles;
	}

	private generateShadowMist(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-50, 50),
				y: this.rand(-30, 30),
				size: this.rand(15, 30),
				color: '#4B0082',
				opacity: this.rand(0.2, 0.6),
				lifetime: this.rand(3000, 8000)
			});
		}
		return particles;
	}

	private generateDarkOrbs(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-35, 35),
				y: this.rand(-20, 20),
				size: this.rand(8, 18),
				color: '#000000',
				intensity: this.rand(0.3, 0.8)
			});
		}
		return particles;
	}

	private generateLeaves(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-50, 50),
				y: this.rand(-40, 40),
				size: this.rand(3, 8),
				color: '#32CD32',
				rotation: this.rand(0, 360),
				fallSpeed: this.rand(0.5, 1.5)
			});
		}
		return particles;
	}

	private generatePollen(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-40, 40),
				y: this.rand(-30, 30),
				size: this.rand(1, 3),
				color: '#FFD700',
				driftSpeed: this.rand(0.2, 0.8)
			});
		}
		return particles;
	}

	private generateCrystalShards(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-45, 45),
				y: this.rand(-25, 25),
				size: this.rand(2, 6),
				color: '#FF69B4',
				sparkle: true
			});
		}
		return particles;
	}

	private generateGemSparkles(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-40, 40),
				y: this.rand(-20, 20),
				size: this.rand(1, 4),
				color: '#FF1493',
				intensity: this.rand(0.7, 1.0)
			});
		}
		return particles;
	}

	private generateVoidParticles(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-50, 50),
				y: this.rand(-30, 30),
				size: this.rand(1, 4),
				color: '#000000',
				opacity: this.rand(0.1, 0.5)
			});
		}
		return particles;
	}

	private generateDimensionRifts(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-30, 30),
				y: this.rand(-20, 20),
				width: this.rand(10, 30),
				height: this.rand(20, 50),
				color: '#8A2BE2',
				opacity: this.rand(0.3, 0.7)
			});
		}
		return particles;
	}

	private generateStars(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-60, 60),
				y: this.rand(-40, 40),
				size: this.rand(1, 3),
				color: '#FFFFFF',
				twinkle: true
			});
		}
		return particles;
	}

	private generateCosmicDust(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-50, 50),
				y: this.rand(-30, 30),
				size: this.rand(2, 5),
				color: '#87CEEB',
				drift: true
			});
		}
		return particles;
	}

	private generateEmber(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-45, 45),
				y: this.rand(-25, 25),
				size: this.rand(2, 6),
				color: '#FF4500',
				riseSpeed: this.rand(0.5, 1.5)
			});
		}
		return particles;
	}

	private generateLavaSparks(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-40, 40),
				y: this.rand(-20, 20),
				size: this.rand(1, 4),
				color: '#FF6347',
				speed: this.rand(1.0, 3.0)
			});
		}
		return particles;
	}

	private generateForestDust(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-50, 50),
				y: this.rand(-30, 30),
				size: this.rand(1, 4),
				color: '#8B4513',
				drift: true
			});
		}
		return particles;
	}

	private generatePrimalSpirits(count: number): any[] {
		const particles: any[] = [];
		for (let i = 0; i < count; i++) {
			particles.push({
				x: this.rand(-35, 35),
				y: this.rand(-20, 20),
				size: this.rand(8, 20),
				color: '#8B4513',
				spirit: true
			});
		}
		return particles;
	}

	// Additional helper methods for missing theme generators
	private elementalSky(): any[] { return [{ type: 'elemental_sky', x: 0, y: 0, width: 200, height: 100, color: '#00BFFF' }]; }
	private elementalMountains(n: number): any[] { return this.mountains(n); }
	private elementalStructures(n: number): any[] { return this.buildings(n); }
	private elementalEffects(n: number): any[] { return this.trees(n); }
	private elementalPlatform(): any[] { return [{ type: 'elemental_platform', x: 0, y: -5, width: 50, height: 3, color: '#00BFFF' }]; }
	
	private shadowySky(): any[] { return [{ type: 'shadowy_sky', x: 0, y: 0, width: 200, height: 100, color: '#4B0082' }]; }
	private darkMountains(n: number): any[] { return this.mountains(n); }
	private keepStructures(n: number): any[] { return this.buildings(n); }
	private shadowCreatures(n: number): any[] { return this.trees(n); }
	private shadowPlatform(): any[] { return [{ type: 'shadow_platform', x: 0, y: -5, width: 50, height: 3, color: '#4B0082' }]; }
	
	private naturalSky(): any[] { return [{ type: 'natural_sky', x: 0, y: 0, width: 200, height: 100, color: '#87CEEB' }]; }
	private forestHills(n: number): any[] { return this.mountains(n); }
	private ancientTrees(n: number): any[] { return this.trees(n); }
	private wildlife(n: number): any[] { return this.trees(n); }
	private naturalGround(): any[] { return [{ type: 'natural_ground', x: 0, y: -5, width: 50, height: 3, color: '#32CD32' }]; }
	
	private cavernCeiling(): any[] { return [{ type: 'cavern_ceiling', x: 0, y: 0, width: 200, height: 100, color: '#2F4F4F' }]; }
	private crystalFormations(n: number): any[] { return this.mountains(n); }
	private crystalClusters(n: number): any[] { return this.buildings(n); }
	private gemStalactites(n: number): any[] { return this.trees(n); }
	private crystalFloor(): any[] { return [{ type: 'crystal_floor', x: 0, y: -5, width: 50, height: 3, color: '#FF69B4' }]; }
	
	private voidSpace(): any[] { return [{ type: 'void_space', x: 0, y: 0, width: 200, height: 100, color: '#000000' }]; }
	private voidStructures(n: number): any[] { return this.buildings(n); }
	private dimensionalPortals(n: number): any[] { return this.trees(n); }
	private voidEntities(n: number): any[] { return this.trees(n); }
	private voidPlatform(): any[] { return [{ type: 'void_platform', x: 0, y: -5, width: 50, height: 3, color: '#000000' }]; }
	
	private starrySky(): any[] { return [{ type: 'starry_sky', x: 0, y: 0, width: 200, height: 100, color: '#191970' }]; }
	private celestialBodies(n: number): any[] { return this.mountains(n); }
	private heavenlyStructures(n: number): any[] { return this.buildings(n); }
	private angelicFigures(n: number): any[] { return this.trees(n); }
	private cloudPlatform(): any[] { return [{ type: 'cloud_platform', x: 0, y: -5, width: 50, height: 3, color: '#FFFFFF' }]; }
	
	private hellishSky(): any[] { return [{ type: 'hellish_sky', x: 0, y: 0, width: 200, height: 100, color: '#FF4500' }]; }
	private volcanicMountains(n: number): any[] { return this.mountains(n); }
	private infernalStructures(n: number): any[] { return this.buildings(n); }
	private demonicFigures(n: number): any[] { return this.trees(n); }
	private lavaPlatform(): any[] { return [{ type: 'lava_platform', x: 0, y: -5, width: 50, height: 3, color: '#FF4500' }]; }
	
	private wildSky(): any[] { return [{ type: 'wild_sky', x: 0, y: 0, width: 200, height: 100, color: '#8B4513' }]; }
	private primalMountains(n: number): any[] { return this.mountains(n); }
	private ancientForest(n: number): any[] { return this.trees(n); }
	private primalCreatures(n: number): any[] { return this.trees(n); }
	private wildGround(): any[] { return [{ type: 'wild_ground', x: 0, y: -5, width: 50, height: 3, color: '#8B4513' }]; }

	private rand(min: number, max: number) { return min + (max - min) * this.rng(); }
}

function mulberry32(a: number) {
	return function() {
		a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}