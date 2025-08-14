extends Node
class_name ProceduralStageTextureGenerator

## Procedural Stage Texture Generator
## Generates stage textures that match character sprite palettes and style
## Integrates with RealtimeProceduralSpriteGenerator for consistent visual style

# Reference to the sprite generator for palette matching
var sprite_generator: RealtimeProceduralSpriteGenerator
var texture_cache: Dictionary = {}
var max_cache_size: int = 50

# FGC-approved texture generation settings
var texture_quality_settings = {
	"low": {"width": 256, "height": 256, "detail_level": 0.5},
	"medium": {"width": 512, "height": 512, "detail_level": 0.7},
	"high": {"width": 1024, "height": 1024, "detail_level": 1.0}
}

func _ready():
	# Get reference to sprite generator for palette consistency
	sprite_generator = RealtimeProceduralSpriteGenerator.new()
	print("ProceduralStageTextureGenerator ready")

## Generate a stage texture layer procedurally
## Uses same color palette system as sprite generation for consistency
func generate_stage_texture(layer_type: String, theme: String, time_of_day: String, palette_name: String = "default", quality: String = "medium") -> ImageTexture:
	"""
	Generate procedural stage textures that match character sprite palettes.
	
	Args:
		layer_type: Type of layer (sky, ground, buildings, etc.)
		theme: Stage theme (classic, urban, dojo, tournament)  
		time_of_day: Lighting context (day, night, sunset)
		palette_name: Character palette to match for consistency
		quality: Texture quality (low, medium, high)
	
	Returns:
		Generated ImageTexture with FGC-approved visual style
	"""
	var cache_key = "%s_%s_%s_%s_%s" % [layer_type, theme, time_of_day, palette_name, quality]
	
	# Check cache first
	if texture_cache.has(cache_key):
		return texture_cache[cache_key]
	
	var quality_settings = texture_quality_settings[quality]
	var image = Image.create(quality_settings.width, quality_settings.height, false, Image.FORMAT_RGBA8)
	
	# Get character palette for consistency
	var character_palette = get_character_palette(palette_name)
	
	# Generate texture based on layer type and theme
	match layer_type:
		"sky":
			generate_sky_texture(image, theme, time_of_day, character_palette)
		"ground":  
			generate_ground_texture(image, theme, character_palette)
		"buildings":
			generate_building_texture(image, theme, time_of_day, character_palette)
		"crowd":
			generate_crowd_texture(image, theme, character_palette)
		"effects":
			generate_effects_texture(image, theme, character_palette)
		_:
			generate_generic_texture(image, theme, character_palette)
	
	# Create texture from image
	var texture = ImageTexture.new()
	texture.set_image(image)
	
	# Cache the result
	texture_cache[cache_key] = texture
	
	# Maintain cache size
	if texture_cache.size() > max_cache_size:
		cleanup_old_cache_entries()
	
	return texture

## Generate sky texture with proper FGC precedent colors
func generate_sky_texture(image: Image, theme: String, time_of_day: String, palette: Dictionary):
	var sky_colors = get_sky_colors_for_time(time_of_day, palette)
	
	# Generate sky gradient (Street Fighter II precedent)
	for y in range(image.get_height()):
		var gradient_factor = float(y) / float(image.get_height())
		var sky_color = sky_colors.top.lerp(sky_colors.bottom, gradient_factor)
		
		for x in range(image.get_width()):
			image.set_pixel(x, y, sky_color)
	
	# Add subtle cloud details for visual interest (without gameplay interference)
	if theme != "tournament": # Tournament stages keep clean backgrounds
		add_cloud_details(image, sky_colors.accent, 0.1)

## Generate ground texture with proper material representation
func generate_ground_texture(image: Image, theme: String, palette: Dictionary):
	var ground_color = get_ground_color_for_theme(theme, palette)
	
	# Fill base ground color
	image.fill(ground_color)
	
	# Add material-specific textures
	match theme:
		"dojo":
			add_wood_plank_texture(image, palette.outline[0])
		"urban":
			add_concrete_texture(image, palette.outline[0])
		"tournament":
			add_tournament_mat_texture(image, palette.outline[0])
		"classic":
			add_stone_texture(image, palette.outline[0])

