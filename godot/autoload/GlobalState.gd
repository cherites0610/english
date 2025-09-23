extends Node

# --- 節點參考 (新增) ---
@onready var refresh_timer = $RefreshTimer
@onready var token_request = $TokenRequest
@onready var api_request = $ApiRequest
@onready var deeplink: Deeplink = $Deeplink as Deeplink
# --- 全域信號 ---
signal tokens_updated
signal logged_out
signal profile_updated
const MainMenuScene = preload("res://ui/main_menu/main_menu.tscn")
# --- 常數 ---
const SAVE_PATH = "user://session.json"
const BASE_URL = "https://english-api.cherites.org/api"
const REFRESH_TOKEN_URL = BASE_URL + "/auth/refresh"
const PROFILE_URL = BASE_URL + "/user/profile"

const FAKE_LOGIN_IN_DEBUG = true

# --- 狀態變數 ---
var current_level_id = "" 
var user_profile: Dictionary = {}
var access_token: String = ""
var refresh_token: String = ""

func _ready():
	print("Absolute path for user:// is: ", OS.get_user_data_dir())
	refresh_timer.timeout.connect(_on_refresh_timer_timeout)
	token_request.request_completed.connect(_on_token_request_completed)
	api_request.request_completed.connect(_on_api_request_completed)
	deeplink.deeplink_received.connect(_on_deeplink_deeplink_received)
	load_tokens_from_disk()
	
func fetch_user_profile():
	print("GlobalState: 正在擷取使用者個人資料...")
	var headers_dict = get_auth_header() # 為了清晰，先將回傳的 Dictionary 存起來

	# 必須要有 token 才能請求
	if headers_dict.is_empty():
		print("擷取個人資料失敗：缺少 token。")
		return

	# 【核心修正】將 Dictionary 轉換為 PackedStringArray
	var headers_array = PackedStringArray()
	for key in headers_dict:
		headers_array.append(key + ": " + headers_dict[key])

	# 使用轉換後的陣列發送請求
	var error = api_request.request(PROFILE_URL, headers_array, HTTPClient.METHOD_GET)
	if error != OK:
		printerr("發送擷取個人資料請求失敗！")

# 負責處理 API 回應
func _on_api_request_completed(result, response_code, headers, body):
	if response_code != 200:
		printerr("擷取個人資料失敗！伺服器回應碼: ", response_code)
		return
		
	var json = JSON.parse_string(body.get_string_from_utf8())
	if not json:
		printerr("無法解析個人資料的回應 JSON！")
		return
	
	# 從回傳的資料中，取得 "data" 這個物件
	var profile_data = json.get("data")
	
	if profile_data and profile_data is Dictionary:
		self.user_profile = profile_data
		print(self.user_profile)
		print("使用者資料已更新！歡迎，", self.user_profile.get("name"))
		
		# 【核心】發出信號，通知所有關心的 UI 元件來更新畫面
		emit_signal("profile_updated")
	else:
		printerr("個人資料回應的格式不正確，找不到 'data' 物件。")
		
func _on_deeplink_deeplink_received(a_url: DeeplinkUrl) -> void:
	var query_string = a_url.get_query()
	var new_access_token = ""
	var new_refresh_token = ""
	
	# 1. 檢查 query 字串是否為空
	if query_string.is_empty():
		printerr("Deep Link 的 query 為空！")
		logout()
		return
		
	# 2. 用 '&' 符號分割出每一個參數
	var params = query_string.split("&")
	
	# 3. 遍歷每一個參數，再用 '=' 分割出鍵和值
	for param in params:
		var key_value = param.split("=")
		if key_value.size() == 2:
			var key = key_value[0]
			var value = key_value[1]
			
			if key == "accessToken":
				new_access_token = value
			elif key == "refreshToken":
				new_refresh_token = value
	
	# 4. 檢查是否成功取得 Token 並儲存
	if not new_access_token.is_empty() and not new_refresh_token.is_empty():
		print("成功從 Deep Link 解析出 Tokens！")
		
		# 【核心】呼叫我們現有的 store_tokens 函式，它會處理好儲存、計時等所有事情
		store_tokens(new_access_token, new_refresh_token)
		
		# (可選但建議) 如果收到 deep link 時，使用者還在登入頁面，
		# 代表登入流程已完成，應自動跳轉到主介面。
		if get_tree().current_scene.scene_file_path.get_file() == "login_scene.tscn":
			print("偵測到位於登入頁，正在跳轉至主介面...")
			get_tree().change_scene_to_packed(MainMenuScene)
			print("MainMenu 場景已完全載入！") # 這行 log 會在新場景載入後才印出
	else:
		printerr("從 Deep Link 解析 Tokens 失敗！ Query: ", query_string)
		# 如果解析失敗，最好也執行登出以清理狀態
		logout()

func store_tokens(new_access_token: String, new_refresh_token: String):
	print("GlobalState: 正在儲存新的 Tokens...")
	self.access_token = new_access_token
	self.refresh_token = new_refresh_token
	
	save_tokens_to_disk()
	
	# (新增) 設定並啟動計時器，15分鐘 = 900秒。我們提早一點，用870秒 (14.5分鐘)
	refresh_timer.wait_time = 870.0
	refresh_timer.start()
	print("GlobalState: Token 刷新計時器已啟動。")
	
	emit_signal("tokens_updated")
	
	fetch_user_profile()

