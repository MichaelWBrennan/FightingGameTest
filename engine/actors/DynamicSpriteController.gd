extends Node2D

## Dynamic 2D-HD Sprite Controller
## Manages high-resolution sprites, skeletal rigs, and material caching
## Chooses between Skeletal2D vs AnimatedSprite2D automatically
## Production-grade sprite system for fighting games
## MIT Licensed

class_name DynamicSpriteController

# === Core Components ===
@onready var sprite_2d: Sprite2D
@onready var animated_sprite: AnimatedSprite2D  
@onready var skeletal_2d: Skeleton2D
@onready var render_profile: RenderProfile

# === Rendering Mode ===
enum RenderMode {
	SPRITE_2D,      ## Single frame sprite (fastest)
	ANIMATED_2D,    ## Frame-based animation
	SKELETAL_2D     ## Bone-based animation (highest quality)
}

# === State ===
var current_action: String = "idle"
var current_context: Dictionary = {}
var current_palette: Texture2D
var current_quality: String = "MED"
var current_render_mode: RenderMode = RenderMode.SPRITE_2D

# === Material Management ===
var material_cache: Dictionary = {}  # Cache for shader materials
var texture_cache: Dictionary = {}   # LRU cache for textures
var max_cache_size: int = 512

# === Frame Cache (for animations) ===
var frame_cache: Dictionary = {}
var frame_cache_keys: Array = []  # For LRU management

# === Hitbox Scaling ===
var base_hitbox_scale: Vector2 = Vector2.ONE
var hitbox_areas: Array[Area2D] = []

# === Performance Tracking ===
var frame_time_ms: float = 0.0
var texture_memory_mb: float = 0.0

# === Signals ===
signal action_changed(action_name: String)
signal quality_changed(quality_level: String)
signal render_mode_changed(mode: RenderMode)

func _ready() -> void:
	_initialize_components()
	_load_render_profile()
	_setup_material_cache()
	_setup_frame_cache()
	
	print("DynamicSpriteController: Initialized for ", get_parent().name)

func _initialize_components() -> void:
	# Create sprite components if they don't exist
	if not sprite_2d:
		sprite_2d = Sprite2D.new()
		sprite_2d.name = "Sprite2D"
		add_child(sprite_2d)
	
	if not animated_sprite:
		animated_sprite = AnimatedSprite2D.new()
		animated_sprite.name = "AnimatedSprite2D"
		animated_sprite.visible = false
		add_child(animated_sprite)
	
	if not skeletal_2d:
		skeletal_2d = Skeleton2D.new()
		skeletal_2d.name = "Skeleton2D"
		skeletal_2d.visible = false
		add_child(skeletal_2d)

func _load_render_profile() -> void:
	var profile_path = "res://engine/render/render_profile.tres"
	if ResourceLoader.exists(profile_path):
		render_profile = load(profile_path)
		_apply_quality_settings()
	else:
		print("DynamicSpriteController: WARNING - Render profile not found, using defaults")
		render_profile = RenderProfile.new()

func _apply_quality_settings() -> void:
	if not render_profile:
		return
		
	# Update cache sizes based on profile
	max_cache_size = render_profile.frame_cache_lru_size
	
	# Apply texture filtering
	_update_texture_filtering()
	
	print("DynamicSpriteController: Applied quality settings for ", render_profile.quality_level)

func _update_texture_filtering() -> void:
	if not render_profile:
		return
		
	var filter_mode = render_profile.sprite_filter_mode
	
	# Apply to all cached materials
	for material in material_cache.values():
		if material is ShaderMaterial:
			var shader_mat = material as ShaderMaterial
			# Note: Texture filtering is set per-texture in Godot 4
			# This would be handled in texture loading

# === Primary API ===

## Set the current action/animation with context
func set_action(action_name: String, context: Dictionary = {}) -> void:
	if current_action == action_name and current_context.hash() == context.hash():
		return  # No change needed
	
	current_action = action_name
	current_context = context
	
	# Determine optimal render mode for this action
	var new_mode = _determine_render_mode(action_name, context)
	_switch_render_mode(new_mode)
	
	# Load appropriate assets
	_load_action_assets(action_name, context)
	
	action_changed.emit(action_name)

