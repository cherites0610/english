extends Control

# --- 節點參考 ---
@onready var mic_player = $DialogueUI/MicPlayer
@onready var voice_player = $DialogueUI/VoicePlayer
@onready var record_button = $DialogueUI/RecordButton
@onready var status_label = $DialogueUI/StatusLabel

@onready var loading_ui = $LoadingUI
@onready var dialogue_ui = $DialogueUI
@onready var settlement_ui = $SettlementUI

# --- WebSocket 相關變數 ---
var ws_peer = WebSocketPeer.new()
var is_recording = false
var is_conversation_created = false
var mp3_full_byte_array = PackedByteArray()

# --- 狀態管理相關變數 ---
var isLoading: bool = true
var has_received_first_response: bool = false

# --- 音訊相關變數 ---
var is_playing_ai_voice: bool = false
var record_bus_idx: int
var record_effect: AudioEffectCapture
var voice_playback: AudioStreamGeneratorPlayback

# 當場景載入時執行
func _ready():
	loading_ui.visible = true
	dialogue_ui.visible = false
	settlement_ui.visible = false
	
	if OS.get_name() in ["Android", "iOS"]:
		if OS.request_permissions():
			print('正在請求權限')
		else:
			# 處理權限被拒絕的情況
			status_label.text = "錯誤：需要麥克風權限才能運作！"
			record_button.disabled = true
			push_error("Microphone permission denied.")
	
	record_button.pressed.connect(_on_record_button_pressed)
	
	var url = "wss://english-api.cherites.org" # 請確保 URL 和 Port 正確
	var new_buffer_size = 1024 * 1024 * 30
	ws_peer.inbound_buffer_size = new_buffer_size
	ws_peer.outbound_buffer_size = new_buffer_size
	ws_peer.connect_to_url(url)
	status_label.text = "正在連接到伺服器..."
	voice_player.finished.connect(_on_voice_player_finished)
	
	# 取得錄音匯流排的索引 (務必確認 Audio Bus 設定正確)
	record_bus_idx = AudioServer.get_bus_index("RecordBus")
	if record_bus_idx == -1:
		push_error("找不到名為 'RecordBus' 的音訊匯流排，請檢查專案設定！")
		return


# 每一影格都會執行
func _process(delta):
	if ws_peer.get_ready_state() == WebSocketPeer.STATE_CLOSED:
		status_label.text = "連線已中斷或失敗。"
		return
		
	ws_peer.poll()
	var state = ws_peer.get_ready_state()

	if state == WebSocketPeer.STATE_OPEN:
		if not is_conversation_created:
			status_label.text = "連線成功！正在建立對話..."
			# [修改] 我們現在傳送一個包含 name 的 payload
			send_ws_event('createConversation', {"name": "TestBattle"})
			is_conversation_created = true
		
		# 處理收到的封包
		while ws_peer.get_available_packet_count() > 0:
			var packet = ws_peer.get_packet()
			
			# 後端現在只會傳送 JSON 格式的文字訊息
			var json_string = packet.get_string_from_utf8()
			var parse_result = JSON.parse_string(json_string)
			
			if parse_result:
				var event_name = parse_result.get("event", "unknown")
				var payload = parse_result.get("payload")
				handle_ws_event(event_name, payload)
			else:
				printerr("收到了無法解析的 JSON 訊息: ", json_string)

	# [重要修改] 傳送音訊的方式
	# 如果正在錄音，抓取音訊緩衝區，並直接作為二進位資料發送
	if is_recording and record_effect:
		var frames_available = record_effect.get_frames_available()
		if frames_available > 0:
			var audio_buffer: PackedVector2Array = record_effect.get_buffer(frames_available)
			var byte_array = serialize_audio_buffer(audio_buffer)
			# 直接發送 PackedByteArray，不再進行 Base64 編碼或包裝成 JSON
			ws_peer.send(byte_array)