## Generate building/architecture textures
func generate_building_texture(image: Image, theme: String, time_of_day: String, palette: Dictionary):
	var building_color = get_building_color_for_theme(theme, palette, time_of_day)
	
	# Base building structure
	image.fill(building_color)
	
	# Add theme-specific architectural details
	match theme:
		"urban":
			add_urban_building_details(image, palette)
		"dojo":
			add_traditional_architecture_details(image, palette)
		"tournament":
			add_modern_architecture_details(image, palette)
		"classic":
			add_classic_architecture_details(image, palette)

## Generate crowd texture (KOF precedent)
func generate_crowd_texture(image: Image, theme: String, palette: Dictionary):
	if theme != "tournament":
		return # Only tournament stages have crowds
	
	var crowd_colors = [
		palette.gi_primary[0],
		palette.gi_secondary[0], 
		palette.skin[0],
		palette.hair[0]
	]
	
	# Generate crowd as collection of small colored shapes
	for i in range(200): # Crowd density
		var x = randi() % image.get_width()
		var y = int(image.get_height() * 0.7) + (randi() % int(image.get_height() * 0.3))
		var color = crowd_colors[randi() % crowd_colors.size()]
		var size = 2 + randi() % 3
		
		draw_filled_circle(image, Vector2(x, y), size, color)

## Get character palette for consistency (matches sprite generator)
func get_character_palette(palette_name: String) -> Dictionary:
	# Use same palette system as RealtimeProceduralSpriteGenerator
	var palettes = {
		"default": {
			"skin": [Color(1.0, 0.86, 0.69), Color(0.92, 0.78, 0.61), Color(0.84, 0.71, 0.54)],
			"hair": [Color(0.55, 0.27, 0.07), Color(0.63, 0.32, 0.18), Color(0.40, 0.26, 0.13)],
			"gi_primary": [Color.WHITE, Color(0.94, 0.94, 0.94), Color(0.86, 0.86, 0.86)],
			"gi_secondary": [Color(0.86, 0.08, 0.24), Color(0.78, 0.08, 0.16), Color(0.71, 0.08, 0.08)],
			"belt": [Color(0.55, 0.27, 0.07), Color(0.40, 0.26, 0.13), Color(0.33, 0.21, 0.07)],
			"eyes": [Color(0.0, 0.39, 0.78), Color(0.0, 0.31, 0.71), Color(0.0, 0.24, 0.63)],
			"outline": [Color.BLACK, Color(0.13, 0.13, 0.13), Color(0.25, 0.25, 0.25)]
		},
		"ryu": {
			"skin": [Color(1.0, 0.86, 0.69), Color(0.92, 0.78, 0.61), Color(0.84, 0.71, 0.54)],
			"hair": [Color(0.55, 0.27, 0.07), Color(0.63, 0.32, 0.18), Color(0.40, 0.26, 0.13)],
			"gi_primary": [Color.WHITE, Color(0.94, 0.94, 0.94), Color(0.86, 0.86, 0.86)],
			"gi_secondary": [Color.WHITE, Color(0.94, 0.94, 0.94), Color(0.86, 0.86, 0.86)],
			"belt": [Color.BLACK, Color(0.13, 0.13, 0.13), Color(0.06, 0.06, 0.06)],
			"eyes": [Color(0.40, 0.26, 0.13), Color(0.33, 0.21, 0.07), Color(0.25, 0.15, 0.06)],
			"outline": [Color.BLACK, Color(0.13, 0.13, 0.13), Color(0.25, 0.25, 0.25)]
		},
		"ken": {
			"skin": [Color(1.0, 0.86, 0.69), Color(0.92, 0.78, 0.61), Color(0.84, 0.71, 0.54)],
			"hair": [Color(1.0, 0.84, 0.0), Color(1.0, 0.76, 0.15), Color(1.0, 0.65, 0.0)],
			"gi_primary": [Color(1.0, 0.0, 0.0), Color(0.86, 0.0, 0.0), Color(0.71, 0.0, 0.0)],
			"gi_secondary": [Color.WHITE, Color(0.94, 0.94, 0.94), Color(0.86, 0.86, 0.86)],
			"belt": [Color(0.55, 0.27, 0.07), Color(0.40, 0.26, 0.13), Color(0.33, 0.21, 0.07)],
			"eyes": [Color(0.0, 0.39, 0.78), Color(0.0, 0.31, 0.71), Color(0.0, 0.24, 0.63)],
			"outline": [Color.BLACK, Color(0.13, 0.13, 0.13), Color(0.25, 0.25, 0.25)]
		}
	}
	
	return palettes.get(palette_name, palettes.default)

