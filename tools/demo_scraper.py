#!/usr/bin/env python3
"""
Demo/Mock version of the sprite scraper for testing and demonstration.
This creates mock data to show how the scraper would work when the website is accessible.
"""

import json
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Dict

@dataclass
class MockSpriteInfo:
    name: str
    game: str
    character: str
    sprite_type: str
    url: str
    file_name: str
    file_size: int = 0
    resolution: str = "1920x1080"
    is_hd: bool = True

@dataclass  
class MockGameInfo:
    name: str
    url: str
    platform: str
    characters: List[str]
    sprite_count: int

def create_mock_data():
    """Create mock sprite data for demonstration."""
    
    # Mock fighting games data
    mock_games = [
        MockGameInfo(
            name="Street Fighter 6",
            url="https://www.spriters-resource.com/pc_computer/streetfighter6/",
            platform="PC",
            characters=["Ryu", "Chun-Li", "Luke", "Jamie", "Manon", "Kimberly", "Marisa", "Lily", "JP", "Juri", "Dee Jay", "Cammy", "Ken", "Blanka", "Guile", "Zangief"],
            sprite_count=0
        ),
        MockGameInfo(
            name="Tekken 8", 
            url="https://www.spriters-resource.com/pc_computer/tekken8/",
            platform="PC",
            characters=["Jin Kazama", "Kazuya Mishima", "Paul Phoenix", "King", "Lars Alexandersson", "Jack-8", "Nina Williams", "Ling Xiaoyu", "Leroy Smith", "Asuka Kazama", "Lili", "Hwoarang", "Bryan Fury", "Claudio Serafino", "Azucena", "Raven"],
            sprite_count=0
        ),
        MockGameInfo(
            name="Guilty Gear Strive",
            url="https://www.spriters-resource.com/pc_computer/guiltygearstrive/", 
            platform="PC",
            characters=["Sol Badguy", "Ky Kiske", "May", "Axl Low", "Chipp Zanuff", "Potemkin", "Faust", "Millia Rage", "Zato-1", "Ramlethal Valentine", "Leo Whitefang", "Nagoriyuki", "Giovanna", "Anji Mito", "I-No", "Goldlewis Dickinson"],
            sprite_count=0
        ),
        MockGameInfo(
            name="King of Fighters XV",
            url="https://www.spriters-resource.com/pc_computer/kingoffightersxv/",
            platform="PC", 
            characters=["Kyo Kusanagi", "Iori Yagami", "Terry Bogard", "Andy Bogard", "Joe Higashi", "Ryo Sakazaki", "Robert Garcia", "Yuri Sakazaki", "Leona Heidern", "Ralf Jones", "Clark Still", "Athena Asamiya"],
            sprite_count=0
        ),
        MockGameInfo(
            name="Mortal Kombat 1",
            url="https://www.spriters-resource.com/pc_computer/mortalkombat1/",
            platform="PC",
            characters=["Liu Kang", "Sub-Zero", "Scorpion", "Kitana", "Kung Lao", "Johnny Cage", "Kenshi", "Mileena", "Raiden", "Tanya", "Baraka", "Geras", "Reptile", "Ashrah", "Havik", "Shang Tsung"],
            sprite_count=0
        )
    ]
    
    # Generate mock sprites for each game
    mock_sprites = []
    
    for game in mock_games:
        for character in game.characters:
            # Create different sprite types for each character
            sprite_types = [
                ("Character Sprites", "sprites", True),
                ("Portrait", "portraits", True), 
                ("Character Select Icon", "icons", False),
                ("Victory Sprites", "sprites", True),
                ("Special Move Effects", "sprites", True)
            ]
            
            for sprite_name, sprite_type, is_hd in sprite_types:
                full_name = f"{character} - {sprite_name}"
                file_name = f"{game.name.lower().replace(' ', '_')}_{character.lower().replace(' ', '_')}_{sprite_name.lower().replace(' ', '_')}"
                
                sprite = MockSpriteInfo(
                    name=full_name,
                    game=game.name,
                    character=character,
                    sprite_type=sprite_type,
                    url=f"{game.url}sheet/{character.lower().replace(' ', '_')}/",
                    file_name=file_name,
                    file_size=1024000 if is_hd else 256000,  # Mock file sizes
                    resolution="1920x1080" if is_hd else "640x480",
                    is_hd=is_hd
                )
                mock_sprites.append(sprite)
                
        game.sprite_count = len([s for s in mock_sprites if s.game == game.name])
    
    return mock_games, mock_sprites

