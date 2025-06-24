<template>
  <div>
    <h2>語音錄製與交互Demo</h2>
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
        // 送音訊Blob到後端轉Google STT
        const text = await sendAudioToGoogleSTT(audioBlob);
        transcript.value = text;

        // 跟 Gemini API 互動
        const gptReply = await sendTextToGeminiAPI(text);
        reply.value = gptReply;

        // 用瀏覽器合成語音播放回覆
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
  // 假設有後端API /api/google-stt 接收音訊檔並回傳文字
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  const res = await fetch('http://localhost:3000/api/google-stt', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  return data.text || '';
}

async function sendTextToGeminiAPI(text) {
  // 假設有後端API /api/gemini 接收文字加prompt回傳結果
  const res = await fetch('http://localhost:3000/api/gemini', {
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
