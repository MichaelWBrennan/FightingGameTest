extends Node2D

## Pseudo-3D Stage System
## ParallaxBackground, Mode-7 floor, Light2D rig, billboard props
## Complete 2.5D environment for fighting games
## MIT Licensed

class_name Stage2_5D

# === Core Components ===
@onready var parallax_background: ParallaxBackground
@onready var mode7_floor: Sprite2D
@onready var lighting_rig: Node2D
@onready var billboard_container: Node2D
@onready var post_processing: CanvasLayer

# === Configuration ===
@export var stage_id: String = "default"
@export var enable_mode7_floor: bool = true
@export var enable_parallax: bool = true  
@export var enable_lighting: bool = true
@export var enable_billboard_props: bool = true

# === Parallax Layers ===
var parallax_layers: Array[ParallaxLayer] = []
var layer_scroll_speeds: Array[float] = [0.1, 0.3, 0.5, 0.7, 0.9, 1.2, 1.5]

# === Mode-7 Floor ===
var floor_material: ShaderMaterial
var floor_scroll_speed: Vector2 = Vector2(0.0, 50.0)

# === Lighting System ===
var dynamic_lights: Array[Light2D] = []
var max_lights: int = 8

# === Billboard Props ===
var billboard_props: Array[Sprite2D] = []
var max_billboard_props: int = 32

# === Performance ===
var render_profile: RenderProfile
var camera_ref: Camera2D

# === Signals ===
signal stage_loaded(stage_id: String)
signal lighting_changed(light_count: int)

func _ready() -> void:
	_load_render_profile()
	_initialize_stage_components()
	_setup_parallax_background()
	_setup_mode7_floor()
	_setup_lighting_rig()
	_setup_billboard_props()
	_setup_post_processing()
	
	print("Stage2_5D: Initialized stage '", stage_id, "'")
	stage_loaded.emit(stage_id)

func _load_render_profile() -> void:
	var profile_path = "res://engine/render/render_profile.tres"
	if ResourceLoader.exists(profile_path):
		render_profile = load(profile_path)
	else:
		render_profile = RenderProfile.new()
		print("Stage2_5D: WARNING - Using default render profile")

func _initialize_stage_components() -> void:
	# Create main components if they don't exist
	if not parallax_background:
		parallax_background = ParallaxBackground.new()
		parallax_background.name = "ParallaxBackground"
		add_child(parallax_background)
	
	if not mode7_floor:
		mode7_floor = Sprite2D.new()
		mode7_floor.name = "Mode7Floor"
		add_child(mode7_floor)
	
	if not lighting_rig:
		lighting_rig = Node2D.new()
		lighting_rig.name = "LightingRig"
		add_child(lighting_rig)
	
	if not billboard_container:
		billboard_container = Node2D.new()
		billboard_container.name = "BillboardContainer"
		add_child(billboard_container)

# === Parallax Background Setup ===

func _setup_parallax_background() -> void:
	if not enable_parallax or not render_profile:
		return
	
	var layer_count = render_profile.parallax_layers
	
	# Clear existing layers
	for child in parallax_background.get_children():
		child.queue_free()
	parallax_layers.clear()
	
	# Create parallax layers (back to front)
	for i in range(layer_count):
		var layer = ParallaxLayer.new()
		layer.name = "Layer_%d" % i
		
		# Calculate motion scale (further layers move slower)
		var motion_scale = layer_scroll_speeds[min(i, layer_scroll_speeds.size() - 1)]
		layer.motion_scale = Vector2(motion_scale, motion_scale)
		layer.motion_offset = Vector2(i * 100, 0)  # Slight offset for variety
		
		# Create sprite for this layer
		var layer_sprite = Sprite2D.new()
		layer_sprite.name = "LayerSprite"
		
		# Load layer texture
		var texture_path = "res://assets/environments/parallax_layer_%d.png" % i
		if ResourceLoader.exists(texture_path):
			layer_sprite.texture = load(texture_path)
		else:
			# Generate placeholder texture
			layer_sprite.texture = _generate_layer_texture(i, layer_count)
		
		layer.add_child(layer_sprite)
		parallax_background.add_child(layer)
		parallax_layers.append(layer)
	
	print("Stage2_5D: Created ", layer_count, " parallax layers")

