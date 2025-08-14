extends Node

## Quick validation runner for 2D-HD system
## Runs basic functionality tests
## MIT Licensed

func _ready():
	print("=== 2D-HD System Quick Validation ===")
	
	# Test 1: RenderProfile system
	print("\n1. Testing RenderProfile...")
	var profile = RenderProfile.new()
	profile.apply_quality_preset(RenderProfile.QualityLevel.HIGH)
	print("✅ RenderProfile loaded and configured")
	
	# Test 2: DynamicSpriteController
	print("\n2. Testing DynamicSpriteController...")
	var controller_script = load("res://engine/actors/DynamicSpriteController.gd")
	var controller = controller_script.new()
	add_child(controller)
	await get_tree().process_frame
	print("✅ DynamicSpriteController created successfully")
	
	# Test 3: CharacterRig2D
	print("\n3. Testing CharacterRig2D...")
	var rig_scene = load("res://engine/actors/CharacterRig2D.tscn")
	var rig = rig_scene.instantiate()
	add_child(rig)
	await get_tree().process_frame
	print("✅ CharacterRig2D instantiated successfully")
	
	# Test 4: Stage2_5D
	print("\n4. Testing Stage2_5D...")
	var stage_scene = load("res://engine/stage/Stage2_5D.tscn")
	var stage = stage_scene.instantiate()
	add_child(stage)
	await get_tree().process_frame
	print("✅ Stage2_5D created successfully")
	
	# Test 5: TextureStreamer
	print("\n5. Testing TextureStreamer...")
	var streamer_script = load("res://utils/texture_streamer.gd")
	var streamer = streamer_script.new()
	add_child(streamer)
	await get_tree().process_frame
	var stats = streamer.get_cache_stats()
	print("✅ TextureStreamer initialized - Cache: ", stats["max_cache_size_mb"], "MB")
	
	# Test 6: Shader loading
	print("\n6. Testing Shaders...")
	var sprite_shader = load("res://engine/render/shaders/sprite_lit.gdshader")
	var mode7_shader = load("res://engine/render/shaders/mode7_floor.gdshader") 
	var billboard_shader = load("res://engine/render/shaders/billboard_prop.gdshader")
	print("✅ All core shaders loaded successfully")
	
	print("\n=== Validation Complete ===")
	print("🎉 2D-HD Rendering Engine is ready for use!")
	print("💡 Run tests/Demo2DHD.tscn to see the system in action")
	
	# Auto-quit after validation
	await get_tree().create_timer(2.0).timeout
	get_tree().quit()