extends PanelContainer

signal add_friend_requested(user_id: String)

@onready var avatar_request: HTTPRequest = $HBoxContainer/AvatarRequest
@onready var avatar_texture: TextureRect = $HBoxContainer/AvatarTexture
@onready var name_label: Label = $HBoxContainer/VBoxContainer/NameLabel
@onready var level_label: Label = $HBoxContainer/VBoxContainer/LevelLabel
@onready var add_friend_button: Button = $HBoxContainer/AddFriendButton

var user_info: Dictionary

func _ready() -> void:
	avatar_request.request_completed.connect(_on_avatar_request_completed)
	add_friend_button.pressed.connect(_on_add_friend_button_pressed)

func set_user_data(data: Dictionary) -> void:
	user_info = data
	name_label.text = user_info.name
	level_label.text = "Lv. " + str(user_info.userLevel)
	if user_info.has("avatarUrl") and not user_info.avatarUrl.is_empty():
		avatar_request.request(user_info.avatarUrl)

func _on_avatar_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var image = Image.new()
		var error = image.load_webp_from_buffer(body)
		if error != OK: error = image.load_png_from_buffer(body)
		if error != OK: error = image.load_jpg_from_buffer(body)
		
		if error == OK:
			avatar_texture.texture = ImageTexture.create_from_image(image)
		else:
			print("SearchResultItem: Failed to load image from buffer.")

func _on_add_friend_button_pressed() -> void:
	# 發送信號，並附上這個用戶的 ID
	add_friend_requested.emit(user_info.id)
	# 點擊後禁用按鈕，防止重複發送請求
	add_friend_button.disabled = true
	add_friend_button.text = "已邀請"
