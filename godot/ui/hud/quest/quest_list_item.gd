# QuestListItem.gd
# 控制單一任務項目的顯示
extends PanelContainer

signal item_selected(quest_data: Dictionary)

# --- 節點引用 ---
@onready var title_label = $HBoxContainer/TitleLabel
@onready var status_label = $HBoxContainer/StatusLabel
@onready var quest_type_icon = $HBoxContainer/QuestTypeIcon

# --- 狀態變數 ---
var quest_data: Dictionary

# --- 核心函式 ---
func _gui_input(event: InputEvent):
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.is_pressed():
		emit_signal("item_selected", quest_data)

# 接收來自 QuestModal 的資料，並更新自身UI
func populate(data: Dictionary):
	self.quest_data = data
	
	# --- 更新基本資訊 ---
	# 使用 .get() 方法可以避免因缺少鍵值而導致的錯誤
	title_label.text = quest_data.get("title", "無標題任務")
	
	# --- 根據狀態更新狀態文字與顏色 ---
	var status = quest_data.get("status", "UNKNOWN")
	match status:
		"IN_PROGRESS":
			status_label.text = "進行中"
			# 可以為不同狀態設定不同顏色以增強使用者體驗
			status_label.modulate = Color.WHITE 
		"COMPLETED":
			status_label.text = "已完成"
			status_label.modulate = Color.GREEN
		"REWARD_CLAIMED":
			status_label.text = "已領取"
			status_label.modulate = Color.GRAY
		_:
			status_label.text = "未知狀態"
			status_label.modulate = Color.WHITE

	# --- 更新任務類型圖示 (可選) ---
	# 這裡你可以根據任務類型來顯示不同的圖示
	var quest_type = quest_data.get("type", "")
	if not quest_type.is_empty():
		# 例如：var icon = load("res://assets/icons/" + quest_type + ".png")
		# quest_type_icon.texture = icon
		# quest_type_icon.show()
		pass # 暫時不處理，你可以之後擴充
	else:
		quest_type_icon.hide()
