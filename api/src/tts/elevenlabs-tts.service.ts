// src/tts/elevenlabs-tts.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { TtsProvider, TtsService } from './tts.interface';
import axios from 'axios';

@Injectable()
export class ElevenlabsTtsService implements TtsService {
  private readonly logger = new Logger(ElevenlabsTtsService.name);
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY??"";
    if (!this.apiKey) throw new Error('ELEVENLABS_API_KEY is not set.');
  }
  public readonly providerName: TtsProvider = 'ELEVENLABS';

  async generateSpeech(text: string, options?: { voiceId?: string }): Promise<Buffer> {
    const { voiceId } = options || {};
    // ElevenLabs 的預設高品質聲音之一，之後可以從 talkData 中讀取
    const effectiveVoiceId =  options?.voiceId; 
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
}