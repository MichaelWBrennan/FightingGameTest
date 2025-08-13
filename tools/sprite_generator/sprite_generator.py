#!/usr/bin/env python3
"""
Fighting Game Sprite Generator
==============================

A production-ready procedural sprite generator for 2D fighting game characters.
Generates SF2-quality pixel art with configurable animations, palettes, and dimensions.

Compatible with Godot 4 and the existing Character.cs smart loading system.
"""

import os
import sys
import json
import argparse
import random
import math
from typing import Dict, List, Tuple, Optional, NamedTuple
from PIL import Image, ImageDraw, ImageFilter
import numpy as np


class SpriteConfig(NamedTuple):
    """Configuration for sprite generation"""
    width: int = 64
    height: int = 96
    enhanced_width: int = 256  
    enhanced_height: int = 384
    frames_per_animation: int = 1  # Single frame per pose for now
    palette_name: str = "default"
    use_dithering: bool = False
    archetype: str = "balanced"


class ColorPalette:
    """Fighting game character color palettes"""
    
    PALETTES = {
        "default": {
            "skin": [(255, 220, 177), (235, 200, 157), (215, 180, 137)],
            "hair": [(139, 69, 19), (160, 82, 45), (101, 67, 33)],
            "gi_primary": [(255, 255, 255), (240, 240, 240), (220, 220, 220)],
            "gi_secondary": [(220, 20, 60), (200, 20, 40), (180, 20, 20)],
            "belt": [(139, 69, 19), (101, 67, 33), (83, 53, 19)],
            "eyes": [(0, 100, 200), (0, 80, 180), (0, 60, 160)],
            "outline": [(0, 0, 0), (32, 32, 32), (64, 64, 64)]
        },
        "ryu": {
            "skin": [(255, 220, 177), (235, 200, 157), (215, 180, 137)],
            "hair": [(139, 69, 19), (160, 82, 45), (101, 67, 33)],
            "gi_primary": [(255, 255, 255), (240, 240, 240), (220, 220, 220)],
            "gi_secondary": [(255, 255, 255), (240, 240, 240), (220, 220, 220)],
            "belt": [(0, 0, 0), (32, 32, 32), (16, 16, 16)],
            "eyes": [(101, 67, 33), (83, 53, 19), (65, 39, 15)],
            "outline": [(0, 0, 0), (32, 32, 32), (64, 64, 64)]
        },
        "ken": {
            "skin": [(255, 220, 177), (235, 200, 157), (215, 180, 137)],
            "hair": [(255, 215, 0), (255, 193, 37), (255, 165, 0)],
            "gi_primary": [(255, 0, 0), (220, 0, 0), (180, 0, 0)],
            "gi_secondary": [(255, 255, 255), (240, 240, 240), (220, 220, 220)],
            "belt": [(139, 69, 19), (101, 67, 33), (83, 53, 19)],
            "eyes": [(0, 100, 200), (0, 80, 180), (0, 60, 160)],
            "outline": [(0, 0, 0), (32, 32, 32), (64, 64, 64)]
        },
        "chun_li": {
            "skin": [(255, 228, 196), (245, 218, 186), (225, 198, 166)],
            "hair": [(139, 69, 19), (101, 67, 33), (83, 53, 19)],
            "gi_primary": [(30, 144, 255), (0, 123, 255), (0, 100, 200)],
            "gi_secondary": [(255, 215, 0), (255, 193, 37), (255, 165, 0)],
            "belt": [(255, 215, 0), (255, 193, 37), (255, 165, 0)],
            "eyes": [(101, 67, 33), (83, 53, 19), (65, 39, 15)],
            "outline": [(0, 0, 0), (32, 32, 32), (64, 64, 64)]
        },
        "zangief": {
            "skin": [(255, 220, 177), (235, 200, 157), (215, 180, 137)],
            "hair": [(205, 92, 92), (178, 34, 34), (139, 0, 0)],
            "gi_primary": [(255, 0, 0), (220, 0, 0), (180, 0, 0)],
            "gi_secondary": [(255, 215, 0), (255, 193, 37), (255, 165, 0)],
            "belt": [(255, 215, 0), (255, 193, 37), (255, 165, 0)],
            "eyes": [(0, 100, 200), (0, 80, 180), (0, 60, 160)],
            "outline": [(0, 0, 0), (32, 32, 32), (64, 64, 64)]
        },
        "sagat": {
            "skin": [(210, 180, 140), (190, 160, 120), (170, 140, 100)],
            "hair": [(0, 0, 0), (32, 32, 32), (16, 16, 16)],
            "gi_primary": [(128, 0, 128), (106, 0, 106), (84, 0, 84)],
            "gi_secondary": [(255, 215, 0), (255, 193, 37), (255, 165, 0)],
            "belt": [(255, 215, 0), (255, 193, 37), (255, 165, 0)],
            "eyes": [(255, 0, 0), (220, 0, 0), (180, 0, 0)],
            "outline": [(0, 0, 0), (32, 32, 32), (64, 64, 64)]
        },
        "lei_wulong": {
            "skin": [(255, 228, 196), (245, 218, 186), (225, 198, 166)],
            "hair": [(0, 0, 0), (32, 32, 32), (16, 16, 16)],
            "gi_primary": [(255, 255, 255), (240, 240, 240), (220, 220, 220)],
            "gi_secondary": [(0, 0, 0), (32, 32, 32), (16, 16, 16)],
            "belt": [(139, 69, 19), (101, 67, 33), (83, 53, 19)],
            "eyes": [(101, 67, 33), (83, 53, 19), (65, 39, 15)],
            "outline": [(0, 0, 0), (32, 32, 32), (64, 64, 64)]
        }
    }
    
    @classmethod
    def get_palette(cls, name: str) -> Dict[str, List[Tuple[int, int, int]]]:
        """Get color palette by name"""
        return cls.PALETTES.get(name, cls.PALETTES["default"])
    
    @classmethod
    def get_available_palettes(cls) -> List[str]:
        """Get list of available palette names"""
        return list(cls.PALETTES.keys())


