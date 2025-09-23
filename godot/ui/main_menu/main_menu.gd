extends Control

# 1. 宣告變數來存放我們的節點
# @onready 關鍵字確保在我們使用這些變數之前，節點都已經準備好了。
# 我們用 $ 符號來快速取得場景樹中的子節點。
@onready var npc1 = $Npc1
@onready var npc2 = $Npc2
@onready var npc_spawn_locations = $NpcSpawnLocations

const QuestModalScene = preload("res://ui/hud/quest/quest_modal.tscn")
const SettingModalScene  = preload("res://ui/hud/settings_modal.tscn")
const MailModalScene  = preload("res://ui/hud/mail/MailModal.tscn")


@onready var background = $Background
@onready var house_buttons = [
	$Background/HouseButton1,
	$Background/HouseButton2,
	$Background/HouseButton3,
	$Background/HouseButton4,
	$Background/HouseButton5
]

const SubMenuScene = preload("res://ui/hud/sub_menu.tscn")
var current_modal = null

# _ready 函式會在場景啟動時自動執行一次
func _ready():
	print('背景',background)
	# 呼叫我們自己寫的函式來處理 NPC 的位置
	randomize_npc_positions()
	var sub_menu_instance = SubMenuScene.instantiate()
	# 將 SubMenu 實例加入到場景中
	add_child(sub_menu_instance) 
	# 像之前一樣，設定它的位置
	sub_menu_instance.position = Vector2(20, 150) 
	sub_menu_instance.z_index = 100
	sub_menu_instance.task_button_pressed.connect(_on_task_button_pressed)
	sub_menu_instance.mail_button_pressed.connect(_on_mail_button_pressed)
	sub_menu_instance.settings_button_pressed.connect(_on_settings_button_pressed)
	sub_menu_instance.friend_button.pressed.connect(_on_friend_button_pressed)


func _on_task_button_pressed():
	var quest_modal = QuestModalScene.instantiate()
	add_child(quest_modal)

func _on_mail_button_pressed():
	print(123)
	var mail_modal = MailModalScene.instantiate()
	add_child(mail_modal)

func _on_settings_button_pressed():
	var setting_modal = SettingModalScene.instantiate()
	add_child(setting_modal)
	setting_modal.show_modal()
	
func _on_friend_button_pressed():
	get_tree().change_scene_to_file("res://ui/friend/FriendsPage.tscn")
	
# 這是一個自訂函式，專門用來處理 NPC 的隨機位置邏輯
func randomize_npc_positions():
	# 2. 取得所有可用的出生點 (Marker2D 節點)
	var spawn_points = npc_spawn_locations.get_children()
	
	# 3. 將出生點的陣列順序隨機打亂
	spawn_points.shuffle()
	
	# 4. 檢查是否有足夠的出生點
	if spawn_points.size() >= 2:
		# 5. 將 NPC 移動到打亂後的前兩個出生點的位置
		#    我們使用 .global_position 來確保座標是正確的
		npc1.global_position = spawn_points[0].global_position
		npc2.global_position = spawn_points[1].global_position
	else:
		print("警告：NPC 出生點少於 2 個！")

func _on_house_button_1_pressed():
	GlobalState.current_level_id = "house_1"
	print("第一個房屋被點擊了！")
	get_tree().change_scene_to_file("res://ui/battle/battle_scene.tscn")


func _on_house_button_2_pressed() -> void:
	GlobalState.current_level_id = "house_2"
	print("第二個房屋被點擊了！")
	get_tree().change_scene_to_file("res://ui/battle/battle_scene.tscn")


func _on_house_button_3_pressed() -> void:
	GlobalState.current_level_id = "house_3"
	print("第三個房屋被點擊了！")
	get_tree().change_scene_to_file("res://ui/battle/battle_scene.tscn")


func _on_house_button_4_pressed() -> void:
	GlobalState.current_level_id = "house_4"
	print("第四個房屋被點擊了！")
	get_tree().change_scene_to_file("res://ui/battle/battle_scene.tscn")


func _on_house_button_5_pressed() -> void:
	GlobalState.current_level_id = "house_5"
	print("第五個房屋被點擊了！")
	get_tree().change_scene_to_file("res://ui/battle/battle_scene.tscn")


func _on_button_pressed() -> void:
	if npc1.finish:
		npc1.set_finish(false)
	else:
		npc1.set_finish(true)
		
	pass # Replace with function body.
