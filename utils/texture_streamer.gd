extends Node

## Texture Streaming Manager
## Async preload & LRU cache for high-resolution textures
## Production-grade memory management for 2D-HD sprites
## MIT Licensed

class_name TextureStreamer

# === Singleton Instance ===
static var instance: TextureStreamer

# === Cache Management ===
var texture_cache: Dictionary = {}  # path -> Texture2D
var cache_usage: Dictionary = {}    # path -> last_used_time
var cache_size_mb: float = 0.0
var max_cache_size_mb: float = 256.0

# === Async Loading ===
var loading_queue: Array[String] = []
var loading_in_progress: Dictionary = {}  # path -> ResourceLoader thread_id
var preload_distance: float = 2.0  # Load textures N actions ahead

# === Performance Tracking ===
var load_requests_per_second: int = 0
var cache_hit_rate: float = 100.0
var total_requests: int = 0
var cache_hits: int = 0

# === Configuration ===
var enable_async_loading: bool = true
var enable_preloading: bool = true
var enable_compression: bool = true
var compression_quality: float = 0.8

# === Signals ===
signal texture_loaded(path: String, texture: Texture2D)
signal texture_unloaded(path: String)
signal cache_full()

func _ready() -> void:
	instance = self
	_load_configuration()
	_setup_cache()
	
	print("TextureStreamer: Initialized with ", max_cache_size_mb, "MB cache")

func _load_configuration() -> void:
	# Load settings from render profile
	var profile_path = "res://engine/render/render_profile.tres"
	if ResourceLoader.exists(profile_path):
		var render_profile = load(profile_path) as RenderProfile
		if render_profile:
			max_cache_size_mb = render_profile.texture_cache_size_mb
			enable_async_loading = render_profile.enable_async_texture_loading

func _setup_cache() -> void:
	texture_cache.clear()
	cache_usage.clear()
	cache_size_mb = 0.0

# === Primary API ===

## Load texture with caching (main API)
func load_texture(path: String) -> Texture2D:
	total_requests += 1
	
	# Check cache first
	if path in texture_cache:
		cache_hits += 1
		_touch_cache_entry(path)
		return texture_cache[path]
	
	# Load synchronously if not in cache
	return _load_texture_sync(path)

## Async load texture (non-blocking)
func load_texture_async(path: String, callback: Callable = Callable()) -> void:
	if not enable_async_loading:
		var texture = load_texture(path)
		if callback.is_valid():
			callback.call(path, texture)
		return
	
	# Check cache first
	if path in texture_cache:
		_touch_cache_entry(path)
		if callback.is_valid():
			callback.call(path, texture_cache[path])
		return
	
	# Check if already loading
	if path in loading_in_progress:
		return
	
	# Start async load
	_load_texture_async_internal(path, callback)

## Preload textures for upcoming actions
func preload_action_textures(character_id: String, action_queue: Array[String]) -> void:
	if not enable_preloading:
		return
	
	for action in action_queue:
		var texture_paths = _get_action_texture_paths(character_id, action)
		for texture_path in texture_paths:
			if texture_path not in texture_cache and texture_path not in loading_queue:
				loading_queue.append(texture_path)

## Force preload specific path
func preload_texture(path: String) -> void:
	if path not in texture_cache and path not in loading_queue:
		loading_queue.append(path)

# === Internal Implementation ===

func _load_texture_sync(path: String) -> Texture2D:
	if not ResourceLoader.exists(path):
		print("TextureStreamer: Texture not found: ", path)
		return null
	
	var texture = load(path) as Texture2D
	if texture:
		_add_to_cache(path, texture)
		texture_loaded.emit(path, texture)
		return texture
	
	print("TextureStreamer: Failed to load: ", path)
	return null

func _load_texture_async_internal(path: String, callback: Callable) -> void:
	# Use ResourceLoader's threaded loading
	var request_id = ResourceLoader.load_threaded_request(path)
	loading_in_progress[path] = request_id
	
	# Monitor loading in process
	_monitor_async_load(path, callback)

func _monitor_async_load(path: String, callback: Callable) -> void:
	# This would be called periodically to check load status
	var load_timer = Timer.new()
	load_timer.wait_time = 0.1
	load_timer.timeout.connect(_check_async_load_status.bind(path, callback, load_timer))
	add_child(load_timer)
	load_timer.start()

func _check_async_load_status(path: String, callback: Callable, timer: Timer) -> void:
	var status = ResourceLoader.load_threaded_get_status(path)
	
	match status:
		ResourceLoader.THREAD_LOAD_LOADED:
			# Loading complete
			var texture = ResourceLoader.load_threaded_get(path) as Texture2D
			if texture:
				_add_to_cache(path, texture)
				texture_loaded.emit(path, texture)
				if callback.is_valid():
					callback.call(path, texture)
			
			loading_in_progress.erase(path)
			timer.queue_free()
			
		ResourceLoader.THREAD_LOAD_FAILED:
			print("TextureStreamer: Async load failed: ", path)
			loading_in_progress.erase(path)
			timer.queue_free()
			
		ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
			print("TextureStreamer: Invalid resource: ", path)
			loading_in_progress.erase(path)
			timer.queue_free()
		
		_:
			# Still loading, continue monitoring
			pass