func _generate_layer_texture(layer_index: int, total_layers: int) -> ImageTexture:
	# Generate a simple gradient texture for demonstration
	var image = Image.create(1920, 1080, false, Image.FORMAT_RGB8)
	var depth_factor = float(layer_index) / float(total_layers)
	
	# Create depth-based gradient
	var near_color = Color(0.8, 0.8, 1.0)  # Light blue for distant
	var far_color = Color(0.3, 0.2, 0.4)   # Dark purple for close
	var layer_color = near_color.lerp(far_color, 1.0 - depth_factor)
	
	image.fill(layer_color)
	
	var texture = ImageTexture.new()
	texture.create_from_image(image)
	return texture

# === Mode-7 Floor Setup ===

func _setup_mode7_floor() -> void:
	if not enable_mode7_floor or not mode7_floor:
		return
	
	# Create floor material with mode7 shader
	floor_material = ShaderMaterial.new()
	var shader_path = "res://engine/render/shaders/mode7_floor.gdshader"
	
	if ResourceLoader.exists(shader_path):
		floor_material.shader = load(shader_path)
		
		# Configure shader parameters
		floor_material.set_shader_parameter("horizon_y", 0.6)
		floor_material.set_shader_parameter("perspective_strength", 1.5)
		floor_material.set_shader_parameter("camera_height", 2.0)
		floor_material.set_shader_parameter("uv_scale", Vector2(4.0, 4.0))
		floor_material.set_shader_parameter("enable_shadows", render_profile.enable_projected_shadows)
		floor_material.set_shader_parameter("shadow_strength", 1.0)
		
		mode7_floor.material = floor_material
		
		# Load floor texture
		var floor_texture_path = "res://assets/environments/floor_texture.png"
		if ResourceLoader.exists(floor_texture_path):
			var floor_texture = load(floor_texture_path)
			floor_material.set_shader_parameter("floor_texture", floor_texture)
		else:
			# Generate placeholder checkerboard
			var floor_texture = _generate_checkerboard_texture()
			floor_material.set_shader_parameter("floor_texture", floor_texture)
		
		# Position and scale floor
		mode7_floor.position = Vector2(0, 400)  # Below characters
		mode7_floor.scale = Vector2(10, 10)     # Large scale
		
		print("Stage2_5D: Mode-7 floor initialized")
	else:
		print("Stage2_5D: WARNING - Mode-7 shader not found")

func _generate_checkerboard_texture() -> ImageTexture:
	# Generate checkerboard pattern for floor
	var size = 512
	var image = Image.create(size, size, false, Image.FORMAT_RGB8)
	
	for x in range(size):
		for y in range(size):
			var checker = ((x / 32) + (y / 32)) % 2
			var color = Color.WHITE if checker == 0 else Color(0.8, 0.8, 0.8)
			image.set_pixel(x, y, color)
	
	var texture = ImageTexture.new()
	texture.create_from_image(image)
	return texture

# === Lighting Rig Setup ===

func _setup_lighting_rig() -> void:
	if not enable_lighting or not lighting_rig or not render_profile:
		return
	
	max_lights = render_profile.max_light_nodes
	
	# Clear existing lights
	for child in lighting_rig.get_children():
		child.queue_free()
	dynamic_lights.clear()
	
	# Create key lights for fighting game
	_create_key_light("MainLight", Vector2(0, -200), Color(1.0, 1.0, 1.0), 2.0)
	_create_key_light("RimLight", Vector2(300, -100), Color(0.8, 0.9, 1.0), 1.5)
	_create_key_light("FillLight", Vector2(-200, -50), Color(1.0, 0.9, 0.8), 1.0)
	
	print("Stage2_5D: Created ", dynamic_lights.size(), " dynamic lights")
	lighting_changed.emit(dynamic_lights.size())

func _create_key_light(light_name: String, pos: Vector2, color: Color, energy: float) -> Light2D:
	var light = Light2D.new()
	light.name = light_name
	light.position = pos
	light.color = color
	light.energy = energy
	light.texture_scale = 2.0
	
	# Configure shadows if enabled
	if render_profile.enable_projected_shadows:
		light.shadow_enabled = true
		light.shadow_filter = Light2D.SHADOW_FILTER_PCF5
	
	lighting_rig.add_child(light)
	dynamic_lights.append(light)
	
	return light

# === Billboard Props Setup ===

