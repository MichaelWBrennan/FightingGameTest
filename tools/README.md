# Fighting Game Sprite Scraper

This directory contains tools for scraping and organizing fighting game sprites from the Spriters Resource website.

## Overview

The sprite scraper system allows you to:
1. **Crawl** the Spriters Resource fighting games section
2. **Extract** character and sprite information 
3. **Download** HD sprites organized by game and character
4. **Map** sprites to the existing character system
5. **Integrate** sprite references into character data files

## Files

### `sprite_scraper.py` - Main Scraper
The primary scraping tool that crawls https://www.spriters-resource.com/genre/fighting/

**Features:**
- Crawls fighting game listings automatically
- Extracts character names and sprite information
- Downloads HD sprites with priority over standard resolution
- Organizes sprites by game → character → type (sprites/portraits/icons)
- Creates comprehensive metadata for all discovered content
- Respects website with delays and proper user-agent headers

**Usage:**
```bash
# Basic scraping (dry run first to test)
python3 tools/sprite_scraper.py --dry-run

# Scrape all fighting games (full download)
python3 tools/sprite_scraper.py

# Filter by specific game
python3 tools/sprite_scraper.py --game-filter "Street Fighter"

# Limit number of games processed
python3 tools/sprite_scraper.py --max-games 3
```

### `integrate_sprites.py` - Character Integration
Integrates scraped sprite data with existing character files.

**Features:**
- Reads sprite metadata created by scraper
- Matches characters with existing character data files
- Updates character JSON files with sprite references
- Creates sprite paths for Godot asset loading

**Usage:**
```bash
# Run after scraping to integrate sprites
python3 tools/integrate_sprites.py
```

### `demo_scraper.py` - Demonstration
Creates mock data to demonstrate the scraper functionality when the website is not accessible.

**Usage:**
```bash
# Generate demonstration data
python3 tools/demo_scraper.py
```

## Directory Structure Created

After running the scraper, the following structure is created:

```
assets/
├── sprites/                          # Downloaded sprite files
│   ├── street_fighter_6/
│   │   ├── ryu/
│   │   │   ├── sprites/              # Character sprite sheets
│   │   │   ├── portraits/            # Character portraits
│   │   │   └── icons/                # Character select icons
│   │   ├── chun_li/
│   │   └── ...
│   ├── tekken_8/
│   └── ...
└── metadata/                         # Scraping metadata
    ├── fighting_games.json           # List of discovered games
    ├── sprites_metadata.json         # All sprite information
    ├── character_sprite_mapping.json # Character → sprite mapping
    └── demo_scraping_report.json     # Demo results (if using demo)
```

## Integration with Character System

The scraper integrates with the existing character data system by:

1. **Matching Characters**: Uses character names to match scraped sprites with existing character data files
2. **Adding Sprite References**: Updates character JSON files with sprite information
3. **Organizing Assets**: Places sprites in organized directory structure
4. **Creating Mappings**: Provides metadata for Godot asset loading

### Example Character Integration

Before integration:
```json
{
  "characterId": "ryu",
  "name": "Ryu",
  "archetype": "shoto",
  // ... other character data
}
```

After integration:
```json
{
  "characterId": "ryu", 
  "name": "Ryu",
  "archetype": "shoto",
  // ... other character data
  "sprites": {
    "sprite_sheets": [
      {
        "name": "Ryu - Character Sprites",
        "file_name": "street_fighter_6_ryu_character_sprites", 
        "url": "https://www.spriters-resource.com/...",
        "is_hd": true,
        "file_size": 1024000,
        "resolution": "1920x1080"
      }
    ],
    "portraits": [...],
    "icons": [...]
  }
}
```

## Configuration

### Character Name Matching

The scraper includes a comprehensive list of fighting game character names for accurate matching:

