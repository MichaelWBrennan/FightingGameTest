extends Skeleton2D

## Character Rig 2D System
## Bone2D hierarchy for sub-sprite articulation
## Production-grade skeletal animation for 2D fighting games
## MIT Licensed

class_name CharacterRig2D

# === Bone References ===
@onready var root_bone: Bone2D
@onready var hips_bone: Bone2D
@onready var torso_bone: Bone2D
@onready var head_bone: Bone2D

# Arms
@onready var left_upper_arm: Bone2D
@onready var left_lower_arm: Bone2D
@onready var left_hand: Bone2D
@onready var right_upper_arm: Bone2D
@onready var right_lower_arm: Bone2D
@onready var right_hand: Bone2D

# Legs  
@onready var left_upper_leg: Bone2D
@onready var left_lower_leg: Bone2D
@onready var left_foot: Bone2D
@onready var right_upper_leg: Bone2D
@onready var right_lower_leg: Bone2D
@onready var right_foot: Bone2D

# === Sprite Attachments ===
var bone_sprites: Dictionary = {}  # Bone -> Sprite2D mapping
var retarget_map: Dictionary = {}  # Animation retargeting

# === Animation State ===
var current_pose: String = "idle"
var animation_speed: float = 1.0
var blend_factor: float = 0.0

# === IK Constraints (optional) ===
var enable_ik: bool = false
var ik_targets: Dictionary = {}

# === Performance ===
var update_frequency: int = 60  # Updates per second
var last_update_time: float = 0.0

signal pose_changed(pose_name: String)
signal bone_transform_updated(bone_name: String, transform: Transform2D)

func _ready() -> void:
	_setup_bone_hierarchy()
	_setup_sprite_attachments()
	_setup_retarget_map()
	_load_default_pose()
	
	print("CharacterRig2D: Initialized with ", get_bone_count(), " bones")

func _setup_bone_hierarchy() -> void:
	# Create bone hierarchy if not already created
	if get_bone_count() == 0:
		_create_standard_skeleton()
	
	# Get bone references
	_cache_bone_references()

func _create_standard_skeleton() -> void:
	# Root bone (main transform)
	root_bone = Bone2D.new()
	root_bone.name = "Root"
	root_bone.position = Vector2.ZERO
	add_child(root_bone)
	
	# Hips (center of mass)
	hips_bone = Bone2D.new()
	hips_bone.name = "Hips"
	hips_bone.position = Vector2(0, 20)
	root_bone.add_child(hips_bone)
	
	# Torso
	torso_bone = Bone2D.new()
	torso_bone.name = "Torso"
	torso_bone.position = Vector2(0, -40)
	hips_bone.add_child(torso_bone)
	
	# Head
	head_bone = Bone2D.new()
	head_bone.name = "Head"
	head_bone.position = Vector2(0, -30)
	torso_bone.add_child(head_bone)
	
	# Left Arm Chain
	left_upper_arm = Bone2D.new()
	left_upper_arm.name = "LeftUpperArm"
	left_upper_arm.position = Vector2(-20, -20)
	torso_bone.add_child(left_upper_arm)
	
	left_lower_arm = Bone2D.new()
	left_lower_arm.name = "LeftLowerArm"
	left_lower_arm.position = Vector2(-25, 0)
	left_upper_arm.add_child(left_lower_arm)
	
	left_hand = Bone2D.new()
	left_hand.name = "LeftHand"
	left_hand.position = Vector2(-20, 0)
	left_lower_arm.add_child(left_hand)
	
	# Right Arm Chain (mirrored)
	right_upper_arm = Bone2D.new()
	right_upper_arm.name = "RightUpperArm"
	right_upper_arm.position = Vector2(20, -20)
	torso_bone.add_child(right_upper_arm)
	
	right_lower_arm = Bone2D.new()
	right_lower_arm.name = "RightLowerArm"
	right_lower_arm.position = Vector2(25, 0)
	right_upper_arm.add_child(right_lower_arm)
	
	right_hand = Bone2D.new()
	right_hand.name = "RightHand"
	right_hand.position = Vector2(20, 0)
	right_lower_arm.add_child(right_hand)
	
	# Left Leg Chain
	left_upper_leg = Bone2D.new()
	left_upper_leg.name = "LeftUpperLeg"
	left_upper_leg.position = Vector2(-12, 0)
	hips_bone.add_child(left_upper_leg)
	
	left_lower_leg = Bone2D.new()
	left_lower_leg.name = "LeftLowerLeg"
	left_lower_leg.position = Vector2(0, 35)
	left_upper_leg.add_child(left_lower_leg)
	
	left_foot = Bone2D.new()
	left_foot.name = "LeftFoot"
	left_foot.position = Vector2(0, 25)
	left_lower_leg.add_child(left_foot)
	
	# Right Leg Chain
	right_upper_leg = Bone2D.new()
	right_upper_leg.name = "RightUpperLeg"
	right_upper_leg.position = Vector2(12, 0)
	hips_bone.add_child(right_upper_leg)
	
	right_lower_leg = Bone2D.new()
	right_lower_leg.name = "RightLowerLeg"
	right_lower_leg.position = Vector2(0, 35)
	right_upper_leg.add_child(right_lower_leg)
	
	right_foot = Bone2D.new()
	right_foot.name = "RightFoot"
	right_foot.position = Vector2(0, 25)
	right_lower_leg.add_child(right_foot)