## Set palette LUT for color swapping
func set_palette(lut: Texture2D) -> void:
	current_palette = lut
	_update_materials_palette()
	
	print("DynamicSpriteController: Palette updated")

## Set quality level
func set_quality(level: String) -> void:
	if current_quality == level:
		return
		
	current_quality = level
	
	if render_profile:
		var quality_enum = RenderProfile.quality_from_string(level)
		render_profile.apply_quality_preset(quality_enum)
		_apply_quality_settings()
	
	quality_changed.emit(level)

## Get hitbox scale factor (for collision scaling)
func get_hitbox_scale() -> Vector2:
	var sprite_scale = Vector2.ONE
	
	match current_render_mode:
		RenderMode.SPRITE_2D:
			sprite_scale = sprite_2d.scale if sprite_2d else Vector2.ONE
		RenderMode.ANIMATED_2D:
			sprite_scale = animated_sprite.scale if animated_sprite else Vector2.ONE
		RenderMode.SKELETAL_2D:
			sprite_scale = skeletal_2d.scale if skeletal_2d else Vector2.ONE
	
	return sprite_scale

## Update hitbox areas to match sprite scaling
func update_hitbox_scaling() -> void:
	var scale_factor = get_hitbox_scale()
	
	for area in hitbox_areas:
		if area and is_instance_valid(area):
			area.scale = base_hitbox_scale * scale_factor

## Register hitbox area for auto-scaling
func register_hitbox_area(area: Area2D, base_scale: Vector2 = Vector2.ONE) -> void:
	if area and area not in hitbox_areas:
		hitbox_areas.append(area)
		if base_hitbox_scale == Vector2.ONE:
			base_hitbox_scale = base_scale

# === Internal Implementation ===

func _determine_render_mode(action_name: String, context: Dictionary) -> RenderMode:
	# Check if skeletal rig is available and preferred
	var rig_path = _get_skeletal_rig_path(action_name)
	if ResourceLoader.exists(rig_path) and render_profile.enable_hd_sprites:
		return RenderMode.SKELETAL_2D
	
	# Check if animation is available
	var anim_path = _get_animation_path(action_name)
	if ResourceLoader.exists(anim_path):
		return RenderMode.ANIMATED_2D
	
	# Fallback to single sprite
	return RenderMode.SPRITE_2D

func _switch_render_mode(new_mode: RenderMode) -> void:
	if current_render_mode == new_mode:
		return
	
	# Hide all components
	sprite_2d.visible = false
	animated_sprite.visible = false
	skeletal_2d.visible = false
	
	# Show active component
	match new_mode:
		RenderMode.SPRITE_2D:
			sprite_2d.visible = true
		RenderMode.ANIMATED_2D:
			animated_sprite.visible = true
		RenderMode.SKELETAL_2D:
			skeletal_2d.visible = true
	
	current_render_mode = new_mode
	render_mode_changed.emit(new_mode)
	
	print("DynamicSpriteController: Switched to ", RenderMode.keys()[new_mode])

func _load_action_assets(action_name: String, context: Dictionary) -> void:
	match current_render_mode:
		RenderMode.SPRITE_2D:
			_load_sprite_2d_asset(action_name, context)
		RenderMode.ANIMATED_2D:
			_load_animated_2d_asset(action_name, context)
		RenderMode.SKELETAL_2D:
			_load_skeletal_2d_asset(action_name, context)

func _load_sprite_2d_asset(action_name: String, context: Dictionary) -> void:
	var texture_path = _get_sprite_texture_path(action_name, context)
	
	if ResourceLoader.exists(texture_path):
		var texture = _load_texture_cached(texture_path)
		if texture:
			sprite_2d.texture = texture
			_apply_sprite_material(sprite_2d)

