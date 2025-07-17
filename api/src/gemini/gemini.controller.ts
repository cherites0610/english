import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { GeminiService } from './gemini.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('google-stt')
  @UseInterceptors(FileInterceptor('file'))
  async googleSTT(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    return this.geminiService.googleSTT(file.buffer);
  }
  
  @Post('gemini')
  async gemini(@Body() body: { prompt: string }) {
    if (!body.prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }
    return this.geminiService.generateGeminiReply(body.prompt);
  }

  @Post('google-tts')
  async googleTTS(
    @Res() res: Response,
    @Body() body: { text: string; speakingRate?: number },
  ) {
    if (!body.text) {
      throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
    }
    const audioBuffer = await this.geminiService.googleTTS(
      body.text,
      body.speakingRate,
    );
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  }
}
