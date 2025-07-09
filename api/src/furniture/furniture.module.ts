import { Module } from '@nestjs/common';
import { FurnitureService } from './furniture.service';
import { FurnitureController } from './furniture.controller';
import { FurnitureAdminController } from './furniture-admin.controller';
import { FurnitureAdminService } from './furniture-admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FurnitureTemplate } from './entity/furniture-template.entity';
import { Furniture } from './entity/furniture.entity';
import { User } from 'src/user/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FurnitureTemplate, Furniture, User])],
  controllers: [FurnitureController, FurnitureAdminController],
  providers: [FurnitureService, FurnitureAdminService],
})
export class FurnitureModule {}
