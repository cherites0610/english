# Modal.gd
extends ColorRect

@onready var title_label = $CenterContainer/WindowPanel/VBoxContainer/TitleBar/TitleLabel
@onready var content_label = $CenterContainer/WindowPanel/VBoxContainer/ContentLabel
@onready var close_button = $CenterContainer/WindowPanel/VBoxContainer/TitleBar/CloseButton

func _ready():
	close_button.pressed.connect(close_modal)

# 提供一個外部接口，用來設定 Modal 的內容並顯示
func show_with_content(title: String, content: String):
	title_label.text = title
	content_label.text = content
	self.show()

# 關閉並銷毀 Modal
func close_modal():
	self.queue_free()

func _on_close_button_pressed() -> void:
	print('123')
	close_modal()
