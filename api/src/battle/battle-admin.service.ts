import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// entity
import { BattleParentCategory } from './entity/battle-parent-category.entity';
import { BattleChildCategory } from './entity/battle-child-category.entity';
import { BattleStage } from './entity/battle-stage.entity';
import { Npc } from 'src/npc/entity/npc.entity';
import { BattleReward } from './entity/battle-reward.entity';

// DTOs
import {
  CreateBattleParentCategoryDto,
  UpdateBattleParentCategoryDto,
  BattleParentCategoryDto,
} from './dto/admin/battle-parent-category.dto';
import {
  CreateBattleChildCategoryDto,
  UpdateBattleChildCategoryDto,
  BattleChildCategoryDto,
} from './dto/admin/battle-child-category.dto';
import {
  CreateBattleStageDto,
  UpdateBattleStageDto,
  BattleStageDto,
} from './dto/admin/battle-stage.dto';
import { NpcDto } from 'src/npc/dto/npc.dto';
import { BattleRewardDto } from './dto/admin/battle-reward.dto';

@Injectable()
export class BattleAdminService {
  private readonly logger = new Logger(BattleAdminService.name);
  constructor(
    @InjectRepository(BattleParentCategory)
    private readonly parentCategoryRepo: Repository<BattleParentCategory>,
    @InjectRepository(BattleChildCategory)
    private readonly childCategoryRepo: Repository<BattleChildCategory>,
    @InjectRepository(BattleStage)
    private readonly stageRepo: Repository<BattleStage>,
    @InjectRepository(Npc) private readonly npcRepo: Repository<Npc>,
  ) { }

  // --- Parent Category Management ---

  async createParentCategory(
    dto: CreateBattleParentCategoryDto,
  ): Promise<BattleParentCategoryDto> {
    const category = this.parentCategoryRepo.create(dto);
    const savedCategory = await this.parentCategoryRepo.save(category);
    return this.mapParentToDto(savedCategory);
  }

  async findAllParentCategories(): Promise<BattleParentCategoryDto[]> {
    const categories = await this.parentCategoryRepo.find({
      order: { name: 'ASC' },
    });
    return categories.map((category) => this.mapParentToDto(category));
  }

  async updateParentCategory(
    id: string,
    dto: UpdateBattleParentCategoryDto,
  ): Promise<BattleParentCategoryDto> {
    const category = await this.parentCategoryRepo.preload({ id, ...dto });
    if (!category) throw new NotFoundException(`找不到 ID 為 ${id} 的父分類`);
    await this.parentCategoryRepo.save(category);
    return this.mapParentToDto(category);
  }

