## Sprite Generator - Godot Integration
## ====================================
##
## GDScript integration for procedurally generated sprites
## Provides AnimatedSprite node configuration and dynamic loading
## Compatible with the existing Character.cs smart loading system

extends Node
class_name SpriteGeneratorIntegration

## Configuration for sprite animations
class AnimationConfig:
	var name: String
	var frames: Array[Texture2D] = []
	var speed: float = 10.0
	var loop: bool = true
	
	func _init(anim_name: String, anim_speed: float = 10.0, should_loop: bool = true):
		name = anim_name
		speed = anim_speed
		loop = should_loop

## Main integration class for generated sprites
static func setup_animated_sprite(animated_sprite: AnimatedSprite2D, character_id: String, use_enhanced: bool = true) -> bool:
	"""
	Setup an AnimatedSprite2D node with generated character sprites
	
	Args:
		animated_sprite: The AnimatedSprite2D node to configure
		character_id: Character identifier (e.g., 'ryu', 'ken')
		use_enhanced: Whether to load enhanced quality sprites
	
	Returns:
		true if setup was successful, false otherwise
	"""
	if not animated_sprite:
		push_error("AnimatedSprite2D node is null")
		return false
	
	# Create sprite frames resource if it doesn't exist
	if not animated_sprite.sprite_frames:
		animated_sprite.sprite_frames = SpriteFrames.new()
	
	var sprite_frames = animated_sprite.sprite_frames
	
	# Standard fighting game animations
	var animations = [
		AnimationConfig.new("idle", 8.0, true),
		AnimationConfig.new("walk", 12.0, true), 
		AnimationConfig.new("attack", 15.0, false),
		AnimationConfig.new("jump", 10.0, false)
	]
	
	var loaded_count = 0
	var total_animations = animations.size()
	
	print("Setting up AnimatedSprite2D for character: ", character_id)
	
	# Load animations
	for anim_config in animations:
		if load_animation(sprite_frames, character_id, anim_config, use_enhanced):
			loaded_count += 1
		else:
			push_warning("Failed to load animation: " + anim_config.name + " for character: " + character_id)
	
	if loaded_count == 0:
		push_error("No animations could be loaded for character: " + character_id)
		return false
	
	# Set default animation
	if sprite_frames.has_animation("idle"):
		animated_sprite.animation = "idle"
	else:
		# Use first available animation as fallback
		var anim_names = sprite_frames.get_animation_names()
		if anim_names.size() > 0:
			animated_sprite.animation = anim_names[0]
	
	animated_sprite.play()
	
	print("✅ Successfully loaded ", loaded_count, "/", total_animations, " animations for ", character_id)
	return true

static func load_animation(sprite_frames: SpriteFrames, character_id: String, anim_config: AnimationConfig, use_enhanced: bool = true) -> bool:
	"""
	Load a single animation into SpriteFrames
	
	Args:
		sprite_frames: The SpriteFrames resource to add animation to
		character_id: Character identifier
		anim_config: Animation configuration
		use_enhanced: Whether to load enhanced quality sprites
	
	Returns:
		true if animation was loaded successfully
	"""
	var animation_name = anim_config.name
	
	# Generate sprite path using the same pattern as Character.cs
	var sprite_suffix = "_enhanced" if use_enhanced else ""
	var sprite_path = "res://assets/sprites/street_fighter_6/%s/sprites/%s_%s%s.png" % [character_id, character_id, animation_name, sprite_suffix]
	
	# Try enhanced first, fallback to original (smart loading)
	if use_enhanced and not ResourceLoader.exists(sprite_path):
		sprite_suffix = ""
		sprite_path = "res://assets/sprites/street_fighter_6/%s/sprites/%s_%s%s.png" % [character_id, character_id, animation_name, sprite_suffix]
	
	# Load the texture
	if not ResourceLoader.exists(sprite_path):
		push_warning("Sprite file not found: " + sprite_path)
		return false
	
	var texture = load(sprite_path) as Texture2D
	if not texture:
		push_warning("Failed to load texture: " + sprite_path)
		return false
	
	# Add animation to sprite frames
	if not sprite_frames.has_animation(animation_name):
		sprite_frames.add_animation(animation_name)
	
	# Clear existing frames for this animation
	sprite_frames.clear(animation_name)
	
	# For now, single-frame animations (expandable to multi-frame)
	sprite_frames.add_frame(animation_name, texture)
	
	# Configure animation properties
	sprite_frames.set_animation_speed(animation_name, anim_config.speed)
	sprite_frames.set_animation_loop(animation_name, anim_config.loop)
	
	print("  ✅ Loaded animation: ", animation_name, " from: ", sprite_path)
	return true

## Helper function to create AnimatedSprite2D node with generated sprites
static func create_character_animated_sprite(character_id: String, use_enhanced: bool = true) -> AnimatedSprite2D:
	"""
	Create a new AnimatedSprite2D node configured with character sprites
	
	Args:
		character_id: Character identifier
		use_enhanced: Whether to load enhanced quality sprites
		
	Returns:
		Configured AnimatedSprite2D node, or null if setup failed
	"""
	var animated_sprite = AnimatedSprite2D.new()
	animated_sprite.name = character_id + "_AnimatedSprite"
	
	if setup_animated_sprite(animated_sprite, character_id, use_enhanced):
		return animated_sprite
	else:
		animated_sprite.queue_free()
		return null

