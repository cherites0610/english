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
import { Like } from './like.entity';
import { Comment } from './comment.entity';

@Entity('wall_messages')
export class WallMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * 這條訊息是留在哪個用戶的留言板上
     */
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    wallOwner: Relation<User>;

    /**
     * 這條訊息是由哪個用戶發布的
     */
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    author: Relation<User>;

    @Column('text')
    content: string;

    /**
     * 點讚計數 (反正規化欄位，用於提升查詢性能)
     */
    @Column({ type: 'int', default: 0 })
    likeCount: number;

    /**
     * 這條留言下的所有評論
     */
    @OneToMany(() => Comment, comment => comment.rootWallMessage, { cascade: true })
    comments: Relation<Comment>[];

    /**
     * 這條留言獲得的所有點讚記錄
     */
    @OneToMany(() => Like, like => like.wallMessage, { cascade: true })
    likes: Relation<Like>[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}