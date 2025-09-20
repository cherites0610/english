# QuestModal.gd
extends ColorRect

# --- 預載入 ---
const QuestListItemScene = preload("res://ui/hud/quest_list_item.tscn")
# 載入您自定義的按鈕圖片
const DAILY_BTN_UNSELECTED = preload("res://assets/modalimage/unselect.png")
const DAILY_BTN_SELECTED = preload("res://assets/modalimage/select.png")
const ACHIEVE_BTN_UNSELECTED = preload("res://assets/modalimage/unselect.png")
const ACHIEVE_BTN_SELECTED = preload("res://assets/modalimage/select.png")

# --- 節點引用 ---
@onready var http_request = $HTTPRequest
# 保留 TabContainer 的引用
@onready var tab_container = $WindowPanel/VBoxContainer/MainHBox/LeftPanel/TabContainer
# 新增自訂按鈕與頁面的引用
@onready var daily_task_button = $TextureRect/TabButtons/DailyTaskButton
@onready var achievement_button = $TextureRect/TabButtons/AchievementButton
@onready var title_label = $TextureRect/title  # 請根據您的場景路徑修改
@onready var daily_task_page = $WindowPanel/VBoxContainer/MainHBox/LeftPanel/DailyQuestPage
@onready var achievement_page = $WindowPanel/VBoxContainer/MainHBox/LeftPanel/AchievementQuestPage

# 您原本的任務列表引用，這裡需要根據您實際的場景結構來調整路徑
# 確保它們指向正確的列表容器
@onready var regular_quest_list = $WindowPanel/VBoxContainer/MainHBox/LeftPanel/TabContainer/任務/RegularQuestList
@onready var achievement_quest_list = $WindowPanel/VBoxContainer/MainHBox/LeftPanel/TabContainer/成就/AchievementQuestList

# 右側詳情面板的元件
@onready var quest_details_panel = $WindowPanel/VBoxContainer/MainHBox/RightPanel/QuestDetails
@onready var close_button2 = $TextureRect/CloseButton2
@onready var detail_title = quest_details_panel.get_node("DetailTitle")
@onready var detail_description = quest_details_panel.get_node("DetailDescription")
@onready var objectives_container = quest_details_panel.get_node("ObjectivesContainer")
@onready var rewards_container = quest_details_panel.get_node("RewardsContainer")

# --- 狀態管理 ---
# 控制使用哪種切換方式，true = 自訂按鈕，false = TabContainer
@export var use_custom_tabs = false

var regular_quests_cache = null
var achievement_quests_cache = null
var current_selected_item = null
var request_type = ""

func _ready():
	$WindowPanel/VBoxContainer/TitleBar/CloseButton.pressed.connect(queue_free)
	http_request.request_completed.connect(_on_request_completed)
	close_button2.pressed.connect(queue_free)

	quest_details_panel.hide() # 預設隱藏詳情面板
	
	if use_custom_tabs:
		# 隱藏 TabContainer 的內建標籤
		tab_container.tab_bar_hidden = true
		
		# 連接自訂按鈕的訊號
		daily_task_button.pressed.connect(_on_daily_task_button_pressed)
		achievement_button.pressed.connect(_on_achievement_button_pressed)
		
		# 遊戲啟動時，預設選中每日任務按鈕
		# 呼叫一個統一的函式來初始化所有狀態
		_select_tab_and_update_ui(0)
		
		# 隱藏 TabContainer 的子節點，由自訂頁面來顯示內容
		for child in tab_container.get_children():
			child.hide()
	else:
		# 使用 TabContainer 的內建功能
		tab_container.tab_changed.connect(_on_tab_changed)
		_on_tab_changed(tab_container.current_tab)

# --- 核心邏輯 ---

