import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import { BattleChildCategory } from './battle-child-category.entity';
import { Npc } from 'src/npc/entity/npc.entity';
import { BattleReward } from './battle-reward.entity';

// 關卡目標類型的 Enum
export enum BattleTargetType {
  DEFEAT_ALL_ENEMIES = 'DEFEAT_ALL_ENEMIES',
  SURVIVE_FOR_TIME = 'SURVIVE_FOR_TIME',
  ANSWER_QUESTIONS = 'ANSWER_QUESTIONS',
}

@Entity('battle_stages')
export class BattleStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // 關卡名稱，例如 '1-1: 尖峰時刻'

  @Column('text')
  backstory: string;

  @Column({
    type: 'text',
    array: true, // <-- 關鍵：告訴 TypeORM 這是一個陣列
    default: [],
  })
  targets: string[];

  /**
   * 關聯到子類型
   */
  @ManyToOne(() => BattleChildCategory, (category) => category.stages, {
    onDelete: 'CASCADE',
  })
  category: Relation<BattleChildCategory>;

  /**
   * 關聯到 NPC (您的新需求)
   */
  @ManyToOne(() => Npc, {
    nullable: true, // 允許某些關卡沒有 NPC
    onDelete: 'SET NULL', // 如果 NPC 被刪除，關卡依然存在，只是不再關聯 NPC
  })
  npc?: Relation<Npc>;

  /**
   * 這個關卡的獎勵列表
   */
  @OneToMany(() => BattleReward, (reward) => reward.stage, { cascade: true })
  rewards: BattleReward[];
}
