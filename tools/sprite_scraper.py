#!/usr/bin/env python3
"""
Fighting Game Sprite Scraper for Spriters Resource

This script crawls https://www.spriters-resource.com/genre/fighting/
to download HD sprites for fighting game characters and organize them
into the project's asset structure.

Usage:
    python3 tools/sprite_scraper.py [--dry-run] [--game-filter GAME_NAME]
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from urllib.parse import urljoin, urlparse
from typing import Dict, List, Optional, Tuple
import argparse
import logging
from dataclasses import dataclass, asdict

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

try:
    from bs4 import BeautifulSoup
    import requests
except ImportError:
    print("Required packages not installed. Installing...")
    os.system("pip3 install requests beautifulsoup4 lxml Pillow")
    from bs4 import BeautifulSoup
    import requests

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SpriteInfo:
    """Information about a sprite resource."""
    name: str
    game: str
    character: str
    sprite_type: str  # e.g., "sprites", "portraits", "icons"
    url: str
    file_name: str
    file_size: Optional[int] = None
    resolution: Optional[str] = None
    is_hd: bool = False

@dataclass
class GameInfo:
    """Information about a fighting game."""
    name: str
    url: str
    platform: str
    characters: List[str]
    sprite_count: int

class SpriteResourceScraper:
    """Scraper for Spriters Resource fighting game sprites."""
    
    BASE_URL = "https://www.spriters-resource.com"
    FIGHTING_URL = "https://www.spriters-resource.com/genre/fighting/"
    
    def __init__(self, assets_dir: Path, dry_run: bool = False):
        self.assets_dir = assets_dir
        self.sprites_dir = assets_dir / "sprites"
        self.metadata_dir = assets_dir / "metadata"
        self.dry_run = dry_run
        
        # Create directories
        self.sprites_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_dir.mkdir(parents=True, exist_ok=True)
        
        # Session for requests
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Metadata storage
        self.games: List[GameInfo] = []
        self.sprites: List[SpriteInfo] = []
        
    def get_page(self, url: str, retries: int = 3) -> Optional[BeautifulSoup]:
        """Fetch and parse a web page."""
        for attempt in range(retries):
            try:
                logger.info(f"Fetching: {url} (attempt {attempt + 1})")
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return BeautifulSoup(response.content, 'html.parser')
            except requests.RequestException as e:
                logger.warning(f"Failed to fetch {url}: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    return None
        return None
        
    def scrape_fighting_games_list(self) -> List[GameInfo]:
        """Scrape the main fighting games page to get all games."""
        logger.info("Scraping fighting games list...")
        
        soup = self.get_page(self.FIGHTING_URL)
        if not soup:
            logger.error("Failed to fetch fighting games page")
            return []
            
        games = []
        
        # Find game entries - this will need to be adapted based on actual HTML structure
        game_links = soup.find_all('a', href=True)
        
        for link in game_links:
            href = link.get('href')
            if href and '/game/' in href:
                game_url = urljoin(self.BASE_URL, href)
                game_name = link.get_text(strip=True)
                
                # Extract platform if available
                platform = "Unknown"
                if link.parent:
                    platform_text = link.parent.get_text()
                    # Simple platform detection
                    for p in ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Arcade', 'Mobile']:
                        if p.lower() in platform_text.lower():
                            platform = p
                            break
                
                game_info = GameInfo(
                    name=game_name,
                    url=game_url,
                    platform=platform,
                    characters=[],
                    sprite_count=0
                )
                games.append(game_info)
                logger.info(f"Found game: {game_name} ({platform})")
                
        logger.info(f"Found {len(games)} fighting games")
        self.games = games
        return games
        
    def scrape_game_sprites(self, game: GameInfo) -> List[SpriteInfo]:
        """Scrape sprites for a specific game."""
        logger.info(f"Scraping sprites for: {game.name}")
        
        soup = self.get_page(game.url)
        if not soup:
            logger.error(f"Failed to fetch game page for {game.name}")
            return []
            
        sprites = []
        
        # Find character sprite links
        sprite_links = soup.find_all('a', href=True)
        
        for link in sprite_links:
            href = link.get('href')
            if href and ('/sheet/' in href or '/sprites/' in href):
                sprite_url = urljoin(self.BASE_URL, href)
                sprite_name = link.get_text(strip=True)
                
                # Try to extract character name
                character_name = self.extract_character_name(sprite_name)
                
                # Determine sprite type
                sprite_type = "sprites"
                if "portrait" in sprite_name.lower():
                    sprite_type = "portraits"
                elif "icon" in sprite_name.lower():
                    sprite_type = "icons"
                
                sprite_info = SpriteInfo(
                    name=sprite_name,
                    game=game.name,
                    character=character_name,
                    sprite_type=sprite_type,
                    url=sprite_url,
                    file_name=self.generate_filename(game.name, character_name, sprite_name),
                    is_hd=self.is_hd_sprite(sprite_name)
                )
                
                sprites.append(sprite_info)
                if character_name not in game.characters:
                    game.characters.append(character_name)
                    
        game.sprite_count = len(sprites)
        logger.info(f"Found {len(sprites)} sprites for {game.name}")
        
        return sprites
        
    def extract_character_name(self, sprite_name: str) -> str:
        """Extract character name from sprite name."""
        # Common fighting game character names
        known_characters = [
            'ryu', 'ken', 'chun-li', 'chun_li', 'zangief', 'sagat', 'akuma', 'gouki',
            'dhalsim', 'blanka', 'e.honda', 'honda', 'vega', 'balrog', 'bison', 'm.bison',
            'cammy', 'fei_long', 'fei-long', 'dee_jay', 'dee-jay', 't.hawk', 'hawk',
            'guile', 'terry', 'bogard', 'andy', 'joe', 'mai', 'shiranui', 'king',
            'iori', 'yagami', 'kyo', 'kusanagi', 'geese', 'howard', 'heihachi',
            'kazuya', 'jin', 'mishima', 'lei', 'wulong', 'nina', 'williams', 'paul',
            'phoenix', 'yoshimitsu', 'sol', 'badguy', 'ky', 'kiske', 'may', 'axl',
            'low', 'potemkin', 'zato', 'millia', 'rage', 'johnny', 'jam', 'kuradoberi',
            'testament', 'dizzy', 'slayer', 'bridget', 'eddie', 'faust', 'anji',
            'baiken', 'venom', 'robo-ky', 'order-sol', 'a.b.a', 'aba'
        ]
        
        name_lower = sprite_name.lower()
        
        # Try exact matches first
        for character in known_characters:
            if character in name_lower:
                return character.title().replace('_', ' ').replace('-', ' ')
                
        # Try to extract from common patterns
        if ' - ' in sprite_name:
            potential_name = sprite_name.split(' - ')[0].strip()
            return potential_name
            
        # Fallback: use first word
        return sprite_name.split()[0] if sprite_name.split() else "Unknown"
        
    def is_hd_sprite(self, sprite_name: str) -> bool:
        """Check if sprite appears to be high definition."""
        hd_indicators = ['hd', 'high', 'definition', '1080', '720', 'upscale', 'enhanced']
        name_lower = sprite_name.lower()
        return any(indicator in name_lower for indicator in hd_indicators)
        
    def generate_filename(self, game_name: str, character_name: str, sprite_name: str) -> str:
        """Generate a standardized filename for the sprite."""
        # Clean names for filesystem
        safe_game = "".join(c if c.isalnum() or c in (' ', '-', '_') else '' for c in game_name)
        safe_character = "".join(c if c.isalnum() or c in (' ', '-', '_') else '' for c in character_name)
        safe_sprite = "".join(c if c.isalnum() or c in (' ', '-', '_') else '' for c in sprite_name)
        
        # Replace spaces with underscores and make lowercase
        safe_game = safe_game.replace(' ', '_').lower()
        safe_character = safe_character.replace(' ', '_').lower()
        safe_sprite = safe_sprite.replace(' ', '_').lower()
        
        return f"{safe_game}_{safe_character}_{safe_sprite}"
        
    def download_sprite(self, sprite: SpriteInfo) -> bool:
        """Download a sprite file."""
        if self.dry_run:
            logger.info(f"[DRY RUN] Would download: {sprite.file_name}")
            return True
            
        try:
            # Get the actual download page
            soup = self.get_page(sprite.url)
            if not soup:
                return False
                
            # Find the actual sprite download link
            download_links = soup.find_all('a', href=True)
            image_url = None
            
            for link in download_links:
                href = link.get('href')
                if href and (href.endswith('.png') or href.endswith('.gif') or 
                           href.endswith('.jpg') or href.endswith('.jpeg')):
                    image_url = urljoin(self.BASE_URL, href)
                    break
                    
            if not image_url:
                logger.warning(f"No image download found for {sprite.name}")
                return False
                
            # Download the image
            response = self.session.get(image_url, timeout=30)
            response.raise_for_status()
            
            # Create directory structure
            game_dir = self.sprites_dir / sprite.game.replace(' ', '_').lower()
            character_dir = game_dir / sprite.character.replace(' ', '_').lower()
            type_dir = character_dir / sprite.sprite_type
            type_dir.mkdir(parents=True, exist_ok=True)
            
            # Save file
            file_ext = Path(image_url).suffix or '.png'
            file_path = type_dir / f"{sprite.file_name}{file_ext}"
            
            with open(file_path, 'wb') as f:
                f.write(response.content)
                
            sprite.file_size = len(response.content)
            logger.info(f"Downloaded: {file_path} ({sprite.file_size} bytes)")
            
            # Small delay to be respectful
            time.sleep(1)
            return True
            
        except Exception as e:
            logger.error(f"Failed to download {sprite.name}: {e}")
            return False
            
    def save_metadata(self):
        """Save metadata about scraped games and sprites."""
        # Save games metadata
        games_file = self.metadata_dir / "fighting_games.json"
        with open(games_file, 'w') as f:
            json.dump([asdict(game) for game in self.games], f, indent=2)
            
        # Save sprites metadata
        sprites_file = self.metadata_dir / "sprites_metadata.json"
        with open(sprites_file, 'w') as f:
            json.dump([asdict(sprite) for sprite in self.sprites], f, indent=2)
            
        # Save character mapping for integration with existing system
        character_mapping = {}
        for sprite in self.sprites:
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
                'file_size': sprite.file_size
            })
            
        mapping_file = self.metadata_dir / "character_sprite_mapping.json"
        with open(mapping_file, 'w') as f:
            json.dump(character_mapping, f, indent=2)
            
        logger.info(f"Metadata saved to {self.metadata_dir}")
        
    def scrape_all(self, game_filter: Optional[str] = None, max_games: Optional[int] = None) -> Dict:
        """Scrape all fighting game sprites."""
        logger.info("Starting complete sprite scraping process...")
        
        # Get list of fighting games
        games = self.scrape_fighting_games_list()
        
        if game_filter:
            games = [g for g in games if game_filter.lower() in g.name.lower()]
            logger.info(f"Filtered to {len(games)} games matching '{game_filter}'")
            
        if max_games:
            games = games[:max_games]
            logger.info(f"Limited to first {max_games} games")
            
        total_sprites = 0
        downloaded_sprites = 0
        
        for game in games:
            logger.info(f"\n--- Processing {game.name} ---")
            
            # Scrape sprites for this game
            game_sprites = self.scrape_game_sprites(game)
            self.sprites.extend(game_sprites)
            
            # Download HD sprites (prioritize HD)
            hd_sprites = [s for s in game_sprites if s.is_hd]
            regular_sprites = [s for s in game_sprites if not s.is_hd]
            
            # Download HD first, then regular if no HD available
            sprites_to_download = hd_sprites if hd_sprites else regular_sprites[:10]  # Limit to avoid overwhelming
            
            for sprite in sprites_to_download:
                if self.download_sprite(sprite):
                    downloaded_sprites += 1
                total_sprites += 1
                
            # Save progress periodically
            if len(games) > 5:  # Only for large scraping sessions
                self.save_metadata()
                
        # Final metadata save
        self.save_metadata()
        
        results = {
            'total_games': len(games),
            'total_sprites_found': len(self.sprites),
            'total_sprites_downloaded': downloaded_sprites,
            'hd_sprites': len([s for s in self.sprites if s.is_hd]),
            'games_processed': [g.name for g in games]
        }
        
        logger.info(f"\n--- Scraping Complete ---")
        logger.info(f"Games processed: {results['total_games']}")
        logger.info(f"Sprites found: {results['total_sprites_found']}")
        logger.info(f"Sprites downloaded: {results['total_sprites_downloaded']}")
        logger.info(f"HD sprites found: {results['hd_sprites']}")
        
        return results

def create_integration_script():
    """Create a script to integrate scraped sprites with existing character system."""
    integration_script = """#!/usr/bin/env python3
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
        print(f"\\nProcessing {game_name}:")
        
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
"""
    
    script_path = Path(__file__).parent.parent / "tools" / "integrate_sprites.py"
    with open(script_path, 'w') as f:
        f.write(integration_script)
    os.chmod(script_path, 0o755)
    return script_path

def main():
    parser = argparse.ArgumentParser(description="Scrape fighting game sprites from Spriters Resource")
    parser.add_argument('--dry-run', action='store_true', help='Run without downloading files')
    parser.add_argument('--game-filter', type=str, help='Filter games by name')
    parser.add_argument('--max-games', type=int, help='Limit number of games to process')
    parser.add_argument('--create-integration', action='store_true', help='Create sprite integration script')
    
    args = parser.parse_args()
    
    # Set up paths
    project_root = Path(__file__).parent.parent
    assets_dir = project_root / "assets"
    
    if args.create_integration:
        script_path = create_integration_script()
        print(f"Created integration script at: {script_path}")
        return
    
    # Create scraper and run
    scraper = SpriteResourceScraper(assets_dir, dry_run=args.dry_run)
    
    try:
        results = scraper.scrape_all(
            game_filter=args.game_filter,
            max_games=args.max_games
        )
        
        print(f"\nScraping completed successfully!")
        print(f"Results saved to: {assets_dir}")
        
        # Create integration script
        create_integration_script()
        print(f"\nTo integrate sprites with existing characters, run:")
        print(f"python3 tools/integrate_sprites.py")
        
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
        scraper.save_metadata()
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()