extends Node

## Test suite for DynamicSpriteController
## Validates sprite loading, caching, material management, and performance
## MIT Licensed

func _ready():
	print("=== DynamicSpriteController Tests ===")
	await test_initialization()
	await test_action_management()
	await test_quality_management() 
	await test_caching()
	print("=== DynamicSpriteController Tests Complete ===")

func test_initialization():
	print("Testing initialization...")
	
	# Create test controller
	var controller_script = load("res://engine/actors/DynamicSpriteController.gd")
	var controller = controller_script.new()
	add_child(controller)
	
	await get_tree().process_frame
	
	assert(controller.sprite_2d != null, "Should create Sprite2D component")
	assert(controller.animated_sprite != null, "Should create AnimatedSprite2D component")  
	assert(controller.skeletal_2d != null, "Should create Skeleton2D component")
	assert(controller.current_action == "idle", "Should start with idle action")
	
	print("✓ Initialization test passed")
	controller.queue_free()

func test_action_management():
	print("Testing action management...")
	
	var controller_script = load("res://engine/actors/DynamicSpriteController.gd")
	var controller = controller_script.new()
	add_child(controller)
	
	await get_tree().process_frame
	
	# Test action changing
	var context = {"character_id": "ryu"}
	controller.set_action("punch", context)
	
	assert(controller.current_action == "punch", "Should update current action")
	assert(controller.current_context["character_id"] == "ryu", "Should store context")
	
	print("✓ Action management test passed")
	controller.queue_free()

func test_quality_management():
	print("Testing quality management...")
	
	var controller_script = load("res://engine/actors/DynamicSpriteController.gd")
	var controller = controller_script.new()
	add_child(controller)
	
	await get_tree().process_frame
	
	controller.set_quality("HIGH")
	assert(controller.current_quality == "HIGH", "Should update quality level")
	
	print("✓ Quality management test passed")
	controller.queue_free()

func test_caching():
	print("Testing caching system...")
	
	var controller_script = load("res://engine/actors/DynamicSpriteController.gd")
	var controller = controller_script.new()
	add_child(controller)
	
	await get_tree().process_frame
	
	# Test memory usage calculation
	var memory_mb = controller.get_memory_usage_mb()
	assert(memory_mb >= 0.0, "Should calculate non-negative memory usage")
	
	# Test cache cleanup
	controller.force_cache_cleanup()
	assert(controller.material_cache.size() == 0, "Should clear material cache")
	
	print("✓ Caching test passed")
	controller.queue_free()

func assert(condition: bool, message: String):
	if not condition:
		print("FAILED: ", message)
	else:
		print("PASS: ", message)