# QuestListItem.gd
extends PanelContainer

# 當此項目被點擊時，發出信號，並將完整的任務資料傳遞出去
signal quest_selected(quest_data)

# 請準備三張圖示，並將路徑填寫於此
const MAIN_QUEST_ICON = preload("res://assets/BuyHub.png")
const DAILY_QUEST_ICON = preload("res://assets/BuyHub.png")
const ACHIEVEMENT_ICON = preload("res://assets/BuyHub.png")

@onready var icon = $HBoxContainer/QuestTypeIcon
@onready var title_label = $HBoxContainer/VBoxContainer/TitleLabel
@onready var status_label = $HBoxContainer/VBoxContainer/StatusLabel

var quest_data: Dictionary

func _ready():
	gui_input.connect(_on_gui_input)

func populate(data: Dictionary):
	self.quest_data = data
	title_label.text = quest_data.get("title", "無標題")
	
	# 根據任務類型設定圖示
	match quest_data.get("questType"):
		"MAIN":
			icon.texture = MAIN_QUEST_ICON
		"DAILY":
			icon.texture = DAILY_QUEST_ICON
		"ACHIEVEMENT":
			icon.texture = ACHIEVEMENT_ICON
	
	# 根據狀態設定文字和顏色
	var status = quest_data.get("status", "UNKNOWN")
	status_label.text = "狀態: " + status
	match status:
		"IN_PROGRESS":
			status_label.modulate = Color.WHITE # 進行中：白色
		"COMPLETED": # 假設有這個狀態
			status_label.modulate = Color.GREEN # 已完成：綠色

# 處理點擊，發送信號
func _on_gui_input(event):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		emit_signal("quest_selected", quest_data)

# 提供一個外部方法來設定選中時的視覺效果
func set_selected(is_selected: bool):
	if is_selected:
		# 這裡可以修改 StyleBox，讓被選中的項目有高亮邊框或不同背景色
		# 例如: self.add_theme_stylebox_override("panel", YOUR_SELECTED_STYLEBOX)
		modulate = Color(1.2, 1.2, 1.2) # 簡單地變亮
	else:
		# self.remove_theme_stylebox_override("panel")
		modulate = Color.WHITE
