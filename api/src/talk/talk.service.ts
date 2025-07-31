import { BadGatewayException, Body, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { BattleAdminService } from 'src/battle/battle-admin.service';
import { BattleChildCategory } from 'src/battle/entity/battle-child-category.entity';
import { GeminiService } from 'src/gemini/gemini.service';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

interface TalkData {
    history: string;
    voiceSpeed: number;
    voiceId: string;
}

@Injectable()
export class TalkService {
    constructor(
        private readonly redisService: RedisService,
        private readonly userService: UserService,
        private readonly battleService: BattleAdminService,
        private readonly geminiService: GeminiService,
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

    async createTalkByCategoryName(userID: string, categoryName: string) {
        const { id } = await this.battleService.getRandomStageByChildCategoryName(categoryName)
        return this.createTalkByID(userID, id)
    }

    async createTalkByID(userID: string, battleID: string) {
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
        const initialTalkData: TalkData = {
            history: "",
            voiceSpeed: 1.0,
            voiceId: battle.npc?.voiceId ?? "en-US-Chirp3-HD-Sadaltager"
        };

        await this.redisService.set(
            `talk:${userID}:${talkID}`,
            JSON.stringify(initialTalkData),
            20 * 60
        );

        const { reply, audioBase64 } = await this.addMessageToTalk(user.id, talkID, finalPrompt, 'USER')


        return {
            message: reply,
            audioBase64,
            talkID: talkID
        };
    }

    async addMessageToTalk(userID: string, talkID: string, message: string, role: 'AI' | "USER") {
        console.log(1);
        const rawTalkData = await this.redisService.get(`talk:${userID}:${talkID}`);
        if (!rawTalkData) throw new NotFoundException("找不到對話");

        const talkData: TalkData = JSON.parse(rawTalkData);

        talkData.history = talkData.history + '\n' + `${role}:${message}`;

        const { reply } = await this.geminiService.generateGeminiReply(talkData.history);

        talkData.history = talkData.history + '\n' + `AI:${reply}`;

        await this.redisService.set(
            `talk:${userID}:${talkID}`,
            JSON.stringify(talkData),
            20 * 60
        );

        const audioBuffer = await this.geminiService.googleTTS(
            reply,
            talkData.voiceSpeed,
            talkData.voiceId
        );
        const audioBase64 = audioBuffer.toString('base64');

        return { reply, audioBase64 };
    }

    async SpeachToText(fileBuffer: Buffer) {
        console.log(3);
        return await this.geminiService.googleSTT(fileBuffer)
    }

    async getTalkSessionContext(userID: string, talkID: string) {
        let context = await this.redisService.get(`talk:${userID}:${talkID}`)
        if (!context) throw new NotFoundException('找不到該對話')
        return context
    }
}