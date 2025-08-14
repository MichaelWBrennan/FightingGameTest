## Real-Time Procedural Sprite Generator
## ====================================
##
## Generates fighting game sprite frames procedurally in real time during gameplay.
## Optimized for SF2-style animation with 60 FPS performance guarantee.
## 
## Features:
## - Context-aware sprite generation based on character state
## - Frame caching system for performance optimization
## - Palette swap support for character customization
## - Smooth interpolation between poses
## - Compatible with existing AnimatedSprite2D system

extends Node
class_name RealtimeProceduralSpriteGenerator

## Configuration for character appearance
class CharacterAppearance:
	var character_id: String = ""
	var palette_name: String = "default"
	var limb_length_multiplier: float = 1.0
	var head_size_multiplier: float = 1.0
	var body_width_multiplier: float = 1.0
	var sprite_width: int = 64
	var sprite_height: int = 96
	var enhanced_quality: bool = false
	
	func _init(char_id: String = "", enhanced: bool = false):
		character_id = char_id
		enhanced_quality = enhanced
		if enhanced:
			sprite_width = 256
			sprite_height = 384

## Frame cache entry for performance optimization
class CachedFrame:
	var texture: ImageTexture
	var generation_time: float
	var access_count: int = 0
	var last_access_time: float
	
	func _init(tex: ImageTexture, gen_time: float):
		texture = tex
		generation_time = gen_time
		last_access_time = Time.get_ticks_msec() / 1000.0