func _setup_billboard_props() -> void:
	if not enable_billboard_props or not billboard_container:
		return
	
	max_billboard_props = render_profile.max_billboard_props if render_profile else 32
	
	# Create sample billboard props
	_create_billboard_prop("Tree1", Vector2(-400, 200), "res://assets/environments/tree.png")
	_create_billboard_prop("Tree2", Vector2(500, 300), "res://assets/environments/tree.png")
	_create_billboard_prop("Rock1", Vector2(-200, 250), "res://assets/environments/rock.png")
	
	print("Stage2_5D: Created ", billboard_props.size(), " billboard props")

func _create_billboard_prop(prop_name: String, pos: Vector2, texture_path: String) -> Sprite2D:
	if billboard_props.size() >= max_billboard_props:
		print("Stage2_5D: Maximum billboard props reached (", max_billboard_props, ")")
		return null
	
	var prop = Sprite2D.new()
	prop.name = prop_name
	prop.position = pos
	
	# Load texture or create placeholder
	if ResourceLoader.exists(texture_path):
		prop.texture = load(texture_path)
	else:
		prop.texture = _generate_prop_texture(prop_name)
	
	# Apply billboard shader
	var billboard_material = ShaderMaterial.new()
	var shader_path = "res://engine/render/shaders/billboard_prop.gdshader"
	
	if ResourceLoader.exists(shader_path):
		billboard_material.shader = load(shader_path)
		
		# Configure shader parameters based on position
		var depth_factor = pos.y / 500.0  # Depth based on Y position
		billboard_material.set_shader_parameter("base_scale", 1.0)
		billboard_material.set_shader_parameter("depth_scale_factor", depth_factor)
		billboard_material.set_shader_parameter("reference_y", 0.0)
		billboard_material.set_shader_parameter("fade_distance", 300.0)
		
		prop.material = billboard_material
	
	billboard_container.add_child(prop)
	billboard_props.append(prop)
	
	return prop

func _generate_prop_texture(prop_name: String) -> ImageTexture:
	# Generate simple colored rectangle as placeholder
	var image = Image.create(64, 128, false, Image.FORMAT_RGBA8)
	var color = Color(randf(), randf(), randf(), 1.0)
	image.fill(color)
	
	var texture = ImageTexture.new()
	texture.create_from_image(image)
	return texture

# === Post-Processing Setup ===

func _setup_post_processing() -> void:
	if not render_profile or not render_profile.enable_post_processing:
		return
	
	post_processing = CanvasLayer.new()
	post_processing.name = "PostProcessing"
	post_processing.layer = 10  # Render on top
	add_child(post_processing)
	
	# Create post-processing chain
	if render_profile.enable_bloom:
		_add_post_effect("bloom", "post_bloom.gdshader")
	
	if render_profile.enable_fake_dof:
		_add_post_effect("dof", "post_dof_fake.gdshader")
	
	if render_profile.enable_color_grading:
		_add_post_effect("color_grading", "post_color_lut.gdshader")
	
	print("Stage2_5D: Post-processing pipeline initialized")

func _add_post_effect(effect_name: String, shader_file: String) -> void:
	var effect_rect = ColorRect.new()
	effect_rect.name = effect_name + "_effect"
	effect_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	
	var effect_material = ShaderMaterial.new()
	var shader_path = "res://engine/render/shaders/" + shader_file
	
	if ResourceLoader.exists(shader_path):
		effect_material.shader = load(shader_path)
		_configure_post_effect(effect_material, effect_name)
		effect_rect.material = effect_material
	
	post_processing.add_child(effect_rect)

func _configure_post_effect(material: ShaderMaterial, effect_name: String) -> void:
	if not material or not render_profile:
		return
	
	match effect_name:
		"bloom":
			material.set_shader_parameter("bloom_intensity", render_profile.bloom_intensity)
			material.set_shader_parameter("bloom_threshold", 1.0)
			material.set_shader_parameter("bloom_radius", 2.0)
		"dof":
			material.set_shader_parameter("focus_distance", 300.0)
			material.set_shader_parameter("blur_strength", render_profile.dof_blur_radius)
		"color_grading":
			material.set_shader_parameter("enable_lut", true)
			material.set_shader_parameter("lut_intensity", 0.8)

# === Camera Integration ===

func set_camera(camera: Camera2D) -> void:
	camera_ref = camera
	_update_parallax_for_camera()

func _update_parallax_for_camera() -> void:
	if camera_ref and parallax_background:
		# Update parallax scroll based on camera movement
		parallax_background.scroll_base_offset = camera_ref.global_position

