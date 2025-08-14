extends Node

## Render Profile Manager Singleton
## Global access to rendering settings and quality management
## Handles CLI arguments and runtime quality switching
## MIT Licensed

var render_profile: RenderProfile
var current_quality_level: RenderProfile.QualityLevel = RenderProfile.QualityLevel.MED

signal quality_changed(level: RenderProfile.QualityLevel)
signal profile_reloaded()

func _ready() -> void:
	_load_profile()
	_parse_command_line_args()
	_apply_profile_globally()
	
	print("RenderProfileManager: Initialized with quality level ", RenderProfile.QualityLevel.keys()[current_quality_level])

func _load_profile() -> void:
	var profile_path = "res://engine/render/render_profile.tres"
	if ResourceLoader.exists(profile_path):
		render_profile = load(profile_path)
		current_quality_level = render_profile.quality_level
	else:
		print("RenderProfileManager: Creating default render profile")
		render_profile = RenderProfile.new()
		render_profile.apply_quality_preset(RenderProfile.QualityLevel.MED)

func _parse_command_line_args() -> void:
	var args = OS.get_cmdline_args()
	
	for arg in args:
		if arg.begins_with("--render_profile="):
			var quality_str = arg.replace("--render_profile=", "")
			var quality_level = RenderProfile.quality_from_string(quality_str)
			set_quality_level(quality_level)
			print("RenderProfileManager: Quality set from command line: ", quality_str)
			break

func _apply_profile_globally() -> void:
	# Apply render settings to global Godot settings
	if render_profile:
		_apply_viewport_settings()
		_apply_rendering_settings()

func _apply_viewport_settings() -> void:
	var main_viewport = get_viewport()
	if main_viewport:
		# Apply MSAA settings
		var msaa_level = 0
		match current_quality_level:
			RenderProfile.QualityLevel.LOW:
				msaa_level = 0
			RenderProfile.QualityLevel.MED:
				msaa_level = 1
			RenderProfile.QualityLevel.HIGH:
				msaa_level = 2
			RenderProfile.QualityLevel.ULTRA:
				msaa_level = 3
		
		main_viewport.msaa_2d = msaa_level

func _apply_rendering_settings() -> void:
	# Apply global rendering settings based on profile
	if render_profile.enable_hd_sprites:
		# Configure texture import settings globally
		pass
	
	# Set physics tick rate to match target FPS
	Engine.physics_ticks_per_second = render_profile.target_fps

## Public API

func get_profile() -> RenderProfile:
	return render_profile

func get_quality_level() -> RenderProfile.QualityLevel:
	return current_quality_level

func set_quality_level(level: RenderProfile.QualityLevel) -> void:
	if current_quality_level == level:
		return
	
	current_quality_level = level
	render_profile.apply_quality_preset(level)
	_apply_profile_globally()
	
	quality_changed.emit(level)
	print("RenderProfileManager: Quality changed to ", RenderProfile.QualityLevel.keys()[level])

func set_quality_by_string(quality_str: String) -> void:
	var level = RenderProfile.quality_from_string(quality_str)
	set_quality_level(level)

func reload_profile() -> void:
	_load_profile()
	_apply_profile_globally()
	profile_reloaded.emit()
	print("RenderProfileManager: Profile reloaded")

func save_profile() -> void:
	if render_profile:
		var profile_path = "res://engine/render/render_profile.tres"
		ResourceSaver.save(render_profile, profile_path)
		print("RenderProfileManager: Profile saved")

## Performance monitoring

func get_current_fps() -> float:
	return Engine.get_frames_per_second()

func is_meeting_fps_target() -> bool:
	var current_fps = get_current_fps()
	var target_fps = render_profile.target_fps if render_profile else 60
	return current_fps >= target_fps * 0.9  # 90% of target is acceptable

func get_performance_recommendation() -> String:
	if is_meeting_fps_target():
		return "Performance is good"
	else:
		var current_fps = get_current_fps()
		var target_fps = render_profile.target_fps if render_profile else 60
		
		if current_fps < target_fps * 0.5:
			return "Consider lowering quality to LOW preset"
		elif current_fps < target_fps * 0.75:
			return "Consider reducing effects or parallax layers"
		else:
			return "Minor performance concerns"

## Advanced settings

func toggle_feature(feature_name: String, enabled: bool) -> void:
	if not render_profile:
		return
	
	match feature_name:
		"hd_sprites":
			render_profile.enable_hd_sprites = enabled
		"parallax":
			render_profile.enable_parallax = enabled
		"mode7_floor":
			render_profile.enable_mode7_floor = enabled
		"lighting":
			render_profile.enable_normal_lighting = enabled
		"post_processing":
			render_profile.enable_post_processing = enabled
		"bloom":
			render_profile.enable_bloom = enabled
		"dof":
			render_profile.enable_fake_dof = enabled
		"motion_blur":
			render_profile.enable_motion_blur = enabled
		_:
			print("RenderProfileManager: Unknown feature: ", feature_name)

func get_memory_usage_estimate() -> float:
	return render_profile.get_estimated_memory_usage() if render_profile else 0.0

func get_performance_impact() -> String:
	return render_profile.get_performance_impact() if render_profile else "Unknown"