func _cache_bone_references() -> void:
	# Cache all bone references for performance
	root_bone = find_child("Root")
	hips_bone = find_child("Hips")
	torso_bone = find_child("Torso")
	head_bone = find_child("Head")
	
	left_upper_arm = find_child("LeftUpperArm")
	left_lower_arm = find_child("LeftLowerArm")
	left_hand = find_child("LeftHand")
	right_upper_arm = find_child("RightUpperArm")
	right_lower_arm = find_child("RightLowerArm")
	right_hand = find_child("RightHand")
	
	left_upper_leg = find_child("LeftUpperLeg")
	left_lower_leg = find_child("LeftLowerLeg")
	left_foot = find_child("LeftFoot")
	right_upper_leg = find_child("RightUpperLeg")
	right_lower_leg = find_child("RightLowerLeg")
	right_foot = find_child("RightFoot")

func _setup_sprite_attachments() -> void:
	# Attach sprites to bones for rendering
	var sprite_assignments = {
		"Head": "head",
		"Torso": "torso", 
		"LeftUpperArm": "left_upper_arm",
		"LeftLowerArm": "left_lower_arm",
		"LeftHand": "left_hand",
		"RightUpperArm": "right_upper_arm",
		"RightLowerArm": "right_lower_arm", 
		"RightHand": "right_hand",
		"LeftUpperLeg": "left_upper_leg",
		"LeftLowerLeg": "left_lower_leg",
		"LeftFoot": "left_foot",
		"RightUpperLeg": "right_upper_leg",
		"RightLowerLeg": "right_lower_leg",
		"RightFoot": "right_foot"
	}
	
	for bone_name in sprite_assignments:
		var bone = find_child(bone_name)
		if bone:
			var sprite = Sprite2D.new()
			sprite.name = bone_name + "_Sprite"
			bone.add_child(sprite)
			bone_sprites[bone] = sprite

