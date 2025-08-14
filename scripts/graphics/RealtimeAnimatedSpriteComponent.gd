## Real-Time Animated Sprite Component
## ==================================
##
## Integrates with AnimatedSprite2D to provide real-time procedural sprite generation.
## Replaces static sprite frames with dynamically generated content based on game state.
## Maintains compatibility with existing AnimatedSprite2D workflow.

extends Node
class_name RealtimeAnimatedSpriteComponent

## Signals for animation events
signal animation_changed(animation_name: String)
signal frame_changed(animation_name: String, frame: int)
signal animation_finished(animation_name: String)

## Configuration
@export var character_id: String = ""
@export var use_enhanced_quality: bool = true
@export var enable_interpolation: bool = true
@export var auto_generate_frames: bool = true
@export var max_fps: int = 60
@export var debug_performance: bool = false

## Character customization
@export var palette_name: String = "default"
@export var limb_length_multiplier: float = 1.0
@export var head_size_multiplier: float = 1.0
@export var body_width_multiplier: float = 1.0

## Animation configuration
class AnimationState:
	var name: String
	var frame_count: int
	var fps: float
	var loop: bool
	var current_frame: int = 0
	var frame_time: float = 0.0
	var finished: bool = false
	
	func _init(anim_name: String, frames: int = 8, animation_fps: float = 12.0, should_loop: bool = true):
		name = anim_name
		frame_count = frames
		fps = animation_fps
		loop = should_loop

## Component references
var animated_sprite: AnimatedSprite2D
var sprite_generator: RealtimeProceduralSpriteGenerator
var character_node: Node  # Reference to Character.cs node for state tracking

## Animation state
var animation_states: Dictionary = {}
var current_animation: AnimationState
var previous_animation: AnimationState
var interpolation_time: float = 0.0
var interpolation_duration: float = 0.1  # 100ms interpolation between states

## Performance tracking
var last_frame_time: float = 0.0
var frame_generation_budget: float = 16.0  # milliseconds per frame at 60 FPS
var skip_frame_threshold: float = 12.0  # Skip generation if over 12ms

## Character state tracking
var last_character_state: String = ""
var last_facing_right: bool = true
var last_velocity: Vector2 = Vector2.ZERO

func _ready():
	# Find required components
	setup_components()
	
	# Initialize sprite generator
	if not sprite_generator:
		sprite_generator = RealtimeProceduralSpriteGenerator.new()
		add_child(sprite_generator)
	
	# Setup default animation states
	setup_default_animations()
	
	# Start with idle animation
	play_animation("idle")

func setup_components():
	"""Find and setup component references"""
	# Find AnimatedSprite2D - check parent and siblings
	animated_sprite = find_animated_sprite_node()
	
	if not animated_sprite:
		push_error("RealtimeAnimatedSpriteComponent: AnimatedSprite2D not found!")
		return
	
	# Find Character node for state tracking
	character_node = find_character_node()
	
	if not character_node:
		push_warning("RealtimeAnimatedSpriteComponent: Character node not found - manual state updates required")

func find_animated_sprite_node() -> AnimatedSprite2D:
	"""Find AnimatedSprite2D node in the scene tree"""
	# Check parent first
	var parent = get_parent()
	if parent is AnimatedSprite2D:
		return parent as AnimatedSprite2D
	
	# Check siblings
	if parent:
		for child in parent.get_children():
			if child is AnimatedSprite2D:
				return child as AnimatedSprite2D
	
	# Check children
	for child in get_children():
		if child is AnimatedSprite2D:
			return child as AnimatedSprite2D
	
	return null

func find_character_node() -> Node:
	"""Find Character.cs node for state tracking"""
	var current = get_parent()
	
	# Walk up the scene tree looking for Character node
	while current:
		if current.has_method("GetCurrentState") or current.name.to_lower().contains("character"):
			return current
		current = current.get_parent()
	
	return null

