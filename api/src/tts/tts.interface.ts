// src/tts/tts.interface.ts
export type TtsProvider = 'GOOGLE' | 'ELEVENLABS';

export interface TtsService {
  readonly providerName: TtsProvider;

  generateSpeech(
    text: string,
    options?: {
      voiceId?: string;
      speakingRate?: number;
    }
  ): Promise<Buffer>;

  generateSpeechStream(
    textStream: AsyncIterable<string>,
    options?: {
      voiceId?: string;
      speakingRate?: number;
    }
  ): AsyncIterable<Buffer>;
}