  async removeParentCategory(id: string): Promise<void> {
    const result = await this.parentCategoryRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`找不到 ID 為 ${id} 的父分類`);
  }

  // --- Child Category Management ---

  async createChildCategory(
    dto: CreateBattleChildCategoryDto,
  ): Promise<BattleChildCategoryDto> {
    const parent = await this.parentCategoryRepo.findOneByOrFail({
      id: dto.parentId,
    });
    const category = this.childCategoryRepo.create({ ...dto, parent });
    const savedCategory = await this.childCategoryRepo.save(category);
    return this.findChildCategoryById(savedCategory.id);
  }

  async findAllChildCategories(): Promise<BattleChildCategoryDto[]> {
    const categories = await this.childCategoryRepo.find({
      relations: ['parent'],
      order: { name: 'ASC' },
    });
    // 這裡原本就是正確的寫法，保持不變
    return categories.map((cat) => this.mapChildToDto(cat));
  }

  async findChildCategoryById(id: string): Promise<BattleChildCategoryDto> {
    const category = await this.childCategoryRepo.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!category) throw new NotFoundException(`找不到 ID 為 ${id} 的子分類`);
    return this.mapChildToDto(category);
  }

  async updateChildCategory(
    id: string,
    dto: UpdateBattleChildCategoryDto,
  ): Promise<BattleChildCategoryDto> {
    const category = await this.childCategoryRepo.preload({ id, ...dto });
    if (!category) throw new NotFoundException(`找不到 ID 為 ${id} 的子分類`);

    if (dto.parentId) {
      category.parent = await this.parentCategoryRepo.findOneByOrFail({
        id: dto.parentId,
      });
    }

    await this.childCategoryRepo.save(category);
    return this.findChildCategoryById(id);
  }

  async removeChildCategory(id: string): Promise<void> {
    const result = await this.childCategoryRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`找不到 ID 為 ${id} 的子分類`);
  }

  // --- Battle Stage Management ---

  async createStage(dto: CreateBattleStageDto): Promise<BattleStageDto> {
    const category = await this.childCategoryRepo.findOneByOrFail({
      id: dto.childCategoryId,
    });
    if (!dto.npcId) {
      throw new BadRequestException('必須提供 npcId');
    }
    const npc = await this.npcRepo.findOneByOrFail({ id: dto.npcId });

    const stageEntity = {
      ...dto,
      category,
      npc,
      rewards: dto.rewards ? dto.rewards.map((r) => ({ ...r })) : [], // 確保 rewards 也是可創建的實體
    };
    const stage = this.stageRepo.create(stageEntity);
    const savedStage = await this.stageRepo.save(stage);
    return this.findStageById(savedStage.id);
  }

  async findStageById(id: string): Promise<BattleStageDto> {
    const stage = await this.stageRepo.findOne({
      where: { id },
      relations: ['category', 'category.parent', 'npc', 'rewards'],
    });
    if (!stage) throw new NotFoundException(`找不到 ID 為 ${id} 的對戰關卡`);
    return this.mapStageToDto(stage);
  }

  async findAllStages(): Promise<BattleStageDto[]> {
    const stages = await this.stageRepo.find({
      relations: ['category', 'category.parent', 'npc', 'rewards'],
      order: { name: 'ASC' },
    });
    // 【修正一】使用箭頭函式確保 `this` 上下文正確
    return stages.map((stage) => this.mapStageToDto(stage));
  }

  async updateStage(
    id: string,
    dto: UpdateBattleStageDto,
  ): Promise<BattleStageDto> {
    // 在更新時，需要先載入包含 rewards 的完整實體
    const stage = await this.stageRepo.findOne({
      where: { id },
      relations: ['rewards'],
    });
    if (!stage) throw new NotFoundException(`找不到 ID 為 ${id} 的對戰關卡`);

    // 使用 preload 來合併純量值
    const updatesToPreload = { ...dto };
    delete updatesToPreload.rewards; // rewards 需要手動處理
    const updatedStage = await this.stageRepo.preload({
      id,
      ...updatesToPreload,
    });
    if (!updatedStage) throw new InternalServerErrorException('Preload failed');

    if (dto.childCategoryId) {
      updatedStage.category = await this.childCategoryRepo.findOneByOrFail({
        id: dto.childCategoryId,
      });
    }
    if (dto.npcId) {
      updatedStage.npc = await this.npcRepo.findOneByOrFail({ id: dto.npcId });
    }

    // 手動處理 rewards 的更新 (這是一個常見的 TypeORM 模式)
    if (dto.rewards) {
      updatedStage.rewards = dto.rewards.map((r) =>
        this.stageRepo.manager.create(BattleReward, {
          ...r,
          stage: updatedStage,
        }),
      );
    }

    await this.stageRepo.save(updatedStage);
    return this.findStageById(id);
  }

  async removeStage(id: string): Promise<void> {
    const result = await this.stageRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`找不到 ID 為 ${id} 的對戰關卡`);
  }

  async getRandomStageByChildCategoryName(categoryName: string) {
    const category = await this.childCategoryRepo.findOneBy({ name: categoryName })
    if (!category) throw new NotFoundException(`找不到分類${categoryName}`)

    const stage = await this.stageRepo
      .createQueryBuilder('stage')
      .where('stage.categoryId = :categoryId', { categoryId: category.id })
      .orderBy('RANDOM()')
      .getOne()

    if (!stage) throw new NotFoundException(`分類中無任何stage`)

    return stage
  }

  // --- Private Mappers ---

  private mapParentToDto(
    category: BattleParentCategory,
  ): BattleParentCategoryDto {
    // 在呼叫此函式前應確保 category 存在，若不存在則是伺服器邏輯錯誤
    if (!category) {
      this.logger.error(
        'mapParentToDto received a null or undefined category.',
      );
      throw new InternalServerErrorException(
        'Mapper function received invalid data.',
      );
    }
    return {
      id: category.id,
      name: category.name,
      description: category.description,
    };
  }

  private mapChildToDto(category: BattleChildCategory): BattleChildCategoryDto {
    if (!category) {
      this.logger.error('mapChildToDto received a null or undefined category.');
      throw new InternalServerErrorException(
        'Mapper function received invalid data.',
      );
    }
    if (!category.parent) {
      this.logger.error(
        `Child category ${category.id} is missing a parent relation.`,
      );
      throw new InternalServerErrorException(
        'Data integrity error: child category is missing a parent.',
      );
    }
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parent: this.mapParentToDto(category.parent),
    };
  }

  private mapNpcToDto(npc: Npc): NpcDto {
    if (!npc) {
      this.logger.error('mapNpcToDto received a null or undefined npc.');
      throw new InternalServerErrorException(
        'Mapper function received invalid data.',
      );
    }
    return {
      id: npc.id,
      name: npc.name,
      avatar: npc.avatar,
      voiceId: npc.voiceId,
      backstory: npc.backstory,
    };
  }

  private mapRewardToDto(reward: BattleReward): BattleRewardDto {
    if (!reward) {
      this.logger.error('mapRewardToDto received a null or undefined reward.');
      throw new InternalServerErrorException(
        'Mapper function received invalid data.',
      );
    }
    return {
      id: reward.id,
      type: reward.type,
      count: reward.count,
      metadata: reward.metadata,
    };
  }

  private mapStageToDto(stage: BattleStage): BattleStageDto {
    if (!stage) {
      this.logger.error('mapStageToDto received a null or undefined stage.');
      throw new InternalServerErrorException(
        'Mapper function received invalid data.',
      );
    }
    if (!stage.category) {
      this.logger.error(
        `Battle stage ${stage.id} is missing a category relation.`,
      );
      throw new InternalServerErrorException(
        'Data integrity error: stage is missing a category.',
      );
    }
    // 【修正二】明確檢查 npc 是否存在，而不是用 ! 忽略它
    if (!stage.npc) {
      this.logger.error(`Battle stage ${stage.id} is missing an NPC relation.`);
      throw new InternalServerErrorException(
        'Data integrity error: stage is missing an NPC.',
      );
    }

    return {
      id: stage.id,
      name: stage.name,
      backstory: stage.backstory,
      targets: stage.targets,
      category: this.mapChildToDto(stage.category),
      npc: this.mapNpcToDto(stage.npc),
      // 【修正一】這裡的寫法原本就是正確的，保持不變
      rewards: (stage.rewards || []).map((reward) =>
        this.mapRewardToDto(reward),
      ),
    };
  }
}
