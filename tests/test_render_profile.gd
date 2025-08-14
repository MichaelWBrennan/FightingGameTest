extends GutTest

## Test suite for RenderProfile system
## Validates quality presets, settings validation, and performance estimation
## MIT Licensed

var render_profile: RenderProfile

func before_each():
	render_profile = RenderProfile.new()

func after_each():
	render_profile = null

# === Quality Preset Tests ===

func test_apply_low_quality_preset():
	render_profile.apply_quality_preset(RenderProfile.QualityLevel.LOW)
	
	assert_eq(render_profile.target_fps, 30, "LOW preset should target 30 FPS")
	assert_eq(render_profile.max_sprite_resolution, 1024, "LOW preset should use 1024px max resolution")
	assert_eq(render_profile.parallax_layers, 4, "LOW preset should use 4 parallax layers")
	assert_false(render_profile.enable_bloom, "LOW preset should disable bloom")
	assert_eq(render_profile.sprite_filter_mode, 0, "LOW preset should use nearest filtering")

func test_apply_medium_quality_preset():
	render_profile.apply_quality_preset(RenderProfile.QualityLevel.MED)
	
	assert_eq(render_profile.target_fps, 60, "MED preset should target 60 FPS")
	assert_eq(render_profile.max_sprite_resolution, 2048, "MED preset should use 2048px max resolution")
	assert_eq(render_profile.parallax_layers, 6, "MED preset should use 6 parallax layers")
	assert_true(render_profile.enable_bloom, "MED preset should enable bloom")
	assert_eq(render_profile.bloom_intensity, 0.6, "MED preset bloom intensity")

func test_apply_high_quality_preset():
	render_profile.apply_quality_preset(RenderProfile.QualityLevel.HIGH)
	
	assert_eq(render_profile.target_fps, 90, "HIGH preset should target 90 FPS")
	assert_eq(render_profile.max_sprite_resolution, 4096, "HIGH preset should use 4096px max resolution")
	assert_true(render_profile.enable_fake_dof, "HIGH preset should enable fake DOF")
	assert_eq(render_profile.sprite_filter_mode, 2, "HIGH preset should use anisotropic filtering")

func test_apply_ultra_quality_preset():
	render_profile.apply_quality_preset(RenderProfile.QualityLevel.ULTRA)
	
	assert_eq(render_profile.target_fps, 120, "ULTRA preset should target 120 FPS")
	assert_true(render_profile.enable_motion_blur, "ULTRA preset should enable motion blur")
	assert_eq(render_profile.texture_cache_size_mb, 1024, "ULTRA preset should use 1GB cache")

# === Settings Validation Tests ===

func test_validate_settings_valid():
	# Default settings should be valid
	assert_true(render_profile.validate_settings(), "Default settings should be valid")

func test_validate_settings_invalid_sprite_resolution():
	render_profile.max_sprite_resolution = 100  # Too low
	assert_false(render_profile.validate_settings(), "Should reject sprite resolution < 256")
	
	render_profile.max_sprite_resolution = 10000  # Too high
	assert_false(render_profile.validate_settings(), "Should reject sprite resolution > 8192")

func test_validate_settings_invalid_parallax_layers():
	render_profile.parallax_layers = 0  # Too low
	assert_false(render_profile.validate_settings(), "Should reject parallax layers < 1")
	
	render_profile.parallax_layers = 15  # Too high  
	assert_false(render_profile.validate_settings(), "Should reject parallax layers > 10")

func test_validate_settings_invalid_fps():
	render_profile.target_fps = 10  # Too low
	assert_false(render_profile.validate_settings(), "Should reject FPS < 15")
	
	render_profile.target_fps = 300  # Too high
	assert_false(render_profile.validate_settings(), "Should reject FPS > 240")

# === String Conversion Tests ===

func test_quality_from_string_valid():
	assert_eq(RenderProfile.quality_from_string("LOW"), RenderProfile.QualityLevel.LOW)
	assert_eq(RenderProfile.quality_from_string("MED"), RenderProfile.QualityLevel.MED)
	assert_eq(RenderProfile.quality_from_string("MEDIUM"), RenderProfile.QualityLevel.MED)
	assert_eq(RenderProfile.quality_from_string("HIGH"), RenderProfile.QualityLevel.HIGH)
	assert_eq(RenderProfile.quality_from_string("ULTRA"), RenderProfile.QualityLevel.ULTRA)

