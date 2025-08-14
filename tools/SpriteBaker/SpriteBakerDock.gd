@tool
extends Control

## Sprite Baker Dock UI
## Interactive editor dock for processing 2D-HD sprites
## Atlas packing, normal/specular baking, LUT management
## MIT Licensed

class_name SpriteBakerDock

# === UI Components ===
var main_container: VBoxContainer
var character_selector: OptionButton
var action_selector: OptionButton
var preview_container: Control
var light_preview: Light2D
var progress_bar: ProgressBar
var log_text: TextEdit

# === Processing State ===
var current_character: String = ""
var current_action: String = ""
var processing_queue: Array[Dictionary] = []
var is_processing: bool = false

# === Settings ===
var atlas_size: Vector2i = Vector2i(2048, 2048)
var generate_normals: bool = true
var generate_specular: bool = true
var normal_strength: float = 1.0
var output_directory: String = "res://assets/characters/"

# === Signals ===
signal sprite_processed(character_id: String, action: String)
signal atlas_created(atlas_path: String)

func _init() -> void:
	name = "SpriteBaker"
	_setup_ui()

func _setup_ui() -> void:
	# Main container
	main_container = VBoxContainer.new()
	add_child(main_container)
	
	# Title
	var title = Label.new()
	title.text = "2D-HD Sprite Baker"
	title.add_theme_font_size_override("font_size", 16)
	main_container.add_child(title)
	
	main_container.add_child(HSeparator.new())
	
	# Character selection
	var char_label = Label.new()
	char_label.text = "Character:"
	main_container.add_child(char_label)
	
	character_selector = OptionButton.new()
	character_selector.item_selected.connect(_on_character_selected)
	main_container.add_child(character_selector)
	
	# Action selection
	var action_label = Label.new()
	action_label.text = "Action:"
	main_container.add_child(action_label)
	
	action_selector = OptionButton.new()
	action_selector.item_selected.connect(_on_action_selected)
	main_container.add_child(action_selector)
	
	main_container.add_child(HSeparator.new())
	
	# Processing options
	var options_label = Label.new()
	options_label.text = "Processing Options:"
	main_container.add_child(options_label)
	
	var normal_check = CheckBox.new()
	normal_check.text = "Generate Normal Maps"
	normal_check.button_pressed = true
	normal_check.toggled.connect(_on_normal_toggle)
	main_container.add_child(normal_check)
	
	var spec_check = CheckBox.new()
	spec_check.text = "Generate Specular Maps"
	spec_check.button_pressed = true
	spec_check.toggled.connect(_on_specular_toggle)
	main_container.add_child(spec_check)
	
	# Normal strength slider
	var strength_label = Label.new()
	strength_label.text = "Normal Strength:"
	main_container.add_child(strength_label)
	
	var strength_slider = HSlider.new()
	strength_slider.min_value = 0.1
	strength_slider.max_value = 3.0
	strength_slider.value = 1.0
	strength_slider.step = 0.1
	strength_slider.value_changed.connect(_on_normal_strength_changed)
	main_container.add_child(strength_slider)
	
	main_container.add_child(HSeparator.new())
	
	# Action buttons
	var process_button = Button.new()
	process_button.text = "Process Current Sprite"
	process_button.pressed.connect(_on_process_sprite)
	main_container.add_child(process_button)
	
	var atlas_button = Button.new()
	atlas_button.text = "Create Atlas"
	atlas_button.pressed.connect(_on_create_atlas)
	main_container.add_child(atlas_button)
	
	var batch_button = Button.new()
	batch_button.text = "Batch Process All"
	batch_button.pressed.connect(_on_batch_process)
	main_container.add_child(batch_button)
	
	main_container.add_child(HSeparator.new())
	
	# Progress
	var progress_label = Label.new()
	progress_label.text = "Progress:"
	main_container.add_child(progress_label)
	
	progress_bar = ProgressBar.new()
	main_container.add_child(progress_bar)
	
	# Log
	var log_label = Label.new()
	log_label.text = "Processing Log:"
	main_container.add_child(log_label)
	
	log_text = TextEdit.new()
	log_text.custom_minimum_size = Vector2(0, 200)
	log_text.editable = false
	main_container.add_child(log_text)
	
	# Initialize character list
	_populate_character_list()

