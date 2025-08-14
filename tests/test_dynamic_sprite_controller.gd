extends GutTest

## Test suite for DynamicSpriteController
## Validates sprite loading, caching, material management, and performance
## MIT Licensed

var sprite_controller: DynamicSpriteController
var test_parent: Node2D

func before_each():
	test_parent = Node2D.new()
	add_child(test_parent)
	
	# Create sprite controller instance
	var controller_script = load("res://engine/actors/DynamicSpriteController.gd")
	sprite_controller = controller_script.new()
	test_parent.add_child(sprite_controller)

func after_each():
	if test_parent:
		test_parent.queue_free()
	sprite_controller = null

# === Basic Functionality Tests ===

func test_initialization():
	assert_not_null(sprite_controller, "Should create sprite controller")
	assert_not_null(sprite_controller.sprite_2d, "Should create Sprite2D component")
	assert_not_null(sprite_controller.animated_sprite, "Should create AnimatedSprite2D component")
	assert_not_null(sprite_controller.skeletal_2d, "Should create Skeleton2D component")

func test_initial_state():
	assert_eq(sprite_controller.current_action, "idle", "Should start with idle action")
	assert_eq(sprite_controller.current_quality, "MED", "Should start with MED quality")
	assert_eq(sprite_controller.current_render_mode, DynamicSpriteController.RenderMode.SPRITE_2D, "Should start with SPRITE_2D mode")

# === Action Management Tests ===

func test_set_action_basic():
	var context = {"character_id": "ryu"}
	sprite_controller.set_action("punch", context)
	
	assert_eq(sprite_controller.current_action, "punch", "Should update current action")
	assert_eq(sprite_controller.current_context["character_id"], "ryu", "Should store context")

func test_set_action_no_change():
	var context = {"character_id": "ryu"}
	sprite_controller.set_action("idle", context)
	
	# Track if action_changed signal was emitted
	var signal_emitted = false
	sprite_controller.action_changed.connect(func(_action): signal_emitted = true)
	
	# Set same action again
	sprite_controller.set_action("idle", context)
	
	# Should not emit signal for no change
	await get_tree().process_frame
	assert_false(signal_emitted, "Should not emit signal for unchanged action")

func test_set_action_signal_emission():
	var signal_received = false
	var received_action = ""
	
	sprite_controller.action_changed.connect(func(action): 
		signal_received = true
		received_action = action
	)
	
	sprite_controller.set_action("walk", {"character_id": "chun_li"})
	
	await get_tree().process_frame
	assert_true(signal_received, "Should emit action_changed signal")
	assert_eq(received_action, "walk", "Should pass correct action name")

# === Quality Management Tests ===

func test_set_quality():
	sprite_controller.set_quality("HIGH")
	assert_eq(sprite_controller.current_quality, "HIGH", "Should update quality level")

func test_set_quality_signal():
	var signal_received = false
	var received_quality = ""
	
	sprite_controller.quality_changed.connect(func(quality):
		signal_received = true
		received_quality = quality
	)
	
	sprite_controller.set_quality("LOW")
	
	await get_tree().process_frame
	assert_true(signal_received, "Should emit quality_changed signal")
	assert_eq(received_quality, "LOW", "Should pass correct quality level")

func test_set_quality_no_change():
	sprite_controller.set_quality("MED")  # Should be default
	
	var signal_emitted = false
	sprite_controller.quality_changed.connect(func(_quality): signal_emitted = true)
	
	sprite_controller.set_quality("MED")  # Same quality
	
	await get_tree().process_frame
	assert_false(signal_emitted, "Should not emit signal for unchanged quality")

# === Render Mode Tests ===

func test_render_mode_switching():
	var signal_received = false
	var received_mode = DynamicSpriteController.RenderMode.SPRITE_2D
	
	sprite_controller.render_mode_changed.connect(func(mode):
		signal_received = true
		received_mode = mode
	)
	
	# Force mode switch (would normally be automatic based on available assets)
	sprite_controller._switch_render_mode(DynamicSpriteController.RenderMode.ANIMATED_2D)
	
	await get_tree().process_frame
	assert_true(signal_received, "Should emit render_mode_changed signal")
	assert_eq(received_mode, DynamicSpriteController.RenderMode.ANIMATED_2D, "Should pass correct mode")

func test_component_visibility():
	# Initially only Sprite2D should be visible
	assert_true(sprite_controller.sprite_2d.visible, "Sprite2D should be visible initially")
	assert_false(sprite_controller.animated_sprite.visible, "AnimatedSprite2D should be hidden initially")
	assert_false(sprite_controller.skeletal_2d.visible, "Skeleton2D should be hidden initially")
	
	# Switch to animated mode
	sprite_controller._switch_render_mode(DynamicSpriteController.RenderMode.ANIMATED_2D)
	
	assert_false(sprite_controller.sprite_2d.visible, "Sprite2D should be hidden after switch")
	assert_true(sprite_controller.animated_sprite.visible, "AnimatedSprite2D should be visible after switch")
	assert_false(sprite_controller.skeletal_2d.visible, "Skeleton2D should still be hidden")

# === Hitbox Scaling Tests ===

func test_hitbox_scale_calculation():
	sprite_controller.sprite_2d.scale = Vector2(2.0, 1.5)
	var scale = sprite_controller.get_hitbox_scale()
	
	assert_eq(scale, Vector2(2.0, 1.5), "Should return current sprite scale")

