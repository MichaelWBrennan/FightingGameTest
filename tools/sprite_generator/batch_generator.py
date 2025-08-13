#!/usr/bin/env python3
"""
Batch Sprite Generator
=====================

Generate sprites for multiple fighting game characters at once.
Integrates with the existing Godot project directory structure.
"""

import os
import sys
import json
import argparse
import concurrent.futures
from typing import List, Dict, Optional
from pathlib import Path

# Import our sprite generator
sys.path.append(os.path.dirname(__file__))
from sprite_generator import SpriteGenerator, SpriteConfig, ColorPalette, FighterArchetype


class BatchSpriteGenerator:
    """Handles batch generation of character sprites"""
    
    def __init__(self, project_root: str = None):
        """Initialize batch generator with project root path"""
        if project_root is None:
            # Auto-detect project root (look for project.godot)
            current = Path(__file__).parent
            while current != current.parent:
                if (current / "project.godot").exists():
                    project_root = str(current)
                    break
                current = current.parent
            
            if project_root is None:
                project_root = str(Path(__file__).parent.parent.parent)
        
        self.project_root = Path(project_root)
        self.asset_dir = self.project_root / "assets" / "sprites" / "street_fighter_6"
        
    def generate_character_batch(self, characters: List[str], 
                               poses: List[str] = None,
                               config: SpriteConfig = None) -> Dict[str, List[str]]:
        """
        Generate sprites for multiple characters
        
        Args:
            characters: List of character IDs to generate
            poses: List of poses to generate (default: all standard poses)
            config: Sprite generation configuration
            
        Returns:
            Dictionary mapping character IDs to list of generated sprite paths
        """
        if poses is None:
            poses = ["idle", "walk", "attack", "jump"]  # Standard 4 poses used in existing system
            
        if config is None:
            config = SpriteConfig()
            
        print(f"🎮 Batch generating sprites for {len(characters)} characters")
        print(f"📁 Project root: {self.project_root}")
        print(f"💾 Asset directory: {self.asset_dir}")
        print(f"🎭 Poses: {', '.join(poses)}")
        
        results = {}
        
        # Generate sprites for each character
        for character_id in characters:
            print(f"\n🔄 Processing character: {character_id}")
            
            # Determine character-specific archetype
            char_archetype = self._get_character_archetype(character_id)
            
            # Create character-specific config
            char_config = SpriteConfig(
                width=config.width,
                height=config.height,
                enhanced_width=config.enhanced_width,
                enhanced_height=config.enhanced_height,
                palette_name=character_id,  # Use character name as palette
                use_dithering=config.use_dithering,
                archetype=char_archetype
            )
            
            # Generate sprites
            generated_paths = self._generate_character_sprites(
                character_id, poses, char_config
            )
            results[character_id] = generated_paths
            
        return results
    
    def _get_character_archetype(self, character_id: str) -> str:
        """Determine appropriate archetype for character"""
        archetype_mapping = {
            "ryu": "balanced",
            "ken": "rushdown", 
            "chun_li": "technical",
            "zangief": "grappler",
            "sagat": "zoner",
            "lei_wulong": "technical",
            # Add new characters with appropriate archetypes
            "akuma": "technical",
            "cammy": "rushdown",
            "guile": "zoner",
            "dhalsim": "zoner",
            "blanka": "rushdown",
            "e_honda": "grappler"
        }
        return archetype_mapping.get(character_id, "balanced")
    
    def _generate_character_sprites(self, character_id: str, poses: List[str], 
                                  config: SpriteConfig) -> List[str]:
        """Generate sprites for a single character"""
        generator = SpriteGenerator(config)
        generated_paths = []
        
        # Create character sprite directory
        char_sprite_dir = self.asset_dir / character_id / "sprites"
        char_sprite_dir.mkdir(parents=True, exist_ok=True)
        
        for pose in poses:
            # Map pose names to existing naming convention
            pose_name = self._map_pose_name(pose)
            
            # Generate original resolution
            try:
                sprite = generator.generate_character_sprite(
                    character_id, pose, enhanced=False
                )
                
                original_path = char_sprite_dir / f"{character_id}_{pose_name}.png"
                generator.save_sprite(sprite, str(original_path))
                generated_paths.append(str(original_path))
                print(f"  ✅ Generated: {original_path.name}")
                
            except Exception as e:
                print(f"  ❌ Error generating original {pose}: {e}")
            
            # Generate enhanced resolution
            try:
                enhanced_sprite = generator.generate_character_sprite(
                    character_id, pose, enhanced=True
                )
                
                enhanced_path = char_sprite_dir / f"{character_id}_{pose_name}_enhanced.png"
                generator.save_sprite(enhanced_sprite, str(enhanced_path))
                generated_paths.append(str(enhanced_path))
                print(f"  ✅ Generated: {enhanced_path.name}")
                
            except Exception as e:
                print(f"  ❌ Error generating enhanced {pose}: {e}")
        
        return generated_paths
    
    def _map_pose_name(self, pose: str) -> str:
        """Map pose names to existing naming convention"""
        pose_mapping = {
            "punch": "attack",  # Map punch to attack for consistency
            "kick": "attack",   # Both punch and kick map to attack
            "special": "attack" # Special moves also map to attack for now
        }
        return pose_mapping.get(pose, pose)
    
    def generate_all_existing_characters(self, config: SpriteConfig = None) -> Dict[str, List[str]]:
        """Generate sprites for all existing characters in the project"""
        existing_characters = self._get_existing_characters()
        
        if not existing_characters:
            print("⚠️  No existing characters found. Generating default set.")
            existing_characters = ["ryu", "ken", "chun_li", "zangief", "sagat", "lei_wulong"]
            
        return self.generate_character_batch(existing_characters, config=config)
    
    def _get_existing_characters(self) -> List[str]:
        """Get list of existing character directories"""
        if not self.asset_dir.exists():
            return []
            
        characters = []
        for item in self.asset_dir.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                characters.append(item.name)
                
        return sorted(characters)
    
    def validate_generated_sprites(self, results: Dict[str, List[str]]) -> Dict[str, Dict]:
        """Validate that generated sprites work with the existing loading system"""
        validation_results = {}
        
        print("\n🔍 Validating generated sprites...")
        
        for character_id, sprite_paths in results.items():
            char_results = {
                "total_generated": len(sprite_paths),
                "original_count": 0,
                "enhanced_count": 0,
                "missing_poses": [],
                "valid_sprites": []
            }
            
            # Expected poses for existing system
            expected_poses = ["idle", "walk", "attack", "jump"]
            
            for pose in expected_poses:
                # Check for original sprite
                original_expected = f"{character_id}_{pose}.png"
                enhanced_expected = f"{character_id}_{pose}_enhanced.png"
                
                original_found = any(original_expected in path for path in sprite_paths)
                enhanced_found = any(enhanced_expected in path for path in sprite_paths)
                
                if original_found:
                    char_results["original_count"] += 1
                    char_results["valid_sprites"].append(f"original_{pose}")
                    
                if enhanced_found:
                    char_results["enhanced_count"] += 1
                    char_results["valid_sprites"].append(f"enhanced_{pose}")
                    
                if not original_found and not enhanced_found:
                    char_results["missing_poses"].append(pose)
            
            validation_results[character_id] = char_results
            
            # Print validation summary
            print(f"  📊 {character_id}: {char_results['original_count']} original + "
                  f"{char_results['enhanced_count']} enhanced = {char_results['total_generated']} total")
            
            if char_results["missing_poses"]:
                print(f"    ⚠️  Missing poses: {', '.join(char_results['missing_poses'])}")
        
        return validation_results


