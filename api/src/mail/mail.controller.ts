import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { UserID } from 'src/common/decorators/user.decorator';
import { SendMailDto } from './dto/send-mail.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) { }

  @Get('')
  async getMail(@UserID() userId: string) {
    return {
      message: '獲取成功',
      data: await this.mailService.getMail(userId)
    }
  }

  @Public()
  @Post()
  async sendMail(@Body() sendMailDto: SendMailDto) {
    return {
      message: "發送成功",
      data: await this.mailService.sendMail(sendMailDto)
    }
  }

  @Patch('read/:emailId')
  async readMail(@Param('emailId') emailId: string) {
    return {
      message: "讀取成功",
      data: await this.mailService.readMail(emailId)
    }
  }
}
