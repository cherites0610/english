extends Control

# --- 節點參考 ---
@onready var mic_player = $DialogueUI/MicPlayer
@onready var voice_player = $DialogueUI/VoicePlayer
@onready var record_button = $DialogueUI/RecordButton
@onready var status_label = $DialogueUI/StatusLabel

@onready var animate = $DialogueUI/PlayAnna

@onready var loading_ui = $LoadingUI
@onready var dialogue_ui = $DialogueUI
@onready var settlement_ui = $SettlementUI
# [新增] 結算介面內部元件的參考
@onready var summary_label = $SettlementUI/ColorRect/VBoxContainer/SummaryLabel
@onready var grammer_laber = $SettlementUI/ColorRect/VBoxContainer/GrammarLabel
@onready var keywords_container = $SettlementUI/ColorRect/VBoxContainer/KeywordsContainer
@onready var confirm_button = $SettlementUI/ColorRect/VBoxContainer/ConfirmButton

# --- WebSocket 相關變數 ---
var ws_peer = WebSocketPeer.new()
var is_recording = false
var is_conversation_created = false
var mp3_full_byte_array = PackedByteArray()

# --- 狀態管理相關變數 ---
var has_received_first_response: bool = false

# --- 音訊相關變數 ---
var is_playing_ai_voice: bool = false
var record_bus_idx: int
var record_effect: AudioEffectCapture
var voice_playback: AudioStreamGeneratorPlayback

# 當場景載入時執行
func _ready():
	loading_ui.show()
	dialogue_ui.visible = false
	settlement_ui.visible = false # 確保結算介面一開始也是隱藏的
	
	if OS.get_name() in ["Android", "iOS"]:
		if OS.request_permissions():
			print('正在請求權限')
		else:
			status_label.text = "錯誤：需要麥克風權限才能運作！"
			record_button.disabled = true
			push_error("Microphone permission denied.")
	
	record_button.pressed.connect(_on_record_button_pressed)
	# [新增] 連接結算介面的確認按鈕信號
	confirm_button.pressed.connect(_on_confirm_button_pressed)
	animate.set_state(animate.State.IDLE)
	var url = "wss://7347a8d2caae.ngrok-free.app"
	var new_buffer_size = 1024 * 1024 * 30
	ws_peer.inbound_buffer_size = new_buffer_size
	ws_peer.outbound_buffer_size = new_buffer_size
	ws_peer.connect_to_url(url)
	status_label.text = "正在連接到伺服器..."
	voice_player.finished.connect(_on_voice_player_finished)
	
	record_bus_idx = AudioServer.get_bus_index("RecordBus")
	if record_bus_idx == -1:
		push_error("找不到名為 'RecordBus' 的音訊匯流排，請檢查專案設定！")
		return

# 每一影格都會執行
func _process(delta):
	if ws_peer.get_ready_state() == WebSocketPeer.STATE_CLOSED:
		# 如果連線已中斷，且不是在結算畫面，才顯示錯誤
		if not settlement_ui.visible:
			status_label.text = "連線已中斷或失敗。"
		return
		
	ws_peer.poll()
	var state = ws_peer.get_ready_state()

	if state == WebSocketPeer.STATE_OPEN:
		if not is_conversation_created:
			status_label.text = "連線成功！正在建立對話..."
			var conversation_data = {
		#"name": GlobalState.current_level_id, # 這個 name 欄位可以對應 battle.name 或 npc.name
		"name":"汽車",
		"userID": GlobalState.user_profile.id,
	  }
			send_ws_event('createConversation', conversation_data)
			is_conversation_created = true
		
		while ws_peer.get_available_packet_count() > 0:
			var packet = ws_peer.get_packet()
			var json_string = packet.get_string_from_utf8()
			var parse_result = JSON.parse_string(json_string)
			
			if parse_result:
				var event_name = parse_result.get("event", "unknown")
				var payload = parse_result.get("payload", {}) # 提供一個預設空字典
				handle_ws_event(event_name, payload)
			else:
				printerr("收到了無法解析的 JSON 訊息: ", json_string)

	if is_recording and record_effect:
		var frames_available = record_effect.get_frames_available()
		if frames_available > 0:
			var audio_buffer: PackedVector2Array = record_effect.get_buffer(frames_available)
			var byte_array = serialize_audio_buffer(audio_buffer)
			ws_peer.send(byte_array)

# --- WebSocket & 事件處理 ---

func handle_ws_event(event_name: String, payload):
	match event_name:
		"audioResponse":
			if payload and payload is String and not payload.is_empty():
				var chunk_byte_array = Marshalls.base64_to_raw(payload)
				if not chunk_byte_array.is_empty():
					mp3_full_byte_array.append_array(chunk_byte_array)
			if status_label.text != "AI 正在生成語音...":
				status_label.text = "AI 正在生成語音..."
			
		"endAudioResponse":
			print(">>> 收到 endAudioResponse 事件！準備播放！ <<<")
			if not has_received_first_response:
				loading_ui.hide()
				has_received_first_response = true
				dialogue_ui.visible = true
			
			play_full_mp3()
			status_label.text = "換你了，請按下按鈕開始說話"
			record_button.disabled = false
			
		"finalResponse":
			# [修改] 這個事件現在只負責顯示最終文字，並禁用錄音，等待 summary
			var final_text = payload.get("text", "對話已結束。")
			print("收到最終回覆: ", final_text)
			status_label.text = "對話分析中..."
			record_button.disabled = true # 對話結束，禁用按鈕等待總結
			
		"conversationAnalysisReady":
			# [修改] 從 payload 中獲取完整的 analysis 物件
			print("收到對話分析結果！", payload)
			var analysis_data = payload.get("analysis", {}) # 安全地獲取，若不存在則返回空字典
			# [修改] 將完整的 analysis 物件傳遞給 UI 函式
			call_deferred("show_settlement_ui", analysis_data)
			
		_:
			print("收到未處理的事件: ", event_name)

