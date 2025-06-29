import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    Relation,
} from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { WallMessage } from './wall-message.entity';
import { JournalEntry } from './journal-entry.entity';
import { Like } from './like.entity';
@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * 評論的作者
     */
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    author: Relation<User>;

    @Column('text')
    content: string;

    @Column({ type: 'int', default: 0 })
    likeCount: number;

    // --- 巢狀結構的關鍵：自我關聯 ---
    /**
     * 指向父評論。如果這是一條頂層評論，則此欄位為 null。
     * onDelete: 'CASCADE' 表示如果父評論被刪除，其下的所有子評論也會被一併刪除。
     */
    @ManyToOne(() => Comment, comment => comment.children, { nullable: true, onDelete: 'CASCADE' })
    parent: Relation<Comment>;

    /**
     * 擁有所有的子評論 (對這條評論的回覆)
     */
    @OneToMany(() => Comment, comment => comment.parent)
    children: Relation<Comment>[];

    // --- 指向根內容的關鍵 (多態關聯) ---
    // 一個評論，要嘛屬於一篇留言板訊息，要嘛屬於一篇日誌。
    // 透過 nullable: true 和兩個 ManyToOne 實現。
    @ManyToOne(() => WallMessage, msg => msg.comments, { nullable: true, onDelete: 'CASCADE' })
    rootWallMessage?: Relation<WallMessage>;

    @ManyToOne(() => JournalEntry, entry => entry.comments, { nullable: true, onDelete: 'CASCADE' })
    rootJournalEntry?: Relation<JournalEntry>;

    @OneToMany(() => Like, like => like.comment, { cascade: true })
    likes: Relation<Like>[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}