func get_auth_header() -> Dictionary:
	if access_token.is_empty():
		return {}
	return { "Authorization": "Bearer " + access_token }

func logout():
	print("GlobalState: 執行登出，清除狀態...")
	user_profile = {}
	access_token = ""
	refresh_token = ""
	
	refresh_timer.stop()
	
	# --- 修正後的檔案刪除邏輯 ---
	# 1. 使用正確的靜態函式檢查檔案是否存在
	if FileAccess.file_exists(SAVE_PATH):
		# 2. 使用 DirAccess 來安全地刪除檔案
		var err = DirAccess.remove_absolute(SAVE_PATH)
		if err == OK:
			print("GlobalState: 已成功刪除儲存的 session 檔案。")
		else:
			printerr("GlobalState: 刪除 session 檔案失敗！錯誤碼: ", err)
	# --- 修正結束 ---
	
	emit_signal("logged_out")

func save_tokens_to_disk():
	var data_to_save = { "refreshToken": refresh_token, "accessToken": access_token }
	var json_string = JSON.stringify(data_to_save, "\t")
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(json_string)

func load_tokens_from_disk():
	# --- 【核心修改】偵錯模式下的假登入 ---
	# 檢查是否啟用假登入，並且確認目前是在偵錯環境下執行
	if FAKE_LOGIN_IN_DEBUG and OS.is_debug_build():
		print("--- FAKE LOGIN ENABLED ---")
		# 直接設定你想要的 access_token
		var fake_access_token = "cherites"
		# 同時也給 refresh_token 一個假的值，避免某些檢查出錯
		var fake_refresh_token = "fake_refresh_token_for_debug"
		
		# 【重要】呼叫 store_tokens 來處理後續所有標準流程。
		# 這會自動幫我們啟動計時器、發送信號，並擷取使用者個人資料。
		store_tokens(fake_access_token, fake_refresh_token)
		
		# 因為已經完成「假登入」，所以直接返回，跳過下方從磁碟讀取檔案的程式碼。
		return
	# --- 【修改結束】 ---

	print("--- Loading Tokens ---")
	var file_exists = FileAccess.file_exists(SAVE_PATH)
	print("Checking for file at '", SAVE_PATH, "'. Exists: ", file_exists)

	if not file_exists:
		emit_signal("initial_auth_failed") # 找不到檔案，直接判定失敗
		return

	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file.is_open():
		printerr("!!! Load Error: Failed to open file for reading.")
		printerr("!!! FileAccess error code: ", FileAccess.get_open_error())
		emit_signal("initial_auth_failed")
		return
		
	var content = file.get_as_text()
	file.close()
	print("File content loaded: ", content)
		
	var parse_result = JSON.parse_string(content)

	if parse_result:
		self.refresh_token = parse_result.get("refreshToken", "")
		self.access_token = parse_result.get("accessToken", "")
		print("GlobalState: 成功從檔案載入 Token。")
		
		if not self.refresh_token.is_empty():
			refresh_access_token()
		else:
			logout()

# 公開的刷新方法，可以被計時器或內部邏輯呼叫
func refresh_access_token():
	if refresh_token.is_empty():
		print("GlobalState: 沒有 refresh token，無法刷新，執行登出。")
		logout()
		return

	if token_request.get_http_client_status() != HTTPClient.STATUS_DISCONNECTED:
		print("GlobalState: 上一個 Token 請求仍在進行中，本次刷新取消。")
		return

	print("GlobalState: 正在發送刷新 Access Token 請求...")
	var headers = ["Content-Type: application/json"]
	var body = JSON.stringify({ "refreshToken": refresh_token })
	var error = token_request.request(REFRESH_TOKEN_URL, headers, HTTPClient.METHOD_POST, body)
	
	if error != OK:
		printerr("GlobalState: 發送刷新 Token 請求失敗! 錯誤碼: ", error)
		logout()

# 當 RefreshTimer 時間到時，會自動呼叫此函式
func _on_refresh_timer_timeout():
	print("GlobalState: 計時器觸發，執行 Token 刷新。")
	refresh_access_token()

# 當 TokenRequest 完成網路請求後，會自動呼叫此函式
func _on_token_request_completed(result, response_code, headers, body):
	if response_code != 200 and response_code != 201:
		printerr("GlobalState: 刷新 Token 失敗！伺服器回應碼: ", response_code)
		logout()
		return
		
	var json = JSON.parse_string(body.get_string_from_utf8())
	if not json:
		printerr("GlobalState: 無法解析刷新 Token 的回應 JSON！")
		logout()
		return

	# 假設後端成功時回傳格式為 { "accessToken": "...", "refreshToken": "..." }
	var new_access = json.get("accessToken")
	# 如果後端在刷新時也換發了新的 refresh token，就使用新的，否則沿用舊的
	var new_refresh = json.get("refreshToken", refresh_token) 

	if new_access and not new_access.is_empty():
		print("GlobalState: Token 刷新成功！")
		store_tokens(new_access, new_refresh)
	else:
		printerr("GlobalState: 刷新後的回應中找不到新的 Access Token！")
		logout()