# === Dynamic Updates ===

func _process(delta: float) -> void:
	_update_mode7_floor(delta)
	_update_billboard_props(delta)
	_update_lighting(delta)

func _update_mode7_floor(delta: float) -> void:
	if not enable_mode7_floor or not floor_material:
		return
	
	# Update UV scrolling
	var current_scroll = floor_material.get_shader_parameter("uv_scroll")
	if current_scroll == null:
		current_scroll = Vector2.ZERO
	
	var new_scroll = current_scroll + floor_scroll_speed * delta * 0.01
	floor_material.set_shader_parameter("uv_scroll", new_scroll)

func _update_billboard_props(delta: float) -> void:
	if not enable_billboard_props:
		return
	
	# Update Y-depth scaling for all props
	for prop in billboard_props:
		if prop and is_instance_valid(prop):
			_update_prop_depth_scaling(prop)

func _update_prop_depth_scaling(prop: Sprite2D) -> void:
	if not prop.material or not prop.material is ShaderMaterial:
		return
	
	var material = prop.material as ShaderMaterial
	var world_y = prop.global_position.y
	
	# Update depth-based parameters
	material.set_shader_parameter("reference_y", world_y)
	
	# Calculate distance to camera for fade effects
	if camera_ref:
		var distance = prop.global_position.distance_to(camera_ref.global_position)
		material.set_shader_parameter("fade_distance", distance)

func _update_lighting(delta: float) -> void:
	if not enable_lighting:
		return
	
	# Animate lights for dynamic atmosphere
	for i in range(dynamic_lights.size()):
		var light = dynamic_lights[i]
		if light and is_instance_valid(light):
			# Subtle light animation
			var time_offset = Time.get_time_dict_from_system()["second"] + i * 2.0
			light.energy = light.energy + sin(time_offset) * 0.1

# === Public API ===

## Load stage by ID
func load_stage(new_stage_id: String) -> void:
	stage_id = new_stage_id
	_reload_stage_assets()

func _reload_stage_assets() -> void:
	# Reload all stage assets for new stage
	_setup_parallax_background()
	_setup_mode7_floor()
	_setup_billboard_props()
	
	print("Stage2_5D: Reloaded assets for stage '", stage_id, "'")

## Add dynamic light
func add_dynamic_light(light_name: String, pos: Vector2, color: Color, energy: float) -> Light2D:
	if dynamic_lights.size() >= max_lights:
		print("Stage2_5D: Maximum lights reached (", max_lights, ")")
		return null
	
	return _create_key_light(light_name, pos, color, energy)

## Remove dynamic light
func remove_dynamic_light(light_name: String) -> void:
	var light = lighting_rig.find_child(light_name)
	if light:
		dynamic_lights.erase(light)
		light.queue_free()

## Add billboard prop
func add_billboard_prop(prop_name: String, pos: Vector2, texture_path: String) -> Sprite2D:
	return _create_billboard_prop(prop_name, pos, texture_path)

## Set parallax scroll speed
func set_parallax_speed(layer_index: int, speed: float) -> void:
	if layer_index < parallax_layers.size():
		var layer = parallax_layers[layer_index]
		layer.motion_scale = Vector2(speed, speed)

## Set floor scroll speed  
func set_floor_scroll_speed(speed: Vector2) -> void:
	floor_scroll_speed = speed

## Enable/disable stage effects
func set_effect_enabled(effect_name: String, enabled: bool) -> void:
	match effect_name:
		"parallax":
			enable_parallax = enabled
			parallax_background.visible = enabled
		"mode7_floor":
			enable_mode7_floor = enabled
			mode7_floor.visible = enabled
		"lighting":
			enable_lighting = enabled
			lighting_rig.visible = enabled
		"billboard_props":
			enable_billboard_props = enabled
			billboard_container.visible = enabled

# === Performance Monitoring ===

func get_performance_stats() -> Dictionary:
	return {
		"parallax_layers": parallax_layers.size(),
		"dynamic_lights": dynamic_lights.size(),
		"billboard_props": billboard_props.size(),
		"mode7_enabled": enable_mode7_floor,
		"post_processing_enabled": post_processing != null
	}

# === Cleanup ===

func _exit_tree() -> void:
	# Cleanup resources
	if floor_material:
		floor_material = null
	
	parallax_layers.clear()
	dynamic_lights.clear()
	billboard_props.clear()