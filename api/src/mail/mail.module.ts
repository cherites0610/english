import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mail } from './entity/mail.entity';
import { User } from 'src/user/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mail,User])
  ],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
