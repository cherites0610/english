import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, MoreThan, Repository } from 'typeorm';
import { GameEventDto } from './dto/game-event.dto';
import { UserQuestStatus } from './enums/user-quest-status.enum';
import { QuestTemplate } from './entity/quest-template.entity';
import { User } from 'src/user/entity/user.entity';
import { QuestRewardType } from './enums/quest-reward-type.enum';
import { UserQuestLog } from './entity/user-quest-log.entity';
import { QuestTemplateType } from './enums/quest-template-type.enum';
import { QuestLogViewType } from './enums/quest-log-view-type.enum';
import {
  QuestLogEntryDto,
  RequirementProgressDto,
  RewardDto,
} from './dto/quest-log-response.dto';
import { UserAchievementService } from 'src/user-achievement/user-achievement.service';

@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);

  constructor(
    @InjectRepository(UserQuestLog)
    private readonly userQuestLogRepository: Repository<UserQuestLog>,
    @InjectRepository(QuestTemplate)
    private readonly questTemplateRepository: Repository<QuestTemplate>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userAchievementService: UserAchievementService,
  ) { }

  // 取得玩家的任務日誌
  async getPlayerQuestLog(
    userId: string,
    viewType: QuestLogViewType,
  ): Promise<QuestLogEntryDto[]> {
    // 1. ========= 資料庫查詢 (使用 QueryBuilder) =========
    const query = this.userQuestLogRepository
      .createQueryBuilder('log')
      // 內連接並選取 template，因為任務日誌必須有模板
      .innerJoinAndSelect('log.template', 'template')
      // 左連接並選取，因為 template 可能沒有 requirements 或 rewards
      .leftJoinAndSelect('template.requirements', 'requirements')
      .leftJoinAndSelect('template.rewards', 'rewards')
      // 指定查詢的使用者
      .where('log.userId = :userId', { userId });

    // 2. ========= 根據視圖類型進行過濾 =========
    if (viewType === QuestLogViewType.REGULAR) {
      // 查詢常規任務 (主線、支線、日常)
      query
        .andWhere('template.type IN (:...types)', {
          types: [
            QuestTemplateType.MAIN,
            QuestTemplateType.SIDE,
            QuestTemplateType.DAILY,
          ],
        })
        // 過濾掉「已領取」的「主線任務」
        // SQL 邏輯: AND (template.type != 'MAIN' OR log.status != 'CLAIMED')
        .andWhere(
          new Brackets((qb) => {
            qb.where('template.type != :mainType', {
              mainType: QuestTemplateType.MAIN,
            }).orWhere('log.status != :claimedStatus', {
              claimedStatus: UserQuestStatus.CLAIMED,
            });
          }),
        );
    } else {
      // viewType === QuestLogViewType.ACHIEVEMENT
      // 查詢成就任務
      query.andWhere('template.type = :type', {
        type: QuestTemplateType.ACHIEVEMENT,
      });
    }

    // 執行查詢，獲取原始數據
    const rawLogs: UserQuestLog[] = await query.getMany();

    // 3. ========= 在記憶體中進行自訂排序 (僅針對常規任務) =========
    if (viewType === QuestLogViewType.REGULAR) {
      // 為狀態和類型定義排序權重
      const statusScore = {
        [UserQuestStatus.IN_PROGRESS]: 0, // 進行中排最前
        [UserQuestStatus.COMPLETED]: 1, // 已完成待領取次之
        [UserQuestStatus.CLAIMED]: 2, // 已領取排最後
      };

      const typeScore = {
        [QuestTemplateType.MAIN]: 0, // 主線最前
        [QuestTemplateType.SIDE]: 1, // 支線次之
        [QuestTemplateType.DAILY]: 2, // 日常再次之
        [QuestTemplateType.ACHIEVEMENT]: 3,
      };

      rawLogs.sort((a, b) => {
        // 規則一：優先比較狀態
        const statusComparison = statusScore[a.status] - statusScore[b.status];
        if (statusComparison !== 0) {
          return statusComparison;
        }
        // 規則二：如果狀態相同，則比較任務類型
        return typeScore[a.template.type] - typeScore[b.template.type];
      });
    } else {
      // 成就任務可以按其他方式排序，例如更新時間
      rawLogs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    // 4. ========= 將原始數據轉換為前端友好的 DTO =========
    const responseDtos: QuestLogEntryDto[] = rawLogs.map((log) => {
      const requirements: RequirementProgressDto[] =
        log.template.requirements.map((req) => ({
          type: req.type,
          targetCount: req.count,
          // 合併進度數據，如果 progress 中沒有該項，預設為 0
          currentCount: log.progress[req.type] || 0,
        }));

      const rewards: RewardDto[] = log.template.rewards.map((rew) => ({
        type: rew.type,
        count: rew.count,
        metadata: rew.metadata,
      }));

      // 組裝成最終的 DTO 物件
      return {
        logId: log.id,
        status: log.status,
        questType: log.template.type,
        title: log.template.title,
        description: log.template.description,
        requirements: requirements,
        rewards: rewards,
      };
    });

    return responseDtos;
  }

  async activateQuestForPlayer(
    userId: string,
    templateId: string,
  ): Promise<UserQuestLog> {
    const template = await this.questTemplateRepository.findOne({
      where: { id: templateId },
      relations: ['requirements'], // 確保載入 requirements
    });

    if (!template) {
      throw new NotFoundException(`Quest template ${templateId} not found`);
    }

    // 檢查是否已經存在一個相同模板的任務日誌 (防止重複接取)
    const existingLog = await this.userQuestLogRepository.findOneBy({
      user: { id: userId },
      template: { id: templateId },
    });

    if (existingLog) {
      throw new ConflictException(
        `User already has an active or completed log for quest ${templateId}`,
      );
    }

    const initialProgress = {};
    template.requirements.forEach((req) => {
      initialProgress[req.type] = 0;
    });

    const newLog = this.userQuestLogRepository.create({
      user: { id: userId },
      template: template,
      progress: initialProgress,
    });

    this.logger.log(
      `Activated quest "${template.title}" (Template ID: ${templateId}) for user ${userId}.`,
    );
    return this.userQuestLogRepository.save(newLog);
  }

  // 處理遊戲事件，核心邏輯
  async handleGameEvent(userId: string, event: GameEventDto): Promise<void> {
    const { eventType, count } = event;

    const activeLogs = await this.userQuestLogRepository.find({
      where: { user: { id: userId }, status: UserQuestStatus.IN_PROGRESS },
      relations: ['template', 'template.requirements'], // 確保載入需求
    });

    for (const log of activeLogs) {
      // 尋找此任務中是否有與事件類型相符的需求
      const relevantRequirement = log.template.requirements.find(
        (req) => req.type === eventType,
      );

      if (!relevantRequirement) {
        continue; // 此任務與此事件無關，跳過
      }

      // 更新進度
      const currentProgress = log.progress[eventType] || 0;
      const targetCount = relevantRequirement.count;

      if (currentProgress >= targetCount) {
        continue; // 此項需求已完成，跳過
      }

      const newProgress = Math.min(currentProgress + count, targetCount);
      log.progress[eventType] = newProgress;

      // 檢查整個任務是否完成
      const isCompleted = this.isQuestCompleted(log);
      if (isCompleted) {
        log.status = UserQuestStatus.COMPLETED;
      }

      await this.userQuestLogRepository.save(log);
    }
  }

  private isQuestCompleted(log: UserQuestLog): boolean {
    for (const requirement of log.template.requirements) {
      const progress = log.progress[requirement.type] || 0;
      if (progress < requirement.count) {
        return false; // 尚有未完成的需求
      }
    }
    return true; // 所有需求均已完成
  }

  // 領取獎勵
  async claimReward(userId: string, logId: string): Promise<User> {
    const log = await this.userQuestLogRepository.findOne({
      where: { id: logId, user: { id: userId } },
      relations: ['user', 'template', 'template.rewards'], // 確保載入獎勵
    });

    if (!log) throw new NotFoundException('Quest log not found.');
    if (log.status !== UserQuestStatus.COMPLETED) {
      throw new ForbiddenException('Quest not ready to be claimed.');
    }

    const user = log.user;

    // --- 獎勵處理循環 ---
    for (const reward of log.template.rewards) {
      switch (reward.type) {
        case QuestRewardType.GAIN_GOLD:
          user.money += reward.count;
          break;
        case QuestRewardType.GAIN_EXPERIENCE:
          user.experience += reward.count;
          break;

        case QuestRewardType.UNLOCK_QUEST:
          const nextQuestTemplateId = reward.metadata?.questTemplateId;
          if (nextQuestTemplateId) {
            // 呼叫啟用任務的方法，並忽略錯誤（例如玩家已接取）
            await this.activateQuestForPlayer(
              userId,
              nextQuestTemplateId,
            ).catch(() => {
              this.logger.warn(
                `Failed to activate next quest ${nextQuestTemplateId} for user ${userId}`,
              );
            });
          }
          break;

        case QuestRewardType.UNLOCK_ACHIEVEMENT:
          const achievementID = reward.metadata?.achievementID as string;
          this.userAchievementService.unlock(userId, achievementID);

          break;
      }
    }

    log.status = UserQuestStatus.CLAIMED;
    await this.userQuestLogRepository.save(log);

    return this.userRepository.save(user);
  }

  async getInitialQuestsForNewPlayer(): Promise<QuestTemplate[]> {
    const achievementQuests = await this.questTemplateRepository.find({
      where: {
        type: In([QuestTemplateType.ACHIEVEMENT, QuestTemplateType.DAILY]),
      },
    });

    const firstMainQuest = await this.questTemplateRepository.findOne({
      where: { questKey: 'MAIN_QUEST_1_1' },
    });

    const initialQuests = [...achievementQuests];
    if (firstMainQuest) {
      initialQuests.push(firstMainQuest);
    } else {
      this.logger.error(
        'CRITICAL: First main quest (MAIN_QUEST_1_1) not found!',
      );
    }

    return initialQuests;
  }

  async resetDailyQuestsForUser(user: User): Promise<void> {
    this.logger.log(`Checking daily quests for user ${user.id}...`);

    // 1. 獲取所有日常任務模板
    const dailyQuestTemplates = await this.questTemplateRepository.find({
      where: { type: QuestTemplateType.DAILY },
      relations: ['requirements'],
    });

    if (dailyQuestTemplates.length === 0) {
      return; // 沒有任何日常任務需要處理
    }

    // 2. 檢查用戶今天是否已經有這些日常任務
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 設定為今天的零點

    const existingTodayLogs = await this.userQuestLogRepository.find({
      where: {
        user: { id: user.id },
        template: { type: QuestTemplateType.DAILY },
        createdAt: MoreThan(today), // 創建時間晚於今天零點
      },
      relations: ['template'],
    });

    const existingTodayTemplateIds = new Set(
      existingTodayLogs.map((log) => log.template.id),
    );

    // 3. 遍歷所有日常任務模板，如果用戶今天還沒有，就為他創建
    for (const template of dailyQuestTemplates) {
      if (!existingTodayTemplateIds.has(template.id)) {
        // 這個用戶今天還沒有這個日常任務，為他啟用
        try {
          // 使用 { id } 來避免傳遞整個物件，提高效能
          await this.activateQuestForPlayer(user.id, template.id);
        } catch {
          // 即使單個任務啟用失敗（例如因為極端情況下的衝突），也只記錄錯誤，不影響其他任務
          this.logger.error(
            `Failed to activate daily quest ${template.id} for user ${user.id}`,
          );
        }
      }
    }

    this.logger.log(`Daily quest check finished for user ${user.id}.`);
  }
}
