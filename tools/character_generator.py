#!/usr/bin/env python3
"""
Dark Fantasy Fighting Game Character Generator
Combines LPC assets to create the 12 fantasy warriors
"""

import json
import os
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CharacterGenerator:
    def __init__(self, assets_dir="/workspace/assets/downloaded_assets"):
        self.assets_dir = Path(assets_dir)
        self.character_dir = self.assets_dir / "characters"
        self.output_dir = self.assets_dir / "generated_characters"
        self.mapping_file = self.assets_dir / "character_mapping.json"
        
        # Create output directory
        self.output_dir.mkdir(exist_ok=True)
        
        # Load character mapping
        with open(self.mapping_file, 'r') as f:
            self.mapping = json.load(f)
    
    def load_asset(self, asset_path):
        """Load an asset image with error handling"""
        try:
            full_path = self.character_dir / asset_path
            if full_path.exists():
                return Image.open(full_path).convert("RGBA")
            else:
                logger.warning(f"Asset not found: {asset_path}")
                return None
        except Exception as e:
            logger.error(f"Error loading asset {asset_path}: {e}")
            return None
    
    def apply_color_tint(self, image, color, intensity=0.3):
        """Apply a color tint to an image"""
        if not image:
            return None
            
        try:
            # Convert hex color to RGB
            if color.startswith('#'):
                color = color[1:]
            r, g, b = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
            
            # Create a colored overlay
            overlay = Image.new('RGBA', image.size, (r, g, b, int(255 * intensity)))
            
            # Blend with original image
            return Image.alpha_composite(image, overlay)
        except Exception as e:
            logger.error(f"Error applying color tint: {e}")
            return image
    
    def add_dark_fantasy_effects(self, image):
        """Add dark fantasy effects to the character"""
        if not image:
            return None
            
        try:
            # Darken the image slightly
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(0.85)
            
            # Increase contrast for more dramatic look
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)
            
            # Add slight blur for mystical effect
            image = image.filter(ImageFilter.GaussianBlur(radius=0.5))
            
            return image
        except Exception as e:
            logger.error(f"Error adding dark fantasy effects: {e}")
            return image
    
    def generate_character(self, character_id):
        """Generate a complete character sprite"""
        logger.info(f"Generating character: {character_id}")
        
        if character_id not in self.mapping["characterAssetMapping"]:
            logger.error(f"Character {character_id} not found in mapping")
            return None
        
        char_data = self.mapping["characterAssetMapping"][character_id]
        assets = char_data["assets"]
        
        # Load base body
        character_image = self.load_asset(assets["body"])
        if not character_image:
            logger.error(f"Failed to load base body for {character_id}")
            return None
        
        # Layer order for proper rendering
        layer_order = [
            "legs", "feet", "torso", "arms", "hands", 
            "hair", "head", "weapon", "cape", "wings"
        ]
        
        # Composite all layers
        for layer in layer_order:
            if layer in assets and assets[layer]:
                layer_image = self.load_asset(assets[layer])
                if layer_image:
                    # Resize to match base if needed
                    if layer_image.size != character_image.size:
                        layer_image = layer_image.resize(character_image.size, Image.LANCZOS)
                    
                    # Apply color tinting if specified
                    if "colors" in char_data:
                        if layer == "weapon":
                            layer_image = self.apply_color_tint(
                                layer_image, char_data["colors"]["accent"], 0.2
                            )
                        elif layer in ["cape", "torso"]:
                            layer_image = self.apply_color_tint(
                                layer_image, char_data["colors"]["primary"], 0.15
                            )
                    
                    # Composite the layer
                    character_image = Image.alpha_composite(character_image, layer_image)
        
        # Apply dark fantasy effects
        character_image = self.add_dark_fantasy_effects(character_image)
        
        # Apply character theme tinting
        if "colors" in char_data:
            character_image = self.apply_color_tint(
                character_image, char_data["colors"]["primary"], 0.1
            )
        
        return character_image
    
    def create_character_variations(self, character_id):
        """Create variations of a character if specified"""
        char_data = self.mapping["characterAssetMapping"][character_id]
        variations = {}
        
        # Base character
        base_character = self.generate_character(character_id)
        if base_character:
            variations["base"] = base_character
        
        # Generate variations if specified
        if "variations" in char_data:
            for var_name, var_data in char_data["variations"].items():
                logger.info(f"Generating {character_id} variation: {var_name}")
                
                # Create modified mapping for this variation
                modified_mapping = char_data.copy()
                
                # Apply variation changes
                if "hair_color" in var_data:
                    hair_path = modified_mapping["assets"]["hair"]
                    hair_path = hair_path.replace(
                        hair_path.split("/")[-1],
                        f"{var_data['hair_color']}.png"
                    )
                    modified_mapping["assets"]["hair"] = hair_path
                
                if "robe_color" in var_data:
                    robe_path = modified_mapping["assets"]["torso"]
                    robe_path = robe_path.replace(
                        robe_path.split("/")[-1],
                        f"{var_data['robe_color']}.png"
                    )
                    modified_mapping["assets"]["torso"] = robe_path
                
                # Generate variation
                var_character = self.generate_character_from_data(modified_mapping)
                if var_character:
                    variations[var_name] = var_character
        
        return variations
    
    def generate_character_from_data(self, char_data):
        """Generate character from character data dict"""
        assets = char_data["assets"]
        
        # Load base body
        character_image = self.load_asset(assets["body"])
        if not character_image:
            return None
        
        # Layer order for proper rendering
        layer_order = [
            "legs", "feet", "torso", "arms", "hands", 
            "hair", "head", "weapon", "cape", "wings"
        ]
        
        # Composite all layers
        for layer in layer_order:
            if layer in assets and assets[layer]:
                layer_image = self.load_asset(assets[layer])
                if layer_image:
                    if layer_image.size != character_image.size:
                        layer_image = layer_image.resize(character_image.size, Image.LANCZOS)
                    character_image = Image.alpha_composite(character_image, layer_image)
        
        # Apply dark fantasy effects
        character_image = self.add_dark_fantasy_effects(character_image)
        
        return character_image
    
    def generate_all_characters(self):
        """Generate all 12 fantasy warriors"""
        logger.info("Generating all fantasy warriors...")
        
        generated_characters = {}
        
        for character_id in self.mapping["characterAssetMapping"]:
            logger.info(f"Processing {character_id}...")
            
            # Generate character variations
            variations = self.create_character_variations(character_id)
            
            if variations:
                generated_characters[character_id] = variations
                
                # Save each variation
                for var_name, char_image in variations.items():
                    output_path = self.output_dir / f"{character_id}_{var_name}.png"
                    char_image.save(output_path)
                    logger.info(f"Saved: {output_path}")
        
        logger.info(f"Generated {len(generated_characters)} characters")
        return generated_characters
    
    def create_character_preview(self):
        """Create a preview sheet showing all characters"""
        logger.info("Creating character preview sheet...")
        
        characters = self.generate_all_characters()
        
        if not characters:
            logger.error("No characters generated")
            return
        
        # Calculate grid size
        char_count = len(characters)
        cols = 4
        rows = (char_count + cols - 1) // cols
        
        # Assume 64x64 character sprites
        char_size = 64
        spacing = 10
        preview_width = cols * (char_size + spacing) - spacing
        preview_height = rows * (char_size + spacing) - spacing + 50  # Extra space for labels
        
        # Create preview image
        preview = Image.new('RGBA', (preview_width, preview_height), (32, 32, 32, 255))
        
        # Place characters
        x, y = 0, 0
        for char_id, variations in characters.items():
            # Use base variation
            char_image = variations.get("base")
            if char_image:
                # Resize if needed
                if char_image.size != (char_size, char_size):
                    char_image = char_image.resize((char_size, char_size), Image.LANCZOS)
                
                # Place on preview
                preview.paste(char_image, (x, y), char_image)
            
            x += char_size + spacing
            if x >= preview_width:
                x = 0
                y += char_size + spacing
        
        # Save preview
        preview_path = self.output_dir / "character_preview.png"
        preview.save(preview_path)
        logger.info(f"Character preview saved: {preview_path}")

def main():
    """Main function"""
    generator = CharacterGenerator()
    
    try:
        # Generate all characters
        generator.generate_all_characters()
        
        # Create preview
        generator.create_character_preview()
        
        logger.info("Character generation complete!")
        
    except Exception as e:
        logger.error(f"Error during character generation: {e}")

if __name__ == "__main__":
    main()