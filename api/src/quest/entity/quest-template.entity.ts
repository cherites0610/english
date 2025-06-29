import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { QuestTemplateType } from '../enums/quest-template-type.enum';
import { QuestRequirementTemplate } from './quest-requirement-template.entity';
import { QuestRewardTemplate } from './quest-reward-template.entity';

@Entity('quest_templates')
export class QuestTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: QuestTemplateType })
  type: QuestTemplateType;

  @Column({ type: 'varchar', unique: true, nullable: true })
  questKey?: string;

  @OneToMany(() => QuestRequirementTemplate, (req) => req.template, {
    cascade: true,
  })
  requirements: QuestRequirementTemplate[];

  @OneToMany(() => QuestRewardTemplate, (reward) => reward.template, {
    cascade: true,
  })
  rewards: QuestRewardTemplate[];
}