func setup_default_animations():
	"""Setup standard fighting game animations"""
	animation_states = {
		"idle": AnimationState.new("idle", 8, 8.0, true),
		"walk": AnimationState.new("walk", 6, 12.0, true),
		"run": AnimationState.new("run", 6, 16.0, true),
		"jump": AnimationState.new("jump", 4, 15.0, false),
		"crouch": AnimationState.new("crouch", 2, 6.0, false),
		"attack": AnimationState.new("attack", 8, 20.0, false),
		"punch": AnimationState.new("punch", 6, 24.0, false),
		"kick": AnimationState.new("kick", 8, 20.0, false),
		"special": AnimationState.new("special", 12, 18.0, false),
		"block": AnimationState.new("block", 3, 8.0, false),
		"hit": AnimationState.new("hit", 4, 15.0, false),
		"knockdown": AnimationState.new("knockdown", 6, 12.0, false)
	}
	
	# Setup AnimatedSprite2D with initial animations
	setup_animated_sprite_animations()

func setup_animated_sprite_animations():
	"""Initialize AnimatedSprite2D with procedural animations"""
	if not animated_sprite:
		return
	
	if not animated_sprite.sprite_frames:
		animated_sprite.sprite_frames = SpriteFrames.new()
	
	var sprite_frames = animated_sprite.sprite_frames
	
	# Create animations in SpriteFrames
	for anim_name in animation_states.keys():
		var anim_state = animation_states[anim_name] as AnimationState
		
		if not sprite_frames.has_animation(anim_name):
			sprite_frames.add_animation(anim_name)
		
		sprite_frames.set_animation_speed(anim_name, anim_state.fps)
		sprite_frames.set_animation_loop(anim_name, anim_state.loop)
		
		# Add initial placeholder frame
		generate_and_add_frame(sprite_frames, anim_name, 0)

func generate_and_add_frame(sprite_frames: SpriteFrames, animation_name: String, frame_index: int):
	"""Generate and add a single frame to the animation"""
	if not sprite_generator:
		return
	
	var appearance = create_character_appearance()
	var texture = sprite_generator.generate_frame(
		appearance,
		animation_name,
		last_facing_right,
		last_velocity,
		frame_index
	)
	
	# Clear existing frames and add the new one
	sprite_frames.clear(animation_name)
	sprite_frames.add_frame(animation_name, texture)

func create_character_appearance() -> RealtimeProceduralSpriteGenerator.CharacterAppearance:
	"""Create character appearance configuration"""
	var appearance = RealtimeProceduralSpriteGenerator.CharacterAppearance.new(character_id, use_enhanced_quality)
	appearance.palette_name = palette_name
	appearance.limb_length_multiplier = limb_length_multiplier
	appearance.head_size_multiplier = head_size_multiplier
	appearance.body_width_multiplier = body_width_multiplier
	return appearance

func _process(delta):
	if not auto_generate_frames or not current_animation:
		return
	
	var start_time = Time.get_ticks_msec()
	
	# Update character state tracking
	update_character_state()
	
	# Update animation timing
	update_animation_timing(delta)
	
	# Generate current frame if needed
	if should_generate_frame():
		generate_current_frame()
	
	# Performance monitoring
	if debug_performance:
		var generation_time = Time.get_ticks_msec() - start_time
		if generation_time > frame_generation_budget:
			print("Frame generation over budget: ", generation_time, "ms")

func update_character_state():
	"""Update character state from Character.cs node"""
	if not character_node:
		return
	
	# Try to get state from Character.cs
	var current_state = ""
	var facing_right = true
	var velocity = Vector2.ZERO
	
	# Use reflection to get state (works with both GDScript and C# Character nodes)
	if character_node.has_method("get"):
		current_state = str(character_node.get("CurrentState")) if character_node.get("CurrentState") != null else ""
		facing_right = bool(character_node.get("FacingRight")) if character_node.get("FacingRight") != null else true
		if character_node.has_method("get_velocity"):
			velocity = character_node.get_velocity()
		elif character_node.get("_velocity") != null:
			velocity = character_node.get("_velocity")
	
	# Map C# enum to animation name
	var animation_name = map_state_to_animation(current_state)
	
	# Check if state changed
	var state_changed = (
		current_state != last_character_state or
		facing_right != last_facing_right or
		velocity.distance_to(last_velocity) > 50.0
	)
	
	if state_changed:
		last_character_state = current_state
		last_facing_right = facing_right
		last_velocity = velocity
		
		# Switch animation if needed
		if animation_name != "" and animation_name != current_animation.name:
			play_animation(animation_name)

