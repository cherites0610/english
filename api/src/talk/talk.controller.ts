import { BadRequestException, Body, Controller, FileTypeValidator, Get, Param, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { TalkService } from './talk.service';
import { UserID } from 'src/common/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';


@Controller('talk')
export class TalkController {
  constructor(private readonly talkService: TalkService) { }

  @Post('/prompt')
  async setPrompt(@Body() dto: { prompt: string }) {
    return {
      message: "設定成功",
      data: await this.talkService.setPrompt(dto.prompt)
    }
  }

  @Get('/prompt')
  async getPrompt() {
    return {
      message: "查詢成功",
      data: await this.talkService.getPrompt()
    }
  }

  @Post('/:battleId')
  async createTalk(@UserID() userID: string, @Param("battleId") battleId: string) {
    const result = await this.talkService.createTalk(userID, battleId)
    return {
      message: "創建成功",
      data: {
        talkID: result.talkID,
        message: {
          role: 'ASSISTANT',
          content: result.message,
          audioBase64: result.audioBase64,
          audioFormat: 'audio/mpeg',
        }
      }
    }
  }

  @Post('/:talkID/message')
  @UseInterceptors(FileInterceptor('audio'))
  async addMessageToTalk(
    @UserID() userID: string,
    @Param('talkID') talkID: string,
    @UploadedFile() file: Express.Multer.File) {

    if (!file) {
      throw new BadRequestException("未上傳檔案");
    }

    const { text } = await this.talkService.SpeachToText(file.buffer)
    const { reply, audioBase64 } = await this.talkService.addMessageToTalk(userID, talkID, text, "USER")
    return {
      message: "對話成功",
      data: {
        userMessage: {
          role: 'USER',
          content: text
        },
        assistantMessage: {
          role: 'ASSISTANT',
          content: reply,
          audioBase64: audioBase64,
          audioFormat: 'audio/mpeg',
        }
      }
    }
  }

  @Get('/:talkID/context')
  async getTalkSessionContext(@UserID() userID: string, @Param('talkID') talkID: string) {
    return {
      message: "查詢成功",
      data: await this.talkService.getTalkSessionContext(userID, talkID)
    }
  }
}