def save_mock_metadata(assets_dir: Path, games: List[MockGameInfo], sprites: List[MockSpriteInfo]):
    """Save mock metadata files."""
    metadata_dir = assets_dir / "metadata"
    metadata_dir.mkdir(parents=True, exist_ok=True)
    
    # Save games metadata
    games_file = metadata_dir / "fighting_games.json"
    with open(games_file, 'w') as f:
        json.dump([asdict(game) for game in games], f, indent=2)
        
    # Save sprites metadata  
    sprites_file = metadata_dir / "sprites_metadata.json"
    with open(sprites_file, 'w') as f:
        json.dump([asdict(sprite) for sprite in sprites], f, indent=2)
        
    # Create character sprite mapping
    character_mapping = {}
    for sprite in sprites:
        game_name = sprite.game
        character = sprite.character
        
        if game_name not in character_mapping:
            character_mapping[game_name] = {}
            
        if character not in character_mapping[game_name]:
            character_mapping[game_name][character] = {
                'sprites': [],
                'portraits': [],
                'icons': []
            }
            
        character_mapping[game_name][character][sprite.sprite_type].append({
            'name': sprite.name,
            'file_name': sprite.file_name,
            'url': sprite.url,
            'is_hd': sprite.is_hd,
            'file_size': sprite.file_size,
            'resolution': sprite.resolution
        })
        
    mapping_file = metadata_dir / "character_sprite_mapping.json"
    with open(mapping_file, 'w') as f:
        json.dump(character_mapping, f, indent=2)
        
    print(f"Mock metadata saved to {metadata_dir}")
    
    # Create directory structure to show organization
    sprites_dir = assets_dir / "sprites"
    for game in games:
        game_dir = sprites_dir / game.name.lower().replace(' ', '_')
        for character in game.characters:
            char_dir = game_dir / character.lower().replace(' ', '_')
            for sprite_type in ['sprites', 'portraits', 'icons']:
                type_dir = char_dir / sprite_type
                type_dir.mkdir(parents=True, exist_ok=True)
                
                # Create placeholder files
                readme_file = type_dir / "README.md"
                with open(readme_file, 'w') as f:
                    f.write(f"# {character} {sprite_type.title()}\n\n")
                    f.write(f"This directory contains {sprite_type} for {character} from {game.name}.\n")
                    f.write(f"Sprites would be downloaded here by the scraper.\n")
                    
    print(f"Directory structure created in {sprites_dir}")

def create_demo_report(games: List[MockGameInfo], sprites: List[MockSpriteInfo]) -> Dict:
    """Create a demonstration report."""
    hd_sprites = [s for s in sprites if s.is_hd]
    total_characters = len(set(s.character for s in sprites))
    
    report = {
        'total_games': len(games),
        'total_characters': total_characters,
        'total_sprites_found': len(sprites),
        'hd_sprites_found': len(hd_sprites),
        'games_processed': [g.name for g in games],
        'sprite_types': list(set(s.sprite_type for s in sprites)),
        'characters_by_game': {g.name: g.characters for g in games},
        'hd_percentage': round((len(hd_sprites) / len(sprites)) * 100, 1) if sprites else 0
    }
    
    return report

def main():
    print("Creating mock sprite scraper demonstration...")
    
    # Set up paths
    project_root = Path(__file__).parent.parent
    assets_dir = project_root / "assets"
    
    # Create mock data
    games, sprites = create_mock_data()
    
    # Save mock metadata and create directory structure
    save_mock_metadata(assets_dir, games, sprites)
    
    # Create demonstration report
    report = create_demo_report(games, sprites)
    
    print(f"\n--- Mock Scraping Demo Complete ---")
    print(f"Games processed: {report['total_games']}")
    print(f"Total characters: {report['total_characters']}")
    print(f"Sprites found: {report['total_sprites_found']}")
    print(f"HD sprites: {report['hd_sprites_found']} ({report['hd_percentage']}%)")
    print(f"Sprite types: {', '.join(report['sprite_types'])}")
    
    print(f"\nGames processed:")
    for game in report['games_processed']:
        character_count = len(report['characters_by_game'][game])
        print(f"  - {game} ({character_count} characters)")
    
    # Save report
    report_file = assets_dir / "metadata" / "demo_scraping_report.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
        
    print(f"\nDemo report saved to: {report_file}")
    print(f"\nThis demonstrates what the scraper would accomplish:")
    print(f"1. Crawl fighting game listings")  
    print(f"2. Extract character sprite information")
    print(f"3. Download and organize HD sprites")
    print(f"4. Create metadata mappings")
    print(f"5. Integrate with existing character system")

if __name__ == "__main__":
    main()