<template>
    <div style="padding: 20px;">

        <h2>語音錄製與交互 Demo</h2>
        <div class="main-container">
            <div class="controls-panel">
                <h3>控制區域</h3>

                <label>
                    請輸入 Prompt 前綴內容：
                    <textarea v-model="promptPrefix" placeholder="例如：請用簡單中文說明…" rows="4"></textarea>
                </label>

                <label class="speed-control-label">
                    語音速度：<span>{{ speakingRate }}</span>
                    <input type="range" v-model.number="speakingRate" min="0.25" max="2" step="0.05" />
                </label>

                <div class="button-group">
                    <button @click="initiateConversation" :disabled="conversationStarted">
                        開始對話
                    </button>
                    <button @click="startRecording" :disabled="!canRecord">
                        <span class="mic-icon">●</span> 開始錄音
                    </button>
                    <button @click="stopRecording" :disabled="!isRecording">
                        ■ 停止錄音
                    </button>
                </div>

                <div class="status-panel">
                    <p v-if="transcript"><b>辨識文字：</b> {{ transcript }}</p>
                    <p v-if="reply"><b>回覆文字：</b> {{ reply }}</p>
                    <p v-if="isRecording" class="recording-status">錄音中...</p>
                </div>
            </div>

            <div class="history-panel">
                <h3>對話記錄</h3>
                <div class="message-container">
                    <div v-for="(message, index) in conversationHistory" :key="index" class="message"
                        :class="message.sender === 'user' ? 'user-message' : 'ai-message'">
                        <div class="sender-label">
                            {{ message.sender === "user" ? "你" : "AI" }}
                        </div>
                        <div class="message-bubble">{{ message.text }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 主要容器，使用 Flexbox 佈局 */
.main-container {
    display: flex;
    gap: 20px;
    /* 左右兩區的間距 */
}

/* 當螢幕寬度小於某個值時，改成 column */
@media (max-width: 600px) {
    .main-container {
        flex-direction: column;
    }
}

/* 左側控制區 */
.controls-panel {
    flex: 1;
    /* 佔據一半空間 */
    display: flex;
    flex-direction: column;
    gap: 15px;
    /* 控制項之間的垂直間距 */
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.controls-panel h3,
.history-panel h3 {
    margin-top: 0;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
}

.controls-panel textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.button-group {
    display: flex;
    gap: 10px;
}

button {
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    font-size: 16px;
    transition: background-color 0.3s;
}

button:hover:not(:disabled) {
    background-color: #0056b3;
}

button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.mic-icon {
    color: red;
}

.status-panel {
    margin-top: 15px;
    padding: 10px;
    background: #e9ecef;
    border-radius: 5px;
    min-height: 60px;
}

.recording-status {
    color: #d93025;
    font-weight: bold;
}

/* 右側對話記錄區 */
.history-panel {
    flex: 1.5;
    /* 佔據另一半空間，可以稍微寬一點 */
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
}

.message-container {
    flex-grow: 1;
    /* 佔滿剩餘空間 */
    overflow-y: auto;
    /* 內容過多時顯示滾動條 */
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    /* 訊息之間的間距 */
}

/* 訊息通用樣式 */
.message {
    display: flex;
    max-width: 80%;
    align-items: flex-start;
    gap: 10px;
}

.sender-label {
    font-weight: bold;
    font-size: 12px;
    background-color: #f1f1f1;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.speed-control-label {
    display: block;
    /* 讓 label 獨佔一行 */
    margin-top: 10px;
}

.speed-control-label span {
    font-weight: bold;
    color: #007bff;
}

.speed-control-label input[type="range"] {
    width: 100%;
    /* 讓滑桿填滿寬度 */
    margin-top: 5px;
}

.message-bubble {
    padding: 12px;
    border-radius: 10px;
    line-height: 1.5;
}

/* 使用者訊息樣式 */
.user-message {
    align-self: flex-end;
    /* 靠右對齊 */
    flex-direction: row-reverse;
    /* 頭像和氣泡反向 */
}

.user-message .message-bubble {
    background-color: #007bff;
    color: white;
}

.user-message .sender-label {
    background-color: #cce5ff;
    color: #004085;
}

/* AI 訊息樣式 */
.ai-message {
    align-self: flex-start;
    /* 靠左對齊 */
}

.ai-message .message-bubble {
    background-color: #e9ecef;
    color: #333;
}

.ai-message .sender-label {
    background-color: #d1e7dd;
    color: #0a3622;
}
</style>

<script setup>
import { ref } from 'vue';
const apiUrl = import.meta.env.VITE_API_URL;

// 將 conversationHistory 改為 ref 陣列，用於儲存對話物件
const speakingRate = ref(1);
const conversationHistory = ref([]);
const isRecording = ref(false);
const transcript = ref('');
const reply = ref('');

const conversationStarted = ref(false);
const canRecord = ref(false);

let mediaRecorder = null;
let audioChunks = [];
const promptPrefix = ref(`You're my English conversation partner. I want to practice real-life conversation in a natural and immersive way.

Please follow these rules:

1. Speak only in English. Never explain or translate into Chinese.
2. Act fully in character based on the role and background I provide.
3. Use only natural spoken English for the specified difficulty level.
4. You should always start the conversation with a natural opening line.
5. Continue the conversation naturally and encourage me to respond.
6. If I stop responding for a while, ask a friendly follow-up to keep the conversation going.

Here is the setup:

【Role Background】
You are [a friendly barista in a small café in London]  
You are currently talking to me, a customer who just walked in.  
You're warm, welcoming, and talkative.

【Difficulty Level】
Use English difficulty level: Level 1 

Level 1: Very basic sentences. Speak slowly and clearly. Use beginner vocabulary only.  
Level 2: Simple sentences, slightly faster. Some common idioms or phrasal verbs.  
Level 3: Normal native-level speed. Include common idioms and a bit more abstract ideas.  
Level 4: Fluent native-level English, use natural expressions, sarcasm, humor, and rich vocabulary.

Now, please begin the conversation naturally in character, based on the above setup.`);

/**
 * @description 從對話歷史和新的使用者文字中建立要發送給 API 的完整 Prompt
 * @param {string} [newUserText] - 可選的，使用者剛說的最新一句話
 * @returns {string} 完整的 Prompt 字串
 */
function buildPromptFromHistory(newUserText = '') {
    let prompt = promptPrefix.value;

    conversationHistory.value.forEach(message => {
        const prefix = message.sender === 'user' ? '\n使用者：' : '\nAI：';
        prompt += `${prefix}${message.text}`;
    });

    if (newUserText) {
        prompt += `\n使用者：${newUserText}`;
    }

    return prompt;
}

// ✅ 初始化對話
async function initiateConversation() {
    if (!promptPrefix.value.trim()) {
        alert('請先輸入 Prompt 前綴內容');
        return;
    }

    // 🔴 不再將初始 Prompt 寫入 conversationHistory
    const prompt = buildPromptFromHistory();

    // 取得 AI 的第一句回覆
    const gptReply = await sendTextToGeminiAPI(prompt);
    reply.value = gptReply;

    // ✅ 將 AI 的第一句回覆加入對話歷史陣列
    conversationHistory.value.push({ sender: 'ai', text: gptReply });

    playTextAsSpeech(gptReply);

    conversationStarted.value = true;
    canRecord.value = true;
}

// ✅ 錄音開始
function startRecording() {
    if (!canRecord.value) {
        alert('請先點選「開始對話」來初始化對話');
        return;
    }

    transcript.value = '';
    reply.value = '';
    audioChunks = [];

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            isRecording.value = true;

            mediaRecorder.ondataavailable = e => {
                audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

                const text = await sendAudioToGoogleSTT(audioBlob);
                transcript.value = text;

                if (!text) return; // 如果沒有辨識出文字，則不繼續

                // 建立傳送給 API 的 Prompt，包含歷史紀錄和剛辨識出的文字
                const prompt = buildPromptFromHistory(text);

                // ✅ 將使用者辨識出的文字加入對話歷史陣列
                conversationHistory.value.push({ sender: 'user', text: text });

                const gptReply = await sendTextToGeminiAPI(prompt);
                reply.value = gptReply;

                // ✅ 將 AI 的回覆加入對話歷史陣列
                conversationHistory.value.push({ sender: 'ai', text: gptReply });

                playTextAsSpeech(gptReply);
            };
        })
        .catch(err => {
            alert('無法取得麥克風: ' + err.message);
        });
}

function stopRecording() {
    if (mediaRecorder) {
        mediaRecorder.stop();
        isRecording.value = false;
    }
}

async function sendAudioToGoogleSTT(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    const res = await fetch(`${apiUrl}/gemini/google-stt`, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    return data.text || '';
}

async function sendTextToGeminiAPI(text) {
    const res = await fetch(`${apiUrl}/gemini/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
    });
    const data = await res.json();
    return data.reply || '';
}

async function playTextAsSpeech(text) {
    try {
        const res = await fetch(`${apiUrl}/gemini/google-tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, speakingRate: speakingRate.value })
        });
        if (!res.ok) {
            throw new Error(`語音合成請求失敗：${res.statusText}`);
        }

        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (error) {
        alert('無法播放語音：' + error.message);
    }
}
</script>