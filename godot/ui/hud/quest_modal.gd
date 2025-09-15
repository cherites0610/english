# QuestModal.gd
extends ColorRect

const QuestListItemScene = preload("res://ui/hud/quest_list_item.tscn")

# --- 節點引用 ---
@onready var http_request = $HTTPRequest
@onready var tab_container = $WindowPanel/VBoxContainer/MainHBox/LeftPanel/TabContainer
@onready var regular_quest_list = $WindowPanel/VBoxContainer/MainHBox/LeftPanel/TabContainer/任務/RegularQuestList
@onready var achievement_quest_list = $WindowPanel/VBoxContainer/MainHBox/LeftPanel/TabContainer/成就/AchievementQuestList
@onready var quest_details_panel = $WindowPanel/VBoxContainer/MainHBox/RightPanel/QuestDetails

# 右側詳情面板的元件
@onready var detail_title = quest_details_panel.get_node("DetailTitle")
@onready var detail_description = quest_details_panel.get_node("DetailDescription")
@onready var objectives_container = quest_details_panel.get_node("ObjectivesContainer")
@onready var rewards_container = quest_details_panel.get_node("RewardsContainer")

# --- 狀態管理 ---
var regular_quests_cache = null
var achievement_quests_cache = null
var current_selected_item = null
var request_type = ""

func _ready():
	$WindowPanel/VBoxContainer/TitleBar/CloseButton.pressed.connect(queue_free)
	http_request.request_completed.connect(_on_request_completed)
	tab_container.tab_changed.connect(_on_tab_changed)
	
	quest_details_panel.hide() # 預設隱藏詳情面板
	_on_tab_changed(tab_container.current_tab) # 啟動時手動觸發一次，以載入預設 Tab

# --- 核心邏輯 ---

func _on_tab_changed(tab_index: int):
	# 清空詳情面板和選中狀態
	quest_details_panel.hide()
	if is_instance_valid(current_selected_item):
		current_selected_item.set_selected(false)
		current_selected_item = null

	# 根據 Tab 檢查快取或發送請求
	match tab_index:
		0: # 任務 Tab
			if regular_quests_cache == null:
				_fetch_quests("REGULAR")
			else:
				_populate_quest_list(regular_quests_cache, regular_quest_list)
		1: # 成就 Tab
			if achievement_quests_cache == null:
				_fetch_quests("ACHIEVEMENT")
			else:
				_populate_quest_list(achievement_quests_cache, achievement_quest_list)

func _fetch_quests(view_type: String):
	request_type = view_type
	var url = GlobalState.BASE_URL + "/quest?viewType=" + view_type
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		push_error("Modal: Missing auth token.")
		return

	var headers_array = PackedStringArray()
	for key in headers_dict:
		headers_array.append(key + ": " + headers_dict[key])
	http_request.request(url, headers_array, HTTPClient.METHOD_GET, "") # 使用 view_type 作為標籤

func _on_request_completed(result, response_code, headers, body):
	if result != HTTPRequest.RESULT_SUCCESS or response_code >= 400: return

	var json = JSON.new()
	json.parse(body.get_string_from_utf8())
	var response = json.get_data()
	if response and response.has("data"):
		var quest_data_array = response["data"]
		if request_type == "REGULAR":
			regular_quests_cache = quest_data_array
			_populate_quest_list(regular_quests_cache, regular_quest_list)
		elif request_type == "ACHIEVEMENT":
			achievement_quests_cache = quest_data_array
			_populate_quest_list(achievement_quests_cache, achievement_quest_list)

# --- UI 生成與更新 ---

func _populate_quest_list(data_array: Array, list_container: VBoxContainer):
	# 清空舊列表
	for child in list_container.get_children():
		child.queue_free()
	
	# 生成新列表
	for quest_data in data_array:
		var item = QuestListItemScene.instantiate()
		print("123",quest_data)
		list_container.add_child(item)
		item.populate(quest_data)
		item.quest_selected.connect(_on_quest_item_selected)

func _on_quest_item_selected(quest_data: Dictionary):
	# 更新列表項的選中視覺效果
	if is_instance_valid(current_selected_item):
		current_selected_item.set_selected(false)
	
	var list_container = regular_quest_list if tab_container.current_tab == 0 else achievement_quest_list
	for item in list_container.get_children():
		if item.quest_data["logId"] == quest_data["logId"]:
			current_selected_item = item
			item.set_selected(true)
			break
			
	# 在右側面板顯示選中任務的詳情
	_display_quest_details(quest_data)

func _display_quest_details(quest_data: Dictionary):
	quest_details_panel.show()
	detail_title.text = quest_data.get("title", "")
	detail_description.text = quest_data.get("description", "")
	
	# --- 動態生成目標列表 ---
	for child in objectives_container.get_children():
		child.queue_free()
	var requirements = quest_data.get("requirements", [])
	for req in requirements:
		var progress = "%d / %d" % [req.get("currentCount", 0), req.get("targetCount", 1)]
		var objective_label = Label.new()
		# 這裡可以替換成一個更複雜的 ObjectiveItem 場景
		objective_label.text = "- %s  %s" % [req.get("type", "未知目標"), progress]
		objectives_container.add_child(objective_label)

	# --- 動態生成獎勵列表 ---
	for child in rewards_container.get_children():
		child.queue_free()
	var rewards = quest_data.get("rewards", [])
	for rew in rewards:
		var reward_label = Label.new()
		# 這裡可以替換成一個更複雜的 RewardItem 場景
		reward_label.text = "%s x %d" % [rew.get("type", "未知獎勵"), rew.get("count", 0)]
		rewards_container.add_child(reward_label)
