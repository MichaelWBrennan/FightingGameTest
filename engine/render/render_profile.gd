extends Resource

## Advanced 2D-HD Rendering Profile for Godot 4
## Controls quality settings, performance targets, and visual fidelity
## MIT Licensed - Production ready

class_name RenderProfile

## Quality presets for different hardware targets
enum QualityLevel {
	LOW,    ## 30 FPS target, basic effects
	MED,    ## 60 FPS target, moderate effects  
	HIGH,   ## 90 FPS target, advanced effects
	ULTRA   ## 120+ FPS target, maximum fidelity
}

## Current quality level
@export var quality_level: QualityLevel = QualityLevel.MED

## === 2D-HD Sprite Settings ===
@export_group("2D-HD Sprites")

## Enable high-resolution sprite pipeline
@export var enable_hd_sprites: bool = true

## Maximum texture resolution per sprite frame (pixels)
@export var max_sprite_resolution: int = 2048

## Enable texture atlasing for better performance
@export var enable_texture_atlasing: bool = true

## Enable runtime palette/LUT swapping
@export var enable_palette_swapping: bool = true

## Enable normal/specular map support
@export var enable_normal_maps: bool = true

## Sprite filtering mode (0=Nearest, 1=Linear, 2=Anisotropic)
@export var sprite_filter_mode: int = 2

## Enable sub-pixel rendering to reduce shimmer
@export var enable_subpixel_rendering: bool = true

## === Pseudo-3D Stage Settings ===
@export_group("Pseudo-3D Stage")

## Enable parallax background layers
@export var enable_parallax: bool = true

## Number of parallax layers (4-7 recommended)
@export var parallax_layers: int = 6

## Enable Mode-7 style floor rendering
@export var enable_mode7_floor: bool = true

## Floor perspective strength (0.0-2.0)
@export var floor_perspective_strength: float = 1.0

## Enable projected blob shadows
@export var enable_projected_shadows: bool = true

## Shadow quality (0=Off, 1=Low, 2=Med, 3=High)
@export var shadow_quality: int = 2

## Enable billboarded props with depth scaling
@export var enable_billboard_props: bool = true

## Maximum billboard props per scene
@export var max_billboard_props: int = 32

## === Lighting Settings ===
@export_group("Lighting")

## Enable 2D normal-mapped lighting
@export var enable_normal_lighting: bool = true

## Maximum Light2D nodes per scene
@export var max_light_nodes: int = 8

## Light shadow resolution
@export var light_shadow_resolution: int = 1024

## Enable rim lighting effects
@export var enable_rim_lighting: bool = true

## Rim light intensity (0.0-2.0)
@export var rim_light_intensity: float = 1.0

## === Post-Processing Settings ===
@export_group("Post-Processing")

## Enable screen-space post-processing
@export var enable_post_processing: bool = true

## Enable bloom effect
@export var enable_bloom: bool = true

## Bloom intensity (0.0-2.0) 
@export var bloom_intensity: float = 0.8

## Enable vignette effect
@export var enable_vignette: bool = true

## Vignette strength (0.0-1.0)
@export var vignette_strength: float = 0.3

## Enable film grain
@export var enable_film_grain: bool = true

## Film grain intensity (0.0-1.0)
@export var film_grain_intensity: float = 0.1

## Enable color grading via 3D LUT
@export var enable_color_grading: bool = true

## Enable fake depth of field
@export var enable_fake_dof: bool = false

## DOF blur radius (pixels)
@export var dof_blur_radius: float = 2.0

## Enable motion blur
@export var enable_motion_blur: bool = false

## Motion blur strength (0.0-1.0)
@export var motion_blur_strength: float = 0.2

## === Performance Settings ===
@export_group("Performance")

## Target FPS for dynamic LOD system
@export var target_fps: int = 60

## Enable texture streaming
@export var enable_texture_streaming: bool = true

## Texture cache size (MB)
@export var texture_cache_size_mb: int = 256

## Enable automatic LOD system
@export var enable_auto_lod: bool = true

## Distance threshold for LOD switching
@export var lod_distance_threshold: float = 500.0

## Maximum draw calls per frame
@export var max_draw_calls: int = 2000

## Enable GPU particle culling
@export var enable_particle_culling: bool = true

## Maximum particles per emitter
@export var max_particles_per_emitter: int = 1000

## === Camera Settings ===
@export_group("Camera")

## Enable camera tilt/lean effects
@export var enable_camera_tilt: bool = true

## Maximum camera tilt angle (degrees)
@export var max_camera_tilt: float = 15.0

## Enable smart zoom for framing players
@export var enable_smart_zoom: bool = true

## Minimum zoom level
@export var min_zoom_level: float = 0.5

## Maximum zoom level  
@export var max_zoom_level: float = 2.0

## Enable screenshake effects
@export var enable_screenshake: bool = true

## Screenshake intensity multiplier
@export var screenshake_intensity: float = 1.0

## Enable perspective character scaling
@export var enable_perspective_scaling: bool = true

## Character scale range based on Y position
@export var character_scale_range: Vector2 = Vector2(0.8, 1.2)

## === Advanced Settings ===
@export_group("Advanced")

## Enable deterministic rendering for replays
@export var enable_deterministic_rendering: bool = true

## Random seed for deterministic effects
@export var deterministic_seed: int = 12345

## Enable async texture loading
@export var enable_async_texture_loading: bool = true

## Frame cache LRU size
@export var frame_cache_lru_size: int = 512

