import { UserAchievement } from 'src/user-achievement/entity/user-achievement.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

@Entity()
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  picture: string;

  @Column()
  acquisitionMethod: string;

  @Column()
  description: string;

  @OneToMany(() => UserAchievement, (ua) => ua.achievement)
  userAchievements: Relation<UserAchievement>[];
}
