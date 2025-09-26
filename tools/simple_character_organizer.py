#!/usr/bin/env python3
"""
Simple Character Organizer for Dark Fantasy Fighting Game
Organizes LPC assets and creates character configurations
"""

import json
import os
import shutil
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleCharacterOrganizer:
    def __init__(self, assets_dir="/workspace/assets/downloaded_assets"):
        self.assets_dir = Path(assets_dir)
        self.character_dir = self.assets_dir / "characters"
        self.output_dir = self.assets_dir / "organized_characters"
        self.mapping_file = self.assets_dir / "character_mapping.json"
        
        # Create output directory
        self.output_dir.mkdir(exist_ok=True)
        
        # Load character mapping
        with open(self.mapping_file, 'r') as f:
            self.mapping = json.load(f)
    
    def create_character_directories(self):
        """Create directories for each character"""
        logger.info("Creating character directories...")
        
        characters = self.mapping["characterAssetMapping"]
        
        for character_id in characters:
            char_dir = self.output_dir / character_id
            char_dir.mkdir(exist_ok=True)
            
            # Create subdirectories
            (char_dir / "sprites").mkdir(exist_ok=True)
            (char_dir / "animations").mkdir(exist_ok=True)
            (char_dir / "effects").mkdir(exist_ok=True)
            
            logger.info(f"Created directory for {character_id}")
    
    def create_character_configs(self):
        """Create character configuration files"""
        logger.info("Creating character configuration files...")
        
        characters = self.mapping["characterAssetMapping"]
        
        for character_id, char_data in characters.items():
            config = {
                "id": character_id,
                "displayName": char_data.get("displayName", character_id.replace("_", " ").title()),
                "archetype": char_data["archetype"],
                "theme": char_data["theme"],
                "colors": char_data.get("colors", {}),
                "assets": char_data["assets"],
                "spriteConfig": {
                    "size": "64x64",
                    "format": "PNG",
                    "hasAlpha": True,
                    "animationFrames": 13,
                    "directions": 4
                },
                "animations": {
                    "idle": {"frames": [0, 1, 2, 3], "speed": 8},
                    "walk": {"frames": [4, 5, 6, 7, 8, 9, 10, 11, 12], "speed": 12},
                    "attack": {"frames": [13, 14, 15], "speed": 20},
                    "special": {"frames": [16, 17, 18], "speed": 15},
                    "hurt": {"frames": [19, 20, 21], "speed": 8},
                    "victory": {"frames": [22, 23, 24], "speed": 6}
                },
                "magicalEffects": {
                    "primary": self.get_primary_effect(character_id),
                    "secondary": self.get_secondary_effect(character_id),
                    "particleEffects": self.get_particle_effects(character_id)
                }
            }
            
            # Save config
            config_path = self.output_dir / character_id / "character_config.json"
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            logger.info(f"Created config for {character_id}")
    
    def get_primary_effect(self, character_id):
        """Get primary magical effect for character"""
        effects_map = {
            "aethon_stormweaver": "lightning",
            "baelor_bladeheart": "divine_light",
            "caelum_elemental": "elemental_orb",
            "draven_shadowbane": "shadow_tendrils",
            "eldric_natureguard": "nature_growth",
            "fiona_crystalborn": "crystal_shards",
            "gareth_voidwalker": "void_portal",
            "helena_celestial": "divine_barrier",
            "ithil_primal": "primal_rage",
            "jareth_infernal": "fire_trail",
            "kira_arcane": "arcane_symbols",
            "luna_mystic": "ethereal_mist"
        }
        return effects_map.get(character_id, "magic_glow")
    
    def get_secondary_effect(self, character_id):
        """Get secondary magical effect for character"""
        effects_map = {
            "aethon_stormweaver": "speed_trail",
            "baelor_bladeheart": "strength_aura",
            "caelum_elemental": "elemental_circle",
            "draven_shadowbane": "dark_aura",
            "eldric_natureguard": "earth_spikes",
            "fiona_crystalborn": "prismatic_light",
            "gareth_voidwalker": "dark_energy",
            "helena_celestial": "healing_light",
            "ithil_primal": "beast_aura",
            "jareth_infernal": "infernal_speed",
            "kira_arcane": "magic_matrix",
            "luna_mystic": "lunar_glow"
        }
        return effects_map.get(character_id, "magic_aura")
    
    def get_particle_effects(self, character_id):
        """Get particle effects for character"""
        effects_map = {
            "aethon_stormweaver": ["lightning_bolts", "electrical_sparks", "storm_clouds"],
            "baelor_bladeheart": ["golden_particles", "divine_light", "holy_symbols"],
            "caelum_elemental": ["elemental_particles", "magic_orbs", "elemental_circles"],
            "draven_shadowbane": ["shadow_particles", "dark_smoke", "shadow_tendrils"],
            "eldric_natureguard": ["leaf_particles", "earth_chunks", "nature_energy"],
            "fiona_crystalborn": ["crystal_particles", "prismatic_light", "crystal_shards"],
            "gareth_voidwalker": ["void_particles", "dark_energy", "ethereal_mist"],
            "helena_celestial": ["divine_particles", "holy_light", "angel_wings"],
            "ithil_primal": ["beast_particles", "primal_energy", "wild_spirits"],
            "jareth_infernal": ["fire_particles", "infernal_flames", "heat_waves"],
            "kira_arcane": ["arcane_particles", "magic_symbols", "spell_circles"],
            "luna_mystic": ["mystical_particles", "lunar_energy", "ethereal_light"]
        }
        return effects_map.get(character_id, ["magic_particles"])
    
    def create_asset_manifest(self):
        """Create a manifest of all organized assets"""
        manifest = {
            "version": "1.0",
            "created": "2025-09-26",
            "game": "FightForge - Dark Fantasy Fighting Game",
            "characters": []
        }
        
        characters = self.mapping["characterAssetMapping"]
        
        for character_id, char_data in characters.items():
            char_info = {
                "id": character_id,
                "archetype": char_data["archetype"],
                "theme": char_data["theme"],
                "assets_required": list(char_data["assets"].keys()),
                "has_variations": "variations" in char_data,
                "magical_effects": {
                    "primary": self.get_primary_effect(character_id),
                    "secondary": self.get_secondary_effect(character_id)
                }
            }
            manifest["characters"].append(char_info)
        
        # Save manifest
        manifest_path = self.output_dir / "character_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Created character manifest: {manifest_path}")
    
    def create_integration_script(self):
        """Create a TypeScript integration script for PlayCanvas"""
        script_content = '''// Dark Fantasy Fighting Game - Character Integration
// Auto-generated character integration script

import { Character } from '../types/Character';
import { CharacterManager } from '../core/characters/CharacterManager';

export class LPCCharacterIntegration {
    private characterManager: CharacterManager;
    
    constructor(characterManager: CharacterManager) {
        this.characterManager = characterManager;
    }
    
    async loadFantasyWarriors(): Promise<Character[]> {
        const warriors = [
            'aethon_stormweaver',
            'baelor_bladeheart', 
            'caelum_elemental',
            'draven_shadowbane',
            'eldric_natureguard',
            'fiona_crystalborn',
            'gareth_voidwalker',
            'helena_celestial',
            'ithil_primal',
            'jareth_infernal',
            'kira_arcane',
            'luna_mystic'
        ];
        
        const characters: Character[] = [];
        
        for (const warriorId of warriors) {
            try {
                const character = await this.loadLPCCharacter(warriorId);
                characters.push(character);
                console.log(`Loaded fantasy warrior: ${warriorId}`);
            } catch (error) {
                console.error(`Failed to load ${warriorId}:`, error);
            }
        }
        
        return characters;
    }
    
    private async loadLPCCharacter(characterId: string): Promise<Character> {
        const configPath = `/assets/organized_characters/${characterId}/character_config.json`;
        const config = await this.loadJSON(configPath);
        
        return {
            id: characterId,
            displayName: config.displayName,
            archetype: config.archetype,
            theme: config.theme,
            colors: config.colors,
            spriteConfig: config.spriteConfig,
            animations: config.animations,
            magicalEffects: config.magicalEffects,
            frameData: this.getFrameDataForArchetype(config.archetype)
        };
    }
    
    private async loadJSON(path: string): Promise<any> {
        const response = await fetch(path);
        return await response.json();
    }
    
    private getFrameDataForArchetype(archetype: string): any {
        // Return frame data based on archetype
        const frameDataMap = {
            'rushdown': { speed: 1.2, damage: 0.9, range: 0.8 },
            'grappler': { speed: 0.8, damage: 1.3, range: 0.6 },
            'zoner': { speed: 0.9, damage: 1.1, range: 1.4 },
            'power': { speed: 0.7, damage: 1.5, range: 1.0 },
            'technical': { speed: 1.0, damage: 1.0, range: 1.0 },
            'mixup': { speed: 1.1, damage: 0.95, range: 0.9 },
            'aerial': { speed: 1.3, damage: 0.85, range: 1.1 },
            'defensive': { speed: 0.6, damage: 1.2, range: 0.7 },
            'allrounder': { speed: 1.0, damage: 1.0, range: 1.0 },
            'speed': { speed: 1.4, damage: 0.8, range: 1.0 },
            'complex': { speed: 0.9, damage: 1.1, range: 1.1 },
            'evasive': { speed: 1.2, damage: 0.9, range: 1.0 }
        };
        
        return frameDataMap[archetype] || frameDataMap['allrounder'];
    }
}

// Usage example:
// const integration = new LPCCharacterIntegration(characterManager);
// const warriors = await integration.loadFantasyWarriors();
'''
        
        script_path = self.output_dir / "LPCCharacterIntegration.ts"
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        logger.info(f"Created integration script: {script_path}")
    
    def create_readme(self):
        """Create a README for the organized assets"""
        readme_content = '''# Organized Fantasy Warriors
## Dark Fantasy Fighting Game Characters

This directory contains the organized character assets for the 12 fantasy warriors in FightForge.

### Character List

1. **Aethon Stormweaver** (Rushdown) - Lightning Speed Magic
2. **Baelor Bladeheart** (Grappler) - Divine Strength Blessing  
3. **Caelum Elemental** (Zoner) - Elemental Mastery
4. **Draven Shadowbane** (Power) - Shadow Magic
5. **Eldric Natureguard** (Technical) - Nature's Precision
6. **Fiona Crystalborn** (Mix-up) - Crystal Magic
7. **Gareth Voidwalker** (Aerial) - Void Manipulation
8. **Helena Celestial** (Defensive) - Divine Protection
9. **Ithil Primal** (All-rounder) - Primal Instincts
10. **Jareth Infernal** (Speed) - Infernal Agility
11. **Kira Arcane** (Complex) - Arcane Mastery
12. **Luna Mystic** (Evasive) - Mystical Evasion

### Directory Structure

Each character has:
- `character_config.json` - Character configuration and stats
- `sprites/` - Character sprite assets (to be populated)
- `animations/` - Animation data and frames
- `effects/` - Magical effect assets

### Integration

Use the `LPCCharacterIntegration.ts` script to load these characters into your game.

### Next Steps

1. Copy LPC sprite assets to each character's `sprites/` directory
2. Create fighting game animations from the base walk cycles
3. Implement magical effects for each character
4. Test integration with your existing character system
'''
        
        readme_path = self.output_dir / "README.md"
        with open(readme_path, 'w') as f:
            f.write(readme_content)
        
        logger.info(f"Created README: {readme_path}")
    
    def run(self):
        """Run the complete organization process"""
        logger.info("🎮 Organizing Dark Fantasy Fighting Game Characters...")
        
        try:
            # Create character directories
            self.create_character_directories()
            
            # Create character configurations
            self.create_character_configs()
            
            # Create asset manifest
            self.create_asset_manifest()
            
            # Create integration script
            self.create_integration_script()
            
            # Create README
            self.create_readme()
            
            logger.info("✅ Character organization complete!")
            logger.info(f"📁 Organized assets saved to: {self.output_dir}")
            
        except Exception as e:
            logger.error(f"❌ Error during organization: {e}")

def main():
    organizer = SimpleCharacterOrganizer()
    organizer.run()

if __name__ == "__main__":
    main()