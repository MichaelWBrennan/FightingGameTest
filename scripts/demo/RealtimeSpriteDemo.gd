## Real-Time Sprite Generation Demo
## ===============================
##
## Demonstrates the real-time procedural sprite generation system
## Shows character state changes, palette swaps, and performance monitoring

extends Control

## UI References
@onready var character_option: OptionButton = $VBoxContainer/CharacterContainer/CharacterOption
@onready var palette_option: OptionButton = $VBoxContainer/PaletteContainer/PaletteOption
@onready var state_option: OptionButton = $VBoxContainer/StateContainer/StateOption
@onready var quality_check: CheckBox = $VBoxContainer/QualityContainer/QualityCheck
@onready var limb_slider: HSlider = $VBoxContainer/CustomizationContainer/LimbContainer/LimbSlider
@onready var head_slider: HSlider = $VBoxContainer/CustomizationContainer/HeadContainer/HeadSlider
@onready var body_slider: HSlider = $VBoxContainer/CustomizationContainer/BodyContainer/BodySlider
@onready var performance_label: Label = $VBoxContainer/PerformanceContainer/PerformanceLabel

## Character and sprite references
var test_character: Node
var sprite_generator: RealtimeProceduralSpriteGenerator
var animated_component: RealtimeAnimatedSpriteComponent
var animated_sprite: AnimatedSprite2D

## Available options
var characters = ["ryu", "ken", "chun_li", "zangief", "sagat", "lei_wulong"]
var palettes = ["default", "ryu", "ken", "chun_li", "zangief", "sagat", "lei_wulong"]
var states = ["idle", "walk", "jump", "crouch", "attack", "kick", "block", "hit"]

func _ready():
	setup_ui()
	setup_test_character()
	setup_performance_monitoring()

func setup_ui():
	"""Initialize the demo UI"""
	# Character selection
	for character in characters:
		character_option.add_item(character.capitalize())
	character_option.selected = 0
	character_option.item_selected.connect(_on_character_changed)
	
	# Palette selection
	for palette in palettes:
		palette_option.add_item(palette.capitalize())
	palette_option.selected = 0
	palette_option.item_selected.connect(_on_palette_changed)
	
	# State selection
	for state in states:
		state_option.add_item(state.capitalize())
	state_option.selected = 0
	state_option.item_selected.connect(_on_state_changed)
	
	# Quality toggle
	quality_check.button_pressed = true
	quality_check.toggled.connect(_on_quality_toggled)
	
	# Customization sliders
	limb_slider.value = 1.0
	limb_slider.min_value = 0.5
	limb_slider.max_value = 2.0
	limb_slider.step = 0.1
	limb_slider.value_changed.connect(_on_limb_changed)
	
	head_slider.value = 1.0
	head_slider.min_value = 0.5
	head_slider.max_value = 2.0
	head_slider.step = 0.1
	head_slider.value_changed.connect(_on_head_changed)
	
	body_slider.value = 1.0
	body_slider.min_value = 0.5
	body_slider.max_value = 2.0
	body_slider.step = 0.1
	body_slider.value_changed.connect(_on_body_changed)

func setup_test_character():
	"""Create a test character with real-time sprite generation"""
	# Create character container
	var character_container = Control.new()
	character_container.name = "CharacterContainer"
	character_container.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	character_container.size = Vector2(400, 400)
	add_child(character_container)
	
	# Create animated sprite
	animated_sprite = AnimatedSprite2D.new()
	animated_sprite.name = "AnimatedSprite2D"
	animated_sprite.position = Vector2(200, 200)
	animated_sprite.scale = Vector2(3, 3)  # Scale up for visibility
	character_container.add_child(animated_sprite)
	
	# Create sprite generator
	sprite_generator = RealtimeProceduralSpriteGenerator.new()
	sprite_generator.name = "SpriteGenerator"
	add_child(sprite_generator)
	
	# Create animated component
	animated_component = RealtimeAnimatedSpriteComponent.new()
	animated_component.name = "AnimatedComponent"
	animated_component.character_id = characters[0]
	animated_component.use_enhanced_quality = true
	animated_component.palette_name = palettes[0]
	animated_component.auto_generate_frames = true
	animated_component.debug_performance = true
	character_container.add_child(animated_component)
	
	# Setup the component
	animated_component.setup_for_character(self, animated_sprite)
	animated_component.play_animation("idle")
	
	print("Real-time sprite demo character created")

