import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Relation,
} from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { WallMessage } from './wall-message.entity';
import { JournalEntry } from './journal-entry.entity';
import { Comment } from './comment.entity';

/**
 * 點讚記錄。
 * 註：'一個用戶只能對一個目標點讚一次' 的業務邏輯，
 * 建議在 Service 層處理 (創建前先查詢是否存在)。
 * 因為跨越多個 nullable 欄位的資料庫唯一約束在不同資料庫系統中行為不一，
 * 在應用層處理會更加可靠和通用。
 */
@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 點讚的發起者
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: Relation<User>;

  // --- 多態關聯: 點讚的目標對象 ---
  // 一個讚，只會屬於以下三種類型中的一個
  @ManyToOne(() => WallMessage, (msg) => msg.likes, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  wallMessage?: Relation<WallMessage>;

  @ManyToOne(() => JournalEntry, (entry) => entry.likes, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  journalEntry?: Relation<JournalEntry>;

  @ManyToOne(() => Comment, (comment) => comment.likes, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  comment?: Relation<Comment>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