## Get sky colors based on time of day (FGC precedents)
func get_sky_colors_for_time(time_of_day: String, palette: Dictionary) -> Dictionary:
	match time_of_day:
		"day":
			# Street Fighter II daytime precedent
			return {
				"top": Color(0.5, 0.7, 1.0),
				"bottom": Color(0.8, 0.9, 1.0),
				"accent": Color(1.0, 1.0, 1.0, 0.8)
			}
		"night":
			# Street Fighter II night stages precedent
			return {
				"top": Color(0.1, 0.1, 0.3),
				"bottom": Color(0.2, 0.2, 0.4),
				"accent": Color(0.8, 0.8, 1.0, 0.3)
			}
		"sunset":
			# 3rd Strike sunset precedent
			return {
				"top": Color(0.3, 0.2, 0.4),
				"bottom": Color(1.0, 0.6, 0.3),
				"accent": Color(1.0, 0.8, 0.5, 0.5)
			}
		_:
			# Default to day
			return get_sky_colors_for_time("day", palette)

## Get ground color based on theme
func get_ground_color_for_theme(theme: String, palette: Dictionary) -> Color:
	match theme:
		"dojo":
			return Color(0.6, 0.4, 0.2) # Wood color
		"urban":
			return Color(0.4, 0.4, 0.4) # Concrete color
		"tournament":
			return Color(0.2, 0.3, 0.5) # Professional mat color
		"classic":
			return Color(0.5, 0.5, 0.5) # Stone color
		_:
			return Color(0.5, 0.5, 0.5)

## Get building color considering theme and lighting
func get_building_color_for_theme(theme: String, palette: Dictionary, time_of_day: String) -> Color:
	var base_color = match theme:
		"urban":
			Color(0.3, 0.3, 0.3)
		"dojo": 
			Color(0.4, 0.3, 0.2)
		"tournament":
			Color(0.6, 0.6, 0.7)
		_:
			Color(0.5, 0.5, 0.5)
	
	# Adjust for time of day lighting
	match time_of_day:
		"night":
			base_color = base_color * 0.6
		"sunset":
			base_color = base_color * Color(1.2, 0.8, 0.6)
	
	return base_color

# Texture detail generation methods

func add_cloud_details(image: Image, cloud_color: Color, opacity: float):
	# Simple cloud shapes using noise-like patterns
	for i in range(20):
		var x = randi() % image.get_width()
		var y = randi() % int(image.get_height() * 0.4) # Upper portion only
		var size = 10 + randi() % 20
		var alpha_color = Color(cloud_color.r, cloud_color.g, cloud_color.b, opacity)
		draw_filled_circle(image, Vector2(x, y), size, alpha_color)

func add_wood_plank_texture(image: Image, line_color: Color):
	# Draw horizontal wood plank lines (dojo floor precedent)
	var plank_height = 20
	for y in range(0, image.get_height(), plank_height):
		for x in range(image.get_width()):
			if y < image.get_height():
				image.set_pixel(x, y, line_color)

func add_concrete_texture(image: Image, line_color: Color):
	# Add concrete texture with subtle variations
	for i in range(50):
		var x = randi() % image.get_width()
		var y = randi() % image.get_height()
		var variation = Color(line_color.r, line_color.g, line_color.b, 0.2)
		image.set_pixel(x, y, variation)

func add_tournament_mat_texture(image: Image, line_color: Color):
	# Clean professional tournament mat texture
	var center_x = image.get_width() / 2
	var center_y = image.get_height() / 2
	
	# Draw subtle boundary lines
	for x in range(image.get_width()):
		image.set_pixel(x, center_y, Color(line_color.r, line_color.g, line_color.b, 0.3))
	for y in range(image.get_height()):
		image.set_pixel(center_x, y, Color(line_color.r, line_color.g, line_color.b, 0.3))

func add_stone_texture(image: Image, line_color: Color):
	# Classic stone texture with mortar lines
	var stone_size = 15
	for y in range(0, image.get_height(), stone_size):
		for x in range(0, image.get_width(), stone_size):
			if y < image.get_height() and x < image.get_width():
				# Draw stone outline
				for i in range(2):
					if y + i < image.get_height():
						image.set_pixel(x, y + i, line_color)
					if x + i < image.get_width():
						image.set_pixel(x + i, y, line_color)