func _ready() -> void:
	_populate_character_list()

func _populate_character_list() -> void:
	character_selector.clear()
	
	# Scan for characters in sprites directory
	var sprites_dir = "res://assets/sprites/street_fighter_6/"
	var dir = DirAccess.open(sprites_dir)
	
	if dir:
		dir.list_dir_begin()
		var file_name = dir.get_next()
		
		while file_name != "":
			if dir.current_is_dir() and not file_name.begins_with("."):
				character_selector.add_item(file_name)
			file_name = dir.get_next()
		
		dir.list_dir_end()
	
	if character_selector.get_item_count() > 0:
		character_selector.select(0)
		_on_character_selected(0)

func _populate_action_list(character_id: String) -> void:
	action_selector.clear()
	
	var actions = ["idle", "walk", "attack", "jump", "block", "hurt"]
	for action in actions:
		action_selector.add_item(action)
	
	if action_selector.get_item_count() > 0:
		action_selector.select(0)
		_on_action_selected(0)

# === Event Handlers ===

func _on_character_selected(index: int) -> void:
	current_character = character_selector.get_item_text(index)
	_populate_action_list(current_character)
	_log("Selected character: " + current_character)

func _on_action_selected(index: int) -> void:
	current_action = action_selector.get_item_text(index)
	_log("Selected action: " + current_action)

func _on_normal_toggle(enabled: bool) -> void:
	generate_normals = enabled
	_log("Normal map generation: " + str(enabled))

func _on_specular_toggle(enabled: bool) -> void:
	generate_specular = enabled
	_log("Specular map generation: " + str(enabled))

func _on_normal_strength_changed(value: float) -> void:
	normal_strength = value
	_log("Normal strength: " + str(value))

func _on_process_sprite() -> void:
	if current_character == "" or current_action == "":
		_log("ERROR: Please select character and action first")
		return
	
	_log("Processing sprite: " + current_character + " - " + current_action)
	_process_single_sprite(current_character, current_action)

func _on_create_atlas() -> void:
	if current_character == "":
		_log("ERROR: Please select character first")
		return
	
	_log("Creating atlas for: " + current_character)
	_create_character_atlas(current_character)

func _on_batch_process() -> void:
	if character_selector.get_item_count() == 0:
		_log("ERROR: No characters found")
		return
	
	_log("Starting batch processing...")
	_start_batch_processing()

# === Sprite Processing ===

func _process_single_sprite(character_id: String, action: String) -> void:
	var sprite_path = "res://assets/sprites/street_fighter_6/%s/sprites/%s_%s_enhanced.png" % [character_id, character_id, action]
	
	if not ResourceLoader.exists(sprite_path):
		_log("ERROR: Sprite not found: " + sprite_path)
		return
	
	# Load source sprite
	var source_texture = load(sprite_path) as Texture2D
	if not source_texture:
		_log("ERROR: Failed to load sprite texture")
		return
	
	# Create output directory
	var output_dir = output_directory + character_id + "/"
	_ensure_directory_exists(output_dir)
	
	# Generate normal map
	if generate_normals:
		var normal_texture = _generate_normal_map(source_texture)
		var normal_path = output_dir + character_id + "_" + action + "_normal.png"
		_save_texture_as_png(normal_texture, normal_path)
		_log("Generated normal map: " + normal_path)
	
	# Generate specular map
	if generate_specular:
		var specular_texture = _generate_specular_map(source_texture)
		var specular_path = output_dir + character_id + "_" + action + "_specular.png"
		_save_texture_as_png(specular_texture, specular_path)
		_log("Generated specular map: " + specular_path)
	
	# Create material resource
	var material = _create_sprite_material(character_id, action)
	var material_path = output_dir + character_id + "_" + action + "_mat.tres"
	ResourceSaver.save(material, material_path)
	_log("Created material: " + material_path)
	
	sprite_processed.emit(character_id, action)

