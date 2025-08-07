#!/usr/bin/env python3
'''
Integration script to map scraped sprites to existing character system.
This script reads the sprite metadata and creates integration files for Godot.
'''

import json
from pathlib import Path

def integrate_sprites():
    project_root = Path(__file__).parent.parent
    metadata_dir = project_root / "assets" / "metadata"
    data_dir = project_root / "data" / "characters"
    
    # Load sprite mapping
    mapping_file = metadata_dir / "character_sprite_mapping.json"
    if not mapping_file.exists():
        print("No sprite mapping found. Run the scraper first.")
        return
        
    with open(mapping_file) as f:
        sprite_mapping = json.load(f)
    
    # Load existing character data
    existing_characters = {}
    for char_file in data_dir.glob("*.json"):
        with open(char_file) as f:
            char_data = json.load(f)
            existing_characters[char_data.get('characterId', char_file.stem)] = char_data
    
    # Create integration mappings
    for game_name, characters in sprite_mapping.items():
        print(f"\nProcessing {game_name}:")
        
        for character_name, sprite_data in characters.items():
            char_id = character_name.lower().replace(' ', '_')
            
            if char_id in existing_characters:
                # Update existing character with sprite references
                char_data = existing_characters[char_id]
                if 'sprites' not in char_data:
                    char_data['sprites'] = {}
                    
                char_data['sprites'].update({
                    'sprite_sheets': sprite_data.get('sprites', []),
                    'portraits': sprite_data.get('portraits', []),
                    'icons': sprite_data.get('icons', [])
                })
                
                # Save updated character data
                char_file = data_dir / f"{char_id}.json"
                with open(char_file, 'w') as f:
                    json.dump(char_data, f, indent=2)
                    
                print(f"  Updated {char_id} with {len(sprite_data.get('sprites', []))} sprites")
            else:
                print(f"  Character {character_name} not found in existing data")

if __name__ == "__main__":
    integrate_sprites()
