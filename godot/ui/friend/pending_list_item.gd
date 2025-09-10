extends PanelContainer

# 定義兩個信號，分別對應接受和拒絕
signal accept_requested(requester_id: String)
signal decline_requested(requester_id: String)

@onready var avatar_request: HTTPRequest = $HBoxContainer/AvatarRequest
@onready var avatar_texture: TextureRect = $HBoxContainer/AvatarTexture
@onready var name_label: Label = $HBoxContainer/VBoxContainer/NameLabel
@onready var accept_button: Button = $HBoxContainer/AcceptButton
@onready var decline_button: Button = $HBoxContainer/DeclineButton

var pending_info: Dictionary
var requester_info: Dictionary

func _ready() -> void:
	avatar_request.request_completed.connect(_on_avatar_request_completed)
	accept_button.pressed.connect(_on_accept_button_pressed)
	decline_button.pressed.connect(_on_decline_button_pressed)

func set_pending_data(data: Dictionary) -> void:
	pending_info = data
	# 邀請者的資料被包在 "requester" 物件裡
	if not pending_info.has("requester"):
		return
	requester_info = pending_info.requester

	name_label.text = requester_info.name

	if requester_info.has("avatarUrl") and not requester_info.avatarUrl.is_empty():
		avatar_request.request(requester_info.avatarUrl)

func _on_avatar_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var image = Image.new()
		var error = image.load_webp_from_buffer(body)
		if error != OK: error = image.load_png_from_buffer(body)
		if error != OK: error = image.load_jpg_from_buffer(body)
		
		if error == OK:
			avatar_texture.texture = ImageTexture.create_from_image(image)
		else:
			print("PendingListItem: Failed to load image from buffer.")

func _on_accept_button_pressed() -> void:
	accept_requested.emit(requester_info.id)

func _on_decline_button_pressed() -> void:
	decline_requested.emit(requester_info.id)
