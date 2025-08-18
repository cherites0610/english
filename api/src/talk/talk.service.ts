import { BadGatewayException, Body, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { BattleAdminService } from 'src/battle/battle-admin.service';
import { BattleChildCategory } from 'src/battle/entity/battle-child-category.entity';
import { GeminiService } from 'src/gemini/gemini.service';
import { RedisService } from 'src/redis/redis.service';
import { TtsService } from 'src/tts/tts.interface';
import { UserService } from 'src/user/user.service';
import type { TtsProvider } from 'src/tts/tts.interface';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

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
        @Inject('TtsService') private readonly ttsService: TtsService,
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
        let talkVoiceId: string;

        switch (this.ttsService.providerName) {
            case 'ELEVENLABS':
                // 這裡可以放 ElevenLabs 的預設 voiceId
                talkVoiceId = battle.npc?.elevenlabsVoiceId ?? "some-elevenlabs-default-voice";
                break;
            case 'GOOGLE':
            default:
                // 這裡放 Google 的預設 voiceId
                talkVoiceId = battle.npc?.googleVoiceId ?? "en-US-Chirp3-HD-Sadaltager";
                break;
        }

        const initialTalkData: TalkData = {
            history: "",
            voiceSpeed: 1.0,
            voiceId: talkVoiceId
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
        const rawTalkData = await this.redisService.get(`talk:${userID}:${talkID}`);
        if (!rawTalkData) throw new NotFoundException("找不到對話");

        const talkData: TalkData = JSON.parse(rawTalkData);

        talkData.history = talkData.history + '\n' + `${role}:${message}`;

        const { reply } = await this.geminiService.generateGeminiReply(talkData.history);
        console.log("完成語言模型思考", new Date());
        talkData.history = talkData.history + '\n' + `AI:${reply}`;

        await this.redisService.set(
            `talk:${userID}:${talkID}`,
            JSON.stringify(talkData),
            20 * 60
        );

        const audioBuffer = await this.ttsService.generateSpeech(reply, {
            voiceId: talkData.voiceId,
            speakingRate: talkData.voiceSpeed,
        });
        console.log("完成TTS", new Date());
        const audioBase64 = audioBuffer.toString('base64');

        return { reply, audioBase64 };
    }

    async handleStreamedTalk(userID: string, talkID: string, message: string, client: Socket) {
        // 1. 取得對話歷史
        const rawTalkData = await this.redisService.get(`talk:${userID}:${talkID}`);
        if (!rawTalkData) throw new Error("找不到對話");
        const talkData: TalkData = JSON.parse(rawTalkData);
        const fullPrompt = talkData.history + '\n' + `USER:${message}`;

        // 2. 從 Gemini 取得文字流
        const geminiTextStream = this.geminiService.generateGeminiReplyStream(fullPrompt);

        // 3. 我們需要將文字流複製成兩份：
        //    一份給 TTS 服務即時轉換成語音
        //    一份用來收集完整的 AI 回覆，以便最後存入歷史紀錄
        const [streamForTts, streamForHistory] = this.teeAsyncIterable(geminiTextStream);

        // 4. 開始非同步收集完整的 AI 回覆文字 (不會阻擋後續流程)
        const fullReplyPromise = this.collectStreamToString(streamForHistory);

        // 5. 將給 TTS 的文字流導入，並取得音訊流
        const audioStream = this.ttsService.generateSpeechStream(streamForTts, {
            voiceId: talkData.voiceId,
            speakingRate: talkData.voiceSpeed,
        });

        // 6. 將收到的音訊流即時透過 WebSocket 傳送給前端
        //    我們使用 'audio-chunk' 作為事件名稱
        for await (const audioChunk of audioStream) {
            client.emit('audio-chunk', audioChunk);
        }

        // 7. 等待 AI 完整回覆的文字收集完畢
        const fullReply = await fullReplyPromise;

        // 8. 更新 Redis 中的對話歷史紀錄
        talkData.history = fullPrompt + '\n' + `AI:${fullReply}`;
        await this.redisService.set(
            `talk:${userID}:${talkID}`,
            JSON.stringify(talkData),
            20 * 60
        );
    }

    async handleEndToEndStream(
        userID: string,
        talkID: string,
        audioInputStream: Readable, // 接收來自 Gateway 的音訊流
        client: Socket
    ) {
        // 1. [串流 STT] 將收到的音訊流轉為文字流
        const sttTextStream = this.geminiService.googleSTTStream(audioInputStream);

        // 我們需要將辨識出的文字流複製成兩份
        const [sttStreamForUser, sttStreamForLlm] = this.teeAsyncIterable(sttTextStream);

        // 同步將辨識出的使用者文字發回前端顯示 (可選，但體驗好)
        (async () => {
            for await (const userText of sttStreamForUser) {
                client.emit('user-text-chunk', userText);
            }
        })();

        // 2. 準備 Gemini 的 Prompt
        const rawTalkData = await this.redisService.get(`talk:${userID}:${talkID}`);
        if (!rawTalkData) throw new Error("找不到對話");
        const talkData: TalkData = JSON.parse(rawTalkData);

        // 收集所有 STT 的結果以建立完整的 prompt
        const userFullText = await this.emitAndCollectStreamToString(
            sttTextStream,
            client,
            'user-text-chunk'
        );
        if (!userFullText) {
            // this.logger.warn("STT did not return any text.");
            console.log('STT did not return any text');

            return; // 如果沒有辨識出任何文字，則直接結束
        }
        const finalPrompt = talkData.history + '\n' + `USER:${userFullText}`;
        const geminiTextStream = this.geminiService.generateGeminiReplyStream(finalPrompt);

        // 同樣複製 AI 文字流，一份給 TTS，一份存檔
        const [streamForTts, streamForHistory] = this.teeAsyncIterable(geminiTextStream);

        const fullReplyPromise = this.emitAndCollectStreamToString(
            streamForHistory,
            client,
            'ai-text-chunk' // <--- 使用新的事件名稱 'ai-text-chunk'
        );

        // 4. [串流 TTS] 將 AI 文字流轉為音訊流
        const audioOutputStream = this.ttsService.generateSpeechStream(streamForTts, {
            voiceId: talkData.voiceId,
        });

        // 5. [回傳串流] 將最終的音訊流發回給前端
        let chunkCount = 0;
        for await (const audioChunk of audioOutputStream) {
            chunkCount++;
            // 每次發送前都打印日誌
            console.log(`[BACKEND-DEBUG] Sending audio chunk #${chunkCount} (size: ${audioChunk.length})`);
            client.emit('audio-chunk', audioChunk);
        }
        console.log(`[BACKEND-DEBUG] Finished sending audio. Total chunks: ${chunkCount}`);


        // 6. 更新歷史紀錄
        const aiFullReply = await fullReplyPromise;
        talkData.history = finalPrompt + '\n' + `AI:${aiFullReply}`;
        await this.redisService.set(
            `talk:${userID}:${talkID}`,
            JSON.stringify(talkData),
            20 * 60
        );
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

    private async collectStreamToString(stream: AsyncIterable<string>): Promise<string> {
        let result = '';
        for await (const chunk of stream) {
            result += chunk;
        }
        return result;
    }

    private teeAsyncIterable<T>(iterable: AsyncIterable<T>): [AsyncIterable<T>, AsyncIterable<T>] {
        const source = iterable[Symbol.asyncIterator]();
        const buffers: T[][] = [[], []];
        const consumers: ((value: IteratorResult<T>) => void)[] = [];
        let done = false;

        const pump = () => {
            if (consumers.length > 0) {
                source.next().then(result => {
                    if (result.done) {
                        done = true;
                    }
                    for (let i = 0; i < consumers.length; i++) {
                        if (result.done) {
                            consumers[i](result);
                        } else {
                            buffers[i].push(result.value);
                            consumers[i]({ value: buffers[i].shift()!, done: false });
                        }
                    }
                    consumers.length = 0;
                });
            }
        };

        const createIterator = (index: number): AsyncIterator<T> => ({
            next: () => {
                return new Promise<IteratorResult<T>>(resolve => {
                    if (buffers[index].length > 0) {
                        resolve({ value: buffers[index].shift()!, done: false });
                    } else if (done) {
                        resolve({ value: undefined, done: true });
                    } else {
                        consumers[index] = resolve;
                        if (consumers.length === 2) {
                            pump();
                        }
                    }
                });
            }
        });

        return [
            { [Symbol.asyncIterator]: () => createIterator(0) },
            { [Symbol.asyncIterator]: () => createIterator(1) }
        ];
    }

    private async emitAndCollectStreamToString(
        stream: AsyncIterable<string>,
        client: Socket,
        eventName: string, // 我們讓事件名稱變成可配置的
    ): Promise<string> {
        let result = '';
        for await (const chunk of stream) {
            if (chunk) {
                client.emit(eventName, chunk); // 將文字片段即時發送給前端
                result += chunk;
            }
        }
        return result;
    }
}