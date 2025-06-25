import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpeechClient, protos } from '@google-cloud/speech';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';
import multer from 'multer';

@Controller('api')
export class AppController {
  private speechClient: SpeechClient;
  private ai: GoogleGenAI;
  private readonly logger = new Logger(AppController.name)


  constructor() {
    const geminiApiKey = process.env.GCP_GEMINI_API
    if (!geminiApiKey) {
      this.logger.error('GenimiAPI environment variable not set. Speech-to-Text will not work.');
      throw new Error('GenimiAPI credentials are required for Speech-to-Text functionality.');
    }
    this.ai = new GoogleGenAI({ apiKey: "GEMINI_API_KEY" });

    const gcpCredentialsJsonBase64 = process.env.GCP_CREDENTIALS_JSON;
    if (!gcpCredentialsJsonBase64) {
      this.logger.error('GCP_CREDENTIALS_JSON environment variable not set. Speech-to-Text will not work.');
      throw new Error('GCP credentials are required for Speech-to-Text functionality.');
    }

    const gcpCredentialsJsonBuffer = Buffer.from(gcpCredentialsJsonBase64, 'base64').toString('utf-8');

    const credentials = JSON.parse(gcpCredentialsJsonBuffer);
    this.speechClient = new SpeechClient({
      credentials,
    });
  }

  @Post('google-stt')
  @UseInterceptors(FileInterceptor('file')) // <== 非常重要
  async googleSTT(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      // 將buffer轉成base64
      const audioBytes = file.buffer.toString('base64');
      this.logger.debug(1)

      const request = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS, // 根據你的錄音格式調整
          sampleRateHertz: 48000, // 根據錄音設定
          languageCode: 'en-US', // 或en-US看需求
        },
      };

      const [response] = await this.speechClient.recognize(request);
      const transcription =
        response.results
          ?.map((result) => result.alternatives?.[0]?.transcript || '')
          .join('\n') || '';

      return { text: transcription };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Google Speech-to-Text failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 接收文字 prompt，呼叫 Gemini API
  @Post('gemini')
  async gemini(@Body() body: { prompt: string }) {
    if (!body.prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: body.prompt,
      });
      console.log(response.text);

      // 假設回傳格式是 { reply: '...' }
      return { reply: response.text || 'No reply' };
    } catch (error) {
      console.error(error.response?.data || error.message);
      throw new HttpException(
        'Gemini API call failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}