## Batch setup for multiple characters
static func setup_character_roster(parent_node: Node, character_ids: Array[String], use_enhanced: bool = true) -> Array[AnimatedSprite2D]:
	"""
	Setup multiple character AnimatedSprite2D nodes
	
	Args:
		parent_node: Node to add the AnimatedSprite2D nodes to
		character_ids: Array of character identifiers
		use_enhanced: Whether to load enhanced quality sprites
		
	Returns:
		Array of successfully created AnimatedSprite2D nodes
	"""
	var created_sprites: Array[AnimatedSprite2D] = []
	
	for character_id in character_ids:
		var animated_sprite = create_character_animated_sprite(character_id, use_enhanced)
		if animated_sprite:
			parent_node.add_child(animated_sprite)
			created_sprites.append(animated_sprite)
			print("Added AnimatedSprite2D for: ", character_id)
		else:
			push_error("Failed to create AnimatedSprite2D for: " + character_id)
	
	print("✅ Successfully created ", created_sprites.size(), "/", character_ids.size(), " character sprites")
	return created_sprites

## Utility function to get available characters
static func get_available_characters() -> Array[String]:
	"""
	Scan the sprites directory to find available characters
	
	Returns:
		Array of available character identifiers
	"""
	var characters: Array[String] = []
	var sprites_dir = "res://assets/sprites/street_fighter_6/"
	
	if not DirAccess.dir_exists_absolute(sprites_dir):
		push_warning("Sprites directory not found: " + sprites_dir)
		return characters
	
	var dir = DirAccess.open(sprites_dir)
	if not dir:
		push_error("Failed to open sprites directory: " + sprites_dir)
		return characters
	
	dir.list_dir_begin()
	var file_name = dir.get_next()
	
	while file_name != "":
		if dir.current_is_dir() and not file_name.begins_with("."):
			# Check if character has sprites directory
			var char_sprites_dir = sprites_dir + file_name + "/sprites/"
			if DirAccess.dir_exists_absolute(char_sprites_dir):
				characters.append(file_name)
		file_name = dir.get_next()
	
	dir.list_dir_end()
	characters.sort()
	
	print("Found ", characters.size(), " available characters: ", characters)
	return characters

## Animation state management for fighting game logic
class FighterAnimationController extends Node:
	"""
	Controller for managing fighter animation states
	Compatible with generated sprites and existing Character.cs system
	"""
	
	@export var character_id: String = ""
	@export var use_enhanced_sprites: bool = true
	@export var auto_setup: bool = true
	
	var animated_sprite: AnimatedSprite2D
	var current_state: String = "idle"
	var state_queue: Array[String] = []
	
	func _ready():
		if auto_setup:
			setup_fighter_animations()
	
	func setup_fighter_animations():
		"""Setup the fighter's animated sprite system"""
		if character_id.is_empty():
			push_error("Character ID not set for FighterAnimationController")
			return
		
		# Find or create AnimatedSprite2D node
		animated_sprite = get_node("AnimatedSprite2D") if has_node("AnimatedSprite2D") else null
		
		if not animated_sprite:
			animated_sprite = AnimatedSprite2D.new()
			animated_sprite.name = "AnimatedSprite2D"
			add_child(animated_sprite)
		
		# Configure with generated sprites
		if SpriteGeneratorIntegration.setup_animated_sprite(animated_sprite, character_id, use_enhanced_sprites):
			print("Fighter animation controller ready for: ", character_id)
		else:
			push_error("Failed to setup fighter animations for: " + character_id)
	
	func change_state(new_state: String, force: bool = false):
		"""Change animation state"""
		if not animated_sprite or not animated_sprite.sprite_frames:
			return
		
		if not animated_sprite.sprite_frames.has_animation(new_state):
			push_warning("Animation not found: " + new_state)
			return
		
		if current_state == new_state and not force:
			return
		
		current_state = new_state
		animated_sprite.animation = new_state
		animated_sprite.play()
		
		# Emit signal for game logic
		animation_changed.emit(new_state)
	
	func queue_state(state: String):
		"""Queue an animation state to play after current finishes"""
		state_queue.append(state)
	
	func _on_animated_sprite_animation_finished():
		"""Handle animation completion"""
		# Process state queue
		if state_queue.size() > 0:
			var next_state = state_queue.pop_front()
			change_state(next_state, true)
		else:
			# Return to idle for non-looping animations
			if not animated_sprite.sprite_frames.get_animation_loop(current_state):
				change_state("idle")
	
	# Signals
	signal animation_changed(animation_name: String)
	signal animation_finished(animation_name: String)

## Example usage function for integration testing
static func demo_sprite_integration():
	"""
	Demo function showing how to use the sprite generator integration
	Call this from a test scene to verify everything works
	"""
	print("=== Sprite Generator Integration Demo ===")
	
	# Get available characters
	var characters = get_available_characters()
	if characters.is_empty():
		print("No characters found. Run the batch generator first.")
		return
	
	print("Available characters: ", characters)
	
	# Demo: Create AnimatedSprite2D for first character
	var test_character = characters[0]
	print("Testing with character: ", test_character)
	
	var animated_sprite = create_character_animated_sprite(test_character, true)
	if animated_sprite:
		print("✅ Successfully created AnimatedSprite2D for ", test_character)
		# In a real scene, you would add this to the scene tree
		# get_tree().current_scene.add_child(animated_sprite)
	else:
		print("❌ Failed to create AnimatedSprite2D for ", test_character)
	
	print("=== Demo Complete ===")