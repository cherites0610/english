extends Control

@onready var google_login_button = $CenterContainer/VBoxContainer/GoogleLoginButton
@onready var line_login_button = $CenterContainer/VBoxContainer/LineLoginButton
@onready var status_label = $CenterContainer/VBoxContainer/StatusLabel
@onready var auth_url_request = $AuthURLRequest

#const GET_GOOGLE_URL_API = "http://localhost:5010/api/auth/google"
#const GET_LINE_URL_API = "http://localhost:5010/api/auth/line"
const GET_GOOGLE_URL_API = GlobalState.BASE_URL + "/auth/google"
const GET_LINE_URL_API = GlobalState.BASE_URL + "/auth/line"

func _ready():
	google_login_button.pressed.connect(_on_google_login_pressed)
	line_login_button.pressed.connect(_on_line_login_pressed)
	auth_url_request.request_completed.connect(_on_auth_url_request_completed)

func _on_google_login_pressed():
	print("請求 Google 登入 URL...")
	_start_login_process("Google")
	_get_auth_url("Google")

func _on_line_login_pressed():
	print("請求 LINE 登入 URL...")
	_start_login_process("LINE")
	_get_auth_url("LINE")
	
func _start_login_process(provider: String):
	google_login_button.disabled = true
	line_login_button.disabled = true
	status_label.text = "正在向伺服器請求 " + provider + " 登入連結..."
	
func _get_auth_url(provider: String):
	var target_url = ""
	match provider:
		"Google":
			target_url = GET_GOOGLE_URL_API
		"LINE":
			target_url = GET_LINE_URL_API
	
	if target_url.is_empty():
		_reset_ui_on_error("客戶端錯誤：未知的登入提供商。")
		return

	var error = auth_url_request.request(target_url)
	if error != OK:
		_reset_ui_on_error("無法發送請求，請檢查網路連線。")

func _on_auth_url_request_completed(result, response_code, headers, body):
	if response_code != 200:
		_reset_ui_on_error("伺服器錯誤，無法取得登入連結。狀態碼: " + str(response_code))
		return

	var json = JSON.parse_string(body.get_string_from_utf8())
	if not json:
		_reset_ui_on_error("無法解析伺服器回應。")
		return
	
	var data_obj = json.get("data")
	
	if not data_obj or typeof(data_obj) != TYPE_DICTIONARY:
		_reset_ui_on_error("伺服器回應格式不正確，找不到 'data' 物件。")
		return

	var auth_url = data_obj.get("url")
	
	if auth_url and not auth_url.is_empty():
		status_label.text = "取得連結成功！正在開啟瀏覽器..."
		print("即將開啟 URL: ", auth_url)
		# 【核心】使用 OS.shell_open() 開啟裝置的預設瀏覽器
		OS.shell_open(auth_url)
		# 注意：開啟瀏覽器後，我們的 App 會進入背景。使用者完成登入後需要一個機制回來。
		# 這就是下一步要討論的 Deep Link。
	else:
		_reset_ui_on_error("伺服器回應中找不到登入連結。")

func _reset_ui_on_error(error_message: String):
	printerr(error_message)
	status_label.text = error_message
	google_login_button.disabled = false
	line_login_button.disabled = false
