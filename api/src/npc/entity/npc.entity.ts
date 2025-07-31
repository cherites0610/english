import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Relation,
} from 'typeorm';
import { BattleStage } from 'src/battle/entity/battle-stage.entity';

@Entity('npcs')
export class Npc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * NPC 的名稱，建議設為唯一以方便管理
   */
  @Column({ unique: true })
  name: string;

  /**
   * NPC 的頭像圖片 URL
   */
  @Column()
  avatar: string;

  /**
   * 對應到聲音資源檔案的編號或 ID
   */
  @Column()
  voiceId: string;

  /**
   * NPC 的背景故事，使用 'text' 類型以支援較長內容
   */
  @Column({ type: 'text' })
  backstory: string;

  @OneToMany(() => BattleStage, (stage) => stage.npc)
  battleStages: Relation<BattleStage>[];

  // --- 未來的擴展性 ---
  // 未來您可以在這裡添加關聯，例如：
  // @OneToMany(() => QuestTemplate, template => template.questGiver)
  // givenQuests: QuestTemplate[];
}