func add_urban_building_details(image: Image, palette: Dictionary):
	# Add windows and urban details (3rd Strike precedent)
	var window_size = 8
	var window_color = Color(0.8, 0.9, 1.0, 0.6)
	
	for y in range(10, image.get_height() - 10, 15):
		for x in range(5, image.get_width() - 5, 20):
			draw_filled_rectangle(image, Vector2(x, y), Vector2(window_size, window_size), window_color)

func add_traditional_architecture_details(image: Image, palette: Dictionary):
	# Traditional architectural elements (SF2 dojo precedent) 
	var beam_color = palette.belt[0]
	var beam_width = 4
	
	# Horizontal support beams
	for y in range(20, image.get_height(), 40):
		for x in range(image.get_width()):
			for i in range(beam_width):
				if y + i < image.get_height():
					image.set_pixel(x, y + i, beam_color)

func add_modern_architecture_details(image: Image, palette: Dictionary):
	# Clean modern architecture (tournament stage precedent)
	var detail_color = palette.gi_primary[1]
	
	# Simple geometric details
	var detail_size = 10
	for i in range(10):
		var x = (i + 1) * image.get_width() / 11
		var y = image.get_height() / 3
		draw_filled_rectangle(image, Vector2(x - detail_size/2, y), Vector2(detail_size, detail_size*2), detail_color)

func add_classic_architecture_details(image: Image, palette: Dictionary):
	# Classic architectural details (SF2 precedent)
	var stone_color = palette.outline[1]
	
	# Stone blocks pattern
	var block_size = 25
	for y in range(0, image.get_height(), block_size):
		for x in range(0, image.get_width(), block_size * 2):
			var offset_x = (block_size if (y / block_size) % 2 == 1 else 0)
			draw_rectangle_outline(image, Vector2(x + offset_x, y), Vector2(block_size, block_size), stone_color)

# Helper drawing functions

func draw_filled_circle(image: Image, center: Vector2, radius: int, color: Color):
	for y in range(center.y - radius, center.y + radius + 1):
		for x in range(center.x - radius, center.x + radius + 1):
			if x >= 0 and x < image.get_width() and y >= 0 and y < image.get_height():
				var dx = x - center.x
				var dy = y - center.y
				if dx * dx + dy * dy <= radius * radius:
					var existing_color = image.get_pixel(x, y)
					var blended_color = existing_color.blend(color)
					image.set_pixel(x, y, blended_color)

func draw_filled_rectangle(image: Image, pos: Vector2, size: Vector2, color: Color):
	var start_x = int(max(0, pos.x))
	var end_x = int(min(image.get_width(), pos.x + size.x))
	var start_y = int(max(0, pos.y))
	var end_y = int(min(image.get_height(), pos.y + size.y))
	
	for y in range(start_y, end_y):
		for x in range(start_x, end_x):
			image.set_pixel(x, y, color)

func draw_rectangle_outline(image: Image, pos: Vector2, size: Vector2, color: Color):
	# Top and bottom edges
	for x in range(pos.x, pos.x + size.x):
		if x >= 0 and x < image.get_width():
			if pos.y >= 0 and pos.y < image.get_height():
				image.set_pixel(x, pos.y, color)
			if pos.y + size.y - 1 >= 0 and pos.y + size.y - 1 < image.get_height():
				image.set_pixel(x, pos.y + size.y - 1, color)
	
	# Left and right edges
	for y in range(pos.y, pos.y + size.y):
		if y >= 0 and y < image.get_height():
			if pos.x >= 0 and pos.x < image.get_width():
				image.set_pixel(pos.x, y, color)
			if pos.x + size.x - 1 >= 0 and pos.x + size.x - 1 < image.get_width():
				image.set_pixel(pos.x + size.x - 1, y, color)

func cleanup_old_cache_entries():
	# Simple cache cleanup - remove oldest entries
	if texture_cache.size() > max_cache_size:
		var keys_to_remove = texture_cache.keys().slice(0, texture_cache.size() - int(max_cache_size * 0.8))
		for key in keys_to_remove:
			texture_cache.erase(key)
	print("Cleaned up stage texture cache")

## Get performance statistics
func get_performance_stats() -> Dictionary:
	return {
		"cache_size": texture_cache.size(),
		"max_cache_size": max_cache_size
	}

## Clear texture cache
func clear_cache():
	texture_cache.clear()
	print("Stage texture cache cleared")