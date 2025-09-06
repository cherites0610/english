extends PanelContainer

@onready var name_label = $HBoxContainer/NameLabel
@onready var level_label = $HBoxContainer/LevelLabel

func _ready() -> void:
	GlobalState.profile_updated.connect(update_display)
	
	update_display()
	
func update_display():
	# 從 GlobalState 讀取資料並更新 Label
	if not GlobalState.user_profile.is_empty():
		name_label.text = "玩家: " + GlobalState.user_profile.get("name", "N/A")
		level_label.text = "等級: " + str(GlobalState.user_profile.get("userLevel", 0))
	else:
		name_label.text = "玩家: 載入中..."
		level_label.text = "等級: ..."
