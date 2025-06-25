<template>
  <div>
    <h2>語音錄製與交互 Demo</h2>

    <label>
      請輸入 Prompt 前綴內容：
      <input v-model="promptPrefix" placeholder="例如：請用簡單中文說明…" />
    </label>

    <br />

    <button @click="startRecording" :disabled="isRecording">開始錄音</button>
    <button @click="stopRecording" :disabled="!isRecording">停止錄音</button>

    <p>辨識文字：{{ transcript }}</p>
    <p>回覆文字：{{ reply }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isRecording = ref(false);
const transcript = ref('');
const reply = ref('');
const promptPrefix = ref('請你幫我翻譯這段英文：'); // 使用者輸入的前綴 prompt

let mediaRecorder = null;
let audioChunks = [];

function startRecording() {
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

        const prompt = promptPrefix.value + text;
        const gptReply = await sendTextToGeminiAPI(prompt);
        reply.value = gptReply;

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
  const res = await fetch('https://api.cherites.net/api/google-stt', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  return data.text || '';
}

async function sendTextToGeminiAPI(text) {
  const res = await fetch('https://api.cherites.net/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: text })
  });
  const data = await res.json();
  return data.reply || '';
}

function playTextAsSpeech(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  } else {
    alert('您的瀏覽器不支援語音合成');
  }
}
</script>