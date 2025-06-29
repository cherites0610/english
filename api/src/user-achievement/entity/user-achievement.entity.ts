import { Achievement } from 'src/achievement/entity/achievement.entity';
import { User } from 'src/user/entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Relation,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['user', 'achievement'])
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userAchievements)
  user: Relation<User>;

  @ManyToOne(() => Achievement, (achievement) => achievement.userAchievements)
  achievement: Relation<Achievement>;

  @CreateDateColumn()
  unlockedAt: Date;
}
