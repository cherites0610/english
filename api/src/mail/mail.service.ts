import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Mail } from './entity/mail.entity';
import { Repository } from 'typeorm';
import { SendMailDto } from './dto/send-mail.dto';
import { validate as isValidUUID } from 'uuid';
import { User } from 'src/user/entity/user.entity';
import { formatDistanceToNow } from 'date-fns';

@Injectable()
export class MailService {
    constructor(
        @InjectRepository(Mail)
        private readonly mailRepository: Repository<Mail>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {

    }

    async getMail(userId: string) {
        const mails = await this.mailRepository.find({
            where: { user: { id: userId } },
            order: {
                createdAt: 'DESC'
            }
        });

        const formattedMails = mails.map(mail => ({
            ...mail,
            // 關鍵改動在這裡
            receivedAt: formatDistanceToNow(mail.createdAt, {
                addSuffix: true, // 這會加上 "前" 或 "後" 的字樣
                // locale: 'en-us'      // 指定使用繁體中文
            })
        }));

        return formattedMails;
    }

    
    async sendMail(dto: SendMailDto) {
        let from: string;

        if (isValidUUID(dto.from)) {
            const user = await this.userRepository.findOneBy({ id: dto.from });
            from = user?.name ?? '未知用戶';
        } else {
            from = dto.from;
        }

        const mail = this.mailRepository.create({
            ...dto,
            from,
            user: { id: dto.targetUserId }
        })
        await this.mailRepository.save(mail)
        return mail
    }

    async readMail(emailId: string) {
        const mail = await this.mailRepository.findOne({
            where: { id: emailId }
        })

        if (!mail) { throw new NotFoundException('找不到郵件') }

        mail.isRead = true
        await this.mailRepository.save(mail)

        return mail
    }
}