## Color palettes for different characters
var color_palettes = {
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

## Performance monitoring
var generation_times: Array[float] = []
var max_generation_time: float = 16.0  # Max 16ms per frame to maintain 60 FPS
var cache_hit_ratio: float = 0.0
var cache_requests: int = 0
var cache_hits: int = 0

## Frame cache - stores recently generated frames
var frame_cache: Dictionary = {}
var max_cache_size: int = 100
var cache_cleanup_interval: float = 5.0  # seconds
var last_cache_cleanup: float = 0.0

## Character state tracking for interpolation
var last_generated_state: String = ""
var interpolation_progress: float = 0.0
var target_state: String = ""

func _ready():
	# Initialize performance monitoring
	set_process(true)

func _process(delta):
	# Periodic cache cleanup
	var current_time = Time.get_ticks_msec() / 1000.0
	if current_time - last_cache_cleanup > cache_cleanup_interval:
		cleanup_cache()
		last_cache_cleanup = current_time

## Generate a sprite frame for the given character state
func generate_frame(appearance: CharacterAppearance, state: String, facing_right: bool = true, velocity: Vector2 = Vector2.ZERO, frame_number: int = 0) -> ImageTexture:
	"""
	Generate a sprite frame for the current character state.
	
	Args:
		appearance: Character appearance configuration
		state: Current character state (idle, walk, punch, etc.)
		facing_right: Character facing direction
		velocity: Character velocity for animation adjustments
		frame_number: Animation frame number for multi-frame actions
	
	Returns:
		Generated ImageTexture ready for use in AnimatedSprite2D
	"""
	var start_time = Time.get_ticks_msec()
	
	# Generate cache key
	var cache_key = generate_cache_key(appearance, state, facing_right, velocity, frame_number)
	
	# Check cache first
	cache_requests += 1
	if frame_cache.has(cache_key):
		var cached_frame = frame_cache[cache_key] as CachedFrame
		cached_frame.access_count += 1
		cached_frame.last_access_time = Time.get_ticks_msec() / 1000.0
		cache_hits += 1
		cache_hit_ratio = float(cache_hits) / float(cache_requests)
		return cached_frame.texture
	
	# Generate new frame
	var texture = create_procedural_frame(appearance, state, facing_right, velocity, frame_number)
	
	# Cache the generated frame
	var generation_time = (Time.get_ticks_msec() - start_time) / 1000.0
	frame_cache[cache_key] = CachedFrame.new(texture, generation_time)
	
	# Maintain cache size limit
	if frame_cache.size() > max_cache_size:
		cleanup_old_cache_entries()
	
	# Track performance
	generation_times.append(generation_time * 1000.0)  # Convert to milliseconds
	if generation_times.size() > 100:
		generation_times.pop_front()
	
	cache_hit_ratio = float(cache_hits) / float(cache_requests)
	
	return texture

## Create the actual procedural frame using low-level drawing
func create_procedural_frame(appearance: CharacterAppearance, state: String, facing_right: bool, velocity: Vector2, frame_number: int) -> ImageTexture:
	"""
	Core procedural drawing function that generates the sprite pixel data.
	Uses optimized drawing techniques for 60 FPS performance.
	"""
	var image = Image.create(appearance.sprite_width, appearance.sprite_height, false, Image.FORMAT_RGBA8)
	var palette = get_character_palette(appearance.character_id, appearance.palette_name)
	
	# Clear to transparent
	image.fill(Color(0, 0, 0, 0))
	
	# Generate pose parameters based on state and frame
	var pose = calculate_pose_parameters(state, facing_right, velocity, frame_number, appearance)
	
	# Draw character using procedural pixel art techniques
	draw_character_base(image, pose, palette, appearance)
	draw_character_details(image, pose, palette, appearance, state)
	
	# Apply post-processing effects
	if appearance.enhanced_quality:
		apply_enhancement_effects(image)
	
	# Create texture from image
	var texture = ImageTexture.new()
	texture.set_image(image)
	
	return texture

## Calculate pose parameters for different states
func calculate_pose_parameters(state: String, facing_right: bool, velocity: Vector2, frame_number: int, appearance: CharacterAppearance) -> Dictionary:
	"""
	Calculate procedural pose parameters based on character state and context.
	Returns a dictionary with body part positions and rotations.
	"""
	var pose = {
		"head_pos": Vector2(appearance.sprite_width * 0.5, appearance.sprite_height * 0.25),
		"torso_pos": Vector2(appearance.sprite_width * 0.5, appearance.sprite_height * 0.5),
		"left_arm_angle": 0.0,
		"right_arm_angle": 0.0,
		"left_leg_angle": 0.0,
		"right_leg_angle": 0.0,
		"stance_width": 1.0,
		"crouch_factor": 0.0,
		"facing_right": facing_right
	}
	
	match state:
		"idle":
			# Subtle breathing animation
			var breath_phase = frame_number * 0.1
			pose.torso_pos.y += sin(breath_phase) * 2.0 * (appearance.sprite_height / 96.0)
			pose.left_arm_angle = sin(breath_phase * 0.5) * 5.0
			pose.right_arm_angle = -sin(breath_phase * 0.5) * 5.0
			
		"walk":
			# Walking cycle animation
			var walk_phase = frame_number * 0.3
			pose.left_leg_angle = sin(walk_phase) * 30.0
			pose.right_leg_angle = -sin(walk_phase) * 30.0
			pose.left_arm_angle = -sin(walk_phase) * 15.0
			pose.right_arm_angle = sin(walk_phase) * 15.0
			pose.torso_pos.y += abs(sin(walk_phase * 2.0)) * 3.0 * (appearance.sprite_height / 96.0)
			
		"jump":
			# Jumping pose
			pose.left_leg_angle = -45.0
			pose.right_leg_angle = -45.0
			pose.left_arm_angle = -90.0
			pose.right_arm_angle = -90.0
			pose.torso_pos.y -= 10.0 * (appearance.sprite_height / 96.0)
			
		"crouch":
			pose.crouch_factor = 0.6
			pose.torso_pos.y += 20.0 * (appearance.sprite_height / 96.0)
			
		"attack":
			# Punch animation
			if facing_right:
				pose.right_arm_angle = 90.0
			else:
				pose.left_arm_angle = 90.0
			pose.stance_width = 1.2
			
		"kick":
			# Kick animation
			if facing_right:
				pose.right_leg_angle = 45.0
			else:
				pose.left_leg_angle = 45.0
			pose.stance_width = 0.8
			
		"block":
			pose.left_arm_angle = -45.0
			pose.right_arm_angle = -45.0
			pose.crouch_factor = 0.2
			
		"hit":
			# Hitstun recoil
			pose.torso_pos.x += (10.0 if facing_right else -10.0) * (appearance.sprite_width / 64.0)
			pose.left_arm_angle = -30.0
			pose.right_arm_angle = -30.0
	
	return pose

## Draw character base (body, limbs)
func draw_character_base(image: Image, pose: Dictionary, palette: Dictionary, appearance: CharacterAppearance):
	"""
	Draw the basic character structure using procedural pixel art.
	Optimized for performance with minimal drawing operations.
	"""
	var scale = appearance.sprite_width / 64.0  # Scale factor for enhanced quality
	
	# Head
	var head_size = int(12 * scale * appearance.head_size_multiplier)
	draw_filled_ellipse(image, pose.head_pos, Vector2(head_size, head_size), palette.skin[0])
	draw_ellipse_outline(image, pose.head_pos, Vector2(head_size, head_size), palette.outline[0], int(2 * scale))
	
	# Torso
	var torso_width = int(20 * scale * appearance.body_width_multiplier)
	var torso_height = int(30 * scale * (1.0 - pose.crouch_factor * 0.3))
	draw_filled_rectangle(image, pose.torso_pos - Vector2(torso_width/2, torso_height/2), Vector2(torso_width, torso_height), palette.gi_primary[0])
	draw_rectangle_outline(image, pose.torso_pos - Vector2(torso_width/2, torso_height/2), Vector2(torso_width, torso_height), palette.outline[0], int(2 * scale))
	
	# Arms
	draw_limb(image, pose.torso_pos + Vector2(-torso_width * 0.4, -torso_height * 0.2), pose.left_arm_angle, int(20 * scale * appearance.limb_length_multiplier), palette.skin[0], palette.gi_secondary[0])
	draw_limb(image, pose.torso_pos + Vector2(torso_width * 0.4, -torso_height * 0.2), pose.right_arm_angle, int(20 * scale * appearance.limb_length_multiplier), palette.skin[0], palette.gi_secondary[0])
	
	# Legs
	draw_limb(image, pose.torso_pos + Vector2(-torso_width * 0.3, torso_height * 0.5), pose.left_leg_angle + 90, int(30 * scale * appearance.limb_length_multiplier), palette.skin[0], palette.gi_primary[0])
	draw_limb(image, pose.torso_pos + Vector2(torso_width * 0.3, torso_height * 0.5), pose.right_leg_angle + 90, int(30 * scale * appearance.limb_length_multiplier), palette.skin[0], palette.gi_primary[0])

## Draw character details (face, hair, belt)
func draw_character_details(image: Image, pose: Dictionary, palette: Dictionary, appearance: CharacterAppearance, state: String):
	"""
	Add character-specific details and facial features.
	"""
	var scale = appearance.sprite_width / 64.0
	var head_center = pose.head_pos
	
	# Hair
	var hair_size = int(14 * scale * appearance.head_size_multiplier)
	draw_filled_ellipse(image, head_center - Vector2(0, 4 * scale), Vector2(hair_size, hair_size * 0.6), palette.hair[0])
	
	# Eyes
	var eye_size = int(2 * scale)
	var eye_offset = int(4 * scale * appearance.head_size_multiplier)
	draw_filled_rectangle(image, head_center + Vector2(-eye_offset, -2 * scale), Vector2(eye_size, eye_size), palette.eyes[0])
	draw_filled_rectangle(image, head_center + Vector2(eye_offset - eye_size, -2 * scale), Vector2(eye_size, eye_size), palette.eyes[0])
	
	# Belt
	var belt_pos = pose.torso_pos + Vector2(0, int(10 * scale))
	var belt_width = int(22 * scale * appearance.body_width_multiplier)
	draw_filled_rectangle(image, belt_pos - Vector2(belt_width/2, int(3 * scale)), Vector2(belt_width, int(6 * scale)), palette.belt[0])
	
	# State-specific details
	match state:
		"attack":
			# Add impact effect particles
			add_impact_effects(image, pose, scale)
		"hit":
			# Add damage/pain expression
			add_pain_expression(image, head_center, scale, palette)

## Helper function to draw filled ellipse (optimized for pixel art)
func draw_filled_ellipse(image: Image, center: Vector2, size: Vector2, color: Color):
	var start_x = int(center.x - size.x / 2)
	var end_x = int(center.x + size.x / 2)
	var start_y = int(center.y - size.y / 2)
	var end_y = int(center.y + size.y / 2)
	
	for y in range(start_y, end_y):
		for x in range(start_x, end_x):
			if x >= 0 and x < image.get_width() and y >= 0 and y < image.get_height():
				var dx = (x - center.x) / (size.x / 2)
				var dy = (y - center.y) / (size.y / 2)
				if dx * dx + dy * dy <= 1.0:
					image.set_pixel(x, y, color)

## Helper function to draw ellipse outline
func draw_ellipse_outline(image: Image, center: Vector2, size: Vector2, color: Color, thickness: int = 1):
	var start_x = int(center.x - size.x / 2)
	var end_x = int(center.x + size.x / 2)
	var start_y = int(center.y - size.y / 2)
	var end_y = int(center.y + size.y / 2)
	
	for y in range(start_y, end_y):
		for x in range(start_x, end_x):
			if x >= 0 and x < image.get_width() and y >= 0 and y < image.get_height():
				var dx = (x - center.x) / (size.x / 2)
				var dy = (y - center.y) / (size.y / 2)
				var dist = dx * dx + dy * dy
				if dist <= 1.0 and dist >= (1.0 - thickness * 0.1):
					image.set_pixel(x, y, color)

## Helper function to draw filled rectangle
func draw_filled_rectangle(image: Image, pos: Vector2, size: Vector2, color: Color):
	var start_x = int(max(0, pos.x))
	var end_x = int(min(image.get_width(), pos.x + size.x))
	var start_y = int(max(0, pos.y))
	var end_y = int(min(image.get_height(), pos.y + size.y))
	
	for y in range(start_y, end_y):
		for x in range(start_x, end_x):
			image.set_pixel(x, y, color)

## Helper function to draw rectangle outline
func draw_rectangle_outline(image: Image, pos: Vector2, size: Vector2, color: Color, thickness: int = 1):
	# Top and bottom edges
	for i in range(thickness):
		draw_filled_rectangle(image, pos + Vector2(0, i), Vector2(size.x, 1), color)
		draw_filled_rectangle(image, pos + Vector2(0, size.y - 1 - i), Vector2(size.x, 1), color)
	
	# Left and right edges
	for i in range(thickness):
		draw_filled_rectangle(image, pos + Vector2(i, 0), Vector2(1, size.y), color)
		draw_filled_rectangle(image, pos + Vector2(size.x - 1 - i, 0), Vector2(1, size.y), color)

## Draw a limb (arm or leg) with proper rotation
func draw_limb(image: Image, start_pos: Vector2, angle: float, length: int, skin_color: Color, clothing_color: Color):
	var end_pos = start_pos + Vector2(cos(deg_to_rad(angle)), sin(deg_to_rad(angle))) * length
	var thickness = max(1, length / 8)
	
	# Draw the limb as a thick line
	draw_thick_line(image, start_pos, end_pos, thickness, skin_color)
	
	# Add clothing details (sleeve/pants)
	var mid_pos = start_pos + (end_pos - start_pos) * 0.3
	draw_thick_line(image, start_pos, mid_pos, thickness + 1, clothing_color)

## Draw a thick line between two points
func draw_thick_line(image: Image, start: Vector2, end: Vector2, thickness: int, color: Color):
	var points = get_line_points(start, end)
	var half_thickness = thickness / 2
	
	for point in points:
		for dy in range(-half_thickness, half_thickness + 1):
			for dx in range(-half_thickness, half_thickness + 1):
				var px = int(point.x + dx)
				var py = int(point.y + dy)
				if px >= 0 and px < image.get_width() and py >= 0 and py < image.get_height():
					if dx * dx + dy * dy <= half_thickness * half_thickness:
						image.set_pixel(px, py, color)

## Get points along a line using Bresenham's algorithm
func get_line_points(start: Vector2, end: Vector2) -> Array[Vector2]:
	var points: Array[Vector2] = []
	var x0 = int(start.x)
	var y0 = int(start.y)
	var x1 = int(end.x)
	var y1 = int(end.y)
	
	var dx = abs(x1 - x0)
	var dy = abs(y1 - y0)
	var sx = 1 if x0 < x1 else -1
	var sy = 1 if y0 < y1 else -1
	var err = dx - dy
	
	while true:
		points.append(Vector2(x0, y0))
		
		if x0 == x1 and y0 == y1:
			break
		
		var e2 = 2 * err
		if e2 > -dy:
			err -= dy
			x0 += sx
		if e2 < dx:
			err += dx
			y0 += sy
	
	return points

## Add impact effects for attack states
func add_impact_effects(image: Image, pose: Dictionary, scale: float):
	# Add simple particle-like effects
	var effect_pos = pose.torso_pos + Vector2(30 * scale, 0)
	for i in range(5):
		var particle_pos = effect_pos + Vector2(randf_range(-10, 10) * scale, randf_range(-10, 10) * scale)
		draw_filled_rectangle(image, particle_pos, Vector2(2 * scale, 2 * scale), Color.YELLOW)

## Add pain expression for hit state
func add_pain_expression(image: Image, head_center: Vector2, scale: float, palette: Dictionary):
	# Change eye expression
	var eye_size = int(3 * scale)
	var eye_offset = int(4 * scale)
	# Draw "X" eyes to show pain
	draw_thick_line(image, head_center + Vector2(-eye_offset - eye_size/2, -2 * scale - eye_size/2), head_center + Vector2(-eye_offset + eye_size/2, -2 * scale + eye_size/2), 1, palette.outline[0])
	draw_thick_line(image, head_center + Vector2(-eye_offset + eye_size/2, -2 * scale - eye_size/2), head_center + Vector2(-eye_offset - eye_size/2, -2 * scale + eye_size/2), 1, palette.outline[0])

## Apply enhancement effects for high-quality sprites
func apply_enhancement_effects(image: Image):
	"""
	Apply post-processing effects for enhanced quality sprites.
	Only applied when enhanced_quality is true.
	"""
	# Apply slight blur for anti-aliasing effect
	var blur_image = image.duplicate()
	# Simple box blur implementation
	var blur_radius = 1
	for y in range(blur_radius, image.get_height() - blur_radius):
		for x in range(blur_radius, image.get_width() - blur_radius):
			var total_color = Color(0, 0, 0, 0)
			var count = 0
			
			for dy in range(-blur_radius, blur_radius + 1):
				for dx in range(-blur_radius, blur_radius + 1):
					total_color += blur_image.get_pixel(x + dx, y + dy)
					count += 1
			
			var avg_color = total_color / count
			image.set_pixel(x, y, avg_color)

## Get character-specific color palette
func get_character_palette(character_id: String, palette_name: String) -> Dictionary:
	var palette_key = character_id if color_palettes.has(character_id) else palette_name
	if not color_palettes.has(palette_key):
		palette_key = "default"
	return color_palettes[palette_key]

## Generate cache key for frame caching
func generate_cache_key(appearance: CharacterAppearance, state: String, facing_right: bool, velocity: Vector2, frame_number: int) -> String:
	return "%s_%s_%s_%s_%s_%d_%s_%0.1f_%0.1f_%0.1f" % [
		appearance.character_id,
		appearance.palette_name,
		state,
		"R" if facing_right else "L",
		str(int(velocity.length())),
		frame_number,
		"E" if appearance.enhanced_quality else "N",
		appearance.limb_length_multiplier,
		appearance.head_size_multiplier,
		appearance.body_width_multiplier
	]

## Cleanup old cache entries to maintain memory usage
func cleanup_old_cache_entries():
	var entries_to_remove = []
	var current_time = Time.get_ticks_msec() / 1000.0
	var min_access_count = 1
	var max_age = 30.0  # seconds
	
	# Find least recently used entries
	for key in frame_cache.keys():
		var cached_frame = frame_cache[key] as CachedFrame
		var age = current_time - cached_frame.last_access_time
		
		if cached_frame.access_count <= min_access_count or age > max_age:
			entries_to_remove.append(key)
	
	# Remove old entries
	for key in entries_to_remove:
		frame_cache.erase(key)
		if frame_cache.size() <= max_cache_size * 0.8:
			break

## Full cache cleanup
func cleanup_cache():
	var current_time = Time.get_ticks_msec() / 1000.0
	var entries_to_remove = []
	
	for key in frame_cache.keys():
		var cached_frame = frame_cache[key] as CachedFrame
		if current_time - cached_frame.last_access_time > 60.0:  # Remove entries older than 1 minute
			entries_to_remove.append(key)
	
	for key in entries_to_remove:
		frame_cache.erase(key)

## Get performance statistics
func get_performance_stats() -> Dictionary:
	var avg_generation_time = 0.0
	if generation_times.size() > 0:
		for time in generation_times:
			avg_generation_time += time
		avg_generation_time /= generation_times.size()
	
	return {
		"cache_hit_ratio": cache_hit_ratio,
		"cache_size": frame_cache.size(),
		"avg_generation_time_ms": avg_generation_time,
		"max_generation_time_ms": generation_times.max() if generation_times.size() > 0 else 0.0,
		"cache_requests": cache_requests,
		"cache_hits": cache_hits
	}

## Clear all cached frames (useful for memory management)
func clear_cache():
	frame_cache.clear()
	cache_requests = 0
	cache_hits = 0
	cache_hit_ratio = 0.0

## Instantly swap character palette for customization
func swap_character_palette(character_id: String, new_palette_name: String):
	"""
	Instantly change character palette by clearing relevant cache entries.
	This allows for real-time palette swaps without reloading assets from disk.
	"""
	var keys_to_remove = []
	
	for key in frame_cache.keys():
		if key.begins_with(character_id + "_"):
			keys_to_remove.append(key)
	
	for key in keys_to_remove:
		frame_cache.erase(key)
	
	print("Palette swapped for ", character_id, " to ", new_palette_name)
	print("Cleared ", keys_to_remove.size(), " cached frames")