- Street Fighter characters (Ryu, Chun-Li, Ken, etc.)
- Tekken characters (Jin, Kazuya, Nina, etc.) 
- Guilty Gear characters (Sol Badguy, Ky Kiske, etc.)
- King of Fighters characters (Kyo, Iori, Terry, etc.)
- Mortal Kombat characters (Liu Kang, Sub-Zero, etc.)
- And many more...

### HD Sprite Detection

Sprites are automatically classified as HD based on:
- Presence of keywords: "hd", "high", "definition", "1080", "720"
- Resolution information when available
- File size heuristics

### Download Priorities

1. **HD sprites first** - Prioritizes high-definition versions
2. **Character sprites** - Main sprite sheets get priority
3. **Portraits and icons** - Secondary content downloaded after main sprites
4. **Rate limiting** - Respectful delays between downloads

## Error Handling

The scraper includes robust error handling for:

- **Network timeouts** - Automatic retries with exponential backoff
- **Missing pages** - Graceful handling of broken links
- **Malformed HTML** - Defensive parsing with fallbacks
- **File system errors** - Proper directory creation and permissions
- **Partial downloads** - Resume capability and progress saving

## Usage Examples

### Complete Workflow

```bash
# 1. Install requirements
pip3 install -r requirements.txt

# 2. Test with dry run
python3 tools/sprite_scraper.py --dry-run --max-games 1

# 3. Run actual scraping (start small)
python3 tools/sprite_scraper.py --max-games 3

# 4. Integrate with character system  
python3 tools/integrate_sprites.py

# 5. Verify results
ls assets/sprites/
cat assets/metadata/demo_scraping_report.json
```

### Targeted Scraping

```bash
# Scrape only Street Fighter games
python3 tools/sprite_scraper.py --game-filter "Street Fighter"

# Scrape only Tekken games
python3 tools/sprite_scraper.py --game-filter "Tekken"

# Limited scraping for testing
python3 tools/sprite_scraper.py --max-games 1 --dry-run
```

## Godot Integration

The scraped sprites can be used in Godot by:

1. **Asset Import**: Sprites are placed in `assets/sprites/` for Godot import
2. **Resource Paths**: Character data contains file paths for loading
3. **Metadata Access**: JSON metadata provides sprite information
4. **Dynamic Loading**: Character system can load sprites based on character data

### Example Godot Usage

```csharp
// In C# character loading system
var characterData = LoadCharacterData("ryu");
var spriteInfo = characterData["sprites"]["sprite_sheets"][0];
var spritePath = $"res://assets/sprites/{spriteInfo["file_name"]}.png";
var spriteTexture = GD.Load<Texture2D>(spritePath);
```

## Limitations

- **Website Dependency**: Requires access to spriters-resource.com
- **Rate Limiting**: Respectful scraping means slower downloads
- **Manual Verification**: Some character name matching may need manual review
- **File Formats**: Limited to image formats supported by the website
- **HD Availability**: Not all games have HD sprites available

## Future Enhancements

Potential improvements for the scraper system:

- **Resume Capability**: Resume interrupted downloads
- **Parallel Processing**: Multi-threaded downloading (with rate limits)
- **Quality Assessment**: Automatic sprite quality evaluation
- **Format Conversion**: Convert sprites to optimal formats for Godot
- **Animation Extraction**: Extract individual frames from sprite sheets
- **Metadata Enhancement**: Additional sprite metadata (frame counts, etc.)

## Troubleshooting

### Common Issues

1. **Network Access**: Ensure spriters-resource.com is accessible
2. **Permissions**: Check write permissions in assets directory
3. **Dependencies**: Verify all Python packages are installed
4. **Disk Space**: Ensure sufficient storage for sprite downloads
5. **Character Matching**: Review character name mappings if integration fails

### Debug Mode

Enable verbose logging by modifying the scraper:
```python
logging.basicConfig(level=logging.DEBUG)
```

### Manual Character Mapping

If character names don't match automatically, you can manually edit:
- `assets/metadata/character_sprite_mapping.json` - Update character names
- `tools/integrate_sprites.py` - Modify character matching logic