func _setup_retarget_map() -> void:
	# Standard retargeting for common fighting game poses
	retarget_map = {
		"idle": {
			"Root": {"position": Vector2.ZERO, "rotation": 0.0},
			"Hips": {"position": Vector2(0, 20), "rotation": 0.0},
			"Torso": {"position": Vector2(0, -40), "rotation": deg_to_rad(-5)},  # Slight lean
			"Head": {"position": Vector2(0, -30), "rotation": 0.0},
			"LeftUpperArm": {"rotation": deg_to_rad(15)},  # Guard position
			"RightUpperArm": {"rotation": deg_to_rad(-15)},
			"LeftUpperLeg": {"rotation": deg_to_rad(5)},   # Stable stance
			"RightUpperLeg": {"rotation": deg_to_rad(-5)}
		},
		"walk": {
			"Root": {"position": Vector2.ZERO, "rotation": 0.0},
			"Hips": {"position": Vector2(0, 18), "rotation": deg_to_rad(3)},  # Slight bob
			"Torso": {"position": Vector2(0, -38), "rotation": deg_to_rad(-2)},
			"Head": {"position": Vector2(0, -30), "rotation": 0.0},
			"LeftUpperArm": {"rotation": deg_to_rad(30)},   # Walking motion
			"RightUpperArm": {"rotation": deg_to_rad(-30)},
			"LeftUpperLeg": {"rotation": deg_to_rad(20)},   # Step forward
			"RightUpperLeg": {"rotation": deg_to_rad(-10)}
		},
		"punch": {
			"Root": {"position": Vector2.ZERO, "rotation": 0.0},
			"Hips": {"position": Vector2(5, 15), "rotation": deg_to_rad(10)},  # Power from hips
			"Torso": {"position": Vector2(0, -35), "rotation": deg_to_rad(15)}, # Twist for power
			"Head": {"position": Vector2(0, -25), "rotation": deg_to_rad(5)},
			"LeftUpperArm": {"rotation": deg_to_rad(45)},   # Guard up
			"RightUpperArm": {"rotation": deg_to_rad(-90)}, # Punch extended
			"RightLowerArm": {"rotation": deg_to_rad(-30)}, # Full extension
			"LeftUpperLeg": {"rotation": deg_to_rad(10)},   # Planted
			"RightUpperLeg": {"rotation": deg_to_rad(-5)}   # Push forward
		}
	}

# === Animation API ===

## Set pose by name with optional blending
func set_pose(pose_name: String, blend_time: float = 0.0) -> void:
	if pose_name == current_pose:
		return
		
	if pose_name in retarget_map:
		if blend_time > 0.0:
			_blend_to_pose(pose_name, blend_time)
		else:
			_apply_pose_immediate(pose_name)
		
		current_pose = pose_name
		pose_changed.emit(pose_name)
	else:
		print("CharacterRig2D: Unknown pose: ", pose_name)

func _apply_pose_immediate(pose_name: String) -> void:
	var pose_data = retarget_map[pose_name]
	
	for bone_name in pose_data:
		var bone = find_child(bone_name)
		if bone and bone is Bone2D:
			var bone_2d = bone as Bone2D
			var transform_data = pose_data[bone_name]
			
			if "position" in transform_data:
				bone_2d.position = transform_data["position"]
			if "rotation" in transform_data:
				bone_2d.rotation = transform_data["rotation"]
			if "scale" in transform_data:
				bone_2d.scale = transform_data["scale"]
			
			bone_transform_updated.emit(bone_name, bone_2d.transform)

func _blend_to_pose(pose_name: String, blend_time: float) -> void:
	# Create a tween for smooth pose transitions
	var tween = create_tween()
	tween.set_parallel(true)  # Allow multiple bone animations
	
	var pose_data = retarget_map[pose_name]
	
	for bone_name in pose_data:
		var bone = find_child(bone_name)
		if bone and bone is Bone2D:
			var bone_2d = bone as Bone2D
			var transform_data = pose_data[bone_name]
			
			if "position" in transform_data:
				tween.tween_property(bone_2d, "position", transform_data["position"], blend_time)
			if "rotation" in transform_data:
				tween.tween_property(bone_2d, "rotation", transform_data["rotation"], blend_time)
			if "scale" in transform_data:
				tween.tween_property(bone_2d, "scale", transform_data["scale"], blend_time)

## Sample idle animation with breathing
func play_idle_animation() -> void:
	var tween = create_tween()
	tween.set_loops()  # Infinite loop
	
	# Subtle breathing animation
	if torso_bone:
		tween.tween_property(torso_bone, "scale", Vector2(1.02, 0.98), 2.0)
		tween.tween_property(torso_bone, "scale", Vector2.ONE, 2.0)

## Sample walk animation cycle  
func play_walk_animation() -> void:
	var tween = create_tween()
	tween.set_loops()
	
	# Simple walk cycle (placeholder for full animation system)
	if hips_bone:
		tween.tween_property(hips_bone, "position", Vector2(0, 18), 0.4)
		tween.tween_property(hips_bone, "position", Vector2(0, 22), 0.4)