# === Cache Management ===

func _add_to_cache(path: String, texture: Texture2D) -> void:
	# Calculate texture size
	var texture_size_mb = _calculate_texture_size_mb(texture)
	
	# Check if we need to free space
	while cache_size_mb + texture_size_mb > max_cache_size_mb and texture_cache.size() > 0:
		_evict_lru_texture()
	
	# Add to cache
	texture_cache[path] = texture
	cache_usage[path] = Time.get_time_dict_from_system()
	cache_size_mb += texture_size_mb
	
	print("TextureStreamer: Cached ", path, " (", "%.1f" % texture_size_mb, "MB)")

func _touch_cache_entry(path: String) -> void:
	cache_usage[path] = Time.get_time_dict_from_system()

func _evict_lru_texture() -> void:
	# Find least recently used texture
	var oldest_path = ""
	var oldest_time = Time.get_time_dict_from_system()
	
	for path in cache_usage:
		var usage_time = cache_usage[path]
		if _time_less_than(usage_time, oldest_time):
			oldest_time = usage_time
			oldest_path = path
	
	if oldest_path != "":
		_remove_from_cache(oldest_path)

func _remove_from_cache(path: String) -> void:
	if path in texture_cache:
		var texture = texture_cache[path]
		var texture_size_mb = _calculate_texture_size_mb(texture)
		
		texture_cache.erase(path)
		cache_usage.erase(path)
		cache_size_mb -= texture_size_mb
		
		texture_unloaded.emit(path)
		print("TextureStreamer: Evicted ", path, " (", "%.1f" % texture_size_mb, "MB)")

func _calculate_texture_size_mb(texture: Texture2D) -> float:
	if not texture:
		return 0.0
	
	var width = texture.get_width()
	var height = texture.get_height()
	var bytes_per_pixel = 4  # Assume RGBA
	
	return (width * height * bytes_per_pixel) / (1024.0 * 1024.0)

func _time_less_than(time1: Dictionary, time2: Dictionary) -> bool:
	# Simple time comparison (could be more robust)
	if time1["second"] != time2["second"]:
		return time1["second"] < time2["second"]
	return time1["microsecond"] < time2["microsecond"]

# === Path Resolution ===

func _get_action_texture_paths(character_id: String, action: String) -> Array[String]:
	var paths: Array[String] = []
	
	# Primary sprite
	var sprite_path = "res://assets/sprites/street_fighter_6/%s/sprites/%s_%s_enhanced.png" % [character_id, character_id, action]
	paths.append(sprite_path)
	
	# Normal map
	var normal_path = sprite_path.replace("_enhanced.png", "_enhanced_normal.png")
	paths.append(normal_path)
	
	# Specular map
	var specular_path = sprite_path.replace("_enhanced.png", "_enhanced_specular.png")
	paths.append(specular_path)
	
	# Atlas version
	var atlas_path = "res://assets/characters/%s/%s_atlas.tres" % [character_id, character_id]
	paths.append(atlas_path)
	
	return paths

# === Background Processing ===

func _process(_delta: float) -> void:
	# Process loading queue
	_process_loading_queue()
	_update_performance_stats()

func _process_loading_queue() -> void:
	if loading_queue.size() == 0:
		return
	
	# Load one texture per frame to avoid frame drops
	var path = loading_queue.pop_front()
	if path not in texture_cache:
		load_texture_async(path)

func _update_performance_stats() -> void:
	# Update cache hit rate
	if total_requests > 0:
		cache_hit_rate = (float(cache_hits) / float(total_requests)) * 100.0

# === Public Utilities ===

## Get cache statistics
func get_cache_stats() -> Dictionary:
	return {
		"cache_size_mb": cache_size_mb,
		"max_cache_size_mb": max_cache_size_mb,
		"cached_textures": texture_cache.size(),
		"cache_hit_rate": cache_hit_rate,
		"loading_queue_size": loading_queue.size(),
		"loading_in_progress": loading_in_progress.size()
	}

## Clear all cache
func clear_cache() -> void:
	texture_cache.clear()
	cache_usage.clear()
	cache_size_mb = 0.0
	loading_queue.clear()
	
	# Cancel in-progress loads
	for path in loading_in_progress:
		ResourceLoader.load_threaded_request(path, "", false)  # Cancel
	loading_in_progress.clear()
	
	print("TextureStreamer: Cache cleared")

## Force garbage collection
func force_gc() -> void:
	clear_cache()
	# Force Godot's garbage collection
	if Engine.has_method("force_gc"):
		Engine.call("force_gc")

## Set cache size limit
func set_cache_size_limit(size_mb: float) -> void:
	max_cache_size_mb = size_mb
	
	# Evict textures if over new limit
	while cache_size_mb > max_cache_size_mb and texture_cache.size() > 0:
		_evict_lru_texture()

## Preload textures for character
func preload_character_textures(character_id: String) -> void:
	var actions = ["idle", "walk", "attack", "jump", "block", "hurt"]
	preload_action_textures(character_id, actions)