def main():
    """Command-line interface for batch sprite generation"""
    parser = argparse.ArgumentParser(description="Batch Fighting Game Sprite Generator")
    
    # Character selection options
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--characters", nargs="+", 
                      help="Specific characters to generate (e.g., ryu ken chun_li)")
    group.add_argument("--all-existing", action="store_true",
                      help="Generate for all existing characters in project")
    group.add_argument("--new-characters", nargs="+",
                      help="Generate sprites for new characters not yet in project")
    
    # Pose options
    parser.add_argument("--poses", nargs="+",
                       default=["idle", "walk", "attack", "jump"],
                       help="Poses to generate")
    
    # Configuration options
    parser.add_argument("--project-root", 
                       help="Path to Godot project root (auto-detected if not provided)")
    parser.add_argument("--dithering", action="store_true",
                       help="Apply retro dithering to sprites")
    parser.add_argument("--enhanced-only", action="store_true",
                       help="Generate only enhanced resolution sprites")
    
    # Quality options
    parser.add_argument("--width", type=int, default=64, help="Original sprite width")
    parser.add_argument("--height", type=int, default=96, help="Original sprite height")
    parser.add_argument("--enhanced-width", type=int, default=256, 
                       help="Enhanced sprite width")
    parser.add_argument("--enhanced-height", type=int, default=384,
                       help="Enhanced sprite height")
    
    args = parser.parse_args()
    
    # Create configuration
    config = SpriteConfig(
        width=args.width,
        height=args.height,
        enhanced_width=args.enhanced_width,
        enhanced_height=args.enhanced_height,
        use_dithering=args.dithering
    )
    
    # Initialize batch generator
    batch_generator = BatchSpriteGenerator(args.project_root)
    
    # Determine which characters to generate
    characters = []
    if args.characters:
        characters = args.characters
    elif args.all_existing:
        characters = batch_generator._get_existing_characters()
        if not characters:
            print("⚠️  No existing characters found. Using default set.")
            characters = ["ryu", "ken", "chun_li", "zangief", "sagat", "lei_wulong"]
    elif args.new_characters:
        characters = args.new_characters
    else:
        # Default: generate for all existing characters
        characters = batch_generator._get_existing_characters()
        if not characters:
            characters = ["ryu", "ken", "chun_li", "zangief", "sagat", "lei_wulong"]
    
    print(f"🚀 Starting batch generation for: {', '.join(characters)}")
    
    # Generate sprites
    results = batch_generator.generate_character_batch(characters, args.poses, config)
    
    # Validate results
    validation_results = batch_generator.validate_generated_sprites(results)
    
    # Print summary
    total_sprites = sum(len(paths) for paths in results.values())
    print(f"\n🎉 Batch generation complete!")
    print(f"   Generated {total_sprites} sprites for {len(characters)} characters")
    print(f"   Sprites saved to: {batch_generator.asset_dir}")
    
    # Check for any issues
    issues = 0
    for char_id, validation in validation_results.items():
        if validation["missing_poses"]:
            issues += len(validation["missing_poses"])
    
    if issues > 0:
        print(f"⚠️  {issues} pose(s) failed to generate. Check the logs above.")
        return 1
    else:
        print("✅ All sprites generated successfully!")
        return 0


if __name__ == "__main__":
    exit(main())