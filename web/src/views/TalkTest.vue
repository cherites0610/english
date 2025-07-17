<template>
    <div class="page-container">
        <h1>對話系統測試介面</h1>

        <el-card class="box-card">
            <template #header>
                <div class="card-header"><span>1. 系統 Prompt 管理</span></div>
            </template>
            <el-input v-model="promptText" :rows="4" type="textarea" placeholder="請輸入您想設定的系統級 Prompt" />
            <div class="button-group">
                <el-button type="primary" @click="setPrompt" :loading="promptLoading">設定 Prompt</el-button>
                <el-button @click="getPrompt" :loading="promptLoading">重新獲取</el-button>
            </div>
            <div v-if="currentPrompt" class="prompt-display">
                <strong>當前 Prompt:</strong>
                <p>{{ currentPrompt }}</p>
            </div>
        </el-card>

        <el-card class="box-card">
            <template #header>
                <div class="card-header"><span>2. 開啟一個新的對話 Session</span></div>
            </template>
            <el-input v-model="battleId" placeholder="請輸入 Battle ID 來開啟對話" class="input-with-select">
                <template #append>
                    <el-button @click="startTalk" :loading="talkLoading">開啟對話</el-button>
                </template>
            </el-input>
        </el-card>

        <el-card class="box-card" v-if="talkId">
            <template #header>
                <div class="card-header">
                    <span>3. 進行對話 (目前 Session ID: {{ talkId }})</span>
                </div>
            </template>

            <div class="conversation-history" ref="historyBoxRef">
                <div v-for="(msg, index) in conversationHistory" :key="index" :class="['message', msg.role]">
                    <el-avatar class="avatar">{{ msg.role === 'USER' ? 'U' : 'AI' }}</el-avatar>
                    <div class="content">{{ msg.content }}</div>
                </div>
                <div v-if="talkLoading" class="message assistant">
                    <el-avatar class="avatar">AI</el-avatar>
                    <div class="content loading-dots"><span>.</span><span>.</span><span>.</span></div>
                </div>
            </div>

            <div class="action-area">
                <div class="record-buttons">
                    <el-button v-if="!isRecording" type="danger" @click="startRecording"
                        :icon="Microphone">開始錄音</el-button>
                    <el-button v-else type="info" @click="stopRecording" :icon="VideoPause">停止錄音</el-button>
                    <span v-if="isRecording" class="recording-indicator">錄音中...</span>
                </div>

                <el-divider direction="vertical" />

                <el-upload ref="uploadRef" :auto-upload="false" :limit="1" :on-exceed="handleFileExceed"
                    :on-change="handleFileChange" accept="audio/mpeg" :show-file-list="false">
                    <template #trigger>
                        <el-button type="primary" :icon="Upload">選擇 MP3 檔案</el-button>
                    </template>
                </el-upload>
            </div>

            <div v-if="fileToUpload" class="file-info">
                <span>已選檔案: {{ fileToUpload.name }}</span>
                <el-button class="ml-3" type="success" @click="sendMessage" :disabled="talkLoading">
                    發送
                </el-button>
            </div>
        </el-card>

        <el-card class="box-card" v-if="sessionContext.length > 0">
            <template #header>
                <div class="card-header">
                    <span>4. 當前Session所有上下文 (目前 Session ID: {{ talkId }})</span>
                </div>
            </template>
            <div class="prompt-display">
                <strong>當前 上下文:</strong>
                <p>{{ sessionContext }}</p>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus';
import { genFileId } from 'element-plus';
import { Microphone, VideoPause, Upload } from '@element-plus/icons-vue';
import talkApi from '../api/talk.api';

// --- State ---
const promptText = ref('');
const currentPrompt = ref('');
const promptLoading = ref(false);

const battleId = ref('');
const talkId = ref('');
const talkLoading = ref(false);

const uploadRef = ref<UploadInstance>();
const fileToUpload = ref<File | null>(null);

const sessionContext = ref<string>("");

const conversationHistory = ref<{ role: 'USER' | 'ASSISTANT'; content: string }[]>([]);
const historyBoxRef = ref<HTMLElement | null>(null);

// -- 錄音相關 State --
const isRecording = ref(false);
const mediaRecorder = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);

// --- Methods ---

// Prompt 管理
const setPrompt = async () => {
    if (!promptText.value) return ElMessage.warning('Prompt 內容不能為空');
    promptLoading.value = true;
    try {
        await talkApi.setPrompt(promptText.value);
        ElMessage.success('Prompt 設定成功！');
        await getPrompt();
    } catch (e) { console.error(e) }
    finally { promptLoading.value = false; }
};

const getPrompt = async () => {
    promptLoading.value = true;
    try {
        const response = await talkApi.getPrompt();
        currentPrompt.value = response.data;
    } catch (e) { console.error(e) }
    finally { promptLoading.value = false; }
};

