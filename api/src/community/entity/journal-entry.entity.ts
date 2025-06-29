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


@Entity('journal_entries')
export class JournalEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    content: string;

    @Column({ default: true })
    isPublic: boolean; // 是否對外公開

    /**
     * 這篇日誌的作者 (也是擁有者)
     */
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    author: Relation<User>;

    @Column({ type: 'int', default: 0 })
    likeCount: number;

    @OneToMany(() => Comment, comment => comment.rootJournalEntry, { cascade: true })
    comments: Relation<Comment>[];

    @OneToMany(() => Like, like => like.journalEntry, { cascade: true })
    likes: Relation<Like>[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}