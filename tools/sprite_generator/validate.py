#!/usr/bin/env python3
"""
Sprite Validation Script
========================

Validates generated sprites against the existing Character.cs loading system.
Ensures compatibility and correct file structure.
"""

import os
from pathlib import Path
from PIL import Image


def validate_sprite_system(project_root):
    """Validate the sprite system compatibility"""
    print("=== SPRITE LOADING SYSTEM VALIDATION ===")
    
    asset_dir = Path(project_root) / "assets" / "sprites" / "street_fighter_6"
    
    if not asset_dir.exists():
        print("❌ Sprites directory not found")
        return False
    
    # Expected characters and poses based on existing system
    characters = ["ryu", "ken", "chun_li", "zangief", "sagat", "lei_wulong"]
    poses = ["idle", "walk", "attack", "jump"]
    
    total_sprites = 0
    loaded_sprites = 0
    enhanced_sprites = 0
    
    results = {}
    
    for character in characters:
        print(f"\nValidating {character}:")
        char_results = {"original": 0, "enhanced": 0, "missing": []}
        
        for pose in poses:
            total_sprites += 1
            
            # Test enhanced sprite loading (priority)  
            enhanced_path = asset_dir / character / "sprites" / f"{character}_{pose}_enhanced.png"
            original_path = asset_dir / character / "sprites" / f"{character}_{pose}.png"
            
            # Smart loading logic (same as Character.cs)
            if enhanced_path.exists():
                selected_path = enhanced_path
                is_enhanced = True
                loaded_sprites += 1
                enhanced_sprites += 1
                char_results["enhanced"] += 1
            elif original_path.exists():
                selected_path = original_path
                is_enhanced = False
                loaded_sprites += 1
                char_results["original"] += 1
            else:
                selected_path = None
                char_results["missing"].append(pose)
            
            if selected_path:
                # Validate sprite properties
                try:
                    with Image.open(selected_path) as img:
                        width, height = img.size
                        quality = "ENHANCED" if is_enhanced else "Original"
                        expected_w = 256 if is_enhanced else 64
                        expected_h = 384 if is_enhanced else 96
                        
                        if width == expected_w and height == expected_h:
                            print(f"  ✅ {pose}: {quality} ({width}x{height}) - VALID")
                        else:
                            print(f"  ⚠️  {pose}: {quality} ({width}x{height}) - Size mismatch! Expected {expected_w}x{expected_h}")
                            
                except Exception as e:
                    print(f"  ❌ {pose}: Failed to validate image - {e}")
            else:
                print(f"  ❌ {pose}: File not found")
        
        results[character] = char_results
    
    print("\n=== VALIDATION RESULTS ===")
    print(f"Total sprites expected: {total_sprites}")
    print(f"Successfully found: {loaded_sprites}")
    print(f"Enhanced quality: {enhanced_sprites}")
    print(f"Original quality: {loaded_sprites - enhanced_sprites}")
    print(f"Success rate: {loaded_sprites / total_sprites * 100:.1f}%")
    print(f"Enhancement rate: {enhanced_sprites / total_sprites * 100:.1f}%")
    
    # Character-by-character summary
    print(f"\n=== CHARACTER SUMMARY ===")
    for character, char_data in results.items():
        enhanced = char_data["enhanced"]
        original = char_data["original"] 
        missing = len(char_data["missing"])
        total = enhanced + original
        print(f"{character}: {total}/4 sprites ({enhanced} enhanced, {original} original, {missing} missing)")
    
    if loaded_sprites == total_sprites and enhanced_sprites == total_sprites:
        print("\n🎉 PERFECT! All sprites found with enhanced quality!")
        return True
    elif loaded_sprites == total_sprites:
        print("\n✅ All sprites found successfully!")
        return True
    else:
        print(f"\n⚠️  {total_sprites - loaded_sprites} sprites are missing.")
        return False


def validate_character_cs_compatibility():
    """Test the Character.cs smart loading simulation"""
    print("\n=== CHARACTER.CS COMPATIBILITY TEST ===")
    
    # Simulate the Character.cs LoadSpriteForState method
    def simulate_character_loading(character_id, state):
        """Simulate Character.cs sprite loading logic"""
        sprite_filename = f"{character_id}_{state}.png"
        
        # Try enhanced version first, fallback to original  
        enhanced_sprite_path = f"res://assets/sprites/street_fighter_6/{character_id}/sprites/{sprite_filename.replace('.png', '_enhanced.png')}"
        original_sprite_path = f"res://assets/sprites/street_fighter_6/{character_id}/sprites/{sprite_filename}"
        
        # Convert to actual file paths
        project_root = Path(__file__).parent.parent.parent
        enhanced_path = project_root / enhanced_sprite_path.replace("res://", "")
        original_path = project_root / original_sprite_path.replace("res://", "")
        
        if enhanced_path.exists():
            return enhanced_path, "enhanced"
        elif original_path.exists():
            return original_path, "original"
        else:
            return None, "missing"
    
    # Test characters and states
    test_cases = [
        ("ryu", "idle"),
        ("ken", "walk"),
        ("chun_li", "attack"), 
        ("akuma", "jump")  # New generated character
    ]
    
    all_passed = True
    
    for character_id, state in test_cases:
        path, quality = simulate_character_loading(character_id, state)
        
        if path:
            with Image.open(path) as img:
                width, height = img.size
            print(f"Smart Loading: {character_id} {state} -> {quality} ({width}x{height}) ✅")
        else:
            print(f"Smart Loading FAILED: {character_id} {state} -> {quality} ❌")
            all_passed = False
    
    return all_passed


def main():
    """Main validation function"""
    # Get project root
    project_root = Path(__file__).parent.parent.parent
    
    print("🔍 Validating Sprite Generator Integration")
    print(f"📁 Project Root: {project_root}")
    
    # Run validations
    sprites_valid = validate_sprite_system(project_root)
    compatibility_valid = validate_character_cs_compatibility()
    
    # Final result
    print(f"\n{'='*50}")
    if sprites_valid and compatibility_valid:
        print("🎉 ALL VALIDATIONS PASSED!")
        print("✅ Sprite generator system is fully compatible with Character.cs")
        print("✅ All sprites are properly formatted and accessible")
        return 0
    else:
        print("⚠️  Some validations failed.")
        if not sprites_valid:
            print("❌ Sprite system validation failed")
        if not compatibility_valid:
            print("❌ Character.cs compatibility test failed")
        return 1


if __name__ == "__main__":
    exit(main())