import { User } from "src/user/entity/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";

@Entity()
export class Mail {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    title: string

    @Column()
    context: string

    @Column()
    from: string

    @Column({ default: false })
    isRead: boolean

    @ManyToOne(() => User, user => user.mails)
    user: Relation<User>

    @CreateDateColumn()
    createdAt: Date
}