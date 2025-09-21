extends Node2D

# 透過 @onready 取得節點參考
@onready var animated_sprite = $AnimatedSprite2D
@onready var open_eyes_node = $張眼 # 包含張眼圖片的 Node2D

func _ready():
	# 初始化隨機數生成器
	randomize() 
	# 確保 AnimatedSprite2D 初始是隱藏的
	animated_sprite.hide()
	# 開始眨眼計時器
	start_blink_timer()

func start_blink_timer():
	# 選擇一個介於 2 到 6 秒之間的隨機等待時間
	var wait_time = randf_range(2.0, 4.0) 
	# 使用 SceneTreeTimer 進行非同步計時
	var timer = get_tree().create_timer(wait_time)
	# 等待計時器結束
	await timer.timeout
	blink()

func blink():
	# 隱藏張眼的圖片
	open_eyes_node.hide()
	
	# 顯示閉眼動畫節點並播放
	animated_sprite.show()
	animated_sprite.play("close_eyes")
	
	# 等待眨眼動畫播放完畢
	await animated_sprite.animation_finished
	
	# 動畫播放完畢後，隱藏閉眼動畫節點
	animated_sprite.hide()
	
	# 重新顯示張眼的圖片
	open_eyes_node.show()
	
	# 再次開始計時器，以進行下一次眨眼
	start_blink_timer()
