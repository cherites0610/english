import { BadGatewayException, Body, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BattleAdminService } from 'src/battle/battle-admin.service';
import { GeminiService } from 'src/gemini/gemini.service';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TalkService {
    constructor(
        private readonly redisService: RedisService,
        private readonly userService: UserService,
        private readonly battleService: BattleAdminService,
        private readonly geminiService: GeminiService,
        private readonly configService: ConfigService
    ) { }

    async setPrompt(@Body() prompt: string) {
        try {
            await this.redisService.set("prompt", prompt);
            console.log('Successfully set new value.');
        } catch (err: any) {
            console.error('An error occurred:', err);
        }
        return true;
    }

    async getPrompt() {
        const result = await this.redisService.get('prompt')
        if (!result) throw new NotFoundException('找不到Prompt')
        return result
    }

    async createTalk(userID: string, battleID: string) {
        // 1. 驗證用戶是否存在
        const user = await this.userService.findByID(userID);
        if (!user) {
            throw new NotFoundException(`User with ID "${userID}" not found`);
        }

        const battle = await this.battleService.findStageById(battleID);
        if (!battle) {
            throw new NotFoundException(`Battle with ID "${battleID}" not found`);
        }

        const originalPrompt = await this.redisService.get("prompt")
        if (!originalPrompt) throw new BadGatewayException("伺服器繁忙")

        const finalPrompt = originalPrompt
            .replaceAll('{currentLevel}', user.englishLevel)
            .replaceAll('{npcBackstory}', battle.npc?.backstory ?? "none stroy")
            .replaceAll('{currentStoryBackground}', battle.backstory)
            .replaceAll('{currentQuestObjective}', battle.rewards.join(','))

        const talkID = uuidv4()
        await this.redisService.set(`talk:${userID}:${talkID}`, ".", 20 * 60)

        const reply = await this.addMessageToTalk(user.id, talkID, finalPrompt, 'USER')
        return {
            message: reply,
            talkID: talkID
        };
    }

    async addMessageToTalk(userID: string, talkID: string, message: string, role: 'AI' | "USER") {
        let talk = await this.redisService.get(`talk:${userID}:${talkID}`)
        if (!talk) throw new NotFoundException("找不到對話")

        talk = talk + '\n' + `${role}:${message}`

        const { reply } = await this.geminiService.generateGeminiReply(talk)

        talk = talk + '\n' + `AI:${reply}`

        await this.redisService.set(`talk:${userID}:${talkID}`, talk, 20 * 60)
        return reply
    }

    async SpeachToText(fileBuffer: Buffer) {
        return await this.geminiService.googleSTT(fileBuffer)
    }

    async getTalkSessionContext(userID:string,talkID:string) {
        let context = await this.redisService.get(`talk:${userID}:${talkID}`)
        if (!context) throw new NotFoundException('找不到該對話')
        return context
    }
}