extends Node2D

@onready var blink_sprite = $EyeClosed
@onready var eyes_group = $breatheAll/Eyes
@onready var blink_timer: Timer = Timer.new()

@onready var idle_sprite = $breatheAll/unFinish
@onready var finished_sprite = $breatheAll/finish

var finish: bool = false

func _ready():
	# 初始顯示
	blink_sprite.visible = false
	blink_sprite.sprite_frames = load("res://sprites/tres/eyes.tres")
	blink_sprite.stop()

	# 綁定動畫完成訊號
	blink_sprite.connect("animation_finished", Callable(self, "_on_EyeClosed_animation_finished"))

	# 建立 Timer（只建立一次）
	blink_timer.one_shot = true
	blink_timer.connect("timeout", Callable(self, "_start_blink"))
	add_child(blink_timer)

	# 啟動第一次眨眼
	_reset_blink_timer()
	_update_body_state()


func _start_blink():
	if blink_sprite.visible:
		return
	print("眨眼觸發！")  # log：開始眨眼
	eyes_group.visible = false       # 只隱藏眼睛，不影響呼吸動畫
	blink_sprite.visible = true
	blink_sprite.play("eyes")        # 確保動畫名稱和 .tres 一致

func _on_EyeClosed_animation_finished():
	print("動畫完成訊號，目前動畫：", blink_sprite.animation)
	if blink_sprite.animation == "eyes":
		blink_sprite.visible = false
		blink_sprite.stop()
		eyes_group.visible = true
		print("眨眼結束！")
		# 重設下一次眨眼時間
		_reset_blink_timer()

func _reset_blink_timer():
	var next_time = randf_range(2.0, 5.0)
	blink_timer.start(next_time)
	print("下一次眨眼預計在 ", next_time, " 秒後")

# 外部或內部切換 finish 狀態時呼叫
func set_finish(state: bool):
	finish = state
	_update_body_state()

func _update_body_state():
	idle_sprite.visible = not finish
	finished_sprite.visible = finish

func _input(event):
	if event.is_action_pressed("ui_accept"):
		finish = not finish
	_update_body_state()
	print("切換 finish =", finish)
