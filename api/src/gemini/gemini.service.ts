import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SpeechClient, protos } from '@google-cloud/speech';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

@Injectable()
export class GeminiService {
  private speechClient: SpeechClient;
  private textToSpeechClient: TextToSpeechClient;
  private ai: GoogleGenerativeAI;
  private oldai: GoogleGenAI;
  private readonly logger = new Logger(GeminiService.name);

  constructor() {
    const geminiApiKey = process.env.GCP_GEMINI_API;
    if (!geminiApiKey) {
      this.logger.error('GeminiAPI environment variable not set.');
      throw new Error('GeminiAPI credentials are required.');
    }
    this.oldai = new GoogleGenAI({ apiKey: geminiApiKey });
    this.ai = new GoogleGenerativeAI(geminiApiKey);

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
      const response = await this.oldai.models.generateContent({
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

  async *googleSTTStream(audioStream: AsyncIterable<Buffer>): AsyncGenerator<string> {
    const recognitionConfig = {
      config: {
        encoding: 'MP3' as const, // 假設前端錄音格式為 MP3
        sampleRateHertz: 48000,
        languageCode: 'en-US',
      },
      interimResults: false, // 我們只關心最終確認的結果
    };

    // 建立一個雙向的 gRPC 串流
    const recognizeStream = this.speechClient.streamingRecognize(recognitionConfig)
      .on('error', (err) => {
        this.logger.error('STT Stream Error:', err);
      });

    // 我們需要一個回呼來處理從 STT 服務回傳的文字
    const sttPromise = new Promise<string[]>((resolve, reject) => {
      const results: string[] = [];
      recognizeStream.on('data', data => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          const transcript = data.results[0].alternatives[0].transcript;
          if (data.results[0].isFinal) {
            results.push(transcript);
          }
        }
      });
      recognizeStream.on('end', () => resolve(results));
      recognizeStream.on('error', reject);
    });

    // 將從 WebSocket 收到的音訊流寫入 gRPC 串流
    const writeToStream = async () => {
      for await (const chunk of audioStream) {
        if (recognizeStream.writable) {
          recognizeStream.write(chunk);
        }
      }
      recognizeStream.end();
    };

    writeToStream();

    // 等待 STT 處理完成並 yield 結果
    const transcripts = await sttPromise;
    for (const transcript of transcripts) {
      yield transcript;
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

  async *generateGeminiReplyStream(prompt: string): AsyncGenerator<string> {
    if (!prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // 注意：為了使用 streaming，我們需要用 getGenerativeModel 方法
      const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        // 確保 chunk.text() 存在且不為空
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText; // 使用 yield 回傳每一個文字片段
        }
      }
    } catch (error) {
      this.logger.error('Gemini API stream call failed:', error);
      throw new HttpException(
        'Gemini API stream call failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
