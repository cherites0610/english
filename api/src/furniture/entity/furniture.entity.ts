import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Relation,
} from 'typeorm';
import { Hut } from 'src/hut/entity/hut.entity';
import { FurnitureTemplate } from './furniture-template.entity';
import { User } from 'src/user/entity/user.entity';

@Entity('furniture')
export class Furniture {
  @PrimaryGeneratedColumn('uuid')
  id: string; // 這是每個家具實例的唯一 ID

  // 新增：直接與 User 關聯，代表擁有者
  @ManyToOne(() => User, (user) => user.furnitureInventory, {
    onDelete: 'CASCADE',
  })
  owner: Relation<User>;

  // 修改：與 Hut 的關聯變為可選
  @ManyToOne(() => Hut, (hut) => hut.furniture, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  hut?: Relation<Hut> | null;

  @ManyToOne(() => FurnitureTemplate, (template) => template.instances, {
    eager: true,
  })
  template: Relation<FurnitureTemplate>;

  // 修改：座標變為可選
  @Column({ type: 'int', nullable: true })
  x?: number | null;

  @Column({ type: 'int', nullable: true })
  y?: number | null;

  @Column({ type: 'int', default: 0 })
  rotation: number;
}