func test_hitbox_registration():
	var test_area = Area2D.new()
	test_parent.add_child(test_area)
	
	sprite_controller.register_hitbox_area(test_area, Vector2(1.0, 1.0))
	
	assert_true(test_area in sprite_controller.hitbox_areas, "Should register hitbox area")
	
	test_area.queue_free()

func test_hitbox_scaling_update():
	var test_area = Area2D.new()
	test_parent.add_child(test_area)
	
	sprite_controller.register_hitbox_area(test_area, Vector2(1.0, 1.0))
	sprite_controller.sprite_2d.scale = Vector2(2.0, 2.0)
	sprite_controller.update_hitbox_scaling()
	
	assert_eq(test_area.scale, Vector2(2.0, 2.0), "Should scale hitbox area with sprite")
	
	test_area.queue_free()

# === Caching Tests ===

func test_texture_cache_basic():
	var test_texture = ImageTexture.new()
	var test_image = Image.create(64, 64, false, Image.FORMAT_RGB8)
	test_texture.create_from_image(test_image)
	
	sprite_controller._add_to_texture_cache("test_path", test_texture)
	
	assert_true("test_path" in sprite_controller.texture_cache, "Should add texture to cache")
	
	var cached_texture = sprite_controller._load_texture_cached("test_path")
	assert_eq(cached_texture, test_texture, "Should retrieve cached texture")

func test_texture_cache_lru():
	# Fill cache beyond capacity
	sprite_controller.max_cache_size = 2
	
	var texture1 = ImageTexture.new()
	var texture2 = ImageTexture.new()
	var texture3 = ImageTexture.new()
	
	sprite_controller._add_to_texture_cache("path1", texture1)
	sprite_controller._add_to_texture_cache("path2", texture2)
	sprite_controller._add_to_texture_cache("path3", texture3)  # Should evict path1
	
	assert_false("path1" in sprite_controller.texture_cache, "Should evict oldest texture")
	assert_true("path2" in sprite_controller.texture_cache, "Should keep newer texture")
	assert_true("path3" in sprite_controller.texture_cache, "Should keep newest texture")

func test_material_cache():
	# Mock render profile for testing
	sprite_controller.render_profile = RenderProfile.new()
	
	var material1 = sprite_controller._get_or_create_material("sprite_lit")
	var material2 = sprite_controller._get_or_create_material("sprite_lit")
	
	# Should return same material (cached)
	assert_eq(material1, material2, "Should cache and reuse materials")

# === Performance Tests ===

func test_performance_stats():
	var stats = sprite_controller.get_performance_stats()
	
	assert_true("frame_time_ms" in stats, "Should include frame time")
	assert_true("texture_memory_mb" in stats, "Should include texture memory")
	assert_true("material_cache_size" in stats, "Should include material cache size")
	assert_true("current_render_mode" in stats, "Should include render mode")

func test_memory_usage_calculation():
	# Add some test textures
	var test_texture = ImageTexture.new()
	var test_image = Image.create(256, 256, false, Image.FORMAT_RGBA8)
	test_texture.create_from_image(test_image)
	
	sprite_controller._add_to_texture_cache("test", test_texture)
	
	var memory_mb = sprite_controller.get_memory_usage_mb()
	assert_gt(memory_mb, 0.0, "Should calculate non-zero memory usage")
	
	# Should be approximately 256*256*4 bytes = 0.25MB
	assert_approximately(memory_mb, 0.25, 0.1, "Should calculate correct memory usage")

# === Cleanup Tests ===

func test_cache_cleanup():
	# Add test data to caches
	sprite_controller.material_cache["test"] = ShaderMaterial.new()
	sprite_controller.texture_cache["test"] = ImageTexture.new()
	sprite_controller.frame_cache["test"] = {}
	
	sprite_controller.force_cache_cleanup()
	
	assert_eq(sprite_controller.material_cache.size(), 0, "Should clear material cache")
	assert_eq(sprite_controller.texture_cache.size(), 0, "Should clear texture cache") 
	assert_eq(sprite_controller.frame_cache.size(), 0, "Should clear frame cache")

# === Error Handling Tests ===

func test_missing_shader_handling():
	# Test with non-existent shader
	var material = sprite_controller._get_or_create_material("nonexistent_shader")
	assert_null(material, "Should return null for missing shader")

func test_missing_texture_handling():
	var texture = sprite_controller._load_texture_cached("res://nonexistent/texture.png")
	assert_null(texture, "Should return null for missing texture")

# === Integration Tests ===

func test_palette_swapping():
	# Create test palette LUT
	var palette_image = Image.create(256, 1, false, Image.FORMAT_RGB8)
	palette_image.fill(Color.RED)  # All red palette
	var palette_texture = ImageTexture.new()
	palette_texture.create_from_image(palette_image)
	
	sprite_controller.set_palette(palette_texture)
	
	assert_eq(sprite_controller.current_palette, palette_texture, "Should store palette texture")

func test_subpixel_rendering_toggle():
	sprite_controller.set_subpixel_rendering(false)
	# Should update render profile settings
	# Note: This would require mock render profile for full testing

func test_mipmap_bias_setting():
	sprite_controller.render_profile = RenderProfile.new()
	sprite_controller.set_mipmap_bias(1.0)
	
	assert_eq(sprite_controller.render_profile.mipmap_bias, 1.0, "Should update mipmap bias")