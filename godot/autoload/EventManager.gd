# EventManager.gd
extends Node

# 我們將在程式碼中建立 HTTPRequest 節點，因為這個單例沒有自己的場景
var http_request: HTTPRequest

func _ready() -> void:
	# 建立 HTTPRequest 節點並將其作為子節點加入 EventManager
	# 這樣它就能在場景樹中正常運作
	http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_request_completed)

## @brief 發送一個遊戲事件到後端
## @param event_type: String, 事件的類型 (例如 "LOGIN", "KILL_SLIME")
## @param count: int, 事件發生的次數 (預設為 1)
func post_event(event_type: String, count: int = 1) -> void:
	print("Posting event: %s, Count: %d" % [event_type, count])
	
	var url = GlobalState.BASE_URL + "/quest/event"
	
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		print("EventManager: Missing auth token. Cannot post event.")
		return
	
	headers_dict["content-type"] = "application/json"
	var headers_array = PackedStringArray()
	for key in headers_dict:
		headers_array.append(key + ": " + headers_dict[key])

	var body_dict = {
		"eventType": event_type,
		"count": count
	}
	var body_string = JSON.stringify(body_dict)

	# 發送 POST 請求
	var error = http_request.request(url, headers_array, HTTPClient.METHOD_POST, body_string)
	
	if error != OK:
		print("EventManager: An error occurred in the HTTP request.")

# 當 API 請求完成後
func _on_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code >= 200 and response_code < 300:
		print("Event successfully posted to server. Response code: ", response_code)
		# 如果需要，可以在這裡解析後端的回應
		# var json = JSON.parse_string(body.get_string_from_utf8())
	else:
		print("EventManager: Failed to post event. Response code: " + str(response_code))
		print("Response body: ", body.get_string_from_utf8())