## Enable shader compilation caching
@export var enable_shader_caching: bool = true

## Mipmap bias for distance textures
@export var mipmap_bias: float = 0.0

## Apply quality preset settings
func apply_quality_preset(level: QualityLevel) -> void:
	quality_level = level
	
	match level:
		QualityLevel.LOW:
			_apply_low_quality()
		QualityLevel.MED:
			_apply_medium_quality()
		QualityLevel.HIGH:
			_apply_high_quality()  
		QualityLevel.ULTRA:
			_apply_ultra_quality()
	
	print("RenderProfile: Applied ", QualityLevel.keys()[level], " quality preset")

func _apply_low_quality() -> void:
	target_fps = 30
	max_sprite_resolution = 1024
	parallax_layers = 4
	shadow_quality = 1
	max_light_nodes = 4
	light_shadow_resolution = 512
	enable_bloom = false
	enable_vignette = false
	enable_film_grain = false
	enable_fake_dof = false
	enable_motion_blur = false
	texture_cache_size_mb = 128
	max_particles_per_emitter = 500
	sprite_filter_mode = 0  # Nearest

func _apply_medium_quality() -> void:
	target_fps = 60
	max_sprite_resolution = 2048
	parallax_layers = 6
	shadow_quality = 2
	max_light_nodes = 6
	light_shadow_resolution = 1024
	enable_bloom = true
	bloom_intensity = 0.6
	enable_vignette = true
	vignette_strength = 0.2
	enable_film_grain = false
	enable_fake_dof = false
	enable_motion_blur = false
	texture_cache_size_mb = 256
	max_particles_per_emitter = 750
	sprite_filter_mode = 1  # Linear

func _apply_high_quality() -> void:
	target_fps = 90
	max_sprite_resolution = 4096
	parallax_layers = 7
	shadow_quality = 3
	max_light_nodes = 8
	light_shadow_resolution = 2048
	enable_bloom = true
	bloom_intensity = 0.8
	enable_vignette = true
	vignette_strength = 0.3
	enable_film_grain = true
	film_grain_intensity = 0.05
	enable_fake_dof = true
	dof_blur_radius = 1.5
	enable_motion_blur = false
	texture_cache_size_mb = 512
	max_particles_per_emitter = 1000
	sprite_filter_mode = 2  # Anisotropic

func _apply_ultra_quality() -> void:
	target_fps = 120
	max_sprite_resolution = 4096
	parallax_layers = 7
	shadow_quality = 3
	max_light_nodes = 12
	light_shadow_resolution = 4096
	enable_bloom = true
	bloom_intensity = 1.0
	enable_vignette = true
	vignette_strength = 0.4
	enable_film_grain = true
	film_grain_intensity = 0.1
	enable_fake_dof = true
	dof_blur_radius = 2.0
	enable_motion_blur = true
	motion_blur_strength = 0.2
	texture_cache_size_mb = 1024
	max_particles_per_emitter = 1500
	sprite_filter_mode = 2  # Anisotropic

## Get quality level from string (for CLI)
static func quality_from_string(quality_str: String) -> QualityLevel:
	match quality_str.to_upper():
		"LOW":
			return QualityLevel.LOW
		"MED", "MEDIUM":
			return QualityLevel.MED
		"HIGH":
			return QualityLevel.HIGH
		"ULTRA":
			return QualityLevel.ULTRA
		_:
			print("RenderProfile: Unknown quality level '", quality_str, "', defaulting to MED")
			return QualityLevel.MED

## Validate settings are within acceptable ranges
func validate_settings() -> bool:
	var valid = true
	
	if max_sprite_resolution < 256 or max_sprite_resolution > 8192:
		print("RenderProfile: WARNING - max_sprite_resolution out of range (256-8192)")
		valid = false
		
	if parallax_layers < 1 or parallax_layers > 10:
		print("RenderProfile: WARNING - parallax_layers out of range (1-10)")
		valid = false
		
	if target_fps < 15 or target_fps > 240:
		print("RenderProfile: WARNING - target_fps out of range (15-240)")
		valid = false
		
	if texture_cache_size_mb < 32 or texture_cache_size_mb > 2048:
		print("RenderProfile: WARNING - texture_cache_size_mb out of range (32-2048)")
		valid = false
	
	return valid

## Get memory usage estimate in MB
func get_estimated_memory_usage() -> float:
	var base_memory = 64.0  # Base system overhead
	var sprite_memory = (max_sprite_resolution * max_sprite_resolution * 4) / (1024.0 * 1024.0)  # RGBA
	var cache_memory = texture_cache_size_mb
	var shadow_memory = (light_shadow_resolution * light_shadow_resolution * 4 * max_light_nodes) / (1024.0 * 1024.0)
	
	return base_memory + sprite_memory + cache_memory + shadow_memory

## Performance impact assessment
func get_performance_impact() -> String:
	var impact_score = 0
	
	if enable_hd_sprites: impact_score += 2
	if enable_normal_maps: impact_score += 1
	if enable_parallax: impact_score += parallax_layers
	if enable_mode7_floor: impact_score += 3
	if enable_projected_shadows: impact_score += shadow_quality
	if enable_post_processing: impact_score += 2
	if enable_bloom: impact_score += 1
	if enable_fake_dof: impact_score += 2
	if enable_motion_blur: impact_score += 3
	
	if impact_score <= 5:
		return "Low"
	elif impact_score <= 15:
		return "Medium"
	elif impact_score <= 25:
		return "High"
	else:
		return "Very High"