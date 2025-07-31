import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SpeechClient, protos } from '@google-cloud/speech';
import { GoogleGenAI } from '@google/genai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

@Injectable()
export class GeminiService {
  private speechClient: SpeechClient;
  private textToSpeechClient: TextToSpeechClient;
  private ai: GoogleGenAI;
  private readonly logger = new Logger(GeminiService.name);

  constructor() {
    const geminiApiKey = process.env.GCP_GEMINI_API;
    if (!geminiApiKey) {
      this.logger.error('GeminiAPI environment variable not set.');
      throw new Error('GeminiAPI credentials are required.');
    }
    this.ai = new GoogleGenAI({ apiKey: geminiApiKey });

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

    this.speechClient = new SpeechClient({ credentials });
    this.textToSpeechClient = new TextToSpeechClient({ credentials });
  }

  async googleSTT(fileBuffer: Buffer): Promise<{ text: string }> {
    if (!fileBuffer) {
      throw new HttpException(
        'No file buffer provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const audioBytes = fileBuffer.toString('base64');

      const request = {
        audio: { content: audioBytes },
        config: {
          encoding:
            protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding
              .MP3,
          sampleRateHertz: 48000,
          languageCode: 'en-US',
        },
      };

      const [response] = await this.speechClient.recognize(request);
      const transcription =
        response.results
          ?.map((result) => result.alternatives?.[0]?.transcript || '')
          .join('\n') || '';

      return { text: transcription };
    } catch (error) {
      this.logger.error('Google Speech-to-Text error:', error);
      throw new HttpException(
        'Google Speech-to-Text failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateGeminiReply(prompt: string): Promise<{ reply: string }> {
    if (!prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return { reply: response.text || 'No reply' };
    } catch {
      this.logger.error('Gemini API call failed:');
      throw new HttpException(
        'Gemini API call failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async googleTTS(text: string, speakingRate?: number, soundID?: string): Promise<Buffer> {
    if (!text) {
      throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const [response] = await this.textToSpeechClient.synthesizeSpeech({
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: soundID ?? 'en-US-Chirp3-HD-Sadaltager',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: speakingRate || 1,
        },
      });

      if (!response.audioContent) {
        throw new HttpException(
          'No audio content returned',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.audioContent as Buffer;
    } catch {
      this.logger.error('Text-to-Speech error:');
      throw new HttpException(
        'Text-to-Speech failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