func _load_animated_2d_asset(action_name: String, context: Dictionary) -> void:
	var animation_path = _get_animation_path(action_name)
	
	if ResourceLoader.exists(animation_path):
		var sprite_frames = load(animation_path) as SpriteFrames
		if sprite_frames:
			animated_sprite.sprite_frames = sprite_frames
			animated_sprite.play(action_name)
			_apply_sprite_material(animated_sprite)

func _load_skeletal_2d_asset(action_name: String, context: Dictionary) -> void:
	var rig_path = _get_skeletal_rig_path(action_name)
	
	if ResourceLoader.exists(rig_path):
		# Load skeletal rig scene
		var rig_scene = load(rig_path) as PackedScene
		if rig_scene:
			# Replace skeletal_2d with loaded rig
			skeletal_2d.queue_free()
			skeletal_2d = rig_scene.instantiate()
			add_child(skeletal_2d)
			_apply_skeletal_materials()

# === Path Resolution ===

func _get_sprite_texture_path(action_name: String, context: Dictionary) -> String:
	var character_id = context.get("character_id", "ryu")
	var quality_suffix = "_enhanced" if render_profile.enable_hd_sprites else ""
	return "res://assets/sprites/street_fighter_6/%s/sprites/%s_%s%s.png" % [character_id, character_id, action_name, quality_suffix]

func _get_animation_path(action_name: String) -> String:
	var character_id = current_context.get("character_id", "ryu")
	return "res://assets/characters/%s/%s_anim.tres" % [character_id, action_name]

func _get_skeletal_rig_path(action_name: String) -> String:
	var character_id = current_context.get("character_id", "ryu")
	return "res://assets/characters/%s/%s_rig.tscn" % [character_id, action_name]

# === Material System ===

func _apply_sprite_material(sprite_node: Node2D) -> void:
	var material = _get_or_create_material("sprite_lit")
	
	if sprite_node.has_method("set_material"):
		sprite_node.material = material
	elif sprite_node is Sprite2D:
		(sprite_node as Sprite2D).material = material
	elif sprite_node is AnimatedSprite2D:
		(sprite_node as AnimatedSprite2D).material = material

func _apply_skeletal_materials() -> void:
	# Apply materials to all sprites in skeletal rig
	_apply_materials_recursive(skeletal_2d)

func _apply_materials_recursive(node: Node) -> void:
	if node is Sprite2D:
		_apply_sprite_material(node)
	
	for child in node.get_children():
		_apply_materials_recursive(child)

func _get_or_create_material(shader_name: String) -> ShaderMaterial:
	var cache_key = "%s_%s_%s" % [shader_name, current_quality, str(current_palette != null)]
	
	if cache_key in material_cache:
		return material_cache[cache_key]
	
	# Create new material
	var material = ShaderMaterial.new()
	var shader_path = "res://engine/render/shaders/%s.gdshader" % shader_name
	
	if ResourceLoader.exists(shader_path):
		material.shader = load(shader_path)
		_configure_material(material)
		
		# Cache it
		material_cache[cache_key] = material
		
		return material
	else:
		print("DynamicSpriteController: WARNING - Shader not found: ", shader_path)
		return null

func _configure_material(material: ShaderMaterial) -> void:
	if not material or not render_profile:
		return
	
	# Configure sprite_lit shader parameters
	if material.shader and material.shader.resource_path.ends_with("sprite_lit.gdshader"):
		material.set_shader_parameter("enable_lighting", render_profile.enable_normal_lighting)
		material.set_shader_parameter("enable_normal_mapping", render_profile.enable_normal_maps)
		material.set_shader_parameter("enable_rim_lighting", render_profile.enable_rim_lighting)
		material.set_shader_parameter("rim_intensity", render_profile.rim_light_intensity)
		material.set_shader_parameter("mip_bias", render_profile.mipmap_bias)
		
		# Palette swapping
		if current_palette:
			material.set_shader_parameter("enable_palette_swap", true)
			material.set_shader_parameter("palette_lut", current_palette)
		else:
			material.set_shader_parameter("enable_palette_swap", false)

# === Texture Caching ===