## Sample punch animation
func play_punch_animation() -> void:
	var tween = create_tween()
	
	# Quick punch motion
	if right_upper_arm and right_lower_arm:
		# Wind up
		tween.tween_property(right_upper_arm, "rotation", deg_to_rad(-45), 0.1)
		# Punch out
		tween.tween_property(right_upper_arm, "rotation", deg_to_rad(-90), 0.15)
		tween.parallel().tween_property(right_lower_arm, "rotation", deg_to_rad(-30), 0.15)
		# Return
		tween.tween_property(right_upper_arm, "rotation", deg_to_rad(15), 0.3)
		tween.parallel().tween_property(right_lower_arm, "rotation", 0.0, 0.3)

# === Bone Management ===

## Get bone by name (with caching)
func get_bone_by_name(bone_name: String) -> Bone2D:
	return find_child(bone_name) as Bone2D

## Set bone transform
func set_bone_transform(bone_name: String, transform: Transform2D) -> void:
	var bone = get_bone_by_name(bone_name)
	if bone:
		bone.transform = transform
		bone_transform_updated.emit(bone_name, transform)

## Get bone world position
func get_bone_world_position(bone_name: String) -> Vector2:
	var bone = get_bone_by_name(bone_name)
	if bone:
		return bone.global_position
	return Vector2.ZERO

# === Sprite Attachment System ===

## Attach sprite to bone
func attach_sprite_to_bone(bone_name: String, texture: Texture2D, offset: Vector2 = Vector2.ZERO) -> Sprite2D:
	var bone = get_bone_by_name(bone_name)
	if not bone:
		print("CharacterRig2D: Bone not found: ", bone_name)
		return null
	
	var sprite = Sprite2D.new()
	sprite.texture = texture
	sprite.position = offset
	sprite.name = bone_name + "_Sprite"
	bone.add_child(sprite)
	
	bone_sprites[bone] = sprite
	return sprite

## Update sprite texture for bone
func update_bone_sprite(bone_name: String, texture: Texture2D) -> void:
	var bone = get_bone_by_name(bone_name)
	if bone and bone in bone_sprites:
		bone_sprites[bone].texture = texture

# === Animation Retargeting ===

## Load pose from animation data
func load_pose_from_data(pose_data: Dictionary) -> void:
	for bone_name in pose_data:
		var bone = get_bone_by_name(bone_name)
		if bone:
			var data = pose_data[bone_name]
			
			if "pos" in data:
				bone.position = Vector2(data["pos"][0], data["pos"][1])
			if "rot" in data:
				bone.rotation = data["rot"]
			if "scale" in data:
				bone.scale = Vector2(data["scale"][0], data["scale"][1])

## Export current pose as data
func export_current_pose() -> Dictionary:
	var pose_data = {}
	
	for bone_name in ["Root", "Hips", "Torso", "Head", "LeftUpperArm", "LeftLowerArm", 
					  "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand",
					  "LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "RightUpperLeg", 
					  "RightLowerLeg", "RightFoot"]:
		var bone = get_bone_by_name(bone_name)
		if bone:
			pose_data[bone_name] = {
				"pos": [bone.position.x, bone.position.y],
				"rot": bone.rotation,
				"scale": [bone.scale.x, bone.scale.y]
			}
	
	return pose_data

# === Performance Optimization ===

func _process(delta: float) -> void:
	# Throttle updates for performance
	var current_time = Time.get_time_dict_from_system()
	var time_elapsed = current_time["second"] + current_time["microsecond"] / 1000000.0
	
	if time_elapsed - last_update_time < (1.0 / update_frequency):
		return
		
	last_update_time = time_elapsed
	
	# Update bone transforms if needed
	_update_bone_transforms()

func _update_bone_transforms() -> void:
	# This would contain real-time bone updates
	# For now, just ensure bone references are valid
	pass

func _load_default_pose() -> void:
	set_pose("idle")

# === Utility Functions ===

## Get all bone names
func get_bone_names() -> Array[String]:
	var names: Array[String] = []
	_collect_bone_names(self, names)
	return names

func _collect_bone_names(node: Node, names: Array[String]) -> void:
	if node is Bone2D:
		names.append(node.name)
	
	for child in node.get_children():
		_collect_bone_names(child, names)

## Reset to default pose
func reset_to_default() -> void:
	_load_default_pose()

## Get performance stats
func get_performance_stats() -> Dictionary:
	return {
		"bone_count": get_bone_count(),
		"sprite_count": bone_sprites.size(),
		"update_frequency": update_frequency,
		"current_pose": current_pose
	}