# 當錄音按鈕被按下時
func _on_record_button_pressed():
	is_recording = not is_recording

	if is_recording:
		print("開始錄音...")
		status_label.text = "正在說話..."
		record_button.text = "停止錄音"
		
		# 建立並開始麥克風串流
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
		print("停止錄音...")
		status_label.text = "正在處理您的語音..."
		record_button.text = "開始錄音"
		record_button.disabled = true # 等待 AI 回應時禁用按鈕
		
		mic_player.stop()
		record_effect = null
		
		send_ws_event("endAudioStream", null)

func serialize_audio_buffer(buffer: PackedVector2Array) -> PackedByteArray:
	var byte_array = PackedByteArray()
	byte_array.resize(buffer.size() * 2)
	var offset = 0
	for sample in buffer:
		# 將左右聲道混合成單聲道 (取平均值)
		var mono_sample_float = (sample.x + sample.y) / 2.0
		var mono_sample_int = int(mono_sample_float * 32767.0)
		
		byte_array.encode_s16(offset, mono_sample_int)
		offset += 2
	return byte_array
	
func send_ws_event(event_name: String, payload):
	if ws_peer.get_ready_state() != WebSocketPeer.STATE_OPEN:
		printerr("WebSocket 未連線，無法發送事件 '", event_name, "'")
		return

	var event_data = { "event": event_name, "data": payload }
	var json_string = JSON.stringify(event_data)
	ws_peer.send_text(json_string)
	
func play_full_mp3():
	if mp3_full_byte_array.is_empty():
		print("沒有收到任何有效的 MP3 資料，不進行播放。")
		return

	print("準備播放完整的 MP3，總大小: %d bytes" % mp3_full_byte_array.size())
	
	var audio_stream_mp3 = AudioStreamMP3.new()
	audio_stream_mp3.data = mp3_full_byte_array

	# 清空 byte array，為下次接收做準備
	mp3_full_byte_array = PackedByteArray()

	voice_player.stream = audio_stream_mp3
	
	is_playing_ai_voice = true
	voice_player.play()
	print("✅ MP3 音訊已載入並開始播放！")
	
func _on_voice_player_finished():
	is_playing_ai_voice = false
	print("AI 語音播放完畢。")

# [重要修改] 處理來自 NestJS 伺服器的各種事件
func handle_ws_event(event_name: String, payload):
	match event_name:
		"conversationCreated":
			print("伺服器回應: ", payload.message)
			status_label.text = "請按下按鈕開始說話"
			record_button.disabled = false
			
		"audioResponse":
			# [最終修改] 收到一塊 Base64，立刻解碼，然後附加到我們的 byte array 中
			if payload and payload is String and not payload.is_empty():
				var chunk_byte_array = Marshalls.base64_to_raw(payload)
				# 如果解碼成功 (回傳的 byte array 不是空的)
				if not chunk_byte_array.is_empty():
					mp3_full_byte_array.append_array(chunk_byte_array)
					print("收到 MP3 二進位區塊，目前總大小: %d bytes" % mp3_full_byte_array.size())
				else:
					print("警告：收到一個無法解碼的 Base64 區塊，已略過。")

			if status_label.text != "AI 正在生成語音...":
				status_label.text = "AI 正在生成語音..."
			
		"endAudioResponse":
			print("\n>>> 收到 endAudioResponse 事件！準備播放！ <<<\n")
			
			if not has_received_first_response:
				isLoading = false
				has_received_first_response = true
				print("首次 AI 回應已接收，isLoading 設為 false。")
				loading_ui.visible = false
				dialogue_ui.visible = true
			
			play_full_mp3() # 呼叫變得更簡單的播放函式
			
			status_label.text = "換你了，請按下按鈕開始說話"
			record_button.disabled = false
			
		"finalResponse":
			print("對話結束: ", payload.text)
			status_label.text = "對話結束: " + payload.text
			record_button.disabled = true # 對話結束，永久禁用按鈕
			ws_peer.close()
			
			dialogue_ui.visible = false
			settlement_ui.visible = true

		_:
			print("收到未處理的事件: ", event_name)


func _on_back_button_pressed() -> void:
	print(123)
	get_tree().change_scene_to_file("res://ui/main_menu/main_menu.tscn")
	pass # Replace with function body.