func _generate_normal_map(source: Texture2D) -> ImageTexture:
	# Get source image
	var source_image = source.get_image()
	var width = source_image.get_width()
	var height = source_image.get_height()
	
	# Create normal map using Sobel filter
	var normal_image = Image.create(width, height, false, Image.FORMAT_RGB8)
	
	for y in range(1, height - 1):
		for x in range(1, width - 1):
			# Sample surrounding pixels for gradient calculation
			var tl = source_image.get_pixel(x - 1, y - 1).get_luminance()
			var tm = source_image.get_pixel(x, y - 1).get_luminance()
			var tr = source_image.get_pixel(x + 1, y - 1).get_luminance()
			var ml = source_image.get_pixel(x - 1, y).get_luminance()
			var mr = source_image.get_pixel(x + 1, y).get_luminance()
			var bl = source_image.get_pixel(x - 1, y + 1).get_luminance()
			var bm = source_image.get_pixel(x, y + 1).get_luminance()
			var br = source_image.get_pixel(x + 1, y + 1).get_luminance()
			
			# Sobel X filter
			var sobel_x = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl)
			
			# Sobel Y filter  
			var sobel_y = (bl + 2.0 * bm + br) - (tl + 2.0 * tm + tr)
			
			# Calculate normal
			var normal_x = sobel_x * normal_strength
			var normal_y = sobel_y * normal_strength
			var normal_z = sqrt(max(0.0, 1.0 - normal_x * normal_x - normal_y * normal_y))
			
			# Convert to 0-1 range for storage
			var normal = Vector3(normal_x * 0.5 + 0.5, normal_y * 0.5 + 0.5, normal_z)
			normal_image.set_pixel(x, y, Color(normal.x, normal.y, normal.z, 1.0))
	
	var normal_texture = ImageTexture.new()
	normal_texture.create_from_image(normal_image)
	return normal_texture

func _generate_specular_map(source: Texture2D) -> ImageTexture:
	# Generate specular based on luminance and edge detection
	var source_image = source.get_image()
	var width = source_image.get_width()
	var height = source_image.get_height()
	
	var specular_image = Image.create(width, height, false, Image.FORMAT_RGB8)
	
	for y in range(height):
		for x in range(width):
			var pixel = source_image.get_pixel(x, y)
			var luminance = pixel.get_luminance()
			
			# Higher luminance = more specular
			var specular_intensity = pow(luminance, 2.0)
			var specular_color = Color(specular_intensity, specular_intensity, specular_intensity, 1.0)
			
			specular_image.set_pixel(x, y, specular_color)
	
	var specular_texture = ImageTexture.new()
	specular_texture.create_from_image(specular_image)
	return specular_texture

func _create_sprite_material(character_id: String, action: String) -> ShaderMaterial:
	var material = ShaderMaterial.new()
	
	# Load sprite lit shader
	var shader_path = "res://engine/render/shaders/sprite_lit.gdshader"
	if ResourceLoader.exists(shader_path):
		material.shader = load(shader_path)
		
		# Set texture parameters
		var base_path = output_directory + character_id + "/" + character_id + "_" + action
		
		# Albedo texture
		var albedo_path = "res://assets/sprites/street_fighter_6/%s/sprites/%s_%s_enhanced.png" % [character_id, character_id, action]
		if ResourceLoader.exists(albedo_path):
			material.set_shader_parameter("albedo_texture", load(albedo_path))
		
		# Normal map
		if generate_normals:
			var normal_path = base_path + "_normal.png"
			if ResourceLoader.exists(normal_path):
				material.set_shader_parameter("normal_texture", load(normal_path))
		
		# Specular map
		if generate_specular:
			var specular_path = base_path + "_specular.png"
			if ResourceLoader.exists(specular_path):
				material.set_shader_parameter("specular_texture", load(specular_path))
		
		# Configure lighting parameters
		material.set_shader_parameter("enable_lighting", true)
		material.set_shader_parameter("enable_normal_mapping", generate_normals)
		material.set_shader_parameter("enable_specular", generate_specular)
		material.set_shader_parameter("rim_intensity", 1.0)
	
	return material

# === Atlas Creation ===

