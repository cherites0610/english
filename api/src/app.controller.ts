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
import axios from 'axios';
import multer from 'multer';

@Controller('api')
export class AppController {
  private speechClient: SpeechClient;
  private readonly logger = new Logger(AppController.name)

  constructor() {
    this.speechClient = new SpeechClient({
      keyFilename: './english-463915-1da80c9cda10.json', // 改成你金鑰路徑
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
      // 這裡示範呼叫 Gemini API，請依你的實際API修改
      const GEMINI_API_URL = 'https://api.gemini.example/v1/chat';
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your_api_key_here';

      const res = await axios.post(
        GEMINI_API_URL,
        {
          prompt: body.prompt,
          // 如果需要可加其他參數
        },
        {
          headers: {
            Authorization: `Bearer ${GEMINI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // 假設回傳格式是 { reply: '...' }
      return { reply: res.data.reply || 'No reply' };
    } catch (error) {
      console.error(error.response?.data || error.message);
      throw new HttpException(
        'Gemini API call failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}