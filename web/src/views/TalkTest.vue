<template>
    <div class="page-container">
        <h1>端到端即時語音對話 DEMO</h1>

        <div v-if="!talkId" class="setup-container">
            <el-card class="box-card">
                <template #header>
                    <div class="card-header">
                        <span>請輸入 Battle ID 以開始</span>
                    </div>
                </template>
                <el-form @submit.prevent="handleStartConversation">
                    <el-form-item label="Battle ID">
                        <el-input v-model="inputBattleId" placeholder="請貼上你的 Battle ID" clearable></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleStartConversation" :loading="isConnecting" native-type="submit" style="width: 100%;">
                            {{ isConnecting ? '連線中...' : '開始對話' }}
                        </el-button>
                    </el-form-item>
                </el-form>
            </el-card>
        </div>

        <el-card class="box-card" v-else>
            <template #header>
                <div class="card-header">
                    <span>對話 Session ID: {{ talkId }}</span>
                </div>
            </template>

            <div class="conversation-history" ref="historyBoxRef">
                <div v-for="(msg, index) in conversationHistory" :key="index" :class="['message', msg.role]">
                    <el-avatar class="avatar">{{ msg.role === 'USER' ? 'U' : 'AI' }}</el-avatar>
                    <div class="content">{{ msg.content }}</div>
                </div>
                <div v-if="isAiResponding" class="message AI">
                    <el-avatar class="avatar">AI</el-avatar>
                    <div class="content loading-dots"><span>.</span><span>.</span><span>.</span></div>
                </div>
            </div>

            <div class="action-area">
                <el-button :type="isRecording ? 'info' : 'danger'" class="talk-button"
                    @mousedown="startRecording" @mouseup="stopRecording" @mouseleave="stopRecording">
                    <el-icon size="24">
                        <Microphone />
                    </el-icon>
                    <span>{{ isRecording ? '鬆開結束' : '按住說話' }}</span>
                </el-button>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Microphone } from '@element-plus/icons-vue';
import axios from 'axios';
import { io } from 'socket.io-client';

// --- 組態設定 ---
const API_BASE_URL = import.meta.env.VITE_API_URL;      // 你的後端 API 位址
const USER_ID = 'b1269c29-a644-4a24-93c1-7bd541572f97';                   // 應來自你的使用者認證系統
const BATTLE_ID_FOR_DEMO = '443893a7-8d6a-4c49-be13-0f4daf4b4fce';// 請填入一個用於測試的 Battle ID

// --- 響應式狀態 (State) ---
const talkId = ref(null);
const conversationHistory = ref([]);
const isRecording = ref(false);
const isAiResponding = ref(false);
const historyBoxRef = ref(null);

// --- 新增的狀態 ---
const inputBattleId = ref('443893a7-8d6a-4c49-be13-0f4daf4b4fce'); // 預設填入舊的ID方便測試
const isConnecting = ref(false); // 用於「開始對話」按鈕的載入狀態

// --- 核心模組變數 ---
let socket = null;
let mediaRecorder = null;
let audioContext = null;
const audioQueue = ref([]);
const isPlaying = ref(false);

// --- WebSocket 初始化與事件監聽 ---
const initializeSocket = () => {
    socket = io(API_BASE_URL, { transports: ['websocket'] });

    socket.on('connect', () => console.log('WebSocket 已連接!'));
    socket.on('disconnect', () => console.log('WebSocket 已斷開.'));
    socket.on('stream-error', (err) => {
        isAiResponding.value = false;
        ElMessage.error(err.message || '串流處理時發生錯誤');
    });

    // 監聽後端辨識出的使用者文字，並更新 UI
    socket.on('user-text-chunk', (text) => {
        const lastMessage = conversationHistory.value[conversationHistory.value.length - 2];
        if (lastMessage && lastMessage.role === 'USER') {
            lastMessage.content += text;
            scrollToBottom();
        }
    });

    socket.on('ai-text-chunk', (textChunk) => {
        // 找到對話歷史中的最後一條訊息 (也就是我們剛建立的空 AI 訊息框)
        const lastMessage = conversationHistory.value[conversationHistory.value.length - 1];
        if (lastMessage && lastMessage.role === 'AI') {
            // 將收到的文字片段附加到 content 後面
            lastMessage.content += textChunk;
            // 即時滾動
            scrollToBottom();
        }
    });

    socket.on('audio-chunk', (chunk) => {
        console.log(`[FRONTEND-DEBUG] SUCCESS! Received 'audio-chunk' (size: ${chunk.byteLength || chunk.length})`);
        const arrayBuffer = new Uint8Array(chunk).buffer;
        audioQueue.value.push(arrayBuffer);
        if (!isPlaying.value) {
            playNextAudioChunk();
        }
    });

    // [超級除錯器] 加入一個萬用事件監聽器
    // 這會捕捉 *所有* 從後端發來的事件，無論事件名稱是什麼
    socket.onAny((eventName, ...args) => {
        console.log(`[FRONTEND-RAW-EVENT] Received event: '${eventName}' with data:`, args);
    });

    // 監聽 AI 回應串流結束事件
    socket.on('stream-end', () => {
        console.log('AI stream ended.');
        isAiResponding.value = false;
    });
};

