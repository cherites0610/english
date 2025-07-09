import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { QuestRequirementType } from '../enums/quest-requirement-type.enum';
import { QuestTemplate } from './quest-template.entity';

@Entity('quest_requirement_templates')
export class QuestRequirementTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => QuestTemplate, (template) => template.requirements, {
    onDelete: 'CASCADE',
  })
  template: QuestTemplate;

  @Column({
    type: 'enum',
    enum: QuestRequirementType,
  })
  type: QuestRequirementType;

  @Column({ type: 'int' })
  count: number;
}
