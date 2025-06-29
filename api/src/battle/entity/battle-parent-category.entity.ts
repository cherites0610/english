import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BattleChildCategory } from './battle-child-category.entity';

@Entity('battle_parent_categories')
export class BattleParentCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string; // 例如: '交通工具'

    @Column('text', { nullable: true })
    description?: string;

    @OneToMany(() => BattleChildCategory, child => child.parent)
    children: BattleChildCategory[];
}