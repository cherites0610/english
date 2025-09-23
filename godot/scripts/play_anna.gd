extends Node2D

# --- 節點參考 ---
@onready var animated_sprite = $AnimatedSprite2D
@onready var open_eyes_node = $張眼
@onready var body_animation_player = $AnimationPlayer
@onready var write_animation_player = $寫字
@onready var listen_object_node = $聽
@onready var smile_mouth = $微笑
@onready var talking_mouth = $TalkingMouth

# --- 狀態管理 ---
enum State { IDLE, TALKING, WRITING }
var current_state = State.IDLE

# 【移除】不再需要這兩個獨立的變數
# var listen = false
# var is_talking = false

func _ready():
	randomize()
	start_blink_timer()
	# 【修改】透過 set_state 來設定初始狀態，而不是手動設定每個節點
	set_state(State.IDLE)


# 【修改】輸入事件現在只負責「請求」改變狀態，而不是直接操作節點
func _unhandled_input(event):
	if event is InputEventKey and event.is_pressed():
		match event.keycode:
			KEY_SPACE:
				# 如果正在寫字，就變回待機；否則就開始寫字
				if current_state == State.WRITING:
					set_state(State.IDLE)
				else:
					set_state(State.WRITING)
			
			KEY_T:
				# 如果正在說話，就變回待機；否則就開始說話
				if current_state == State.TALKING:
					set_state(State.IDLE)
				else:
					set_state(State.TALKING)


# 【新增】核心的狀態機函式
func set_state(new_state: State):
	# 如果狀態沒有改變，就直接返回，避免不必要的處理
	if new_state == current_state:
		return

	current_state = new_state
	
	# 使用 match 陳述式來處理不同狀態下的所有視覺變化
	# 這裡集中管理了所有動畫和節點的顯示/隱藏
	match current_state:
		State.IDLE:
			# 設定「待機」狀態的所有視覺效果
			body_animation_player.play("playAnna")
			write_animation_player.stop()
			listen_object_node.hide()
			talking_mouth.stop()
			talking_mouth.hide()
			smile_mouth.show()
			
		State.TALKING:
			# 設定「說話」狀態的所有視覺效果
			write_animation_player.stop() # 確保不在說話時寫字
			listen_object_node.hide()
			smile_mouth.hide()
			talking_mouth.show()
			talking_mouth.play("talking")

		State.WRITING:
			# 設定「寫字」狀態的所有視覺效果
			write_animation_player.play("new_animation")
			listen_object_node.show()
			# 確保寫字時嘴巴是微笑的
			talking_mouth.stop()
			talking_mouth.hide()
			smile_mouth.show()


# 【修改】_process 函式現在是空的！
# 因為我們的邏輯是「事件驅動」的 (只在狀態改變時做事)，
# 不再需要在每一影格都去檢查狀態。這樣更有效率。
func _process(delta):
	pass


# --- 眨眼相關函式 (不變) ---
func start_blink_timer():
	var wait_time = randf_range(2.0, 4.0)
	var timer = get_tree().create_timer(wait_time)
	await timer.timeout
	blink()

func blink():
	# 眨眼時，只有眼睛的節點需要改變，不影響當前的 state
	open_eyes_node.hide()
	animated_sprite.show()
	animated_sprite.play("close_eyes")
	await animated_sprite.animation_finished
	animated_sprite.hide()
	open_eyes_node.show()
	start_blink_timer()