// 開啟對話
const startTalk = async () => {
    if (!battleId.value) return ElMessage.warning('請輸入 Battle ID');
    talkLoading.value = true;
    try {
        const response = await talkApi.createTalk(battleId.value);
        talkId.value = response.data.talkID; // 假設返回的 data 中有 talkID
        conversationHistory.value.push(response.data.message); // 假設返回的 data 中有初始訊息
        ElMessage.success(`對話已開啟，ID: ${talkId.value}`);

        const assistantMessage = response.data.message;
        const audioBase64 = assistantMessage.audioBase64;
        const audioFormat = assistantMessage.audioFormat;
        const audioSrc = `data:${audioFormat};base64,${audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.play();
    } catch (e) { console.error(e) }
    finally { talkLoading.value = false; getSessionContet() }
};

// 取得對話上下文
const getSessionContet = async () => {
    try {
        const response = await talkApi.getSessionConText(talkId.value)
        sessionContext.value = response.data
    } catch (e) {
        console.error(e);
    }
}

// 處理檔案上傳
const handleFileChange: UploadProps['onChange'] = (uploadFile) => {
    fileToUpload.value = uploadFile.raw as File;
};
const handleFileExceed: UploadProps['onExceed'] = (files) => {
    uploadRef.value!.clearFiles();
    const file = files[0] as UploadRawFile;
    file.uid = genFileId();
    uploadRef.value!.handleStart(file);
    fileToUpload.value = file as File;
};

const sendMessage = async () => {
    if (!fileToUpload.value) return ElMessage.warning('請先選擇或錄製一個音檔');
    talkLoading.value = true;
    try {
        const response = await talkApi.addMessage(talkId.value, fileToUpload.value);

        if (response.data && response.data.userMessage && response.data.assistantMessage) {
            conversationHistory.value.push(response.data.userMessage);
            conversationHistory.value.push(response.data.assistantMessage);

            const assistantMessage = response.data.assistantMessage;
            const audioBase64 = assistantMessage.audioBase64;
            const audioFormat = assistantMessage.audioFormat;
            const audioSrc = `data:${audioFormat};base64,${audioBase64}`;
            const audio = new Audio(audioSrc);
            audio.play();
        }

        uploadRef.value?.clearFiles(); // 清空檔案上傳列表
        fileToUpload.value = null; // 清空待上傳檔案

        // 等待 DOM 更新後，滾動到底部
        nextTick(() => {
            if (historyBoxRef.value) historyBoxRef.value.scrollTop = historyBoxRef.value.scrollHeight;
        });
    } catch (e) { console.error(e) }
    finally { talkLoading.value = false; getSessionContet() }
};

const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return ElMessage.error('您的瀏覽器不支援錄音功能。');
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder.value = new MediaRecorder(stream);

        // 清空上次的錄音數據
        audioChunks.value = [];

        // 當有音頻數據可用時，存入 chunks 陣列
        mediaRecorder.value.ondataavailable = event => {
            audioChunks.value.push(event.data);
        };

        // 當錄音停止時觸發
        mediaRecorder.value.onstop = () => {
            // 將收集到的音頻數據塊合併成一個 Blob 物件
            const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' }); // 假設為 webm
            // 轉換為 File 物件，以便和上傳功能共用 sendMessage
            const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
            fileToUpload.value = audioFile;

            // 停止媒體流，關閉麥克風指示燈
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.value.start();
        isRecording.value = true;
        ElMessage.success('錄音已開始...');
    } catch (err) {
        ElMessage.error('無法獲取麥克風權限，請檢查您的設定。');
        console.error('getUserMedia error:', err);
    }
};

const stopRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
        mediaRecorder.value.stop();
        isRecording.value = false;
        ElMessage.info('錄音已結束，檔案已準備好發送。');
    }
};


// ** 生命週期鉤子 (核心修改) **
onMounted(() => {
    // ** 修改點：頁面載入時自動獲取 Prompt **
    getPrompt();
});
</script>

<style scoped>
.page-container {
    padding: 20px;
}

.box-card {
    margin-top: 20px;
}

.card-header {
    font-weight: bold;
}

.button-group {
    margin-top: 10px;
}

.prompt-display {
    margin-top: 15px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.prompt-display p {
    margin: 5px 0 0;
}

.conversation-history {
    height: 300px;
    overflow-y: auto;
    border: 1px solid #dcdfe6;
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 4px;
}

.message {
    display: flex;
    margin-bottom: 10px;
}

.message .avatar {
    flex-shrink: 0;
    margin-right: 10px;
}

.message .content {
    padding: 8px 12px;
    border-radius: 8px;
    max-width: 80%;
}

.message.USER .content {
    background-color: #ecf5ff;
}

.message.ASSISTANT .content {
    background-color: #f0f9eb;
}

.loading-dots span {
    animation: blink 1.4s infinite both;
    font-size: 1.5rem;
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