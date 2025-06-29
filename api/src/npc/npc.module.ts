import { Module } from '@nestjs/common';
import { NpcService } from './npc.service';
import { NpcController } from './npc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Npc } from './entity/npc.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Npc])
  ],
  controllers: [NpcController],
  providers: [NpcService],
})
export class NpcModule { }