class FighterArchetype:
    """Fighting game character archetype definitions"""
    
    ARCHETYPES = {
        "balanced": {
            "body_type": "medium",
            "stance": "neutral",
            "proportions": {"head": 0.12, "torso": 0.45, "legs": 0.43},
            "muscle_definition": "medium"
        },
        "rushdown": {
            "body_type": "lean",
            "stance": "forward",
            "proportions": {"head": 0.11, "torso": 0.44, "legs": 0.45},
            "muscle_definition": "low"
        },
        "grappler": {
            "body_type": "heavy",
            "stance": "wide",
            "proportions": {"head": 0.10, "torso": 0.50, "legs": 0.40},
            "muscle_definition": "high"
        },
        "zoner": {
            "body_type": "tall",
            "stance": "defensive",
            "proportions": {"head": 0.13, "torso": 0.42, "legs": 0.45},
            "muscle_definition": "medium"
        },
        "technical": {
            "body_type": "medium",
            "stance": "precise",
            "proportions": {"head": 0.12, "torso": 0.43, "legs": 0.45},
            "muscle_definition": "medium"
        }
    }
    
    @classmethod
    def get_archetype(cls, name: str) -> Dict:
        """Get archetype definition by name"""
        return cls.ARCHETYPES.get(name, cls.ARCHETYPES["balanced"])


