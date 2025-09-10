extends Control

# 1. 宣告變數來存放我們的節點
# @onready 關鍵字確保在我們使用這些變數之前，節點都已經準備好了。
# 我們用 $ 符號來快速取得場景樹中的子節點。
@onready var npc1 = $Npc1
@onready var npc2 = $Npc2
@onready var npc_spawn_locations = $NpcSpawnLocations

@onready var task_button = $SubMenu/TaskButton
@onready var task_request = $TaskRequest
@onready var mail_button = $SubMenu/MailButton
@onready var settings_button = $SubMenu/SettingsButton

const SubMenuScene = preload("res://ui/hud/sub_menu.tscn")
const ModalScene = preload("res://ui/hud/modal.tscn")
var current_modal = null

# _ready 函式會在場景啟動時自動執行一次
func _ready():
	# 呼叫我們自己寫的函式來處理 NPC 的位置
	randomize_npc_positions()
	
	var sub_menu_instance = SubMenuScene.instantiate()
	# 將 SubMenu 實例加入到場景中
	add_child(sub_menu_instance) 
	# 像之前一樣，設定它的位置
	sub_menu_instance.position = Vector2(20, 20) 
	
	sub_menu_instance.task_button_pressed.connect(_on_task_button_pressed)
	sub_menu_instance.mail_button_pressed.connect(_on_mail_button_pressed)
	sub_menu_instance.settings_button_pressed.connect(_on_settings_button_pressed)

func _on_task_button_pressed():
	var modal = ModalScene.instantiate()
	add_child(modal)
	modal.show_quests(modal.QuestViewType.REGULAR)

func _on_mail_button_pressed():
	var modal = ModalScene.instantiate()
	add_child(modal)
	modal.show_with_content("郵件", "您目前沒有新郵件。")

func _on_settings_button_pressed():
	var modal = ModalScene.instantiate()
	add_child(modal)
	modal.show_with_content("設定", "音量設定\n畫質設定\n...")
	
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


func _on_button_2_pressed() -> void:
	get_tree().change_scene_to_file("res://ui/friend/FriendsPage.tscn")
