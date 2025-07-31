import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { isSameDay } from 'date-fns';
import { QuestService } from 'src/quest/quest.service';
import { validate as isUuid } from 'uuid';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly questService: QuestService,
  ) { }

  async findByID(id: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    return user;
  }

  async findByLineID(lineID: string) {
    const user = await this.userRepository.findOneBy({ lineID: lineID });
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOneBy({ email: email });
    return user;
  }

  async findByGoogleID(googleID: string) {
    const user = await this.userRepository.findOneBy({ googleID: googleID });
    return user;
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    await this.userRepository.save(user);

    this.logger.log(`Assigning initial quests to new user ${user.id}...`);
    try {
      const initialQuests =
        await this.questService.getInitialQuestsForNewPlayer();

      // 使用 Promise.all 來並行處理，但為了錯誤隔離，for...of 更好
      for (const template of initialQuests) {
        try {
          await this.questService.activateQuestForPlayer(user.id, template.id);
        } catch {
          // 如果單個任務添加失敗（例如已存在），只記錄錯誤，不中斷整個註冊流程
          this.logger.error(
            `Failed to assign quest ${template.id} to user ${user.id}`,
          );
        }
      }
    } catch {
      // 如果獲取任務列表本身失敗，記錄一個更嚴重的錯誤
      this.logger.error(
        `Could not fetch initial quests for new user ${user.id}`,
      );
    }
    return user;
  }

  async update(userID: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findByID(userID);
    if (!user) {
      throw new NotFoundException('找不到該用戶');
    }

    await this.userRepository.update(userID, updateData);
    return { ...user, ...updateData }; // 合併原資料與更新資料
  }

  async processDailyLoginIfNeeded(user: User): Promise<User> {
    const now = new Date();

    if (!user.lastLoginAt || !isSameDay(new Date(user.lastLoginAt), now)) {
      this.logger.debug('處理每日初次登陸業務邏輯層');
      this.questService.resetDailyQuestsForUser(user);
      return await this.update(user.id, { lastLoginAt: now });
    }

    return user;
  }

  async findListByNameOrID(param: string) {
    const whereConditions: FindOptionsWhere<User>[] = [
      { name: Like(`%${param}%`) }
    ];

    if (isUuid(param)) {
      whereConditions.push({ id: Like(`%${param}%`) });
    }

    // 4. 使用動態產生的條件陣列進行查詢
    return await this.userRepository.find({
      where: whereConditions
    });
  }
}