// --- 音訊播放邏輯 ---
const playNextAudioChunk = async () => {
    if (audioQueue.value.length === 0) {
        isPlaying.value = false;
        return;
    }
    isPlaying.value = true;

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const arrayBuffer = audioQueue.value.shift();
    try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        source.onended = () => playNextAudioChunk();
    } catch (error) {
        console.error('音訊解碼錯誤:', error);
        playNextAudioChunk(); // 即使發生錯誤，也繼續嘗試播放下一個
    }
};

// --- 核心互動函式 ---
const startTalk = async (battleId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/talk/battle/${battleId}`, { userID: USER_ID }, { headers: { Authorization: `Bearer cherites` } });
        const { data, message: apiMessage } = response.data;
        const { message, talkID } = data
        talkId.value = talkID;
        conversationHistory.value.push({ role: 'AI', content: message.content });

        const binaryString = atob(message.audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        new Audio(audioUrl).play();

    } catch (error) {
        ElMessage.error('開啟對話失敗，請檢查後端服務與 Battle ID');
        // 如果失敗，需要重設 isConnecting 狀態
        isConnecting.value = false;
    }
};

// *** 新增 handleStartConversation 函式 ***
const handleStartConversation = async () => {
    if (!inputBattleId.value.trim()) {
        ElMessage.warning('請輸入 Battle ID');
        return;
    }
    isConnecting.value = true;
    await startTalk(inputBattleId.value);
    // 成功後 startTalk 會設定 talkId，v-if 會自動切換畫面
    // 失敗時 startTalk 內部會處理 isConnecting.value
};


const startRecording = async () => {
    console.log("--- [DEBUG] 1. '按住說話' 按鈕被觸發 ---");

    if (!talkId.value) {
        console.error("[DEBUG] 錯誤：talkId 不存在，無法開始錄音。");
        ElMessage.warning('尚未成功開啟對話，無法錄音');
        return;
    }
    if (isRecording.value) {
        console.warn("[DEBUG] 警告：重複觸發，目前已經在錄音中。");
        return;
    }
    console.log(`[DEBUG] 2. 狀態檢查通過 (talkId: ${talkId.value})，準備請求麥克風權限...`);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("[DEBUG] 3. 麥克風權限已獲取，成功！");

        mediaRecorder = new MediaRecorder(stream);
        isRecording.value = true;

        // 4. 通知後端，我們要開始說話了
        console.log("[DEBUG] 4. 準備發送 'start-talk' 事件到後端...");
        socket.emit('start-talk', {
            userID: USER_ID,
            talkID: talkId.value,
        });
        console.log("[DEBUG] 5. 'start-talk' 事件已發送！");

        // 6. 建立使用者訊息框
        conversationHistory.value.push({ role: 'USER', content: '' });

        // 7. 監聽音訊數據
        mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                console.log(`[DEBUG] 錄到音訊塊 (大小: ${event.data.size})，準備發送...`);
                socket.emit('audio-chunk', event.data);
            }
        });

        // 8. 開始錄音
        mediaRecorder.start(250);
        console.log("[DEBUG] 6. MediaRecorder 已啟動。");

    } catch (error) {
        console.error("[DEBUG] 錯誤：在請求麥克風權限或啟動錄音時失敗。", error);
        ElMessage.error("無法啟動麥克風。請檢查瀏覽器權限，並確保網頁是透過 HTTPS 或 localhost 存取。");
    }
};

const stopRecording = () => {
    if (!isRecording.value || !mediaRecorder) return;

    mediaRecorder.stop();
    isRecording.value = false;
    isAiResponding.value = true;

    conversationHistory.value.push({ role: 'AI', content: '' });
    isAiResponding.value = true;

    // 5. 通知後端，我們說完話了
    socket.emit('end-audio');

    // 停止錄音後，立即滾動到底部
    scrollToBottom();
};

// --- UI 工具函式 ---
const scrollToBottom = () => {
    nextTick(() => {
        if (historyBoxRef.value) {
            historyBoxRef.value.scrollTop = historyBoxRef.value.scrollHeight;
        }
    });
};

// --- Vue 生命週期掛鉤 ---
onMounted(() => {
    initializeSocket();
});

onUnmounted(() => {
    if (socket) socket.disconnect();
    if (mediaRecorder) mediaRecorder.stream.getTracks().forEach(track => track.stop());
});
</script>


<style scoped>
.page-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
}

.box-card {
    margin-top: 20px;
}

.card-header {
    font-weight: bold;
}

.conversation-history {
    height: 50vh;
    overflow-y: auto;
    border: 1px solid #dcdfe6;
    padding: 10px;
    border-radius: 4px;
    background-color: #f9f9f9;
}

.message {
    display: flex;
    margin-bottom: 15px;
    align-items: flex-start;
}

.message .avatar {
    margin-right: 10px;
}

.message .content {
    padding: 10px 15px;
    border-radius: 10px;
    max-width: 80%;
    word-wrap: break-word;
}

.message.USER {
    flex-direction: row-reverse;
}

.message.USER .avatar {
    margin-left: 10px;
    margin-right: 0;
}

.message.USER .content {
    background-color: #409eff;
    color: white;
}

.message.AI .content {
    background-color: #e9e9eb;
    color: #303133;
}

.action-area {
    margin-top: 20px;
    text-align: center;
}

.talk-button {
    padding: 20px;
    font-size: 18px;
    height: auto;
    border-radius: 50px;
}

.loading-dots span {
    display: inline-block;
    animation: blink 1.4s infinite both;
}

.loading-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes blink {
    0% {
        opacity: 0.2;
    }

    20% {
        opacity: 1;
    }

    100% {
        opacity: 0.2;
    }
}
</style>