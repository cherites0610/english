// In: talk.gateway.ts

import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TalkService } from './talk.service';
import { Logger } from '@nestjs/common';
import { PassThrough } from 'stream';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class TalkGateway {
    @WebSocketServer()
    server: Server;
    private readonly logger = new Logger(TalkGateway.name);

    constructor(private readonly talkService: TalkService) { }

    // 我們不再使用之前的 'talk-stream'，而是建立一個更完整的流程
    // 讓客戶端可以透過 'start-talk' 開始一個新的對話串流
    @SubscribeMessage('start-talk')
    async handleTalkStream(
        @MessageBody() data: { userID: string; talkID: string },
        @ConnectedSocket() client: Socket,
    ): Promise<void> {
        const { userID, talkID } = data;
        this.logger.log(`Client ${client.id} started a talk stream for talkID: ${talkID}`);

        // 1. 建立一個 PassThrough Stream
        // 這是一個可讀寫的流，用來接收從前端傳來的音訊塊
        const audioInputStream = new PassThrough();

        // 2. 監聽從同一個客戶端傳來的 'audio-chunk' 事件
        // 並將收到的音訊塊寫入我們的 audioInputStream
        const onAudioChunk = (chunk: Buffer) => {
            audioInputStream.write(chunk);
        };
        client.on('audio-chunk', onAudioChunk);

        // 3. 監聽客戶端結束說話的事件
        client.once('end-audio', () => {
            this.logger.log(`Client ${client.id} ended audio stream.`);
            audioInputStream.end(); // 結束寫入，觸發後續的 STT 處理
            client.off('audio-chunk', onAudioChunk); // 清理監聽器
        });

        // 4. [核心流程] 呼叫 TalkService 的新方法來處理整個端到端串流
        try {
            await this.talkService.handleEndToEndStream(
                userID,
                talkID,
                audioInputStream, // 將音訊輸入流傳遞下去
                client,             // 將 socket client 傳遞下去，以便回傳音訊
            );
            client.emit('stream-end');
            this.logger.log(`Full stream processing finished for client: ${client.id}`);
        } catch (error) {
            this.logger.error(`E2E stream failed for ${client.id}:`, error);
            client.emit('stream-error', { message: error.message || '處理串流時發生未知錯誤' });
        }
    }
}