func send_ws_event(event_name: String, payload):
	if ws_peer.get_ready_state() != WebSocketPeer.STATE_OPEN:
		printerr("WebSocket 未連線，無法發送事件 '", event_name, "'")
		return
	var event_data = { "event": event_name, "data": payload }
	var json_string = JSON.stringify(event_data)
	ws_peer.send_text(json_string)

# --- UI & 場景控制 ---

# [新增] 顯示結算介面的函式
func show_settlement_ui(analysis_data: Dictionary):
	# 1. 隱藏對話介面
	dialogue_ui.hide()
	
	# 2. 安全性檢查：如果資料為空，顯示錯誤訊息
	if analysis_data.is_empty():
		summary_label.text = "分析資料載入失敗，請稍後再試。"
		grammer_laber.text = ""
		# 清除可能殘留的舊關鍵字
		for child in keywords_container.get_children():
			child.queue_free()
		# 顯示介面讓使用者知道結果
		settlement_ui.show()
		return
		
	# 3. 從字典中安全地獲取資料並更新 UI 元件
	summary_label.text = analysis_data.get("summary", "無摘要資訊。")
	grammer_laber.text = analysis_data.get("grammar", "無文法分析。")
	
	# 4. 動態生成關鍵字列表
	# 4a. 先清除上一次可能殘留的舊關鍵字
	for child in keywords_container.get_children():
		child.queue_free()
	
	# 4b. 遍歷關鍵字陣列，為每一個關鍵字建立一個新的 Label
	var keywords_array = analysis_data.get("keywords", [])
	for item in keywords_array:
		if item is Dictionary:
			var word = item.get("word", "N/A")
			var explanation = item.get("explanation", "N/A")
			
			var keyword_label = Label.new()
			keyword_label.text = "• %s: %s" % [word, explanation] # 使用項目符號 • 增加可讀性
			keyword_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART # 設定自動換行
			keywords_container.add_child(keyword_label)
	
	# 5. 顯示整個結算介面
	settlement_ui.show()
	
	# 6. 加入動畫，讓介面淡入
	var tween = create_tween()
	tween.tween_property(settlement_ui, "modulate", Color.WHITE, 0.5).from(Color.TRANSPARENT)
	
	# 7. 收到摘要後，安全地關閉連線
	if ws_peer.get_ready_state() == WebSocketPeer.STATE_OPEN:
		ws_peer.close()
		print("已收到摘要，WebSocket 連線已關閉。")


# [新增] 當結算介面的 "確認" 按鈕被按下時
func _on_confirm_button_pressed():
	settlement_ui.hide()
	get_tree().change_scene_to_file("res://ui/main_menu/main_menu.tscn")
	print("結算確認按鈕被按下，返回主選單。")


func _on_back_button_pressed() -> void:
	get_tree().change_scene_to_file("res://ui/main_menu/main_menu.tscn")

# --- 音訊錄製 & 播放 (以下函式保持不變) ---

func _on_record_button_pressed():
	is_recording = not is_recording
	if is_recording:
		status_label.text = "正在說話..."
		record_button.text = "停止錄音"
		
		# [新增] 告訴 Anna 開始寫字
		animate.set_state(animate.State.WRITING)
		
		# (麥克風啟動邏輯不變)
		var mic_stream := AudioStreamMicrophone.new()
		mic_player.stream = mic_stream
		mic_player.bus = "RecordBus"
		mic_player.play()
		record_effect = AudioServer.get_bus_effect(record_bus_idx, 0) as AudioEffectCapture
		if not record_effect:
			push_error("在 'RecordBus' 上找不到 AudioEffectCapture 實例！")
			is_recording = false
			return
	else:
		status_label.text = "正在處理您的語音..."
		record_button.text = "開始錄音"
		record_button.disabled = true
		
		# [新增] 告訴 Anna 停止寫字，回到待機狀態
		animate.set_state(animate.State.IDLE)
		
		# (麥克風停止邏輯不變)
		mic_player.stop()
		record_effect = null
		send_ws_event("endAudioStream", null)

func serialize_audio_buffer(buffer: PackedVector2Array) -> PackedByteArray:
	var byte_array = PackedByteArray()
	byte_array.resize(buffer.size() * 2)
	var offset = 0
	for sample in buffer:
		var mono_sample_float = (sample.x + sample.y) / 2.0
		var mono_sample_int = int(mono_sample_float * 32767.0)
		byte_array.encode_s16(offset, mono_sample_int)
		offset += 2
	return byte_array
	
func play_full_mp3():
	if mp3_full_byte_array.is_empty():
		print("沒有收到任何有效的 MP3 資料，不進行播放。")
		return

	# [新增] 告訴 Anna 開始說話
	animate.set_state(animate.State.TALKING)

	var audio_stream_mp3 = AudioStreamMP3.new()
	audio_stream_mp3.data = mp3_full_byte_array
	mp3_full_byte_array = PackedByteArray()
	voice_player.stream = audio_stream_mp3
	is_playing_ai_voice = true
	voice_player.play()
	print("✅ MP3 音訊已載入並開始播放！")
	
func _on_voice_player_finished():
	is_playing_ai_voice = false
	
	# [新增] 告訴 Anna 停止說話，回到待機狀態
	animate.set_state(animate.State.IDLE)
	
	print("AI 語音播放完畢。")
