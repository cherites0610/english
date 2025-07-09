import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Relation,
} from 'typeorm';
import { BattleStage } from './battle-stage.entity';
import { QuestRewardType } from 'src/quest/enums/quest-reward-type.enum'; // 可以共用任務的獎勵類型 Enum

@Entity('battle_rewards')
export class BattleReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 關聯到對戰關卡
   */
  @ManyToOne(() => BattleStage, (stage) => stage.rewards, {
    onDelete: 'CASCADE',
  })
  stage: Relation<BattleStage>;

  @Column({
    type: 'enum',
    enum: QuestRewardType, // 我們可以直接複用任務的獎勵類型
  })
  type: QuestRewardType;

  @Column({ type: 'int' })
  count: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