func map_state_to_animation(state_string: String) -> String:
	"""Map Character.cs state to animation name"""
	match state_string.to_lower():
		"idle", "0":
			return "idle"
		"walking", "1":
			return "walk"
		"crouching", "2":
			return "crouch"
		"jumping", "3":
			return "jump"
		"attacking", "4":
			return "attack"
		"hit", "5":
			return "hit"
		"blocking", "6":
			return "block"
		"knocked", "7":
			return "knockdown"
		"stunned", "8":
			return "hit"
		_:
			return ""

func update_animation_timing(delta: float):
	"""Update animation frame timing"""
	if not current_animation:
		return
	
	current_animation.frame_time += delta
	var frame_duration = 1.0 / current_animation.fps
	
	if current_animation.frame_time >= frame_duration:
		current_animation.frame_time -= frame_duration
		current_animation.current_frame += 1
		
		# Handle animation end/looping
		if current_animation.current_frame >= current_animation.frame_count:
			if current_animation.loop:
				current_animation.current_frame = 0
			else:
				current_animation.current_frame = current_animation.frame_count - 1
				if not current_animation.finished:
					current_animation.finished = true
					emit_signal("animation_finished", current_animation.name)
		
		# Emit frame changed signal
		emit_signal("frame_changed", current_animation.name, current_animation.current_frame)

func should_generate_frame() -> bool:
	"""Determine if we should generate a new frame this update"""
	var current_time = Time.get_ticks_msec()
	
	# Respect frame rate limit
	var min_frame_time = 1000.0 / max_fps
	if current_time - last_frame_time < min_frame_time:
		return false
	
	return true

func generate_current_frame():
	"""Generate the current animation frame and update AnimatedSprite2D"""
	if not animated_sprite or not current_animation or not sprite_generator:
		return
	
	var start_time = Time.get_ticks_msec()
	
	# Check performance budget
	var time_since_last = start_time - last_frame_time
	if time_since_last < skip_frame_threshold:
		return  # Skip this frame to maintain performance
	
	var appearance = create_character_appearance()
	var texture = sprite_generator.generate_frame(
		appearance,
		current_animation.name,
		last_facing_right,
		last_velocity,
		current_animation.current_frame
	)
	
	# Update the AnimatedSprite2D
	if animated_sprite.sprite_frames:
		var sprite_frames = animated_sprite.sprite_frames
		sprite_frames.clear(current_animation.name)
		sprite_frames.add_frame(current_animation.name, texture)
		
		# Ensure we're playing the current animation
		if animated_sprite.animation != current_animation.name:
			animated_sprite.animation = current_animation.name
			animated_sprite.play()
	
	last_frame_time = start_time
	
	# Performance tracking
	if debug_performance:
		var generation_time = Time.get_ticks_msec() - start_time
		if generation_time > frame_generation_budget:
			print("Frame generation took: ", generation_time, "ms (budget: ", frame_generation_budget, "ms)")

func play_animation(animation_name: String, force_restart: bool = false):
	"""Play a specific animation"""
	if not animation_states.has(animation_name):
		push_warning("Animation not found: " + animation_name)
		return
	
	var new_animation = animation_states[animation_name] as AnimationState
	
	# Don't restart same animation unless forced
	if current_animation and current_animation.name == animation_name and not force_restart:
		return
	
	# Store previous animation for interpolation
	if enable_interpolation and current_animation:
		previous_animation = current_animation
		interpolation_time = 0.0
	
	current_animation = new_animation
	current_animation.current_frame = 0
	current_animation.frame_time = 0.0
	current_animation.finished = false
	
	# Generate initial frame
	if auto_generate_frames:
		generate_current_frame()
	
	emit_signal("animation_changed", animation_name)

func stop_animation():
	"""Stop the current animation"""
	if animated_sprite:
		animated_sprite.stop()
	
	current_animation = null

func is_animation_playing() -> bool:
	"""Check if an animation is currently playing"""
	return current_animation != null and not current_animation.finished

