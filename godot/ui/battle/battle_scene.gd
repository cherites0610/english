extends Control

# --- 節點參考 ---
@onready var mic_player = $MicPlayer
@onready var voice_player = $VoicePlayer
@onready var record_button = $RecordButton

# --- WebSocket 相關變數 ---
var ws_peer = WebSocketPeer.new()
var is_recording = false

var is_conversation_created = false

# --- 音訊相關變數 ---
var record_bus_idx: int # 錄音匯流排的索引
var record_effect: AudioEffectCapture # 錄音效果的實例
var voice_playback: AudioStreamGeneratorPlayback # 語音播放器

# 當場景載入時執行
func _ready():
	# 連接錄音按鈕的 pressed 信號到我們的函式
	record_button.pressed.connect(_on_record_button_pressed)
	
	# 初始化 WebSocket (請換成你自己的伺服器 URL)
	var url = "ws://127.0.0.1:5010"
	ws_peer.connect_to_url(url)
	print("正在連接到 WebSocket 伺服器...")
		# 初始化音訊播放器，用於播放收到的語音
	var stream_generator = AudioStreamGenerator.new()
	stream_generator.mix_rate = AudioServer.get_mix_rate() # 確保取樣率一致
	stream_generator.buffer_length = 0.1 # 較小的緩衝區以降低延遲
	voice_player.stream = stream_generator
	
	# 取得錄音匯流排的索引
	record_bus_idx = AudioServer.get_bus_index("RecordBus")


# 每一影格都會執行
func _process(delta):
	# 1. 處理 WebSocket 連線
	ws_peer.poll()
	var state = ws_peer.get_ready_state()

	if state == WebSocketPeer.STATE_OPEN:
		
		if not is_conversation_created:
				print("WebSocket 已連接，正在建立對話...")
				send_ws_event('createConversation', {"name": "123"})
				is_conversation_created = true
		
		while ws_peer.get_available_packet_count() > 0:
			var packet = ws_peer.get_packet()
			
			# 假設所有訊息都是 UTF8 編碼的 JSON 字串
			var json_string = packet.get_string_from_utf8()
			var parse_result = JSON.parse_string(json_string)
			
			if parse_result:
				var event_name = parse_result.get("event", "unknown")
				var payload = parse_result.get("payload")
				handle_ws_event(event_name, payload)
			else:
				printerr("收到了無法解析的 JSON 訊息: ", json_string)
		
	# 2. 如果正在錄音，抓取音訊緩衝區、編碼並作為事件發送
	if is_recording and record_effect:
		var frames_available = record_effect.get_frames_available()
		if frames_available > 0:
			var audio_buffer: PackedVector2Array = record_effect.get_buffer(frames_available)
			var byte_array = serialize_audio_buffer(audio_buffer)
			var base64_string = Marshalls.raw_to_base64(byte_array)
			send_ws_event("audio_chunk", base64_string)
# 當錄音按鈕被按下時
func _on_record_button_pressed():
	is_recording = not is_recording  # 切換錄音狀態

	if is_recording:
		print("開始錄音...")

		# 建立麥克風音訊流
		var mic_stream := AudioStreamMicrophone.new()
		mic_player.stream = mic_stream

		# 將 MicPlayer 的輸出指向我們的 RecordBus
		mic_player.bus = "RecordBus"
		mic_player.play()

		# 取得錄音效果 (注意: 用 get_bus_effect 而不是 get_bus_effect_instance)
		var record_bus_idx := AudioServer.get_bus_index("RecordBus")
		record_effect = AudioServer.get_bus_effect(record_bus_idx, 0) as AudioEffectCapture

		if record_effect:
			print("已取得錄音效果，可以讀取 buffer")
		else:
			push_error("RecordBus 上沒有 AudioEffectCapture，請確認 Audio Bus 設定")

		record_button.text = "停止錄音"
	else:
		print("停止錄音...")
		mic_player.stop()
		record_effect = null
		record_button.text = "開始錄音"

# 將收到的音訊位元組推送到播放器
func push_voice_data(byte_array: PackedByteArray):
	if voice_playback == null:
		# 首次收到資料時，開始播放並取得 playback 物件
		voice_player.play()
		voice_playback = voice_player.get_stream_playback()

	# 將位元組陣列反序列化回音訊緩衝區
	var audio_buffer = deserialize_byte_array(byte_array)
	print(audio_buffer)
	# 將音訊緩衝區推送到播放器
	voice_playback.push_buffer(audio_buffer)


# 將音訊緩衝區 (PackedVector2Array) 序列化為位元組 (PackedByteArray)
func serialize_audio_buffer(buffer: PackedVector2Array) -> PackedByteArray:
	# 每個音訊影格 (sample) 包含 2 個 float (左/右聲道)
	# 每個 float 我們要轉成 1 個 s16 (2 個位元組)
	# 所以總位元組數 = 影格數 * 2 (聲道) * 2 (位元組)
	var final_size = buffer.size() * 4
	var byte_array = PackedByteArray()
	byte_array.resize(final_size)
	
	var offset = 0
	for sample in buffer:
		# 將 float (-1 to 1) 轉換為 int16 (-32768 to 32767)
		var left_int = int(sample.x * 32767.0)
		var right_int = int(sample.y * 32767.0)
		
		# 1. 呼叫 encode_s16()，它不回傳任何值
		byte_array.encode_s16(offset, left_int)
		# 2. 手動將 offset 增加 2 (因為 s16 佔 2 個位元組)
		offset += 2
		
		# 對右聲道重複此操作
		byte_array.encode_s16(offset, right_int)
		offset += 2
		
	return byte_array


# 將位元組 (PackedByteArray) 反序列化回音訊緩衝區 (PackedVector2Array)
func deserialize_byte_array(byte_array: PackedByteArray) -> PackedVector2Array:
	var buffer = PackedVector2Array()
	# 每次讀取 4 個位元組 (2 for left, 2 for right)
	for i in range(0, byte_array.size(), 4):
		var left_int = byte_array.decode_s16(i)
		var right_int = byte_array.decode_s16(i + 2)
		# 將 int16 轉回 float
		var sample_x = float(left_int) / 32767.0
		var sample_y = float(right_int) / 32767.0
		buffer.push_back(Vector2(sample_x, sample_y))
	return buffer


func _on_back_button_pressed() -> void:
	print('123')
	
	# 建立一個輔助函式來發送結構化事件
func send_ws_event(event_name: String, payload):
	if ws_peer.get_ready_state() != WebSocketPeer.STATE_OPEN:
		printerr("WebSocket 未連線，無法發送事件 '", event_name, "'")
		return

	# 1. 建立一個 Dictionary 來存放事件資料
	var event_data = {
		"event": event_name,
		"data": payload
	}
	
	# 2. 將 Dictionary 轉換為 JSON 字串
	var json_string = JSON.stringify(event_data)
	print(json_string)
	# 3. 透過 WebSocket 傳送文字 (JSON)
	ws_peer.send_text(json_string)

func handle_ws_event(event_name: String, payload):
	match event_name:
		"message":
			print("接收到 'message' 事件: ", payload)
		"audio_chunk":
			var byte_array = Marshalls.base64_to_raw(payload)
			push_voice_data(byte_array)
			
		_:
			print("收到未處理的事件: ", event_name)
