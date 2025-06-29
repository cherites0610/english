import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Relation } from 'typeorm';
import { Furniture } from './furniture.entity';


@Entity('furniture_templates')
export class FurnitureTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('text')
    description: string;

    @Column()
    imageUrl: string; // 家具的圖片資源 URL

    @Column({ type: 'int' })
    width: number; // 佔用的格子寬度

    @Column({ type: 'int' })
    height: number; // 佔用的格子高度

    @OneToMany(() => Furniture, furniture => furniture.template)
    instances: Relation<Furniture>[];
}