# MailListItem.gd
extends PanelContainer

# 自訂信號，當此項目被點擊時，會將自己發送出去，通知父節點
signal item_clicked(item_instance)

@onready var read_status = $VBoxContainer/MarginContainer/BasicInfo/ReadStatus
@onready var title_label = $VBoxContainer/MarginContainer/BasicInfo/TitleLabel
@onready var from_label = $VBoxContainer/MarginContainer/BasicInfo/FromLabel
@onready var received_at_label = $VBoxContainer/MarginContainer/BasicInfo/ReceivedAtLabel
@onready var context_label = $VBoxContainer/ContextLabel

var mail_data: Dictionary

func _ready():
	# 預設隱藏詳細內容
	context_label.hide()
	# 連接自身的點擊輸入信號
	gui_input.connect(_on_gui_input)

# 外部呼叫此函式來填入郵件資料
func populate(data: Dictionary):
	self.mail_data = data
	title_label.text = mail_data.get("title", "無標題")
	from_label.text = mail_data.get("from", "未知寄件人")
	received_at_label.text = mail_data.get("receivedAt", "")
	context_label.text = mail_data.get("context", "沒有內容。")
	print(123)
	
	# 根據 isRead 狀態設定指示燈的顏色
	if mail_data.get("isRead", true):
		read_status.color = Color(0.5, 0.5, 0.5) # 已讀：灰色
	else:
		read_status.color = Color(0.2, 0.8, 1.0) # 未讀：亮藍色

# 處理點擊事件
func _on_gui_input(event: InputEvent):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		# 當被點擊時，發送信號，讓父節點 (Modal) 來處理後續邏輯
		emit_signal("item_clicked", self)

# 展開詳細內容
func expand():
	context_label.show()

# 收合詳細內容
func collapse():
	context_label.hide()
