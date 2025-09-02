import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { BadGatewayException, Logger, NotFoundException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SpeechClient } from '@google-cloud/speech';
import {
  GoogleGenerativeAI,
  Part,
  GenerativeModel,
} from '@google/generative-ai';
import { RedisService } from 'src/redis/redis.service';
import * as WebSocket from 'ws';
import { BattleAdminService } from 'src/battle/battle-admin.service';
import { UserService } from 'src/user/user.service';

// --- 型別定義 ---
interface ChatHistory {
  role: 'user' | 'model';
  parts: Part[];
}

// --- Gemini 系統指令 ---
const GEMINI_SYSTEM_INSTRUCTION = `
# Role: Conversational Lifestyle Robot

## Profile
- language: English
- description: AI for natural, engaging conversations, adapting linguistic style to predefined personas. Simulates human-like interactions.
- background: Simulates social scenarios and relationships.
- personality: Customizable via "Persona Configuration" (witty/sarcastic to friendly/supportive).
- expertise: Conversational English, contextual understanding, natural language generation, scenario-based dialogue.
- target_audience: Users seeking personalized AI conversations; developers needing versatile conversational AI.

## Skills

1. Core Conversational Skills
   - NLG: Produces fluent, contextually appropriate responses.
   - Contextual Understanding: Interprets user input to maintain relevance.
   - Sentiment Analysis: Responds to emotional undertones.
   - Persona Emulation: Embodies personality, background, and English proficiency from Persona Configuration.

2. Technical Skills
   - Variable Integration: Integrates traits, proficiency, background, and ending conditions from Persona Configuration.
   - Ending Condition Detection: Identifies predefined conversation conclusions.
   - Error Handling: Manages errors gracefully.

## Rules

1. Basic Principles:
   - Persona Adherence: Adhere to personality, English proficiency, background, and ending condition in Persona Configuration.
   - Conciseness: Provide direct responses.
   - Language Consistency: Maintain consistent English level.
   - Ending Condition Tagging: Append "[EOC]" if ending condition met; otherwise, "[EOT]".

2. Behavior Guidelines:
   - Contextual Appropriateness: Responses relevant to background and conversation.
   - Adaptive Language: Adjust language to match English proficiency.
   - Personality Consistency: Uphold assigned personality traits.
   - Ending Condition Monitoring: Monitor for predefined ending condition.

3. Limitations:
   - No External Data: Do not access external data.
   - Focused Scope: Generate responses and detect ending condition only.
   - No Code Blocks: Use plain text only.

## Workflows

- Goal: Generate responses based on Persona Configuration and determine if ending condition is met.
- Step 1: Analyze user input, adhering to Persona Configuration.
- Step 2: Construct response aligning with personality, English proficiency, and background.
- Step 3: Evaluate user input for ending condition.
- Step 4: Generate response and append "[EOC]" or "[EOT]".
- Expected Result: Conversational response with appropriate tag.

## OutputFormat

1. Text Output:
   - format: Plain text
   - style: Natural, conversational
   - special_requirements: Response with "[EOC]" or "[EOT]".

2. Format Specifications:
   - indentation: N/A
   - sections: Conversational text and ending tag only.
   - highlighting: N/A

3. Validation Rules:
   - constraints: Coherent sentences ending with "[EOC]" or "[EOT]".

4. Examples:
   1. Example 1:
      - Title: Standard Response
      - Format Type: Text
      - Description: Ending condition not met.
      - Example Content: What's new with you?[EOT]
   
   2. Example 2:
      - Title: Conversation Ending
      - Format Type: Text
      - Description: User signaled end.
      - Example Content: See you later![EOC]

## Initialization
As a Conversational Lifestyle Robot, adhere to Rules, execute Workflows, and output responses in plain text with the appropriate tag. Persona is defined in Persona Configuration.
`;

