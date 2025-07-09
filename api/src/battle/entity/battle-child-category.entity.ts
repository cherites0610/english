import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import { BattleParentCategory } from './battle-parent-category.entity';
import { BattleStage } from './battle-stage.entity';

@Entity('battle_child_categories')
export class BattleChildCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // 例如: '公車'

  @Column('text', { nullable: true })
  description?: string;

  /**
   * 關聯到父類型
   */
  @ManyToOne(() => BattleParentCategory, (parent) => parent.children, {
    onDelete: 'CASCADE',
  })
  parent: Relation<BattleParentCategory>;

  @OneToMany(() => BattleStage, (stage) => stage.category)
  stages: BattleStage[];
}
