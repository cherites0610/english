import { User } from 'src/user/entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserQuestStatus } from '../enums/user-quest-status.enum';
import { QuestTemplate } from './quest-template.entity';
import { QuestRequirementType } from '../enums/quest-requirement-type.enum';

@Entity('user_quest_logs')
// 根據任務類型決定是否唯一
// 對於成就/主線，可以是唯一的。對於每日任務，需要 (userId, templateId, date) 的複合唯一鍵
// 這裡暫用 (userId, templateId) 作為示例，真實場景可能更複雜
@Unique(['user', 'template'])
export class UserQuestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string; // 這是玩家任務日誌的唯一ID

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => QuestTemplate, { eager: true, onDelete: 'CASCADE' }) // eager: true 方便查詢時自動加載模板
  template: QuestTemplate;

  @Column({
    type: 'enum',
    enum: UserQuestStatus,
    default: UserQuestStatus.IN_PROGRESS,
  })
  status: UserQuestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'jsonb',
    default: {},
    comment: 'e.g., { "KILL_SLIME": 5, "COLLECT_HERB": 2 }',
  })
  progress: Record<QuestRequirementType, number>;
}
