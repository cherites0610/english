# SettingsModal.gd
extends ColorRect

# --- 節點引用 ---
@onready var close_button = $WindowPanel/VBoxContainer/TitleBar/CloseButton
@onready var google_button = $WindowPanel/VBoxContainer/GoogleButton
@onready var line_button = $WindowPanel/VBoxContainer/LineButton
@onready var name_edit = $WindowPanel/VBoxContainer/NameHBox/NameEdit
@onready var save_name_button = $WindowPanel/VBoxContainer/SaveNameButton
@onready var volume_slider = $WindowPanel/VBoxContainer/VolumeHBox/VolumeSlider
@onready var logout_button = $WindowPanel/VBoxContainer/LogoutButton

func _ready():
	# 連接關閉按鈕的信號
	close_button.pressed.connect(close_modal)
	
	# 您也可以在這裡用程式碼連接所有信號，或者直接在編輯器中連接
	google_button.pressed.connect(_on_google_button_pressed)
	line_button.pressed.connect(_on_line_button_pressed)
	save_name_button.pressed.connect(_on_save_name_button_pressed)
	logout_button.pressed.connect(_on_logout_button_pressed)
	volume_slider.value_changed.connect(_on_volume_slider_value_changed)
	
	# 初始化顯示（可以從 GlobalState 讀取初始值）
	# volume_slider.value = GlobalState.current_volume
	 #name_edit.text = GlobalState.
	print("設定 Modal 已準備就緒。")

# --- 公開 API ---
func show_modal():
	self.show()

func close_modal():
	self.queue_free()

# --- 信號處理函式 (Signal Handlers) ---

func _on_google_button_pressed():
	print("（假）按下了綁定 Google 帳號按鈕。")
	# 未來邏輯：呼叫 Google 登入的 SDK

func _on_line_button_pressed():
	print("（假）按下了綁定 Line 帳號按鈕。")
	# 未來邏輯：呼叫 Line 登入的 SDK

func _on_save_name_button_pressed():
	var new_name = name_edit.text
	if not new_name.is_empty():
		print("（假）準備儲存新暱稱: %s" % new_name)
		# 未來邏輯：發送 API 請求到後端更新使用者名稱
	else:
		print("暱稱不能為空。")

func _on_volume_slider_value_changed(value: float):
	print("（假）音量已調整為: %d" % int(value))
	# 未來邏輯：GlobalState.current_volume = value
	# AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(value / 100.0))

func _on_logout_button_pressed():
	print("（假）按下了登出按鈕。")
	# 未來邏輯：清除本地 token，發送登出 API，切換到登入場景