func _create_character_atlas(character_id: String) -> void:
	var actions = ["idle", "walk", "attack", "jump", "block", "hurt"]
	var atlas_textures: Array[Texture2D] = []
	var atlas_rects: Array[Rect2] = []
	
	# Collect all textures for this character
	for action in actions:
		var sprite_path = "res://assets/sprites/street_fighter_6/%s/sprites/%s_%s_enhanced.png" % [character_id, character_id, action]
		if ResourceLoader.exists(sprite_path):
			var texture = load(sprite_path) as Texture2D
			if texture:
				atlas_textures.append(texture)
	
	if atlas_textures.size() == 0:
		_log("ERROR: No textures found for character: " + character_id)
		return
	
	# Simple atlas packing (grid layout for now)
	var atlas_image = Image.create(atlas_size.x, atlas_size.y, false, Image.FORMAT_RGBA8)
	atlas_image.fill(Color.TRANSPARENT)
	
	var grid_size = ceil(sqrt(atlas_textures.size()))
	var cell_size = Vector2i(atlas_size.x / grid_size, atlas_size.y / grid_size)
	
	for i in range(atlas_textures.size()):
		var texture = atlas_textures[i]
		var grid_x = i % int(grid_size)
		var grid_y = i / int(grid_size)
		var cell_pos = Vector2i(grid_x * cell_size.x, grid_y * cell_size.y)
		
		# Resize texture to fit cell
		var texture_image = texture.get_image()
		texture_image.resize(cell_size.x, cell_size.y, Image.INTERPOLATE_LANCZOS)
		
		# Blit to atlas
		atlas_image.blit_rect(texture_image, Rect2i(Vector2i.ZERO, cell_size), cell_pos)
		
		# Store rect for later use
		atlas_rects.append(Rect2(cell_pos, cell_size))
	
	# Save atlas
	var atlas_texture = ImageTexture.new()
	atlas_texture.create_from_image(atlas_image)
	
	var atlas_path = output_directory + character_id + "/" + character_id + "_atlas.tres"
	ResourceSaver.save(atlas_texture, atlas_path)
	_log("Created atlas: " + atlas_path)
	
	atlas_created.emit(atlas_path)

# === Batch Processing ===

func _start_batch_processing() -> void:
	if is_processing:
		_log("ERROR: Batch processing already in progress")
		return
	
	processing_queue.clear()
	
	# Queue all character/action combinations
	for i in range(character_selector.get_item_count()):
		var character = character_selector.get_item_text(i)
		var actions = ["idle", "walk", "attack", "jump", "block", "hurt"]
		
		for action in actions:
			processing_queue.append({"character": character, "action": action})
	
	is_processing = true
	progress_bar.max_value = processing_queue.size()
	progress_bar.value = 0
	
	_log("Batch processing " + str(processing_queue.size()) + " sprites...")
	_process_next_in_queue()

func _process_next_in_queue() -> void:
	if processing_queue.size() == 0:
		is_processing = false
		progress_bar.value = progress_bar.max_value
		_log("Batch processing complete!")
		return
	
	var item = processing_queue.pop_front()
	var character = item["character"]
	var action = item["action"]
	
	_process_single_sprite(character, action)
	
	progress_bar.value = progress_bar.max_value - processing_queue.size()
	
	# Process next item on next frame
	call_deferred("_process_next_in_queue")

# === Utilities ===

func _log(message: String) -> void:
	var timestamp = Time.get_datetime_string_from_system()
	var log_line = "[" + timestamp + "] " + message + "\n"
	
	if log_text:
		log_text.text += log_line
		print("SpriteBaker: " + message)

func _ensure_directory_exists(path: String) -> void:
	var dir = DirAccess.open("res://")
	if dir:
		dir.make_dir_recursive(path.replace("res://", ""))

func _save_texture_as_png(texture: ImageTexture, path: String) -> void:
	var image = texture.get_image()
	var file_path = path.replace("res://", "")
	image.save_png(file_path)

func _get_sprite_path(character_id: String, action: String) -> String:
	return "res://assets/sprites/street_fighter_6/%s/sprites/%s_%s_enhanced.png" % [character_id, character_id, action]