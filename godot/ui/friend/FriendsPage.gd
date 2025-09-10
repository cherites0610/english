extends Control

const FriendListItemScene = preload("res://ui/friend/FriendListItem.tscn")
const PendingListItemScene = preload("res://ui/friend/pending_list_item.tscn")
const SearchResultItemScene = preload("res://ui/friend/search_result_item.tscn")

@onready var http_request: HTTPRequest = $ApiRequest
@onready var tab_container: TabContainer = $TabContainer
@onready var friends_list_container: VBoxContainer = $TabContainer/FriendsListTab
@onready var pending_list_container: VBoxContainer = $TabContainer/PendingListTab
@onready var search_input: LineEdit = $TabContainer/SearchTab/HBoxContainer/SearchInput
@onready var search_button: Button = $TabContainer/SearchTab/HBoxContainer/SearchButton
@onready var search_results_container: VBoxContainer = $TabContainer/SearchTab/ScrollContainer/SearchResultsContainer

var friends_data: Array = []
var pending_data: Array = []
var search_results_data: Array = []

var current_request_type: String = ""

func _ready() -> void:
	http_request.request_completed.connect(_on_api_request_completed)
	tab_container.tab_changed.connect(_on_tab_changed)
	search_button.pressed.connect(_on_search_button_pressed)
	
	# 立即載入第一個分頁的內容
	fetch_friends_list()

# 當分頁被切換時呼叫
func _on_tab_changed(tab_idx: int) -> void:
	match tab_idx:
		0: # 第一個分頁 (好友列表)
			fetch_friends_list()
		1: # 第二個分頁 (待處理邀請)
			fetch_pending_list()
		2: # 第三個分頁 (搜尋)
			pass # 暫時不做事

func fetch_pending_list() -> void:
	current_request_type = "fetch_pending"
	var url = GlobalState.BASE_URL + "/friend-ship/pending"
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		print("FriendsPage: Missing auth token.")
		return

	var headers_array = PackedStringArray()
	for key in headers_dict: headers_array.append(key + ": " + headers_dict[key])
	
	http_request.request(url, headers_array, HTTPClient.METHOD_GET)


func fetch_friends_list() -> void:
	current_request_type = "fetch_list"
	var url = GlobalState.BASE_URL + "/friend-ship"
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		print("FriendsPage: Missing auth token.")
		return
	
	var headers_array = PackedStringArray()
	for key in headers_dict: headers_array.append(key + ": " + headers_dict[key])
	
	http_request.request(url, headers_array, HTTPClient.METHOD_GET)

func _on_search_button_pressed() -> void:
	var query = search_input.text.strip_edges()
	if query.is_empty():
		print("Search query is empty.")
		return
	search_for_user(query)
	
func search_for_user(user_name: String) -> void:
	current_request_type = "search_user"
	# URL 編碼以處理特殊字元
	var encoded_name = user_name.uri_encode()
	var url = GlobalState.BASE_URL + "/user/" + encoded_name
	
	var headers_dict = GlobalState.get_auth_header()
	var headers_array = PackedStringArray()
	for key in headers_dict: headers_array.append(key + ": " + headers_dict[key])
	
	http_request.request(url, headers_array, HTTPClient.METHOD_GET)

func send_friend_request(user_id: String) -> void:
	current_request_type = "send_request"
	var url = GlobalState.BASE_URL + "/friend-ship/request"
	
	var headers_dict = GlobalState.get_auth_header()
	headers_dict["content-type"] = "application/json"
	var headers_array = PackedStringArray()
	for key in headers_dict: headers_array.append(key + ": " + headers_dict[key])
	
	var body_dict = { "addresseeID": user_id }
	http_request.request(url, headers_array, HTTPClient.METHOD_POST, JSON.stringify(body_dict))

