import { JournalEntry } from 'src/community/entity/journal-entry.entity';
import { Like } from 'src/community/entity/like.entity';
import { Comment } from 'src/community/entity/comment.entity';
import { WallMessage } from 'src/community/entity/wall-message.entity';
import { Friendship } from 'src/friend-ship/entity/friend.ship.entity';
import { Furniture } from 'src/furniture/entity/furniture.entity';
import { Hut } from 'src/hut/entity/hut.entity';
import { UserAchievement } from 'src/user-achievement/entity/user-achievement.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

export enum EnglishProficiency {
  NOVICE = 'novice',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  SUPERIOR = 'superior',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    nullable: true,
  })
  lineID: string;

  @Column({
    nullable: true,
  })
  googleID: string;

  @Column()
  avatarUrl: string;

  @Column()
  name: string;

  @Column()
  userLevel: number;

  @Column()
  money: number;

  @Column({
    default: 0,
  })
  experience: number;

  @Column({
    type: 'enum',
    enum: EnglishProficiency,
  })
  englishLevel: EnglishProficiency;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  lastLoginAt: Date;

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendRequests: Relation<Friendship>[];

  // 我收到的好友請求
  @OneToMany(() => Friendship, (friendship) => friendship.addressee)
  receivedFriendRequests: Relation<Friendship>[];

  @OneToMany(() => UserAchievement, (ua) => ua.user)
  userAchievements: Relation<UserAchievement>[];

  @OneToOne(() => Hut, hut => hut.user, { cascade: true })
  @JoinColumn()
  hut: Relation<Hut>;

  @OneToMany(() => Furniture, furniture => furniture.owner)
  furnitureInventory: Relation<Furniture>[]; // 代表該用戶擁有的所有家具（無論是否放置）

  @OneToMany(() => WallMessage, (message) => message.wallOwner)
  wallMessages: Relation<WallMessage>[];

  /**
   * 該用戶發布的所有日誌
   */
  @OneToMany(() => JournalEntry, (entry) => entry.author)
  journalEntries: Relation<JournalEntry>[];

  /**
   * 該用戶發布過的所有評論
   */
  @OneToMany(() => Comment, (comment) => comment.author)
  commentsMade: Relation<Comment>[];

  /**
   * 該用戶給出的所有點讚
   */
  @OneToMany(() => Like, (like) => like.user)
  likesGiven: Relation<Like>[];
}
