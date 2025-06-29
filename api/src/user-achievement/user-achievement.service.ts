import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserAchievementDto } from './dto/create-user-achievement.dto';
import { UpdateUserAchievementDto } from './dto/update-user-achievement.dto';
import { UserAchievement } from './entity/user-achievement.entity';
import { User } from 'src/user/entity/user.entity';
import { Achievement } from 'src/achievement/entity/achievement.entity';

@Injectable()
export class UserAchievementService {
  private readonly logger = new Logger(UserAchievementService.name);

  constructor(
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
  ) {}

  async create(dto: CreateUserAchievementDto): Promise<UserAchievement> {
    const user = await this.userRepo.findOneByOrFail({ id: dto.userId });
    const achievement = await this.achievementRepo.findOneByOrFail({
      id: dto.achievementId,
    });

    // create 方法可以增加一個檢查，如果希望它也具備防止重複的功能
    const existingRecord = await this.userAchievementRepo.findOneBy({
      user: { id: dto.userId },
      achievement: { id: dto.achievementId },
    });
    if (existingRecord) {
      throw new ConflictException(
        `User ${dto.userId} already has achievement ${dto.achievementId}`,
      );
    }

    const entity = this.userAchievementRepo.create({
      user,
      achievement,
    });

    return this.userAchievementRepo.save(entity);
  }

  findAll(userID: string): Promise<UserAchievement[]> {
    return this.userAchievementRepo.find({
      relations: ['user', 'achievement'],
      where: { user: { id: userID } },
    });
  }

  async findOne(id: string): Promise<UserAchievement> {
    const record = await this.userAchievementRepo.findOne({
      where: { id },
      relations: ['user', 'achievement'],
    });

    if (!record) {
      throw new NotFoundException(`UserAchievement ${id} not found`);
    }

    return record;
  }

  async update(
    id: string,
    dto: UpdateUserAchievementDto,
  ): Promise<UserAchievement> {
    // 提醒：根據您的實體結構，此方法可能沒有太多實際用途
    const record = await this.findOne(id);

    if (dto.userId) {
      record.user = await this.userRepo.findOneByOrFail({ id: dto.userId });
    }

    if (dto.achievementId) {
      record.achievement = await this.achievementRepo.findOneByOrFail({
        id: dto.achievementId,
      });
    }

    return this.userAchievementRepo.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.userAchievementRepo.remove(record);
  }

  /**
   * 為指定用戶解鎖一項成就（核心業務邏輯）
   * @param userID 使用者 ID
   * @param achievementID 成就模板 ID
   * @returns 返回 UserAchievement 記錄，如果已存在則返回現有記錄
   */
  async unlock(
    userID: string,
    achievementID: string,
  ): Promise<UserAchievement> {
    // 1. 檢查該成就記錄是否已存在
    const existingRecord = await this.userAchievementRepo.findOneBy({
      user: { id: userID },
      achievement: { id: achievementID },
    });

    // 2. 如果已存在，直接返回，確保冪等性
    if (existingRecord) {
      this.logger.log(
        `User ${userID} already has achievement ${achievementID}. Unlock call skipped.`,
      );
      return existingRecord;
    }

    // 3. 如果不存在，驗證 User 和 Achievement 的存在性
    // findOneByOrFail 會在找不到時自動拋出 NotFoundException
    const user = await this.userRepo.findOneByOrFail({ id: userID });
    const achievement = await this.achievementRepo.findOneByOrFail({
      id: achievementID,
    });

    // 4. 創建新的 UserAchievement 記錄
    this.logger.log(
      `Unlocking achievement ${achievement.name} for user ${user.name}...`,
    );
    const newUnlock = this.userAchievementRepo.create({
      user,
      achievement,
    });

    // 5. 儲存並返回新記錄
    return this.userAchievementRepo.save(newUnlock);
  }
}