class SpriteGenerator:
    """Main sprite generator class"""
    
    def __init__(self, config: SpriteConfig):
        """Initialize sprite generator with configuration"""
        self.config = config
        self.palette = ColorPalette.get_palette(config.palette_name)
        self.archetype = FighterArchetype.get_archetype(config.archetype)
        
    def generate_character_sprite(self, character_id: str, pose: str, 
                                enhanced: bool = False) -> Image.Image:
        """
        Generate a fighting game character sprite
        
        Args:
            character_id: Character identifier (e.g., 'ryu', 'ken')
            pose: Animation pose ('idle', 'walk', 'punch', 'kick', 'jump', 'special')
            enhanced: Generate enhanced resolution version
            
        Returns:
            PIL Image object containing the generated sprite
        """
        # Determine sprite dimensions
        if enhanced:
            width, height = self.config.enhanced_width, self.config.enhanced_height
            scale = 4  # 4x scaling from original
        else:
            width, height = self.config.width, self.config.height
            scale = 1
            
        # Create base image with transparency
        sprite = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(sprite)
        
        # Get character-specific palette
        char_palette = ColorPalette.get_palette(character_id)
        if not char_palette:
            char_palette = self.palette
            
        # Generate character based on pose
        self._draw_character(draw, char_palette, pose, width, height, scale)
        
        # Apply dithering if requested
        if self.config.use_dithering:
            sprite = self._apply_dithering(sprite)
            
        return sprite
    
    def _draw_character(self, draw: ImageDraw.Draw, palette: Dict, 
                       pose: str, width: int, height: int, scale: int):
        """Draw character on the sprite canvas"""
        
        # Calculate base dimensions
        center_x = width // 2
        proportions = self.archetype["proportions"]
        
        # Character body parts heights (proportional to sprite height)
        head_height = int(height * proportions["head"])
        torso_height = int(height * proportions["torso"])
        legs_height = int(height * proportions["legs"])
        
        # Adjust positions based on pose
        pose_offset = self._get_pose_offset(pose, scale)
        body_lean = self._get_body_lean(pose, scale)
        
        # Draw character from bottom up
        current_y = height - 5 * scale  # Leave small margin at bottom
        
        # Draw legs
        leg_width = 8 * scale if self.archetype["body_type"] == "heavy" else 6 * scale
        self._draw_legs(draw, palette, center_x + body_lean, current_y, 
                       leg_width, legs_height, pose, scale)
        current_y -= legs_height
        
        # Draw torso
        torso_width = 12 * scale if self.archetype["body_type"] == "heavy" else 10 * scale
        self._draw_torso(draw, palette, center_x + body_lean, current_y,
                        torso_width, torso_height, pose, scale)
        current_y -= torso_height
        
        # Draw head
        head_width = 8 * scale
        self._draw_head(draw, palette, center_x + body_lean, current_y,
                       head_width, head_height, pose, scale)
        
        # Draw arms based on pose
        self._draw_arms(draw, palette, center_x + body_lean, current_y + head_height//2,
                       pose, scale, torso_width, torso_height)
    
    def _get_pose_offset(self, pose: str, scale: int) -> Tuple[int, int]:
        """Get x,y offset for the pose"""
        offsets = {
            "idle": (0, 0),
            "walk": (2 * scale, 0),
            "punch": (3 * scale, -2 * scale),
            "kick": (1 * scale, -1 * scale), 
            "jump": (0, -8 * scale),
            "special": (2 * scale, -4 * scale)
        }
        return offsets.get(pose, (0, 0))
    
    def _get_body_lean(self, pose: str, scale: int) -> int:
        """Get horizontal body lean for the pose"""
        leans = {
            "idle": 0,
            "walk": 1 * scale,
            "punch": 3 * scale,
            "kick": -2 * scale,
            "jump": 0,
            "special": 2 * scale
        }
        return leans.get(pose, 0)
    
    def _draw_legs(self, draw: ImageDraw.Draw, palette: Dict, center_x: int, 
                  bottom_y: int, width: int, height: int, pose: str, scale: int):
        """Draw character legs"""
        leg_colors = palette.get("gi_primary", [(255, 255, 255)])
        outline_colors = palette.get("outline", [(0, 0, 0)])
        
        # Adjust leg positioning based on pose
        if pose == "kick":
            # Draw kicking pose - one leg extended
            # Standing leg
            leg1_x1 = center_x - width//4
            leg1_x2 = center_x
            leg1_y1 = bottom_y
            leg1_y2 = bottom_y - height
            
            # Kicking leg (extended)
            leg2_x1 = center_x
            leg2_x2 = center_x + width//2
            leg2_y1 = bottom_y - height//3
            leg2_y2 = bottom_y - height//2
            
            # Draw both legs
            draw.rectangle([leg1_x1, leg1_y2, leg1_x2, leg1_y1], 
                          fill=leg_colors[0], outline=outline_colors[0])
            draw.rectangle([leg2_x1, leg2_y2, leg2_x2, leg2_y1],
                          fill=leg_colors[0], outline=outline_colors[0])
        elif pose == "jump":
            # Draw jumping pose - legs bent
            leg_width = width // 3
            leg_height = height * 2 // 3
            
            # Left leg
            draw.rectangle([center_x - width//2, bottom_y - leg_height,
                          center_x - width//4, bottom_y],
                         fill=leg_colors[0], outline=outline_colors[0])
            # Right leg  
            draw.rectangle([center_x + width//4, bottom_y - leg_height,
                          center_x + width//2, bottom_y],
                         fill=leg_colors[0], outline=outline_colors[0])
        else:
            # Default standing legs
            # Left leg
            draw.rectangle([center_x - width//2, bottom_y - height,
                          center_x - width//8, bottom_y],
                         fill=leg_colors[0], outline=outline_colors[0])
            # Right leg
            draw.rectangle([center_x + width//8, bottom_y - height,
                          center_x + width//2, bottom_y],
                         fill=leg_colors[0], outline=outline_colors[0])
    
    def _draw_torso(self, draw: ImageDraw.Draw, palette: Dict, center_x: int,
                   bottom_y: int, width: int, height: int, pose: str, scale: int):
        """Draw character torso"""
        torso_colors = palette.get("gi_primary", [(255, 255, 255)])
        secondary_colors = palette.get("gi_secondary", [(220, 20, 60)])
        outline_colors = palette.get("outline", [(0, 0, 0)])
        
        # Main torso rectangle
        torso_rect = [center_x - width//2, bottom_y - height,
                     center_x + width//2, bottom_y]
        draw.rectangle(torso_rect, fill=torso_colors[0], outline=outline_colors[0])
        
        # Add gi details
        belt_y = bottom_y - height // 4
        draw.rectangle([center_x - width//2, belt_y - 2*scale,
                       center_x + width//2, belt_y + 2*scale],
                      fill=palette.get("belt", [(139, 69, 19)])[0],
                      outline=outline_colors[0])
        
        # Add muscle definition for grapplers
        if self.archetype["muscle_definition"] == "high":
            # Draw chest definition
            chest_y = bottom_y - height * 3 // 4
            draw.ellipse([center_x - width//3, chest_y - 4*scale,
                         center_x + width//3, chest_y + 4*scale],
                        outline=torso_colors[1] if len(torso_colors) > 1 else outline_colors[0])
    
    def _draw_head(self, draw: ImageDraw.Draw, palette: Dict, center_x: int,
                  bottom_y: int, width: int, height: int, pose: str, scale: int):
        """Draw character head"""
        skin_colors = palette.get("skin", [(255, 220, 177)])
        hair_colors = palette.get("hair", [(139, 69, 19)])
        eye_colors = palette.get("eyes", [(0, 100, 200)])
        outline_colors = palette.get("outline", [(0, 0, 0)])
        
        # Head shape (oval)
        head_rect = [center_x - width//2, bottom_y - height,
                    center_x + width//2, bottom_y]
        draw.ellipse(head_rect, fill=skin_colors[0], outline=outline_colors[0])
        
        # Hair
        hair_height = height // 3
        hair_rect = [center_x - width//2, bottom_y - height,
                    center_x + width//2, bottom_y - height + hair_height]
        draw.ellipse(hair_rect, fill=hair_colors[0], outline=outline_colors[0])
        
        # Eyes
        eye_y = bottom_y - height * 2 // 3
        eye_size = 2 * scale
        # Left eye
        draw.ellipse([center_x - width//4 - eye_size//2, eye_y - eye_size//2,
                     center_x - width//4 + eye_size//2, eye_y + eye_size//2],
                    fill=eye_colors[0])
        # Right eye  
        draw.ellipse([center_x + width//4 - eye_size//2, eye_y - eye_size//2,
                     center_x + width//4 + eye_size//2, eye_y + eye_size//2],
                    fill=eye_colors[0])
    
    def _draw_arms(self, draw: ImageDraw.Draw, palette: Dict, center_x: int,
                  center_y: int, pose: str, scale: int, torso_width: int, torso_height: int):
        """Draw character arms based on pose"""
        arm_colors = palette.get("gi_primary", [(255, 255, 255)])
        skin_colors = palette.get("skin", [(255, 220, 177)])
        outline_colors = palette.get("outline", [(0, 0, 0)])
        
        arm_width = 4 * scale
        arm_length = torso_height // 2
        
        if pose == "punch":
            # Punching pose - one arm extended forward
            # Extended arm (right)
            draw.rectangle([center_x + torso_width//2, center_y - arm_width//2,
                          center_x + torso_width//2 + arm_length, center_y + arm_width//2],
                         fill=arm_colors[0], outline=outline_colors[0])
            # Hand
            draw.ellipse([center_x + torso_width//2 + arm_length - 3*scale, center_y - 3*scale,
                         center_x + torso_width//2 + arm_length + 3*scale, center_y + 3*scale],
                        fill=skin_colors[0], outline=outline_colors[0])
            
            # Retracted arm (left)
            draw.rectangle([center_x - torso_width//2 - arm_length//2, center_y - arm_width//2,
                          center_x - torso_width//2, center_y + arm_width//2],
                         fill=arm_colors[0], outline=outline_colors[0])
        elif pose == "special":
            # Special move pose - dramatic arm positions
            # Both arms in dynamic positions
            # Left arm up
            draw.rectangle([center_x - torso_width//2 - arm_width//2, center_y - arm_length,
                          center_x - torso_width//2 + arm_width//2, center_y],
                         fill=arm_colors[0], outline=outline_colors[0])
            # Right arm forward and down
            draw.rectangle([center_x + torso_width//2, center_y,
                          center_x + torso_width//2 + arm_length//2, center_y + arm_length//2],
                         fill=arm_colors[0], outline=outline_colors[0])
        else:
            # Default arms at sides
            # Left arm
            draw.rectangle([center_x - torso_width//2 - arm_width, center_y - arm_width//2,
                          center_x - torso_width//2, center_y + arm_length],
                         fill=arm_colors[0], outline=outline_colors[0])
            # Right arm
            draw.rectangle([center_x + torso_width//2, center_y - arm_width//2,
                          center_x + torso_width//2 + arm_width, center_y + arm_length],
                         fill=arm_colors[0], outline=outline_colors[0])
    
    def _apply_dithering(self, image: Image.Image) -> Image.Image:
        """Apply retro-style dithering to the sprite"""
        # Convert to limited color palette
        image = image.quantize(colors=16, dither=Image.Dither.FLOYDSTEINBERG)
        return image.convert("RGBA")
    
    def save_sprite(self, sprite: Image.Image, output_path: str):
        """Save sprite to file with PNG optimization"""
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save with optimal PNG compression
        sprite.save(output_path, "PNG", optimize=True)


def main():
    """Command-line interface for sprite generation"""
    parser = argparse.ArgumentParser(description="Fighting Game Sprite Generator")
    parser.add_argument("--character", required=True, help="Character ID (e.g., ryu, ken)")
    parser.add_argument("--poses", nargs="+", 
                       default=["idle", "walk", "punch", "kick", "jump", "special"],
                       help="Poses to generate")
    parser.add_argument("--palette", choices=ColorPalette.get_available_palettes(),
                       default="default", help="Color palette to use")
    parser.add_argument("--archetype", choices=list(FighterArchetype.ARCHETYPES.keys()),
                       default="balanced", help="Character archetype")
    parser.add_argument("--output-dir", default="./generated_sprites",
                       help="Output directory for sprites")
    parser.add_argument("--width", type=int, default=64, help="Sprite width")
    parser.add_argument("--height", type=int, default=96, help="Sprite height")
    parser.add_argument("--enhanced-width", type=int, default=256, 
                       help="Enhanced sprite width")
    parser.add_argument("--enhanced-height", type=int, default=384,
                       help="Enhanced sprite height")
    parser.add_argument("--dithering", action="store_true", 
                       help="Apply retro dithering")
    parser.add_argument("--enhanced-only", action="store_true",
                       help="Generate only enhanced resolution sprites")
    
    args = parser.parse_args()
    
    # Create configuration
    config = SpriteConfig(
        width=args.width,
        height=args.height,
        enhanced_width=args.enhanced_width,
        enhanced_height=args.enhanced_height,
        palette_name=args.palette,
        use_dithering=args.dithering,
        archetype=args.archetype
    )
    
    # Initialize generator
    generator = SpriteGenerator(config)
    
    print(f"Generating sprites for character: {args.character}")
    print(f"Poses: {', '.join(args.poses)}")
    print(f"Palette: {args.palette}")
    print(f"Archetype: {args.archetype}")
    print(f"Output directory: {args.output_dir}")
    
    generated_sprites = []
    
    # Generate sprites for each pose
    for pose in args.poses:
        print(f"\nGenerating {pose} pose...")
        
        # Generate original resolution (unless enhanced-only)
        if not args.enhanced_only:
            sprite = generator.generate_character_sprite(args.character, pose, enhanced=False)
            output_path = os.path.join(args.output_dir, f"{args.character}_{pose}.png")
            generator.save_sprite(sprite, output_path)
            generated_sprites.append(output_path)
            print(f"  Original: {output_path}")
        
        # Generate enhanced resolution
        enhanced_sprite = generator.generate_character_sprite(args.character, pose, enhanced=True)
        enhanced_output_path = os.path.join(args.output_dir, f"{args.character}_{pose}_enhanced.png")
        generator.save_sprite(enhanced_sprite, enhanced_output_path)
        generated_sprites.append(enhanced_output_path)
        print(f"  Enhanced: {enhanced_output_path}")
    
    print(f"\n✅ Successfully generated {len(generated_sprites)} sprites!")
    print(f"All sprites saved to: {args.output_dir}")
    
    return generated_sprites


if __name__ == "__main__":
    main()