func setup_performance_monitoring():
	"""Setup performance monitoring timer"""
	var timer = Timer.new()
	timer.wait_time = 1.0  # Update every second
	timer.timeout.connect(_update_performance_display)
	timer.autostart = true
	add_child(timer)

func _update_performance_display():
	"""Update performance statistics display"""
	if not animated_component:
		return
	
	var stats = animated_component.get_performance_stats()
	if stats.size() > 0:
		var cache_hit_ratio = stats.get("cache_hit_ratio", 0.0) * 100
		var cache_size = stats.get("cache_size", 0)
		var avg_time = stats.get("avg_generation_time_ms", 0.0)
		var max_time = stats.get("max_generation_time_ms", 0.0)
		var current_anim = stats.get("current_animation", "none")
		var current_frame = stats.get("current_frame", 0)
		
		var text = "Performance Stats:\n"
		text += "Current: %s (frame %d)\n" % [current_anim, current_frame]
		text += "Cache Hit Ratio: %.1f%%\n" % cache_hit_ratio
		text += "Cache Size: %d frames\n" % cache_size
		text += "Avg Generation: %.2f ms\n" % avg_time
		text += "Max Generation: %.2f ms\n" % max_time
		text += "60 FPS Budget: 16.67 ms"
		
		performance_label.text = text
	else:
		performance_label.text = "Performance stats not available"

## UI Event Handlers

func _on_character_changed(index: int):
	"""Handle character selection change"""
	if animated_component and index < characters.size():
		animated_component.character_id = characters[index]
		animated_component.clear_cache()  # Clear cache to regenerate with new character
		print("Changed character to: ", characters[index])

func _on_palette_changed(index: int):
	"""Handle palette change"""
	if animated_component and index < palettes.size():
		animated_component.set_character_palette(palettes[index])
		print("Changed palette to: ", palettes[index])

func _on_state_changed(index: int):
	"""Handle animation state change"""
	if animated_component and index < states.size():
		animated_component.play_animation(states[index], true)
		print("Changed state to: ", states[index])

func _on_quality_toggled(enabled: bool):
	"""Handle quality toggle"""
	if animated_component:
		animated_component.use_enhanced_quality = enabled
		animated_component.clear_cache()  # Clear cache to regenerate with new quality
		print("Enhanced quality: ", enabled)

func _on_limb_changed(value: float):
	"""Handle limb length change"""
	if animated_component:
		animated_component.set_limb_length(value)
		print("Limb length: ", value)

func _on_head_changed(value: float):
	"""Handle head size change"""
	if animated_component:
		animated_component.set_head_size(value)
		print("Head size: ", value)

func _on_body_changed(value: float):
	"""Handle body width change"""
	if animated_component:
		animated_component.set_body_width(value)
		print("Body width: ", value)

## Manual testing functions

func _input(event):
	"""Handle keyboard input for manual testing"""
	if not event is InputEventKey or not event.pressed:
		return
	
	match event.keycode:
		KEY_1:
			# Quick palette swap test
			var random_palette = palettes[randi() % palettes.size()]
			_on_palette_changed(palettes.find(random_palette))
		
		KEY_2:
			# Quick state change test
			var random_state = states[randi() % states.size()]
			_on_state_changed(states.find(random_state))
		
		KEY_3:
			# Random proportions test
			_on_limb_changed(randf_range(0.5, 2.0))
			_on_head_changed(randf_range(0.5, 2.0))
			_on_body_changed(randf_range(0.5, 2.0))
		
		KEY_C:
			# Clear cache
			if animated_component:
				animated_component.clear_cache()
				print("Cache cleared")
		
		KEY_P:
			# Print performance stats
			if animated_component:
				var stats = animated_component.get_performance_stats()
				print("Performance Stats: ", stats)

func _on_test_button_pressed():
	"""Run automated tests"""
	print("Starting automated real-time sprite generation test...")
	
	# Test all characters
	for i in range(characters.size()):
		_on_character_changed(i)
		await get_tree().create_timer(1.0).timeout
	
	# Test all palettes
	for i in range(palettes.size()):
		_on_palette_changed(i)
		await get_tree().create_timer(0.5).timeout
	
	# Test all states
	for i in range(states.size()):
		_on_state_changed(i)
		await get_tree().create_timer(1.0).timeout
	
	print("Automated test completed")

func _notification(what):
	"""Handle notifications"""
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		# Cleanup before closing
		if sprite_generator:
			sprite_generator.clear_cache()
		get_tree().quit()