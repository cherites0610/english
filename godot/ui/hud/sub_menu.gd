extends PanelContainer

# --- 對外聲明這個場景會發出哪些信號 ---
signal task_button_pressed
signal mail_button_pressed
signal settings_button_pressed

# --- 內部節點參考 ---
@onready var task_button = $VBoxContainer/TaskButton
@onready var mail_button = $VBoxContainer/MailButton
@onready var settings_button = $VBoxContainer/SettingsButton

func _ready():
	# 連接內部按鈕的 "pressed" 信號到對應的處理函式
	task_button.pressed.connect(_on_task_button_pressed)
	mail_button.pressed.connect(_on_mail_button_pressed)
	settings_button.pressed.connect(_on_settings_button_pressed)

# --- 內部信號處理函式 ---

func _on_task_button_pressed():
	# 當任務按鈕被點擊時，對外發出 "task_button_pressed" 信號
	emit_signal("task_button_pressed")

func _on_mail_button_pressed():
	emit_signal("mail_button_pressed")

func _on_settings_button_pressed():
	emit_signal("settings_button_pressed")
