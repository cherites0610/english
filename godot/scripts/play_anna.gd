extends Node2D

# 透過 @onready 取得節點參考
@onready var animated_sprite = $AnimatedSprite2D
@onready var open_eyes_node = $張眼
@onready var body_animation_player = $AnimationPlayer
@onready var write_animation_player = $寫字
@onready var listen_object_node = $聽
@onready var smile_mouth = $微笑 # 取得微笑嘴巴節點
@onready var talking_mouth = $TalkingMouth # 新增：取得說話嘴巴節點

# 定義你的變數
var listen = false
var is_talking = false # 新增：控制說話的變數

func _ready():
	randomize()
	animated_sprite.hide()
	talking_mouth.hide() # 確保說話嘴巴初始是隱藏的
	start_blink_timer()
	body_animation_player.play("playAnna")
	listen_object_node.hide()

func _unhandled_input(event):
	if event is InputEventKey and event.is_pressed() and event.keycode == KEY_SPACE:
		listen = not listen
		if listen:
			listen_object_node.show()
		else:
			listen_object_node.hide()
	
	# 新增：按下 'T' 鍵切換說話狀態
	if event is InputEventKey and event.is_pressed() and event.keycode == KEY_T:
		is_talking = not is_talking

func _process(delta):
	# 控制寫字動畫
	if listen:
		if not write_animation_player.is_playing():
			write_animation_player.play("new_animation")
	else:
		if write_animation_player.is_playing():
			write_animation_player.stop()

	# 控制說話動畫
	if is_talking:
		# 當開始說話時，隱藏微笑嘴巴，顯示說話嘴巴並播放動畫
		smile_mouth.hide()
		talking_mouth.show()
		if not talking_mouth.is_playing():
			talking_mouth.play("talking")
	else:
		# 當停止說話時，停止動畫並隱藏說話嘴巴
		talking_mouth.stop()
		talking_mouth.hide()
		# 顯示微笑嘴巴
		smile_mouth.show()

# 眨眼相關函式 (不變)
func start_blink_timer():
	var wait_time = randf_range(2.0, 4.0)
	var timer = get_tree().create_timer(wait_time)
	await timer.timeout
	blink()

func blink():
	open_eyes_node.hide()
	animated_sprite.show()
	animated_sprite.play("close_eyes")
	await animated_sprite.animation_finished
	animated_sprite.hide()
	open_eyes_node.show()
	start_blink_timer()
