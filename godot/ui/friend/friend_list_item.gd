extends PanelContainer

# 定義一個信號，當刪除按鈕被點擊時發出
signal delete_requested(friend_id: String)

@onready var avatar_request: HTTPRequest = $HBoxContainer/AvatarRequest
@onready var avatar_texture: TextureRect = $HBoxContainer/AvatarTexture
@onready var name_label: Label = $HBoxContainer/VBoxContainer/NameLabel
@onready var level_label: Label = $HBoxContainer/VBoxContainer/LevelLabel
@onready var delete_button: Button = $HBoxContainer/DeleteButton

var friend_info: Dictionary

func _ready() -> void:
	# 連接下載頭像和點擊刪除按鈕的信號
	avatar_request.request_completed.connect(_on_avatar_request_completed)
	delete_button.pressed.connect(_on_delete_button_pressed)

# 這個是公開方法，讓 FriendsPage 可以呼叫它來設定資料
func set_friend_data(data: Dictionary) -> void:
	print(data)
	friend_info = data
	
	name_label.text = friend_info.name
	level_label.text = "Lv. " + str(friend_info.userLevel)
	
	# 如果 avatarUrl 存在且不為空，就去下載圖片
	if friend_info.has("avatarUrl") and not friend_info.avatarUrl.is_empty():
		avatar_request.request(friend_info.avatarUrl)
	else:
		# 可以設定一個預設的頭像圖片
		avatar_texture.texture = null # 或者 load("res://default_avatar.png")

# 當頭像下載完成時
func _on_avatar_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var image = Image.new()
		# 根據圖片格式選擇，常見為 webp, png, jpg
		var error = image.load_webp_from_buffer(body)
		if error != OK:
			error = image.load_png_from_buffer(body)
		if error != OK:
			error = image.load_jpg_from_buffer(body)

		if error == OK:
			var texture = ImageTexture.create_from_image(image)
			avatar_texture.texture = texture
		else:
			print("Failed to load image from buffer.")

# 當刪除按鈕被點擊時
func _on_delete_button_pressed() -> void:
	# 發出信號，並把這個好友的 ID 傳遞出去
	delete_requested.emit(friend_info.id)
