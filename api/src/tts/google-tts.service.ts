// src/tts/google-tts.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { TtsProvider, TtsService } from './tts.interface';

@Injectable()
export class GoogleTtsService implements TtsService {
    private readonly logger = new Logger(GoogleTtsService.name);
    private textToSpeechClient: TextToSpeechClient;

    constructor() {
        const gcpCredentialsJsonBase64 = process.env.GCP_CREDENTIALS_JSON;
        if (!gcpCredentialsJsonBase64) {
            this.logger.error('GCP_CREDENTIALS_JSON environment variable not set.');
            throw new Error('GCP credentials are required.');
        }

        const gcpCredentialsJsonBuffer = Buffer.from(
            gcpCredentialsJsonBase64,
            'base64',
        ).toString('utf-8');
        const credentials = JSON.parse(gcpCredentialsJsonBuffer);
        this.textToSpeechClient = new TextToSpeechClient({ credentials });
    }

    public readonly providerName: TtsProvider = 'GOOGLE';

    async generateSpeech(text: string, options?: { voiceId?: string; speakingRate?: number }): Promise<Buffer> {
        const { voiceId, speakingRate } = options || {};
        this.logger.log(`Generating speech using Google TTS for voice: ${voiceId}`);

        // 這裡是您原本 googleTTS 的完整邏輯
        const [response] = await this.textToSpeechClient.synthesizeSpeech({
            input: { text },
            voice: {
                languageCode: 'en-US', // 或根據 voiceId 動態調整
                name: voiceId ?? 'en-US-Standard-C',
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: speakingRate || 1,
            },
        });

        return response.audioContent as Buffer;
    }

    async *generateSpeechStream(
        textStream: AsyncIterable<string>,
        options?: { voiceId?: string; speakingRate?: number }
    ): AsyncIterable<Buffer> {
        this.logger.warn('Streaming is not implemented for GoogleTtsService yet.');
        // 為了簡單起見，我們先收集所有文字再呼叫原本的方法
        // 這不是真正的串流，但能讓程式碼運作
        let fullText = '';
        for await (const chunk of textStream) {
            fullText += chunk;
        }
        const audioBuffer = await this.generateSpeech(fullText, options);
        yield audioBuffer;
    }
}