func get_current_animation_name() -> String:
	"""Get the name of the currently playing animation"""
	return current_animation.name if current_animation else ""

func get_current_frame() -> int:
	"""Get the current frame number"""
	return current_animation.current_frame if current_animation else 0

## Character customization methods

func set_character_palette(new_palette: String):
	"""Change character color palette instantly"""
	if palette_name == new_palette:
		return
	
	palette_name = new_palette
	
	# Clear cache for this character to force regeneration with new palette
	if sprite_generator:
		sprite_generator.swap_character_palette(character_id, new_palette)
	
	# Regenerate current frame
	if auto_generate_frames and current_animation:
		generate_current_frame()

func set_limb_length(multiplier: float):
	"""Adjust character limb length"""
	limb_length_multiplier = clamp(multiplier, 0.5, 2.0)
	if sprite_generator:
		sprite_generator.clear_cache()  # Clear cache to regenerate with new proportions

func set_head_size(multiplier: float):
	"""Adjust character head size"""
	head_size_multiplier = clamp(multiplier, 0.5, 2.0)
	if sprite_generator:
		sprite_generator.clear_cache()

func set_body_width(multiplier: float):
	"""Adjust character body width"""
	body_width_multiplier = clamp(multiplier, 0.5, 2.0)
	if sprite_generator:
		sprite_generator.clear_cache()

## Performance and debugging methods

func get_performance_stats() -> Dictionary:
	"""Get performance statistics"""
	var base_stats = {}
	if sprite_generator:
		base_stats = sprite_generator.get_performance_stats()
	
	base_stats["current_animation"] = current_animation.name if current_animation else "none"
	base_stats["current_frame"] = current_animation.current_frame if current_animation else 0
	base_stats["auto_generate_enabled"] = auto_generate_frames
	base_stats["interpolation_enabled"] = enable_interpolation
	base_stats["enhanced_quality"] = use_enhanced_quality
	
	return base_stats

func clear_cache():
	"""Clear all cached frames"""
	if sprite_generator:
		sprite_generator.clear_cache()

func set_debug_mode(enabled: bool):
	"""Enable/disable debug performance monitoring"""
	debug_performance = enabled

## Manual frame generation (for custom animations)

func generate_custom_frame(state_name: String, frame_index: int, facing_right: bool = true, velocity: Vector2 = Vector2.ZERO) -> ImageTexture:
	"""Generate a custom frame manually"""
	if not sprite_generator:
		return null
	
	var appearance = create_character_appearance()
	return sprite_generator.generate_frame(appearance, state_name, facing_right, velocity, frame_index)

func add_custom_animation(name: String, frame_count: int, fps: float, loop: bool = true):
	"""Add a custom animation configuration"""
	animation_states[name] = AnimationState.new(name, frame_count, fps, loop)
	
	# Add to AnimatedSprite2D if available
	if animated_sprite and animated_sprite.sprite_frames:
		var sprite_frames = animated_sprite.sprite_frames
		if not sprite_frames.has_animation(name):
			sprite_frames.add_animation(name)
		sprite_frames.set_animation_speed(name, fps)
		sprite_frames.set_animation_loop(name, loop)

## Integration helpers for existing Character.cs system

func setup_for_character(character: Node, anim_sprite: AnimatedSprite2D):
	"""Setup component for specific character and sprite nodes"""
	character_node = character
	animated_sprite = anim_sprite
	
	# Get character ID from Character.cs
	if character.has_method("get") and character.get("CharacterId"):
		character_id = str(character.get("CharacterId"))
	
	# Setup animations
	setup_animated_sprite_animations()
	play_animation("idle")

func connect_to_character_signals(character: Node):
	"""Connect to Character.cs signals for automatic state updates"""
	if character.has_signal("StateChanged"):
		if not character.is_connected("StateChanged", _on_character_state_changed):
			character.connect("StateChanged", _on_character_state_changed)

func _on_character_state_changed(new_state: int):
	"""Handle Character.cs state change signal"""
	var state_names = ["idle", "walking", "crouching", "jumping", "attacking", "hit", "blocking", "knocked", "stunned"]
	if new_state >= 0 and new_state < state_names.size():
		var animation_name = state_names[new_state]
		play_animation(animation_name)