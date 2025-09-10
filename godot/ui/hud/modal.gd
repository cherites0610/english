# Modal.gd
extends ColorRect

# --- Enum ---
# 定義一個任務視圖類型，讓外部可以直接使用 Modal.QuestViewType.REGULAR
enum QuestViewType {
	REGULAR,
	ACHIEVEMENT
}

# --- 節點引用 ---
@onready var title_label = $CenterContainer/WindowPanel/VBoxContainer/TitleBar/TitleLabel
@onready var content_label = $CenterContainer/WindowPanel/VBoxContainer/ContentLabel
@onready var close_button = $CenterContainer/WindowPanel/VBoxContainer/TitleBar/CloseButton
@onready var http_request = $HTTPRequest

func _ready():
	# 在 _ready 中只需要連接信號
	http_request.request_completed.connect(_on_request_completed)
	close_button.pressed.connect(close_modal)

# --- 公開的 API (Public API) ---

# 新的統一入口函式，取代了舊的 show_tasks()
func show_quests(view_type: QuestViewType):
	var url: String
	var title: String

	# 1. 根據傳入的 view_type 決定 URL 和標題
	match view_type:
		QuestViewType.REGULAR:
			url = GlobalState.BASE_URL + "/quest?viewType=REGULAR"
			title = "任務"
		QuestViewType.ACHIEVEMENT:
			url = GlobalState.BASE_URL + "/quest?viewType=ACHIEVEMENT"
			title = "成就"
		_:
			push_error("Invalid QuestViewType provided to Modal.")
			return

	# 2. 立即顯示 Modal 並設定為載入中狀態
	self.show()
	title_label.text = title
	content_label.text = "正在從伺服器載入資料..."

	# 3. 準備並發送請求 (保留您原有的 header 處理邏輯)
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		content_label.text = "擷取資料失敗：缺少 Token。"
		push_error("Modal: Missing auth token.")
		return

	var headers_array = PackedStringArray()
	for key in headers_dict:
		headers_array.append(key + ": " + headers_dict[key])
		
	var error = http_request.request(url, headers_array, HTTPClient.METHOD_GET)
	
	if error != OK:
		push_error("Modal failed to send HTTP request. Error code: " + str(error))
		content_label.text = "無法發送請求，請檢查網路連線。"

# 用於顯示靜態內容的函式，依然保留
func show_with_content(title: String, content: String):
	title_label.text = title
	content_label.text = content
	self.show()

# --- 內部邏輯 (Internal Logic) ---

func close_modal():
	self.queue_free()

func _on_request_completed(result, response_code, headers, body):
	# 檢查請求是否成功
	if result != HTTPRequest.RESULT_SUCCESS or response_code != 200:
		content_label.text = "無法獲取資料，請稍後再試。\n錯誤碼: %d" % response_code
		print("Modal's HTTPRequest failed with code: %d" % response_code)
		return

	# 解析 JSON 資料
	var json = JSON.new()
	if json.parse(body.get_string_from_utf8()) != OK:
		content_label.text = "無法解析伺服器回應的資料。"
		print("Modal's JSON Parse Error: ", json.get_error_message())
		return

	# 從回應中正確地取得 data 陣列
	var response_data = json.get_data()
	if response_data and response_data.has("data") and response_data["data"] is Array:
		# 將 data 陣列傳遞給格式化函式
		content_label.text = _format_quest_content(response_data["data"])
	else:
		content_label.text = "收到的資料格式不正確或沒有任務。"

# 【核心修正】重寫內容格式化函式，以匹配您的 JSON 結構
func _format_quest_content(quest_list: Array) -> String:
	if quest_list.is_empty():
		return "目前沒有任何項目。"

	var content = ""
	for quest in quest_list:
		# 安全地獲取資料
		var title = quest.get("title", "無標題任務")
		var requirements = quest.get("requirements", [])
		
		var progress_str = ""
		# 顯示第一個需求的進度
		if not requirements.is_empty():
			var req = requirements[0]
			var current = req.get("currentCount", 0)
			var target = req.get("targetCount", 1)
			progress_str = " (%d/%d)" % [current, target]
		
		# 組合單行任務的字串
		content += "- %s%s\n" % [title, progress_str]
		
	return content
