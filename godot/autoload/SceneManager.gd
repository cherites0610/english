# SceneManager.gd
extends Node

# --- 請將 "res://loading.tscn" 替換成你讀取畫面的實際路徑 ---
const LoadingScene = preload("res://scenes/loading.tscn")

# 用一個變數來存放目前讀取畫面的實例，方便之後移除
var current_loading_instance = null

## @brief 顯示讀取畫面
## 這個函式會建立一個讀取畫面的實例，並將它加到螢幕最上層
func show_loading_screen() -> void:
	if is_instance_valid(current_loading_instance):
		print("SceneManager: Loading screen is already visible.")
		return
		
	print("SceneManager: Showing loading screen.")
	current_loading_instance = LoadingScene.instantiate()
	
	# 將 add_child 的操作推遲到安全的時候執行
	get_tree().root.call_deferred("add_child", current_loading_instance)

## @brief 隱藏並移除讀取畫面
func hide_loading_screen() -> void:
	# 確認讀取畫面的實例還存在
	if is_instance_valid(current_loading_instance):
		print("SceneManager: Hiding loading screen.")
		# queue_free() 會安全地將節點從場景樹中移除並釋放記憶體
		current_loading_instance.queue_free()
		current_loading_instance = null
	else:
		print("SceneManager: No loading screen instance to hide.")
