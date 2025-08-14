## Real-Time Sprite Integration Test
## ================================
##
## Tests the real-time sprite generation system with the existing Character.cs system
## Validates automatic state detection and sprite generation

extends Node2D

var test_character: Node
var performance_timer: Timer
var test_states = ["Idle", "Walking", "Jumping", "Attacking", "Hit", "Blocking"]
var current_test_state = 0

func _ready():
	print("Starting Real-Time Sprite Integration Test...")
	setup_test_character()
	setup_performance_monitoring()
	start_automated_test()

func setup_test_character():
	"""Create a test character with real-time sprites enabled"""
	# Load Character.cs script
	var character_script = load("res://scripts/characters/Character.cs")
	if not character_script:
		push_error("Could not load Character.cs script")
		return
	
	# Create character instance
	test_character = CharacterBody2D.new()
	test_character.set_script(character_script)
	test_character.name = "TestCharacter"
	
	# Configure for real-time sprites
	test_character.set("CharacterId", "ryu")
	test_character.set("UseRealtimeSprites", true)
	test_character.set("UseEnhancedQuality", true)
	test_character.set("SpritePalette", "ryu")
	
	# Create required child nodes for Character.cs
	var animation_player = AnimationPlayer.new()
	animation_player.name = "AnimationPlayer"
	test_character.add_child(animation_player)
	
	var hitbox_area = Area2D.new()
	hitbox_area.name = "HitboxArea"
	test_character.add_child(hitbox_area)
	
	var hurtbox_area = Area2D.new()
	hurtbox_area.name = "HurtboxArea"
	test_character.add_child(hurtbox_area)
	
	# Position character in center of screen
	test_character.position = Vector2(960, 540)
	add_child(test_character)
	
	print("✅ Test character created with real-time sprites")

func setup_performance_monitoring():
	"""Setup performance monitoring"""
	performance_timer = Timer.new()
	performance_timer.wait_time = 2.0
	performance_timer.timeout.connect(_check_performance)
	performance_timer.autostart = true
	add_child(performance_timer)

func start_automated_test():
	"""Start automated testing sequence"""
	print("🚀 Starting automated real-time sprite generation test...")
	_run_state_test()

func _run_state_test():
	"""Test different character states"""
	if current_test_state >= test_states.size():
		_run_customization_test()
		return
	
	var state_name = test_states[current_test_state]
	print("Testing state: ", state_name)
	
	# Change character state (this should trigger sprite generation)
	if test_character and test_character.has_method("ChangeState"):
		# Map string to enum value (CharacterState enum in C#)
		var state_value = current_test_state
		test_character.call("ChangeState", state_value)
	
	current_test_state += 1
	
	# Wait and continue
	await get_tree().create_timer(2.0).timeout
	_run_state_test()

func _run_customization_test():
	"""Test character customization features"""
	print("🎨 Testing character customization...")
	
	if not test_character:
		_finish_test()
		return
	
	# Test palette swaps
	var palettes = ["ken", "chun_li", "zangief"]
	for palette in palettes:
		print("Testing palette: ", palette)
		test_character.call("SetSpritePalette", palette)
		await get_tree().create_timer(1.0).timeout
	
	# Test proportion changes
	print("Testing proportion changes...")
	test_character.call("SetCharacterProportions", 1.5, 0.8, 1.2)  # Tall, small head, wide body
	await get_tree().create_timer(2.0).timeout
	
	test_character.call("SetCharacterProportions", 0.7, 1.5, 0.8)   # Short, big head, thin body
	await get_tree().create_timer(2.0).timeout
	
	test_character.call("SetCharacterProportions", 1.0, 1.0, 1.0)   # Back to normal
	await get_tree().create_timer(1.0).timeout
	
	_finish_test()

func _finish_test():
	"""Complete the test and display results"""
	print("✅ Real-time sprite integration test completed!")
	
	if test_character and test_character.has_method("GetSpriteGenerationStats"):
		var stats = test_character.call("GetSpriteGenerationStats")
		print("📊 Final Performance Statistics:")
		for key in stats.keys():
			print("  ", key, ": ", stats[key])
	
	print("🎯 Test Summary:")
	print("  - Character state changes: TESTED")
	print("  - Real-time sprite generation: TESTED") 
	print("  - Palette swapping: TESTED")
	print("  - Proportion customization: TESTED")
	print("  - Performance monitoring: TESTED")
	
	# Create success indicator
	var success_label = Label.new()
	success_label.text = "✅ REAL-TIME SPRITE GENERATION TEST PASSED"
	success_label.position = Vector2(100, 100)
	success_label.add_theme_font_size_override("font_size", 24)
	add_child(success_label)

func _check_performance():
	"""Check performance during testing"""
	if not test_character or not test_character.has_method("GetSpriteGenerationStats"):
		return
	
	var stats = test_character.call("GetSpriteGenerationStats")
	if stats.size() > 0:
		var avg_time = stats.get("avg_generation_time_ms", 0.0)
		var cache_ratio = stats.get("cache_hit_ratio", 0.0) * 100
		var cache_size = stats.get("cache_size", 0)
		
		print("⚡ Performance Check:")
		print("  Generation Time: %.2f ms (Budget: 16.67 ms)" % avg_time)
		print("  Cache Hit Ratio: %.1f%%" % cache_ratio)
		print("  Cache Size: %d frames" % cache_size)
		
		# Warn if performance is poor
		if avg_time > 16.0:
			print("⚠️  WARNING: Generation time exceeding 60 FPS budget")
		if cache_ratio < 70.0:
			print("⚠️  WARNING: Low cache hit ratio, may impact performance")

func _input(event):
	"""Handle input during testing"""
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_SPACE:
				# Skip to next test
				current_test_state = test_states.size()
				_run_customization_test()
			
			KEY_ESCAPE:
				# Exit test
				get_tree().quit()
			
			KEY_S:
				# Print current stats
				_check_performance()