import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, NotFoundException } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import {
  GoogleGenerativeAI,
  Part,
  GenerativeModel,
} from '@google/generative-ai';
import { RedisService } from 'src/redis/redis.service';
import { BattleAdminService } from 'src/battle/battle-admin.service';
import { UserService } from 'src/user/user.service';
import { v4 as uuidv4 } from 'uuid';

interface CreateConversationPayload {
  name: string; // 可能是 npcName 或 battleName
  userID: string;
}

interface DialogueAnalysisResult {
  summary: string;
  grammar: string;
  keywords: {
    word: string;
    explanation: string;
  }[];
}

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

@WebSocketGateway({
  cors: { orgin: '*' },
})
export class TalkGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('TalkGateway');
  private readonly speechClient: SpeechClient;
  private readonly genAI: GoogleGenerativeAI;
  private readonly geminiModel: GenerativeModel;

  private readonly speechStreams = new Map<string, any>();
  private readonly ttsConnections = new Map<string, WebSocket>();

  private clients: Map<WebSocket, string> = new Map();
  private clientsById: Map<string, WebSocket> = new Map();

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
    this.logger.log('✅ [系統] WebSocket 閘道器已初始化！');
  }

  handleConnection(client: WebSocket) {
    const clientId = uuidv4();
    this.clients.set(client, clientId);
    this.clientsById.set(clientId, client);
    this.logger.log(`🔗 [${clientId}] 客戶端連線成功。`);

    client.on('message', (data: Buffer) => {
      if (data instanceof Buffer) {
        if (!this.speechStreams.has(clientId)) {
          this.createNewStreamForClient(clientId);
        }
        this.speechStreams.get(clientId)?.write(data);
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    const clientId = this.clients.get(client);
    if (clientId) {
      this.logger.log(`🔌 [${clientId}] 客戶端連線中斷。`);
      this.closeStreamForClient(clientId);
      this.ttsConnections.get(clientId)?.close();
      this.clients.delete(client);
      this.clientsById.delete(clientId);
    }
  }

  @SubscribeMessage('createConversation')
  async handleCreateConversation(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() payload: CreateConversationPayload,
  ) {
    const clientId = this.clients.get(client);
    if (!clientId) return;
    this.logger.log(
      `🚀 [${clientId}] 收到 'createConversation' 事件，目標：'${payload.name}'`,
    );
    const initialPrompt = await this.buildInitialPrompt(
      payload.name,
      payload.userID,
    );
    await this.processAndStreamResponse(initialPrompt, clientId, []);
  }

  @SubscribeMessage('endAudioStream')
  handleEndAudioStream(@ConnectedSocket() client: WebSocket) {
    const clientId = this.clients.get(client);
    if (!clientId) return;
    const stream = this.speechStreams.get(clientId);
    if (stream) {
      this.logger.log(`🎤 [${clientId}] 收到音訊串流結束信號，停止 STT 輸入。`);
      stream.end();
    }
  }

  private async buildInitialPrompt(
    name: string,
    userId: string,
  ): Promise<string> {
    this.logger.debug(`[系統] 正在為目標 '${name}' 建立初始對話提示...`);
    const user = await this.userService.findByID(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    const battle =
      await this.battleService.getRandomStageByChildCategoryName(name);
    if (!battle) {
      throw new NotFoundException(`Battle with Name "${name}" not found`);
    }
    const prompt = `請你扮演一位名叫'${battle.npc?.name}'，現在的故事為${battle.backstory},需要使用的英文難度為${user.englishLevel},目標為${battle.targets},請開始你的對話！`;
    return prompt;
  }

  private createNewStreamForClient(clientId: string) {
    this.logger.log(`🎤 [${clientId}] 正在建立新的 STT 語音識別串流。`);
    const stream = this.speechClient
      .streamingRecognize({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 44100,
          languageCode: 'en-us',
          enableAutomaticPunctuation: true,
        },
        interimResults: false,
      })
      .on('error', (err) => {
        this.logger.error(`❌ [${clientId}] STT 串流錯誤:`, err);
        this.closeStreamForClient(clientId);
      })
      .on('data', async (data) => {
        const transcript = data.results[0]?.alternatives[0]?.transcript;
        if (transcript && data.results[0].isFinal) {
          this.logger.log(`🎤 [${clientId}] STT 最終識別結果: '${transcript}'`);
          const history = await this.getHistoryFromRedis(clientId);
          await this.processAndStreamResponse(transcript, clientId, history);
          this.closeStreamForClient(clientId);
        }
      });
    this.speechStreams.set(clientId, stream);
  }

  private closeStreamForClient(clientId: string) {
    const stream = this.speechStreams.get(clientId);
    if (stream) {
      this.logger.log(`🧹 [${clientId}] 正在清理 STT 語音識別串流...`);
      stream.destroy();
      this.speechStreams.delete(clientId);
    }
  }

  private async processAndStreamResponse(
    prompt: string,
    clientId: string,
    history: ChatHistory[],
  ) {
    this.logger.log(`🤖 [${clientId}] 開始處理提示並串流回覆...`);
    this.logger.debug(`[${clientId}] 待處理的提示文字: "${prompt}"`);

    let geminiStreamFinished = false;
    let ttsStreamClosed = false;

    const checkAndFinalize = () => {
      if (geminiStreamFinished && ttsStreamClosed) {
        this.logger.log(
          `✅ [${clientId}] Gemini 與 TTS 串流均已完成，發送最終結束信號。`,
        );
        this.sendToClientById(clientId, 'endAudioResponse', {});
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
        // 【修正】使用 if...else if 來確保 [EOC] 的優先級
        if (chunkText.includes('[EOC]')) {
          endCondition = 'EOC';
          chunkText = chunkText.replace('[EOC]', '');
        } else if (chunkText.includes('[EOT]')) {
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
      this.logger.log(`✅ [${clientId}] Gemini 串流已完成。`);
      this.logger.debug(`[${clientId}] Gemini 完整回覆: "${fullResponse}"`);

      if (ttsWs?.readyState === WebSocket.OPEN) {
        ttsWs.send(JSON.stringify({ text: '' }));
      }
      checkAndFinalize();

      if (endCondition === 'EOC') {
        this.logger.log(
          `🏁 [${clientId}] 偵測到對話結束條件 [EOC]。準備進行最終分析。`,
        );
        this.sendToClientById(clientId, 'finalResponse', {
          text: fullResponse,
        });
        this.processFinalConversation(clientId, history, prompt, fullResponse); // 非同步執行
        await this.redisService.del(this.getHistoryRedisKey(clientId));
      } else {
        this.logger.log(`💬 [${clientId}] 對話繼續 [EOT]。正在更新歷史紀錄。`);
        await this.updateHistoryInRedis(
          clientId,
          history,
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'model', parts: [{ text: fullResponse }] },
        );
      }
    } catch (error) {
      this.logger.error(`❌ [${clientId}] 處理串流回覆時發生錯誤:`, error);
      this.ttsConnections.get(clientId)?.close();
    }
  }

  private async processFinalConversation(
    clientId: string,
    history: ChatHistory[],
    lastUserPrompt: string,
    lastModelResponse: string,
  ) {
    this.logger.log(`📊 [${clientId}] 開始對完整對話進行最終分析...`);
    try {
      let finalConversation = history
        .map((turn) => `${turn.role}: ${turn.parts[0].text}`)
        .join('\n');
      finalConversation += `\nuser: ${lastUserPrompt}`;
      finalConversation += `\nmodel: ${lastModelResponse}`;

      this.logger.debug(
        `[${clientId}] 📜 用於最終分析的完整對話日誌:\n${finalConversation}`,
      );

      const finalPrompt = `
# Role: AI Dialogue Analysis Expert

## Profile
- language: English
- description: Analyzes and summarizes user-AI dialogues, focusing on semantics, grammar, and key words, outputting in JSON.
- background: NLP, speech recognition, and data analysis expertise.
- personality: Precise, objective, practical, and efficient.
- expertise: Dialogue analysis, semantic understanding, grammar analysis, keyword extraction, JSON formatting.
- target_audience: Speech tech developers, language learners, AI product managers.

## Skills

1. Dialogue Analysis and Summarization
   - Semantic Understanding: Accurately understand dialogue meaning.
   - Content Extraction: Extract main information and viewpoints.
   - Summarization: Concisely summarize dialogue (within 20 seconds of speech).
   - Intent Recognition: Identify user and AI communication intentions.

2. Grammar Analysis
   - Grammar Correction: Identify potential grammatical errors.
   - Structural Analysis: Analyze sentence structure (subject-verb-object, etc.).
   - Usage Explanation: Explain grammatical phenomena.

3. Keyword Extraction
   - Key Word Identification: Identify important words/phrases.
   - Contextual Association: Infer word meaning from context.
   - Part-of-Speech Tagging: Tag word part of speech.
   - Meaning Explanation: Explain key word meaning in dialogue.

4. JSON Formatting
   - Data Structure Design: Design compliant JSON structure.
   - Format Conversion: Convert analysis results to JSON.
   - Format Validation: Ensure JSON correctness.
   - Encoding Handling: Handle encoding for correct parsing.

## Rules

1. Basic Principles:
   - Accuracy: Ensure analysis accuracy.
   - Objectivity: Maintain objectivity and neutrality.
   - Simplicity: Concise summary content.
   - Comprehensiveness: Cover key dialogue information.

2. Behavioral Guidelines:
   - Context Priority: Consider context during analysis.
   - Hypothesis Verification: Verify assumptions about speech recognition errors.
   - Emphasis: Highlight key information.
   - Continuous Learning: Improve analysis capabilities.

3. Constraints:
   - Duration Limit: Summarized speech around 20 seconds.
   - Error Tolerance: Handle speech recognition errors.
   - Knowledge Boundary: Acknowledge knowledge limitations.
   - Avoid Creation: Only analyze existing dialogue.

## Workflows

- Goal: Analyze user-AI dialogue and output JSON with summaries, grammar analysis, and key words. Input and output in English.
- Step 1: Receive user-AI dialogue in English.
- Step 2: Perform semantic understanding and content extraction, focusing on user intent.
- Step 3: Perform grammar analysis, identifying and correcting errors.
- Step 4: Extract key words and explain their meanings.
- Step 5: Organize information into JSON format.
- Step 6: Output compliant JSON data.
- Expected Result: JSON file for voice assistants, language learning, etc.

## OutputFormat

1. JSON Output Format:
   - format: json
   - structure: Contains three top-level fields: 'summary', 'grammar', 'keywords'.
     - 'summary': String, containing the summary of the dialogue.
     - 'grammar': String, containing the grammar summary of the dialogue.
     - 'keywords': Array, containing objects of key single words. Each object contains 'word' (single word) and 'explanation' (explanation). 'keywords' is a required field, and should be an empty array "[]" if no keywords are identified.
   - style: Concise, clear, easy to parse.
   - special_requirements: Ensure all characters use UTF-8 encoding.

2. Format Specifications:
   - indentation: Use 2 spaces for indentation.
   - sections: No need to divide into sections, directly output the JSON object.
   - highlighting: No need to highlight.

3. Validation Rules:
   - validation: Use JSON Schema to validate the correctness of the JSON format.
   - constraints: All fields must exist and have the correct type.
   - error_handling: If a valid JSON cannot be generated, output an error message and provide the reason.

4. Example Description:
   1. Example 1:
      - Title: Complete Example
      - Format Type: json
      - Description: Complete example containing all three fields.
      - Example Content: |
          {
            "summary": "The user asked the AI how to make pizza, and the AI provided the steps to make pizza, including preparing the ingredients and baking methods.",
            "grammar": "The dialogue uses imperative sentences to describe the making steps, such as 'Mix flour and water'.",
            "keywords": [
              {
                "word": "pizza",
                "explanation": "An Italian flatbread, usually covered with tomato sauce, cheese, and toppings."
              },
              {
                "word": "bake",
                "explanation": "The process of heating food in an oven."
              }
            ]
          }

          ## Initialization
          As an AI Dialogue Analysis Expert, you must follow the above Rules, execute tasks according to the Workflows, and output according to the JSON output format. The input and output should be in English.

          ##DIALOGUE TO ANALYZE
${finalConversation}

## TASK
Now, analyze the dialogue above and provide the output strictly in the specified JSON format. Do not include any other text, explanations, or markdown formatting like

          `;

      const analysisModel = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const result = await analysisModel.generateContent(finalPrompt);
      const rawResponseText = result.response.text();

      const jsonStartIndex = rawResponseText.indexOf('{');
      const jsonEndIndex = rawResponseText.lastIndexOf('}');
      let analysisResult: DialogueAnalysisResult;
      if (
        jsonStartIndex === -1 ||
        jsonEndIndex === -1 ||
        jsonEndIndex < jsonStartIndex
      ) {
        this.logger.error(
          `❌ [${clientId}] 在模型回應中找不到有效的 JSON 物件。`,
        );
        throw new Error('Response does not contain a valid JSON object.');
      }

      const jsonString = rawResponseText.substring(
        jsonStartIndex,
        jsonEndIndex + 1,
      );

      try {
        analysisResult = JSON.parse(jsonString);
      } catch (parseError) {
        this.logger.error(
          `❌ [${clientId}] 解析模型回傳的 JSON 失敗:`,
          parseError,
        );
        this.logger.error(
          `[${clientId}] 📄 無法解析的原始文字: ${rawResponseText}`,
        );
        throw new Error('Failed to parse JSON response from the model.');
      }

      this.logger.log(`✅ [${clientId}] 成功生成並解析對話分析結果。`);
      this.sendToClientById(clientId, 'conversationAnalysisReady', {
        analysis: analysisResult,
      });
      this.logger.log(`📤 [${clientId}] 已將最終分析結果發送至前端。`);
    } catch (error) {
      this.logger.error(
        `❌ [${clientId}] 在最終對話分析過程中發生錯誤:`,
        error,
      );
      this.sendToClientById(clientId, 'conversationAnalysisFailed', {
        error: '無法生成對話分析，請稍後再試。',
      });
    }
  }

  private startElevenLabsStream(clientId: string, onCloseCallback: () => void) {
    const voiceId = 'si0svtk05vPEuvwAW93c';
    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_multilingual_v2`;
    const ttsWs = new WebSocket(wsUrl, {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    });
    this.ttsConnections.set(clientId, ttsWs);

    ttsWs.on('open', () => {
      this.logger.log(`🔊 [${clientId}] TTS WebSocket 連線已開啟。`);
    });

    ttsWs.on('message', (data: Buffer) => {
      const response = JSON.parse(data.toString());
      if (response.audio) {
        this.sendToClientById(clientId, 'audioResponse', response.audio);
      } else {
        // this.logger.debug(`[${clientId}] TTS 收到非音訊訊息:`, response);
      }
    });

    ttsWs.on('close', () => {
      this.logger.log(`🔊 [${clientId}] TTS WebSocket 連線已關閉。`);
      this.ttsConnections.delete(clientId);
      onCloseCallback();
    });

    ttsWs.on('error', (error) => {
      this.logger.error(`❌ [${clientId}] TTS WebSocket 發生錯誤:`, error);
      this.ttsConnections.get(clientId)?.close();
    });
  }

  private sendToClientById(
    clientId: string,
    event: string,
    payload: any,
  ): boolean {
    const client = this.clientsById.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, payload }));
      return true;
    }
    return false;
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