func delete_friend(friend_id: String) -> void:
	current_request_type = "delete_friend"
	var url = GlobalState.BASE_URL + "/friend-ship/friend/" + friend_id
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		print("FriendsPage: Missing auth token.")
		return
		
	headers_dict["content-type"] = "application/json"
	var headers_array = PackedStringArray()
	for key in headers_dict: headers_array.append(key + ": " + headers_dict[key])
	
	var body_dict = { "addresseeID": friend_id }
	http_request.request(url, headers_array, HTTPClient.METHOD_DELETE, JSON.stringify(body_dict))

# --- 新增的函式 ---
func respond_to_request(requester_id: String, status: String) -> void:
	current_request_type = "respond_request"
	var url = GlobalState.BASE_URL + "/friend-ship/respond"
	var headers_dict = GlobalState.get_auth_header()
	if headers_dict.is_empty():
		print("FriendsPage: Missing auth token.")
		return
	
	headers_dict["content-type"] = "application/json"
	var headers_array = PackedStringArray()
	for key in headers_dict: headers_array.append(key + ": " + headers_dict[key])
	
	# API Body 需要 requesterID 和 status ("accepted" or "rejected")
	var body_dict = {
		"requesterID": requester_id,
		"status": status
	}
	http_request.request(url, headers_array, HTTPClient.METHOD_PATCH, JSON.stringify(body_dict))

func _on_api_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if not (response_code >= 200 and response_code < 300):
		print("FriendsPage: Request failed with code: " + str(response_code) + " for request type: " + current_request_type)
		print("Response body: ", body.get_string_from_utf8())
		return

	match current_request_type:
		"fetch_list":
			var json = JSON.parse_string(body.get_string_from_utf8())
			if json:
				friends_data = json.data
				update_friends_list_ui()
		"delete_friend":
			print("成功刪除好友！")
			fetch_friends_list()
		# --- 新增的 Case ---
		"fetch_pending":
			var json = JSON.parse_string(body.get_string_from_utf8())
			if json:
				pending_data = json.data
				update_pending_list_ui()
		"respond_request":
			print("成功回應好友邀請！")
			# 回應後，重新整理待處理列表
			fetch_pending_list()
		"search_user":
			var json = JSON.parse_string(body.get_string_from_utf8())
			if json:
				search_results_data = json.data
				update_search_results_ui()
		"send_request":
			print("好友邀請已成功發送！")

func update_search_results_ui() -> void:
	for child in search_results_container.get_children(): child.queue_free()
	
	for user in search_results_data:
		var item = SearchResultItemScene.instantiate()
		search_results_container.add_child(item)
		item.set_user_data(user)
		item.add_friend_requested.connect(_on_add_friend_requested)

func update_friends_list_ui() -> void:
	for child in friends_list_container.get_children(): child.queue_free()
	for friend in friends_data:
		var item = FriendListItemScene.instantiate()
		friends_list_container.add_child(item)
		item.set_friend_data(friend)
		item.delete_requested.connect(_on_friend_delete_requested)
		
func _on_add_friend_requested(user_id: String) -> void:
	print("Requesting to add friend with ID: ", user_id)
	send_friend_request(user_id)

# --- 新增的函式 ---
func update_pending_list_ui() -> void:
	for child in pending_list_container.get_children(): child.queue_free()
	for request in pending_data:
		var item = PendingListItemScene.instantiate()
		pending_list_container.add_child(item)
		item.set_pending_data(request)
		# 連接接受和拒絕的信號
		item.accept_requested.connect(_on_request_accepted)
		item.decline_requested.connect(_on_request_declined)

func _on_friend_delete_requested(friend_id: String) -> void:
	delete_friend(friend_id)

# --- 新增的函式 ---
func _on_request_accepted(requester_id: String) -> void:
	respond_to_request(requester_id, "accepted")

func _on_request_declined(requester_id: String) -> void:
	# 根據你的API，拒絕可能也是用 "rejected" 或 "declined"
	# 這裡我們假設用 "rejected"，你可以根據實際情況修改
	respond_to_request(requester_id, "rejected")