# 這是關鍵的統一函式，它同時處理按鈕的視覺和資料邏輯
func _select_tab_and_update_ui(tab_index: int):
	quest_details_panel.hide()
	if is_instance_valid(current_selected_item):
		current_selected_item.set_selected(false)
		current_selected_item = null

	# 第一步：處理按鈕的視覺狀態
	# 這是解決您問題的關鍵步驟
	if tab_index == 0:
		# 每日任務按鈕：設定為「選中」圖片
		daily_task_button.texture_normal = DAILY_BTN_SELECTED
		daily_task_button.texture_pressed = DAILY_BTN_SELECTED # 確保點擊時外觀不變
		# 成就任務按鈕：設定為「未選中」圖片
		achievement_button.texture_normal = ACHIEVE_BTN_UNSELECTED
		achievement_button.texture_pressed = ACHIEVE_BTN_UNSELECTED
	else: # tab_index == 1
		# 每日任務按鈕：設定為「未選中」圖片
		daily_task_button.texture_normal = DAILY_BTN_UNSELECTED
		daily_task_button.texture_pressed = DAILY_BTN_UNSELECTED
		# 成就任務按鈕：設定為「選中」圖片
		achievement_button.texture_normal = ACHIEVE_BTN_SELECTED
		achievement_button.texture_pressed = ACHIEVE_BTN_SELECTED
	
	# 第二步：處理資料和內容邏輯
	var list_to_use = null
	var cache_to_use = null
	var view_type_to_fetch = ""

	match tab_index:
		0: # 每日任務 Tab
			list_to_use = regular_quest_list
			cache_to_use = regular_quests_cache
			view_type_to_fetch = "REGULAR"
			tab_container.current_tab = 0
		1: # 成就任務 Tab
			list_to_use = achievement_quest_list
			cache_to_use = achievement_quests_cache
			view_type_to_fetch = "ACHIEVEMENT"
			tab_container.current_tab = 1
	
	if cache_to_use == null:
		_fetch_quests(view_type_to_fetch)
	else:
		_populate_quest_list(cache_to_use, list_to_use)

# 處理 TabContainer 內建 Tab 切換的函式
func _on_tab_changed(tab_index: int):
	_select_tab_and_update_ui(tab_index)

# 處理自訂按鈕切換的函式
func _on_daily_task_button_pressed():
	# 設定標題為「每日任務」
	title_label.text = "每日任務"
	
	_select_tab_and_update_ui(0)

func _on_achievement_button_pressed():
	# 設定標題為「成就任務」
	title_label.text = "成就任務"
	_select_tab_and_update_ui(1)

# --- API 請求與資料處理 ---
func _fetch_quests(view_type: String):
	# 修正：在迴圈外呼叫 http_request.request()
	request_type = view_type
	var url = GlobalState.BASE_URL + "/quest?viewType=" + view_type
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		push_error("Modal: Missing auth token.")
		return

	var headers_array = PackedStringArray()
	for key in headers_dict:
		headers_array.append(key + ": " + headers_dict[key])
	
	http_request.request(url, headers_array, HTTPClient.METHOD_GET, "")

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
	for child in list_container.get_children():
		child.queue_free()
	
	for quest_data in data_array:
		var item = QuestListItemScene.instantiate()
		list_container.add_child(item)
		item.populate(quest_data)
		item.quest_selected.connect(_on_quest_item_selected)

func _on_quest_item_selected(quest_data: Dictionary):
	if is_instance_valid(current_selected_item):
		current_selected_item.set_selected(false)
	
	var list_container = null
	if use_custom_tabs:
		list_container = regular_quest_list if tab_container.current_tab == 0 else achievement_quest_list
	else:
		list_container = regular_quest_list if tab_container.current_tab == 0 else achievement_quest_list

	for item in list_container.get_children():
		if item.quest_data["logId"] == quest_data["logId"]:
			current_selected_item = item
			item.set_selected(true)
			break
			
	_display_quest_details(quest_data)

func _display_quest_details(quest_data: Dictionary):
	quest_details_panel.show()
	detail_title.text = quest_data.get("title", "")
	detail_description.text = quest_data.get("description", "")

	for child in objectives_container.get_children():
		child.queue_free()
	var requirements = quest_data.get("requirements", [])
	for req in requirements:
		var progress = "%d / %d" % [req.get("currentCount", 0), req.get("targetCount", 1)]
		var objective_label = Label.new()
		objective_label.text = "- %s  %s" % [req.get("type", "未知目標"), progress]
		objectives_container.add_child(objective_label)

	for child in rewards_container.get_children():
		child.queue_free()
	var rewards = quest_data.get("rewards", [])
	for rew in rewards:
		var reward_label = Label.new()
		reward_label.text = "%s x %d" % [rew.get("type", "未知獎勵"), rew.get("count", 0)]
		rewards_container.add_child(reward_label)
