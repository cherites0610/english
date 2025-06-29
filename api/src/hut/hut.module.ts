import { Module } from '@nestjs/common';
import { HutService } from './hut.service';
import { HutController } from './hut.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hut } from './entity/hut.entity';
import { Furniture } from 'src/furniture/entity/furniture.entity';
import { FurnitureTemplate } from 'src/furniture/entity/furniture-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hut, Furniture, FurnitureTemplate])
  ],
  controllers: [HutController],
  providers: [HutService],
})
export class HutModule { }