func test_quality_from_string_invalid():
	# Should default to MED for invalid strings
	assert_eq(RenderProfile.quality_from_string("INVALID"), RenderProfile.QualityLevel.MED)
	assert_eq(RenderProfile.quality_from_string(""), RenderProfile.QualityLevel.MED)

func test_quality_from_string_case_insensitive():
	assert_eq(RenderProfile.quality_from_string("low"), RenderProfile.QualityLevel.LOW)
	assert_eq(RenderProfile.quality_from_string("High"), RenderProfile.QualityLevel.HIGH)
	assert_eq(RenderProfile.quality_from_string("uLtRa"), RenderProfile.QualityLevel.ULTRA)

# === Memory Estimation Tests ===

func test_memory_estimation():
	render_profile.max_sprite_resolution = 2048
	render_profile.texture_cache_size_mb = 256
	render_profile.light_shadow_resolution = 1024
	render_profile.max_light_nodes = 8
	
	var estimated_mb = render_profile.get_estimated_memory_usage()
	
	# Should be reasonable estimate (base + sprite + cache + shadows)
	assert_gt(estimated_mb, 250.0, "Should account for cache size")
	assert_lt(estimated_mb, 400.0, "Should not be excessive")

func test_memory_estimation_scaling():
	# Test that memory scales with settings
	render_profile.texture_cache_size_mb = 128
	var low_memory = render_profile.get_estimated_memory_usage()
	
	render_profile.texture_cache_size_mb = 512
	var high_memory = render_profile.get_estimated_memory_usage()
	
	assert_gt(high_memory, low_memory, "Higher cache size should increase memory estimate")

# === Performance Impact Tests ===

func test_performance_impact_calculation():
	# Test minimal settings
	render_profile.enable_hd_sprites = false
	render_profile.enable_parallax = false
	render_profile.enable_post_processing = false
	var low_impact = render_profile.get_performance_impact()
	assert_eq(low_impact, "Low", "Minimal settings should have low impact")
	
	# Test maximum settings
	render_profile.enable_hd_sprites = true
	render_profile.enable_parallax = true
	render_profile.parallax_layers = 7
	render_profile.enable_mode7_floor = true
	render_profile.enable_post_processing = true
	render_profile.enable_bloom = true
	render_profile.enable_fake_dof = true
	render_profile.enable_motion_blur = true
	var high_impact = render_profile.get_performance_impact()
	assert_true(high_impact in ["High", "Very High"], "Maximum settings should have high impact")

# === Resource Loading Tests ===

func test_resource_loading():
	# Test that default resource loads correctly
	var loaded_profile = load("res://engine/render/render_profile.tres") as RenderProfile
	assert_not_null(loaded_profile, "Should load default render profile")
	assert_eq(loaded_profile.quality_level, RenderProfile.QualityLevel.MED, "Default should be MED quality")

func test_resource_saving():
	# Test saving custom profile
	render_profile.quality_level = RenderProfile.QualityLevel.HIGH
	render_profile.enable_motion_blur = true
	
	var temp_path = "res://tests/temp_profile.tres"
	ResourceSaver.save(render_profile, temp_path)
	
	var loaded = load(temp_path) as RenderProfile
	assert_not_null(loaded, "Should save and load custom profile")
	assert_eq(loaded.quality_level, RenderProfile.QualityLevel.HIGH, "Should preserve quality level")
	assert_true(loaded.enable_motion_blur, "Should preserve custom settings")
	
	# Cleanup
	var file = FileAccess.open(temp_path, FileAccess.WRITE)
	if file:
		file.close()
		DirAccess.remove_files_recursively(temp_path)

# === Edge Case Tests ===

func test_extreme_values():
	# Test system handles extreme values gracefully
	render_profile.bloom_intensity = 100.0  # Very high
	render_profile.parallax_layers = 50     # Too many
	render_profile.target_fps = 1000        # Unrealistic
	
	# Should not crash and validation should catch issues
	var is_valid = render_profile.validate_settings()
	assert_false(is_valid, "Should detect invalid extreme values")

func test_negative_values():
	# Test negative values are handled
	render_profile.bloom_intensity = -1.0
	render_profile.target_fps = -60
	render_profile.texture_cache_size_mb = -100
	
	# Apply quality preset should reset to valid values
	render_profile.apply_quality_preset(RenderProfile.QualityLevel.MED)
	
	assert_gt(render_profile.bloom_intensity, 0.0, "Should reset negative bloom")
	assert_gt(render_profile.target_fps, 0, "Should reset negative FPS")
	assert_gt(render_profile.texture_cache_size_mb, 0, "Should reset negative cache size")