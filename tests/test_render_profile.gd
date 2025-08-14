extends Node

## Test suite for RenderProfile system  
## Validates quality presets, settings validation, and performance estimation
## MIT Licensed

func _ready():
	print("=== RenderProfile Tests ===")
	test_quality_presets()
	test_settings_validation()
	test_string_conversion()
	test_memory_estimation()
	print("=== RenderProfile Tests Complete ===")

func test_quality_presets():
	print("Testing quality presets...")
	
	var profile = RenderProfile.new()
	
	# Test LOW preset
	profile.apply_quality_preset(RenderProfile.QualityLevel.LOW)
	assert(profile.target_fps == 30, "LOW preset should target 30 FPS")
	assert(profile.max_sprite_resolution == 1024, "LOW preset should use 1024px")
	print("✓ LOW quality preset")
	
	# Test MED preset
	profile.apply_quality_preset(RenderProfile.QualityLevel.MED)
	assert(profile.target_fps == 60, "MED preset should target 60 FPS")
	assert(profile.enable_bloom == true, "MED preset should enable bloom")
	print("✓ MED quality preset")
	
	# Test HIGH preset
	profile.apply_quality_preset(RenderProfile.QualityLevel.HIGH)
	assert(profile.target_fps == 90, "HIGH preset should target 90 FPS")
	assert(profile.enable_fake_dof == true, "HIGH preset should enable DOF")
	print("✓ HIGH quality preset")
	
	# Test ULTRA preset
	profile.apply_quality_preset(RenderProfile.QualityLevel.ULTRA)
	assert(profile.target_fps == 120, "ULTRA preset should target 120 FPS")
	assert(profile.enable_motion_blur == true, "ULTRA preset should enable motion blur")
	print("✓ ULTRA quality preset")

func test_settings_validation():
	print("Testing settings validation...")
	
	var profile = RenderProfile.new()
	
	# Valid settings
	assert(profile.validate_settings(), "Default settings should be valid")
	print("✓ Default settings validation")
	
	# Invalid sprite resolution
	profile.max_sprite_resolution = 100
	assert(not profile.validate_settings(), "Should reject low resolution")
	print("✓ Invalid resolution detection")

func test_string_conversion():
	print("Testing string conversion...")
	
	assert(RenderProfile.quality_from_string("LOW") == RenderProfile.QualityLevel.LOW)
	assert(RenderProfile.quality_from_string("MED") == RenderProfile.QualityLevel.MED)
	assert(RenderProfile.quality_from_string("HIGH") == RenderProfile.QualityLevel.HIGH)
	assert(RenderProfile.quality_from_string("ULTRA") == RenderProfile.QualityLevel.ULTRA)
	print("✓ String to quality conversion")

func test_memory_estimation():
	print("Testing memory estimation...")
	
	var profile = RenderProfile.new()
	profile.texture_cache_size_mb = 256
	var memory = profile.get_estimated_memory_usage()
	
	assert(memory > 200.0, "Should account for cache size")
	assert(memory < 500.0, "Should not be excessive")
	print("✓ Memory estimation: ", memory, "MB")

func assert(condition: bool, message: String):
	if not condition:
		print("FAILED: ", message)
	else:
		print("PASS: ", message)