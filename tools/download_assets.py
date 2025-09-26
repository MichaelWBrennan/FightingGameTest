#!/usr/bin/env python3
"""
Asset Downloader for Dark Fantasy Fighting Game
Downloads free-to-use 2D and 3D assets that fit the game's vision
"""

import os
import requests
import zipfile
import json
from pathlib import Path
from urllib.parse import urlparse
import time

class AssetDownloader:
    def __init__(self, base_dir="/workspace/assets"):
        self.base_dir = Path(base_dir)
        self.downloaded_assets = []
        
        # Create directory structure
        self.dirs = {
            'characters': self.base_dir / 'characters',
            'stages': self.base_dir / 'stages', 
            'effects': self.base_dir / 'effects',
            'ui': self.base_dir / 'ui',
            'particles': self.base_dir / 'particles',
            'sounds': self.base_dir / 'sounds'
        }
        
        for dir_path in self.dirs.values():
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def download_file(self, url, filename, subdir=None):
        """Download a file from URL"""
        try:
            if subdir:
                filepath = self.dirs[subdir] / filename
            else:
                filepath = self.base_dir / filename
                
            print(f"Downloading {filename}...")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
                
            self.downloaded_assets.append({
                'url': url,
                'filename': filename,
                'subdir': subdir,
                'size': len(response.content)
            })
            
            print(f"✓ Downloaded {filename} ({len(response.content)} bytes)")
            return True
            
        except Exception as e:
            print(f"✗ Failed to download {filename}: {e}")
            return False
    
    def download_zip_and_extract(self, url, extract_to, subdir=None):
        """Download and extract a ZIP file"""
        try:
            print(f"Downloading ZIP from {url}...")
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            
            zip_path = self.base_dir / "temp_download.zip"
            with open(zip_path, 'wb') as f:
                f.write(response.content)
            
            # Extract to appropriate directory
            extract_dir = self.dirs[subdir] if subdir else self.base_dir
            extract_dir = extract_dir / extract_to
            extract_dir.mkdir(parents=True, exist_ok=True)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # Clean up
            zip_path.unlink()
            
            print(f"✓ Extracted to {extract_dir}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to download/extract ZIP: {e}")
            return False
    
    def download_fantasy_characters(self):
        """Download fantasy character sprites"""
        print("\n=== Downloading Fantasy Character Assets ===")
        
        # These are example URLs - in practice, you'd need to find actual free asset packs
        character_assets = [
            {
                'name': 'Fantasy Warrior Pack',
                'url': 'https://opengameart.org/sites/default/files/fantasy_warrior_sprites.zip',
                'extract_to': 'fantasy_warriors'
            },
            {
                'name': 'Medieval Fighter Sprites',
                'url': 'https://opengameart.org/sites/default/files/medieval_fighter_sprites.zip', 
                'extract_to': 'medieval_fighters'
            }
        ]
        
        for asset in character_assets:
            self.download_zip_and_extract(asset['url'], asset['extract_to'], 'characters')
            time.sleep(1)  # Be respectful to servers
    
    def download_gothic_stages(self):
        """Download gothic/dark fantasy stage backgrounds"""
        print("\n=== Downloading Gothic Stage Assets ===")
        
        stage_assets = [
            {
                'name': 'Gothic Castle Background',
                'url': 'https://opengameart.org/sites/default/files/gothic_castle_bg.png',
                'filename': 'gothic_castle_bg.png'
            },
            {
                'name': 'Dark Forest Background', 
                'url': 'https://opengameart.org/sites/default/files/dark_forest_bg.png',
                'filename': 'dark_forest_bg.png'
            }
        ]
        
        for asset in stage_assets:
            self.download_file(asset['url'], asset['filename'], 'stages')
            time.sleep(1)
    
    def download_magical_effects(self):
        """Download magical particle effects and VFX"""
        print("\n=== Downloading Magical Effect Assets ===")
        
        effect_assets = [
            {
                'name': 'Lightning Effect',
                'url': 'https://opengameart.org/sites/default/files/lightning_effect.png',
                'filename': 'lightning_effect.png'
            },
            {
                'name': 'Fire Effect',
                'url': 'https://opengameart.org/sites/default/files/fire_effect.png', 
                'filename': 'fire_effect.png'
            },
            {
                'name': 'Ice Effect',
                'url': 'https://opengameart.org/sites/default/files/ice_effect.png',
                'filename': 'ice_effect.png'
            },
            {
                'name': 'Shadow Effect',
                'url': 'https://opengameart.org/sites/default/files/shadow_effect.png',
                'filename': 'shadow_effect.png'
            }
        ]
        
        for asset in effect_assets:
            self.download_file(asset['url'], asset['filename'], 'effects')
            time.sleep(1)
    
    def download_ui_elements(self):
        """Download dark fantasy UI elements"""
        print("\n=== Downloading UI Assets ===")
        
        ui_assets = [
            {
                'name': 'Health Bar',
                'url': 'https://opengameart.org/sites/default/files/health_bar.png',
                'filename': 'health_bar.png'
            },
            {
                'name': 'Magic Meter',
                'url': 'https://opengameart.org/sites/default/files/magic_meter.png',
                'filename': 'magic_meter.png'
            },
            {
                'name': 'Dark Fantasy Button',
                'url': 'https://opengameart.org/sites/default/files/dark_button.png',
                'filename': 'dark_button.png'
            }
        ]
        
        for asset in ui_assets:
            self.download_file(asset['url'], asset['filename'], 'ui')
            time.sleep(1)
    
    def create_asset_manifest(self):
        """Create a manifest of all downloaded assets"""
        manifest = {
            'downloaded_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_assets': len(self.downloaded_assets),
            'total_size': sum(asset['size'] for asset in self.downloaded_assets),
            'assets': self.downloaded_assets
        }
        
        manifest_path = self.base_dir / 'asset_manifest.json'
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"\n✓ Asset manifest created: {manifest_path}")
    
    def run(self):
        """Run the complete asset download process"""
        print("🎮 Dark Fantasy Fighting Game Asset Downloader")
        print("=" * 50)
        
        # Download different types of assets
        self.download_fantasy_characters()
        self.download_gothic_stages()
        self.download_magical_effects()
        self.download_ui_elements()
        
        # Create manifest
        self.create_asset_manifest()
        
        print(f"\n🎉 Download complete! Downloaded {len(self.downloaded_assets)} assets")
        print(f"📁 Assets saved to: {self.base_dir}")

if __name__ == "__main__":
    downloader = AssetDownloader()
    downloader.run()