func _load_texture_cached(path: String) -> Texture2D:
	if path in texture_cache:
		return texture_cache[path]
	
	if ResourceLoader.exists(path):
		var texture = load(path) as Texture2D
		if texture:
			_add_to_texture_cache(path, texture)
			return texture
	
	print("DynamicSpriteController: Failed to load texture: ", path)
	return null

func _add_to_texture_cache(path: String, texture: Texture2D) -> void:
	# Simple LRU implementation
	if texture_cache.size() >= max_cache_size:
		_evict_oldest_texture()
	
	texture_cache[path] = texture

func _evict_oldest_texture() -> void:
	# Remove oldest entry (simplified LRU)
	if texture_cache.size() > 0:
		var first_key = texture_cache.keys()[0]
		texture_cache.erase(first_key)

# === Frame Cache Management ===

func _setup_frame_cache() -> void:
	frame_cache.clear()
	frame_cache_keys.clear()

func _get_frame_cache_key(action: String, frame_idx: int, palette_id: String, lod: int, seed: int) -> String:
	return "%s:%d:%s:%d:%d" % [action, frame_idx, palette_id, lod, seed]

func _add_to_frame_cache(key: String, data: Dictionary) -> void:
	if frame_cache.size() >= max_cache_size:
		_evict_oldest_frame()
	
	frame_cache[key] = data
	frame_cache_keys.append(key)

func _evict_oldest_frame() -> void:
	if frame_cache_keys.size() > 0:
		var oldest_key = frame_cache_keys[0]
		frame_cache.erase(oldest_key)
		frame_cache_keys.remove_at(0)

# === Material Cache Management ===

func _setup_material_cache() -> void:
	material_cache.clear()

func _update_materials_palette() -> void:
	# Update all cached materials with new palette
	for material in material_cache.values():
		if material is ShaderMaterial:
			_configure_material(material)

# === Cleanup ===

func _exit_tree() -> void:
	_cleanup_caches()

func _cleanup_caches() -> void:
	material_cache.clear()
	texture_cache.clear()
	frame_cache.clear()
	frame_cache_keys.clear()

# === Performance Monitoring ===

func _process(_delta: float) -> void:
	# Track performance metrics
	frame_time_ms = Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0
	
	# Update hitbox scaling if needed
	if render_profile and render_profile.enable_perspective_scaling:
		update_hitbox_scaling()

func get_performance_stats() -> Dictionary:
	return {
		"frame_time_ms": frame_time_ms,
		"texture_memory_mb": texture_memory_mb,
		"material_cache_size": material_cache.size(),
		"texture_cache_size": texture_cache.size(),
		"frame_cache_size": frame_cache.size(),
		"current_render_mode": RenderMode.keys()[current_render_mode]
	}

# === Advanced Features ===

## Enable/disable sub-pixel rendering
func set_subpixel_rendering(enabled: bool) -> void:
	if render_profile:
		render_profile.enable_subpixel_rendering = enabled
		_update_texture_filtering()

## Set mipmap bias for distance LOD
func set_mipmap_bias(bias: float) -> void:
	if render_profile:
		render_profile.mipmap_bias = bias
		_update_materials_mipmap_bias()

func _update_materials_mipmap_bias() -> void:
	for material in material_cache.values():
		if material is ShaderMaterial:
			var shader_mat = material as ShaderMaterial
			shader_mat.set_shader_parameter("mip_bias", render_profile.mipmap_bias)

## Get memory usage estimate
func get_memory_usage_mb() -> float:
	var total_size = 0.0
	
	for texture in texture_cache.values():
		if texture is Texture2D:
			var tex = texture as Texture2D
			var size = tex.get_width() * tex.get_height() * 4  # Assume RGBA
			total_size += size
	
	return total_size / (1024.0 * 1024.0)

## Force cache cleanup
func force_cache_cleanup() -> void:
	_cleanup_caches()
	_setup_material_cache()
	_setup_frame_cache()
	
	print("DynamicSpriteController: Forced cache cleanup completed")