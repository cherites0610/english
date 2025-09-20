# MailModal.gd
extends ColorRect

# 預載入我們剛剛創建的郵件項目場景
const MailListItemScene = preload("res://ui/hud/mail_list_item.tscn")

@onready var mail_list_container = $WindowPanel/VBoxContainer/ScrollContainer/MailListContainer
@onready var close_button = $WindowPanel/VBoxContainer/TitleBar/CloseButton #這是舊Btn
@onready var http_request = $HTTPRequest
@onready var close_button2 = $TextureRect/CloseButton2

# 追蹤當前展開的項目，以實現手風琴效果
var currently_expanded_item = null
var requestMode = 0

func _ready():
	close_button.pressed.connect(queue_free) #這是舊Btn
	close_button2.pressed.connect(queue_free)
	# 連接 HTTPRequest 的信號
	http_request.request_completed.connect(_on_request_completed)
	
	# Modal 準備好後，立即獲取郵件列表
	_fetch_mail_list()

# --- Public API ---
# 外部可以呼叫此函式來顯示 Modal (如果它是手動實例化的話)
func show_modal():
	self.show()
	_fetch_mail_list()

# --- 內部邏輯 ---

# 1. 獲取郵件列表
func _fetch_mail_list():
	var url = GlobalState.BASE_URL + "/mail"
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		push_error("Modal: Missing auth token.")
		return

	var headers_array = PackedStringArray()
	for key in headers_dict:
		headers_array.append(key + ": " + headers_dict[key])
	requestMode=1
	http_request.request(url, headers_array, HTTPClient.METHOD_GET) # 最後一個參數是自訂標籤

# 2. 將郵件標為已讀
func _mark_mail_as_read(mail_id: String):
	var url = GlobalState.BASE_URL + "/mail/read/" + mail_id
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		push_error("Modal: Missing auth token.")
		return

	var headers_array = PackedStringArray()
	for key in headers_dict:
		headers_array.append(key + ": " + headers_dict[key])
	requestMode=2
	http_request.request(url, headers_array, HTTPClient.METHOD_POST, "")

# 3. 處理來自 HTTPRequest 的所有回應
func _on_request_completed(result, response_code, headers, body):
	if result != HTTPRequest.RESULT_SUCCESS or response_code >= 400:
		return
	print(requestMode)
	if requestMode == 1:
		# 清空舊列表
		for child in mail_list_container.get_children():
			child.queue_free()
		
		var json = JSON.new()
		json.parse(body.get_string_from_utf8())
		var response = json.get_data()
		print(response)
		
		if response and response.has("data"):
			var mails = response["data"]
			for mail_data in mails:
				var item = MailListItemScene.instantiate()
				mail_list_container.add_child(item)
				item.populate(mail_data)
				# 連接每個 item 的自訂信號
				item.item_clicked.connect(_on_mail_item_clicked)
	
	elif requestMode == 2:
		print("Mail marked as read successfully.")
		# 可以在這裡做一些成功後的回饋，例如播放音效

# 4. 處理郵件項目的點擊事件
func _on_mail_item_clicked(item_instance):
	# 如果點擊的是已經展開的項目，則將其收合
	if currently_expanded_item == item_instance:
		item_instance.collapse()
		currently_expanded_item = null
		return

	# 如果有其他項目已經展開，先將它收合
	if is_instance_valid(currently_expanded_item):
		currently_expanded_item.collapse()
	
	# 展開當前點擊的項目
	item_instance.expand()
	currently_expanded_item = item_instance
	
	# 如果點擊的郵件是未讀的，就發送已讀請求
	if not item_instance.mail_data.get("isRead", true):
		var mail_id = item_instance.mail_data.get("id")
		if mail_id:
			_mark_mail_as_read(mail_id)
			# 可以在前端立即更新狀態，以獲得更好的體驗
			item_instance.mail_data["isRead"] = true
			item_instance.populate(item_instance.mail_data)
