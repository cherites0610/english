// src/tts/elevenlabs-tts.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { TtsProvider, TtsService } from './tts.interface';
import axios from 'axios';
import * as WebSocket from 'ws';

@Injectable()
export class ElevenlabsTtsService implements TtsService {
  private readonly logger = new Logger(ElevenlabsTtsService.name);
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY ?? "";
    if (!this.apiKey) throw new Error('ELEVENLABS_API_KEY is not set.');
  }
  public readonly providerName: TtsProvider = 'ELEVENLABS';

  async generateSpeech(text: string, options?: { voiceId?: string }): Promise<Buffer> {
    const { voiceId } = options || {};
    // ElevenLabs 的預設高品質聲音之一，之後可以從 talkData 中讀取
    const effectiveVoiceId = options?.voiceId;
    this.logger.log(`Generating speech using ElevenLabs for voice: ${effectiveVoiceId}`);

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${effectiveVoiceId}`;
    const headers = {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': this.apiKey,
    };
    const data = {
      text: text,
      model_id: 'eleven_multilingual_v2',
    };

    const response = await axios.post(url, data, {
      headers,
      responseType: 'arraybuffer', // 直接獲取 Buffer
    });

    return Buffer.from(response.data);
  }

  async *generateSpeechStream(
    textStream: AsyncIterable<string>,
    options?: { voiceId?: string },
  ): AsyncIterable<Buffer> {
    const voiceId = options?.voiceId ?? "kNie5n4lYl7TrvqBZ4iG";
    const url = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_multilingual_v2`;

    const ws = new WebSocket(url, { headers: { 'xi-api-key': this.apiKey } });

    // [修正] 我們將使用 Promise 來橋接事件和我們的迴圈
    let messageQueue: any[] = [];
    let resolveNextMessage: ((value: any) => void) | null = null;


    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.logger.log('[TTS-DEBUG] 6. Received message from ElevenLabs:', message);
      if (resolveNextMessage) {
        resolveNextMessage(message);
        resolveNextMessage = null;
      } else {
        messageQueue.push(message);
      }
    });

    ws.on('error', (error) => {
      if (resolveNextMessage) resolveNextMessage({ isFinal: true, error: true }); // 發生錯誤時結束迴圈
    });

    ws.on('close', (code, reason) => {
      if (resolveNextMessage) resolveNextMessage({ isFinal: true }); // 連線關閉時結束迴圈
    });

    const sendTextChunks = async () => {
      await new Promise(resolve => ws.once('open', resolve));

      let textSent = false;
      for await (const textChunk of textStream) {
        if (ws.readyState === WebSocket.OPEN) {
          this.logger.log(`[TTS-DEBUG] 4. Sending text chunk: "${textChunk}"`);
          ws.send(JSON.stringify({ text: textChunk, try_trigger_generation: true }));
          textSent = true;
        }
      }

      if (ws.readyState === WebSocket.OPEN) {
        this.logger.log('[TTS-DEBUG] 5. All text sent. Sending end-of-stream message.');
        ws.send(JSON.stringify({ text: "" }));
      }
      if (!textSent) {
        this.logger.warn('[TTS-DEBUG] Warning: Text stream from Gemini was empty.');
      }
    };
    sendTextChunks();

    while (true) {
      let data;
      if (messageQueue.length > 0) {
        data = messageQueue.shift();
      } else {
        data = await new Promise(resolve => {
          resolveNextMessage = resolve;
        });
      }

      if (data.audio) {
        this.logger.log('[TTS-DEBUG] 7. Yielding audio chunk...');
        yield Buffer.from(data.audio, 'base64');
      }

      if (data.isFinal) {
        this.logger.log('[TTS-DEBUG] 8. Received final message. Breaking loop.');
        break;
      }
    }
  }
}