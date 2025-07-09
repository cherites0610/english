import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { Furniture } from 'src/furniture/entity/furniture.entity';

@Entity('huts')
export class Hut {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.hut)
  user: User;

  @OneToMany(() => Furniture, (furniture) => furniture.hut, { cascade: true })
  furniture: Relation<Furniture>[];
}
