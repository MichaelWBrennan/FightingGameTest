extends Node2D

## 2D-HD Rendering Engine Demo Scene
## Interactive demo showcasing all major features
## MIT Licensed

@onready var stage_2_5d = $Stage2_5D
@onready var camera_2d = $Camera2D  
@onready var player1 = $Player1
@onready var player2 = $Player2
@onready var instructions_label = $UI/Instructions
@onready var performance_label = $UI/PerformanceLabel

var current_quality = "MED"
var render_profile_manager

func _ready():
	print("Demo2DHDScene: Starting 2D-HD rendering demo")
	
	# Get render profile manager
	render_profile_manager = get_node("/root/RenderProfileManager")
	
	# Connect stage to camera
	stage_2_5d.set_camera(camera_2d)
	
	# Setup initial state
	_update_ui()
	
	print("Demo2DHDScene: Demo ready - use number keys to change quality")

func _input(event):
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_1:
				_set_quality("LOW")
			KEY_2:
				_set_quality("MED")
			KEY_3:
				_set_quality("HIGH")
			KEY_4:
				_set_quality("ULTRA")
			KEY_Q:
				_toggle_mode7_floor()
			KEY_W:
				_toggle_parallax()
			KEY_E:
				_toggle_lighting()
			KEY_R:
				_toggle_post_processing()
			KEY_SPACE:
				_random_palette_swap()
			KEY_TAB:
				_toggle_performance_stats()

func _set_quality(quality: String):
	current_quality = quality
	
	if render_profile_manager:
		render_profile_manager.set_quality_by_string(quality)
	
	# Update characters
	if player1:
		player1.SetSpriteQuality(quality)
	if player2:
		player2.SetSpriteQuality(quality)
	
	_update_ui()
	print("Demo2DHDScene: Quality set to ", quality)

func _toggle_mode7_floor():
	if stage_2_5d:
		var current = stage_2_5d.enable_mode7_floor
		stage_2_5d.set_effect_enabled("mode7_floor", not current)
		print("Demo2DHDScene: Mode-7 floor ", "enabled" if not current else "disabled")

func _toggle_parallax():
	if stage_2_5d:
		var current = stage_2_5d.enable_parallax
		stage_2_5d.set_effect_enabled("parallax", not current)
		print("Demo2DHDScene: Parallax ", "enabled" if not current else "disabled")

func _toggle_lighting():
	if stage_2_5d:
		var current = stage_2_5d.enable_lighting
		stage_2_5d.set_effect_enabled("lighting", not current)
		print("Demo2DHDScene: Lighting ", "enabled" if not current else "disabled")

func _toggle_post_processing():
	if render_profile_manager:
		var profile = render_profile_manager.get_profile()
		if profile:
			profile.enable_post_processing = not profile.enable_post_processing
			print("Demo2DHDScene: Post-processing ", "enabled" if profile.enable_post_processing else "disabled")

func _random_palette_swap():
	# Create random palette LUT
	var palette_image = Image.create(256, 1, false, Image.FORMAT_RGB8)
	
	for i in range(256):
		var hue = randf()
		var color = Color.from_hsv(hue, 0.8, 0.9)
		palette_image.set_pixel(i, 0, color)
	
	var palette_texture = ImageTexture.new()
	palette_texture.create_from_image(palette_image)
	
	# Apply to characters
	if player1:
		player1.SetSpritePalette(palette_texture)
	if player2:
		player2.SetSpritePalette(palette_texture)
	
	print("Demo2DHDScene: Applied random palette")

func _toggle_performance_stats():
	if performance_label:
		performance_label.visible = not performance_label.visible
		if performance_label.visible:
			_update_performance_display()

func _update_ui():
	if instructions_label:
		var text = instructions_label.text
		# Update quality display in instructions
		var lines = text.split("\n")
		for i in range(lines.size()):
			if lines[i].contains("Current Quality:"):
				lines[i] = "[color=green]Current Quality:[/color] " + current_quality
			elif lines[i].contains("FPS:"):
				var target_fps = _get_target_fps_for_quality(current_quality)
				lines[i] = "[color=green]FPS:[/color] " + str(target_fps) + " target"
		
		instructions_label.text = "\n".join(lines)

func _get_target_fps_for_quality(quality: String) -> int:
	match quality:
		"LOW":
			return 30
		"MED":
			return 60
		"HIGH":
			return 90
		"ULTRA":
			return 120
		_:
			return 60

func _process(_delta):
	# Update performance stats periodically
	if performance_label and performance_label.visible:
		_update_performance_display()

func _update_performance_display():
	var fps = Engine.get_frames_per_second()
	var memory_estimate = 0.0
	
	if render_profile_manager:
		memory_estimate = render_profile_manager.get_memory_usage_estimate()
	
	# Get sprite controller stats if available
	var sprite_stats = ""
	if player1:
		var stats = player1.GetSpritePerformanceStats()
		if stats.size() > 0:
			sprite_stats = "\nRender Mode: " + str(stats.get("current_render_mode", "Unknown"))
			sprite_stats += "\nTexture Cache: " + str(stats.get("texture_cache_size", 0))
			sprite_stats += "\nMaterial Cache: " + str(stats.get("material_cache_size", 0))
	
	performance_label.text = "Performance Stats:\nFPS: " + str(fps) + "\nMemory: " + str(int(memory_estimate)) + "MB\nQuality: " + current_quality + sprite_stats