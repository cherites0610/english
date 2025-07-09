import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { QuestTemplate } from './quest-template.entity';
import { QuestRewardType } from '../enums/quest-reward-type.enum';

@Entity('quest_reward_templates')
export class QuestRewardTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => QuestTemplate, (template) => template.rewards, {
    onDelete: 'CASCADE',
  })
  template: QuestTemplate;

  @Column({
    type: 'enum',
    enum: QuestRewardType,
  })
  type: QuestRewardType;

  @Column({ type: 'int' })
  count: number;

  @Column({
    type: 'jsonb',
    nullable: true, // 設為可選，簡單獎勵可以沒有此欄位
    comment: 'e.g., { "questTemplateId": "uuid-of-quest-1-2" }',
  })
  metadata?: Record<string, any>;
}
