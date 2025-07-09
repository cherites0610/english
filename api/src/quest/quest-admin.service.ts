import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// DTOs
import { CreateQuestTemplateDto } from './dto/create-quest-template.dto';
import { QuestTemplate } from './entity/quest-template.entity';
import { QuestTemplateDto } from './dto/quest-template-admin.dto';
import { UpdateQuestTemplateDto } from './dto/update-quest-template.dto';

// Entities

@Injectable()
export class QuestAdminService {
  constructor(
    @InjectRepository(QuestTemplate)
    private readonly questTemplateRepository: Repository<QuestTemplate>,
  ) {}

  /**
   * 創建一個新的任務模板
   * @param createDto DTO for creating a quest template
   * @returns The created quest template as a DTO
   */
  async create(createDto: CreateQuestTemplateDto): Promise<QuestTemplateDto> {
    // TypeORM 的 create 方法只在內存中創建一個實體實例
    const newTemplate = this.questTemplateRepository.create(createDto);
    // save 方法才會將其存入資料庫，並觸發 cascade 選項來保存 requirements 和 rewards
    const savedTemplate = await this.questTemplateRepository.save(newTemplate);
    // 再次查詢以獲取包含所有關聯的完整實體
    return this.findOne(savedTemplate.id);
  }

  /**
   * 查詢所有任務模板
   * @returns An array of all quest templates as DTOs
   */
  async findAll(): Promise<QuestTemplateDto[]> {
    const templates = await this.questTemplateRepository.find({
      // 必須加載關聯，以便在 DTO 轉換時使用
      relations: ['requirements', 'rewards'],
      order: { title: 'ASC' }, // 加上排序
    });
    // 將每個實體都轉換為 DTO
    return templates.map((template) => this.mapTemplateToDto(template));
  }

  /**
   * 根據 ID 查詢單個任務模板
   * @param id The ID of the quest template
   * @returns The quest template as a DTO
   */
  async findOne(id: string): Promise<QuestTemplateDto> {
    const template = await this.questTemplateRepository.findOne({
      where: { id },
      relations: ['requirements', 'rewards'],
    });

    if (!template) {
      throw new NotFoundException(`找不到 ID 為 ${id} 的任務模板`);
    }

    return this.mapTemplateToDto(template);
  }

  /**
   * 根據 ID 更新一個任務模板
   * @param id The ID of the quest template to update
   * @param updateDto DTO with the fields to update
   * @returns The updated quest template as a DTO
   */
  async update(
    id: string,
    updateDto: UpdateQuestTemplateDto,
  ): Promise<QuestTemplateDto> {
    // preload 會根據 id 查找實體，如果存在，則將 updateDto 的內容合併到該實體上
    // 這樣可以觸發 TypeORM 的 @UpdateDateColumn 等功能
    const templateToUpdate = await this.questTemplateRepository.preload({
      id: id,
      ...updateDto,
    });

    if (!templateToUpdate) {
      throw new NotFoundException(`找不到 ID 為 ${id} 的任務模板`);
    }

    // 儲存合併後的實體，cascade 會自動處理 requirements 和 rewards 的更新
    const updatedTemplate =
      await this.questTemplateRepository.save(templateToUpdate);
    return this.findOne(updatedTemplate.id);
  }

  /**
   * 根據 ID 刪除一個任務模板
   * @param id The ID of the quest template to delete
   */
  async remove(id: string): Promise<void> {
    // delete 方法更高效，它直接發送一個 DELETE 查詢
    const result = await this.questTemplateRepository.delete(id);

    // 如果沒有任何行受到影響，代表該 ID 不存在
    if (result.affected === 0) {
      throw new NotFoundException(`找不到 ID 為 ${id} 的任務模板`);
    }
  }

  /**
   * 私有輔助方法：將 QuestTemplate 實體映射到 QuestTemplateDto
   * @param template The QuestTemplate entity
   * @returns The mapped QuestTemplateDto
   */
  private mapTemplateToDto(template: QuestTemplate): QuestTemplateDto {
    return {
      id: template.id,
      title: template.title,
      description: template.description,
      type: template.type,
      questKey: template.questKey,
      requirements: template.requirements.map((req) => ({
        id: req.id,
        type: req.type,
        count: req.count,
      })),
      rewards: template.rewards.map((rew) => ({
        id: rew.id,
        type: rew.type,
        count: rew.count,
        metadata: rew.metadata,
      })),
    };
  }
}
