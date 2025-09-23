# QuestModal.gd
# (版本 2: 頁面切換模式)
extends ColorRect

# --- 常數與預載入 ---
const QuestListItemScene = preload("res://ui/hud/quest/quest_list_item.tscn")
const BTN_UNSELECTED = preload("res://assets/modalimage/unselect.png")
const BTN_SELECTED = preload("res://assets/modalimage/select.png")

# --- 節點引用 ---
# ... (舊的引用)
@onready var http_request = $HTTPRequest
@onready var close_button = $TextureRect/CloseButton2
@onready var title_label = $TextureRect/title

# 頁面容器
@onready var list_page = $TextureRect/ListPage
@onready var details_page = $TextureRect/DetailsPage
@onready var daily_task_page = $TextureRect/ListPage/DailyTaskPage
@onready var achievement_page = $TextureRect/ListPage/AchievementPage
@onready var daily_quest_list = $TextureRect/ListPage/DailyTaskPage/QuestList
@onready var achievement_quest_list = $TextureRect/ListPage/AchievementPage/QuestList

# 頁籤按鈕
@onready var daily_task_button = $TextureRect/ListPage/TabButtons/DailyTaskButton
@onready var achievement_button = $TextureRect/ListPage/TabButtons/AchievementButton

# 詳情頁面內的元件
@onready var detail_title = $TextureRect/DetailsPage/DetailTitle
@onready var detail_description = $TextureRect/DetailsPage/DetailDescription
@onready var requirements_container = $TextureRect/DetailsPage/RequirementsContainer
@onready var rewards_container = $TextureRect/DetailsPage/HBoxContainer/MarginContainer/RewardsContainer
@onready var claim_button = $TextureRect/DetailsPage/HBoxContainer/MarginContainer/ClaimButton

# --- 狀態管理 ---
var regular_quests_cache = null
var achievement_quests_cache = null
var current_request_type = ""
var current_tab_index = 0 # 記住目前在哪個頁籤

# --- Godot 生命週期函式 ---
func _ready():
	# 連接信號
	close_button.pressed.connect(queue_free)
	http_request.request_completed.connect(_on_request_completed)
	daily_task_button.pressed.connect(_on_daily_task_button_pressed)
	achievement_button.pressed.connect(_on_achievement_button_pressed)
	claim_button.pressed.connect(_on_claim_reward_pressed)
	
	# 初始化UI
	_select_tab(0)
	_show_list_view() # 確保一開始顯示的是列表

# --- 頁面切換邏輯 ---
func _show_list_view():
	list_page.show()
	details_page.hide()
	# 恢復主標題
	_update_title_by_tab(current_tab_index)

func _show_details_view(quest_data: Dictionary):
	list_page.hide()
	details_page.show()
	title_label.text = "任務詳情"
	
	# 填充詳情頁內容
	detail_title.text = quest_data.get("title", "")
	detail_description.text = quest_data.get("description", "")
	
	for child in requirements_container.get_children(): child.queue_free()
	for req in quest_data.get("requirements", []):
		var progress = "%s / %s" % [req.get("currentCount", 0), req.get("targetCount", 1)]
		var label = Label.new()
		label.text = "- %s: %s" % [req.get("type", "未知目標"), progress]
		requirements_container.add_child(label)
		
	for child in rewards_container.get_children(): child.queue_free()
	for rew in quest_data.get("rewards", []):
		var label = Label.new()
		label.text = "- %s x %s" % [rew.get("type", "未知獎勵"), rew.get("count", 0)]
		rewards_container.add_child(label)
		
	claim_button.visible = (quest_data.get("status", "") == "COMPLETED")
	# 可以在這裡保存一份 data 供領獎按鈕使用
	claim_button.set_meta("quest_data", quest_data)


# --- 互動邏輯 ---
func _select_tab(tab_index: int):
	current_tab_index = tab_index
	_update_title_by_tab(tab_index)

	match tab_index:
		0: # 每日任務
			daily_task_page.show(); achievement_page.hide()
			daily_task_button.texture_normal = BTN_SELECTED
			achievement_button.texture_normal = BTN_UNSELECTED
			if regular_quests_cache == null: _fetch_quests("REGULAR")
			else: _populate_quest_list(regular_quests_cache, daily_quest_list)
		1: # 成就
			daily_task_page.hide(); achievement_page.show()
			daily_task_button.texture_normal = BTN_UNSELECTED
			achievement_button.texture_normal = BTN_SELECTED
			if achievement_quests_cache == null: _fetch_quests("ACHIEVEMENT")
			else: _populate_quest_list(achievement_quests_cache, achievement_quest_list)

func _update_title_by_tab(tab_index: int):
	if tab_index == 0:
		title_label.text = "每日任務"
	else:
		title_label.text = "成就"

# --- 信號回呼函式 ---
func _on_daily_task_button_pressed(): _select_tab(0)
func _on_achievement_button_pressed(): _select_tab(1)
func _on_back_button_pressed(): _show_list_view()
func _on_quest_item_selected(quest_data: Dictionary): _show_details_view(quest_data)

func _on_claim_reward_pressed():
	var quest_data = claim_button.get_meta("quest_data", {})
	if quest_data.is_empty() or quest_data.get("status", "") != "COMPLETED": return
	
	var log_id = quest_data.get("logId", "")
	if log_id.is_empty(): return
		
	print("準備領取獎勵，任務ID: ", log_id)
	# ... 此處應放置領獎的 HTTPRequest ...
	# 領獎成功後，理想情況是：
	# 1. 重新 fetch_quests 來更新快取
	# 2. 返回列表頁 _show_list_view()

# --- 資料處理 ---
func _populate_quest_list(data_array: Array, list_container: VBoxContainer):
	for child in list_container.get_children(): child.queue_free()
	for quest_data in data_array:
		var item = QuestListItemScene.instantiate()
		list_container.add_child(item)
		item.populate(quest_data)
		item.item_selected.connect(_on_quest_item_selected)

func _fetch_quests(view_type: String):
	# 注意：這裡假設你有名為 "GlobalState" 的 autoload/單例
	# 且其中有 BASE_URL 和 get_auth_header() 方法
	current_request_type = view_type
	var url = GlobalState.BASE_URL + "/quest?viewType=" + view_type
	var headers = GlobalState.get_auth_header()
	if headers.is_empty():
		push_error("QuestModal: 缺少驗證權杖 (Auth Token)，無法發送請求。")
		return

	# 將字典轉換為 PackedStringArray
	var headers_array = []
	for key in headers:
		headers_array.append(key + ": " + headers[key])
	
	http_request.request(url, headers_array, HTTPClient.METHOD_GET, "")

# 請求完成後的回呼函式
func _on_request_completed(_result, response_code, _headers, body):
	if response_code < 200 or response_code >= 300:
		printerr("QuestModal: 請求失敗，狀態碼: ", response_code)
		return

	var json = JSON.new()
	var error = json.parse(body.get_string_from_utf8())
	if error != OK:
		printerr("QuestModal: 解析 JSON 失敗。")
		return
		
	var response = json.get_data()
	if response and response.has("data"):
		var quest_data_array = response["data"]
		
		# 根據請求時的類型，將資料存入對應的快取並填充列表
		if current_request_type == "REGULAR":
			regular_quests_cache = quest_data_array
			_populate_quest_list(regular_quests_cache, daily_quest_list)
		elif current_request_type == "ACHIEVEMENT":
			achievement_quests_cache = quest_data_array
			_populate_quest_list(achievement_quests_cache, achievement_quest_list)