@WebSocketGateway()
export class TalkGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('TalkGateway');
  private readonly speechClient: SpeechClient;
  private readonly genAI: GoogleGenerativeAI;
  private readonly geminiModel: GenerativeModel;
  private readonly speechStreams = new Map<string, any>();
  private readonly ttsConnections = new Map<string, WebSocket>();

  constructor(
    private readonly redisService: RedisService,
    private readonly userService: UserService,
    private readonly battleService: BattleAdminService,
  ) {
    const gcpCredentialsJsonBase64 = process.env.GCP_CREDENTIALS_JSON;
    if (!gcpCredentialsJsonBase64)
      throw new Error('GCP credentials are required.');
    const gcpCredentialsJsonBuffer = Buffer.from(
      gcpCredentialsJsonBase64,
      'base64',
    ).toString('utf-8');
    const credentials = JSON.parse(gcpCredentialsJsonBuffer);
    this.speechClient = new SpeechClient({ credentials });

    const geminiApiKey = process.env.GCP_GEMINI_API;
    if (!geminiApiKey) throw new Error('GeminiAPI credentials are required.');
    this.genAI = new GoogleGenerativeAI(geminiApiKey);

    this.geminiModel = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
    });
  }

  afterInit(server: any) {
    this.logger.log('✅ WebSocket Gateway Initialized!', server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔗 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
    this.closeStreamForClient(client.id);
    this.ttsConnections.get(client.id)?.close();
  }

  @SubscribeMessage('createConversation')
  async handleCreateConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { name: string },
  ) {
    console.log(payload);

    this.logger.log(
      `[${client.id}] Received createConversation for name: "${payload.name}"`,
    );
    const initialPrompt = await this.buildInitialPrompt(payload.name);
    await this.processAndStreamResponse(initialPrompt, client.id, []);
  }

  @SubscribeMessage('audioStream')
  handleAudioStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    if (!this.speechStreams.has(client.id))
      this.createNewStreamForClient(client);
    const stream = this.speechStreams.get(client.id);
    if (stream) stream.write(Buffer.from(data, 'base64'));
  }

  @SubscribeMessage('endAudioStream')
  handleEndAudioStream(@ConnectedSocket() client: Socket) {
    const stream = this.speechStreams.get(client.id);
    if (stream) {
      this.logger.log(
        `🏁 Received end audio signal from ${client.id}. Ending STT input.`,
      );
      stream.end();
    }
  }

  private async buildInitialPrompt(name: string): Promise<string> {
    this.logger.log(`Building initial prompt for name: ${name}`);

    const userID = '5c7cb32f-a5c5-48b7-86cf-59b7250258ff';
    const battleID = '443893a7-8d6a-4c49-be13-0f4daf4b4fce';
    const user = await this.userService.findByID(userID);
    if (!user) {
      throw new NotFoundException(`User with ID "${userID}" not found`);
    }

    // const { id } = await this.battleService.getRandomStageByChildCategoryName(name)
    const battle = await this.battleService.findStageById(battleID);
    if (!battle) {
      throw new NotFoundException(`Battle with ID "${battleID}" not found`);
    }

    const prompt = `請你扮演一位名叫'${battle.npc?.name}'，現在的故事為${battle.backstory},需要使用的英文難度為${user.englishLevel},目標為${battle.targets},請開始你的對話！`;
    return prompt;
  }

  private createNewStreamForClient(client: Socket) {
    this.logger.log(`🚀 Creating new STT stream for ${client.id}`);
    const stream = this.speechClient
      .streamingRecognize({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-us',
        },
        interimResults: false,
      })
      .on('error', (err) => {
        this.logger.error(`STT Stream Error for ${client.id}:`, err);
        this.closeStreamForClient(client.id);
      })
      .on('data', async (data) => {
        const transcript = data.results[0]?.alternatives[0]?.transcript;
        if (transcript && data.results[0].isFinal) {
          this.logger.log(
            `🎤 Final Transcript for ${client.id}: ${transcript}`,
          );
          const history = await this.getHistoryFromRedis(client.id);
          await this.processAndStreamResponse(transcript, client.id, history);
          this.closeStreamForClient(client.id);
        }
      });
    this.speechStreams.set(client.id, stream);
  }

  private closeStreamForClient(clientId: string) {
    const stream = this.speechStreams.get(clientId);
    if (stream) {
      this.logger.log(`🧹 Cleaning up STT stream for ${clientId}`);
      stream.destroy();
      this.speechStreams.delete(clientId);
    }
  }

  private async processAndStreamResponse(
    prompt: string,
    clientId: string,
    history: ChatHistory[],
  ) {
    this.logger.log(`🤖 [${clientId}] Processing prompt: "${prompt}"`);

    let geminiStreamFinished = false;
    let ttsStreamClosed = false;

    const checkAndFinalize = () => {
      if (geminiStreamFinished && ttsStreamClosed) {
        this.logger.log(
          `✅ [${clientId}] BOTH streams finished. Sending final end signal.`,
        );
        this.server.to(clientId).emit('endAudioResponse');
      }
    };

    try {
      this.startElevenLabsStream(clientId, () => {
        ttsStreamClosed = true;
        checkAndFinalize();
      });

      const chat = this.geminiModel.startChat({ history });
      const result = await chat.sendMessageStream(prompt);
      const ttsWs = this.ttsConnections.get(clientId);
      let fullResponse = '';
      let endCondition: 'EOT' | 'EOC' | null = null;

      for await (const chunk of result.stream) {
        let chunkText = chunk.text();

        if (chunkText.includes('[EOC]')) {
          endCondition = 'EOC';
          chunkText = chunkText.replace('[EOC]', '');
        }
        if (chunkText.includes('[EOT]')) {
          endCondition = 'EOT';
          chunkText = chunkText.replace('[EOT]', '');
        }
        if (chunkText) {
          fullResponse += chunkText;
          if (ttsWs?.readyState === WebSocket.OPEN) {
            ttsWs.send(JSON.stringify({ text: chunkText }));
          }
        }
        if (endCondition) break;
      }

      geminiStreamFinished = true;
      this.logger.log(`✅ [${clientId}] Gemini stream finished.`);

      if (ttsWs?.readyState === WebSocket.OPEN) {
        ttsWs.send(JSON.stringify({ text: '' }));
      }
      checkAndFinalize();

      if (endCondition === 'EOC') {
        this.logger.log(
          `[${clientId}] End condition met. Sending final text response.`,
        );

        // 步驟 1: 透過新事件，將最後的文字回應傳給前端
        this.server.to(clientId).emit('finalResponse', { text: fullResponse });

        // 步驟 2: (非同步) 呼叫您自訂的函式來處理完整的對話歷史
        this.processFinalConversation(clientId, history, fullResponse);

        // 步驟 3: 清理 Redis 中的對話歷史
        await this.redisService.del(this.getHistoryRedisKey(clientId));
      } else {
        this.logger.log(
          `[${clientId}] Continuing conversation. Updating history.`,
        );
        await this.updateHistoryInRedis(
          clientId,
          history,
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'model', parts: [{ text: fullResponse }] },
        );
      }
    } catch (error) {
      this.logger.error(
        `Error in processAndStreamResponse for ${clientId}:`,
        error,
      );
      this.ttsConnections.get(clientId)?.close();
    }
  }

  private async processFinalConversation(
    clientId: string,
    history: ChatHistory[],
    finalResponse: string,
  ) {
    this.logger.log(
      `[${clientId}] Starting final processing for conversation history.`,
    );

    const userTurns = history
      .filter((h) => h.role === 'user')
      .map((h) => h.parts[0].text);
    const modelTurns = history
      .filter((h) => h.role === 'model')
      .map((h) => h.parts[0].text);

    const finalPromptForSummary = `
            請根據以下對話歷史，生成一個簡短的總結。
            使用者說了: ${userTurns.join(', ')}
            AI 回應了: ${modelTurns.join(', ')}
            AI 最後的回應是: ${finalResponse}
        `;

    this.logger.log(
      `[${clientId}] Final summary prompt: ${finalPromptForSummary}`,
    );
    // await someOtherAiModel.generate(finalPromptForSummary);
    // await database.save({ summary: '...' });
  }

  private startElevenLabsStream(clientId: string, onCloseCallback: () => void) {
    const voiceId = '0lp4RIz96WD1RUtvEu3Q';
    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_multilingual_v2`;
    const ttsWs = new WebSocket(wsUrl, {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    });
    this.ttsConnections.set(clientId, ttsWs);

    ttsWs.on('open', () => {
      this.logger.log(`🔊 [${clientId}] TTS WebSocket connection opened.`);
    });

    ttsWs.on('message', (data: Buffer) => {
      const response = JSON.parse(data.toString());

      if (response.audio) {
        this.server.to(clientId).emit('audioResponse', response.audio);
      }
    });

    ttsWs.on('close', () => {
      this.logger.log(`🔊 [${clientId}] TTS WebSocket connection closed.`);
      this.ttsConnections.delete(clientId);
      onCloseCallback();
    });

    ttsWs.on('error', (error) => {
      this.logger.error(`🔊 [${clientId}] TTS WebSocket error:`, error);
      if (this.ttsConnections.has(clientId)) {
        this.ttsConnections.get(clientId)?.close();
      } else {
        onCloseCallback();
      }
    });
  }

  // --- Redis Helpers (使用您的 RedisService) ---
  private getHistoryRedisKey(clientId: string): string {
    return `history:${clientId}`;
  }
  private async getHistoryFromRedis(clientId: string): Promise<ChatHistory[]> {
    const key = this.getHistoryRedisKey(clientId);
    const historyJson = await this.redisService.get(key);
    return historyJson ? JSON.parse(historyJson) : [];
  }
  private async updateHistoryInRedis(
    clientId: string,
    oldHistory: ChatHistory[],
    userTurn: ChatHistory,
    modelTurn: ChatHistory,
  ) {
    const key = this.getHistoryRedisKey(clientId);
    const newHistory = [...oldHistory, userTurn, modelTurn];
    await this.redisService.set(key, JSON.stringify(newHistory), 60 * 5);
  }
}
