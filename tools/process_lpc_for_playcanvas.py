#!/usr/bin/env python3
"""
Process LPC Assets for PlayCanvas
Converts LPC sprites to PlayCanvas-compatible format
"""

import json
import os
import shutil
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LPCToPlayCanvasProcessor:
    def __init__(self, lpc_dir="/workspace/assets/downloaded_assets/characters", 
                 output_dir="/workspace/assets/playcanvas_assets"):
        self.lpc_dir = Path(lpc_dir)
        self.output_dir = Path(output_dir)
        self.character_config = self.load_character_config()
        
        # Create output directories
        self.create_output_directories()
    
    def load_character_config(self):
        """Load the 6-character configuration"""
        config_path = Path("/workspace/assets/downloaded_assets/organized_characters/6_characters_5_variations.json")
        with open(config_path, 'r') as f:
            return json.load(f)
    
    def create_output_directories(self):
        """Create PlayCanvas asset directories"""
        dirs = [
            "characters/sprites",
            "characters/animations", 
            "characters/effects",
            "characters/configs",
            "ui/elements",
            "stages/backgrounds",
            "audio/sfx",
            "audio/music"
        ]
        
        for dir_path in dirs:
            (self.output_dir / dir_path).mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Created PlayCanvas asset directories in {self.output_dir}")
    
    def process_character_assets(self):
        """Process LPC assets for each character"""
        characters = self.character_config["characters"]
        
        for character in characters:
            character_id = character["id"]
            logger.info(f"Processing character: {character_id}")
            
            # Create character directory
            char_dir = self.output_dir / "characters" / character_id
            char_dir.mkdir(exist_ok=True)
            
            # Process base character
            self.process_base_character(character, char_dir)
            
            # Process variations
            self.process_character_variations(character, char_dir)
    
    def process_base_character(self, character, char_dir):
        """Process base character assets"""
        character_id = character["id"]
        base_assets = character["baseAssets"]
        
        # Create character config for PlayCanvas
        playcanvas_config = {
            "id": character_id,
            "name": character["displayName"],
            "theme": character["theme"],
            "baseArchetype": character["baseArchetype"],
            "colors": character["baseColors"],
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
            },
            "variations": [var["id"] for var in character["variations"]]
        }
        
        # Save character config
        config_path = char_dir / "character_config.json"
        with open(config_path, 'w') as f:
            json.dump(playcanvas_config, f, indent=2)
        
        logger.info(f"Created config for {character_id}")
    
    def process_character_variations(self, character, char_dir):
        """Process character variations"""
        character_id = character["id"]
        
        for variation in character["variations"]:
            var_id = variation["id"]
            logger.info(f"Processing variation: {character_id} - {var_id}")
            
            # Create variation config
            variation_config = {
                "id": var_id,
                "name": variation["name"],
                "archetype": variation["archetype"],
                "description": variation["description"],
                "mods": variation.get("mods", {}),
                "adds": variation.get("adds", {}),
                "magicalEffects": {
                    "primary": variation["magicalEffects"]["primary"],
                    "secondary": variation["magicalEffects"]["secondary"],
                    "particleEffects": variation["magicalEffects"].get("particleEffects", [])
                }
            }
            
            # Save variation config
            var_config_path = char_dir / f"{var_id}_config.json"
            with open(var_config_path, 'w') as f:
                json.dump(variation_config, f, indent=2)
    
    def get_primary_effect(self, character_id):
        """Get primary magical effect for character"""
        effects_map = {
            "aethon_stormweaver": "lightning_bolts",
            "baelor_bladeheart": "divine_light",
            "draven_shadowbane": "shadow_tendrils",
            "fiona_crystalborn": "crystal_shards",
            "jareth_infernal": "fire_trails",
            "kira_arcane": "arcane_symbols"
        }
        return effects_map.get(character_id, "magic_glow")
    
    def get_secondary_effect(self, character_id):
        """Get secondary magical effect for character"""
        effects_map = {
            "aethon_stormweaver": "electrical_sparks",
            "baelor_bladeheart": "holy_symbols",
            "draven_shadowbane": "dark_energy",
            "fiona_crystalborn": "prismatic_light",
            "jareth_infernal": "infernal_flames",
            "kira_arcane": "magic_circles"
        }
        return effects_map.get(character_id, "magic_aura")
    
    def get_particle_effects(self, character_id):
        """Get particle effects for character"""
        effects_map = {
            "aethon_stormweaver": ["lightning", "storm_clouds", "speed_trails"],
            "baelor_bladeheart": ["golden_aura", "blessing_light", "angel_wings"],
            "draven_shadowbane": ["shadow_smoke", "void_portals", "nightmare_aura"],
            "fiona_crystalborn": ["gem_particles", "crystal_barrier", "mystic_symbols"],
            "jareth_infernal": ["hellfire", "demon_aura", "phoenix_effects"],
            "kira_arcane": ["spell_weaving", "mystic_barrier", "chaos_energy"]
        }
        return effects_map.get(character_id, ["magic_particles"])
    
    def create_playcanvas_manifest(self):
        """Create PlayCanvas asset manifest"""
        manifest = {
            "version": "1.0",
            "created": "2025-09-26",
            "game": "FightForge - Dark Fantasy Fighting Game",
            "engine": "PlayCanvas",
            "characters": [],
            "assets": {
                "sprites": [],
                "animations": [],
                "effects": [],
                "audio": []
            }
        }
        
        characters = self.character_config["characters"]
        
        for character in characters:
            char_info = {
                "id": character["id"],
                "name": character["displayName"],
                "theme": character["theme"],
                "variations": len(character["variations"]),
                "spritePath": f"characters/{character['id']}/base.png",
                "configPath": f"characters/{character['id']}/character_config.json"
            }
            manifest["characters"].append(char_info)
        
        # Save manifest
        manifest_path = self.output_dir / "asset_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Created PlayCanvas manifest: {manifest_path}")
    
    def create_integration_guide(self):
        """Create PlayCanvas integration guide"""
        guide_content = '''# PlayCanvas Integration Guide
## FightForge Dark Fantasy Fighting Game

### Asset Structure
```
assets/
├── characters/
│   ├── aethon_stormweaver/
│   │   ├── character_config.json
│   │   ├── lightning_storm_config.json
│   │   ├── arcane_master_config.json
│   │   └── ... (other variations)
│   └── ... (other characters)
├── ui/
├── stages/
└── audio/
```

### Loading Characters in PlayCanvas

#### 1. Add Character Loader Script
```javascript
// In PlayCanvas Editor, add this script to an entity
pc.script.create('characterLoader', function (app) {
    return {
        initialize: function() {
            this.loadCharacter('aethon_stormweaver', 'lightning_storm');
        }
    };
});
```

#### 2. Load Character Data
```javascript
// Load character configuration
const characterConfig = await this.loadJSON('/assets/characters/aethon_stormweaver/character_config.json');

// Create character entity
const character = new pc.Entity();
character.addComponent('sprite', {
    sprite: this.app.assets.find('character_aethon_stormweaver'),
    width: 64,
    height: 64
});
```

#### 3. Switch Variations
```javascript
// Switch to different variation
this.characterLoader.switchVariation('aethon_stormweaver', 'speed_demon');
```

### Character System
- **6 Base Characters**: Each with unique theme and fighting style
- **5 Variations Each**: 30 total fighting styles
- **Magical Effects**: Theme-based particle systems
- **Animation System**: 13-frame sprite animations

### Next Steps
1. Import LPC sprite assets into PlayCanvas
2. Set up animation sequences
3. Implement magical effect systems
4. Create character selection UI
5. Test character loading and switching
'''
        
        guide_path = self.output_dir / "INTEGRATION_GUIDE.md"
        with open(guide_path, 'w') as f:
            f.write(guide_content)
        
        logger.info(f"Created integration guide: {guide_path}")
    
    def run(self):
        """Run the complete processing pipeline"""
        logger.info("🎮 Processing LPC Assets for PlayCanvas...")
        
        try:
            # Process character assets
            self.process_character_assets()
            
            # Create PlayCanvas manifest
            self.create_playcanvas_manifest()
            
            # Create integration guide
            self.create_integration_guide()
            
            logger.info("✅ LPC to PlayCanvas processing complete!")
            logger.info(f"📁 Processed assets saved to: {self.output_dir}")
            
        except Exception as e:
            logger.error(f"❌ Error during processing: {e}")

def main():
    processor = LPCToPlayCanvasProcessor()
    processor.run()

if __name__ == "__main__":
    main()