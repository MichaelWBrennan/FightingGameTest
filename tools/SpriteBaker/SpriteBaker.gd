@tool
extends EditorPlugin

## Sprite Baker Editor Plugin
## Atlas packer, normal/spec baker, LUT manager with Light2D preview  
## Production-grade sprite processing for 2D-HD pipeline
## MIT Licensed

const SpriteBakerDock = preload("res://tools/SpriteBaker/SpriteBakerDock.gd")

var dock_instance

func _enter_tree() -> void:
	# Add the SpriteBaker dock to the editor
	dock_instance = SpriteBakerDock.new()
	add_control_to_dock(DOCK_SLOT_LEFT_BL, dock_instance)
	
	# Add menu items
	add_tool_menu_item("Sprite Baker", _open_sprite_baker)
	
	print("SpriteBaker: Plugin enabled")

func _exit_tree() -> void:
	# Remove the dock when disabling the plugin
	if dock_instance:
		remove_control_from_docks(dock_instance)
		dock_instance = null
	
	remove_tool_menu_item("Sprite Baker")
	
	print("SpriteBaker: Plugin disabled")

func _open_sprite_baker() -> void:
	if dock_instance:
		dock_instance.show()
		print("SpriteBaker: Opened from menu")