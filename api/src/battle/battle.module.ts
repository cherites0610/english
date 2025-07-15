import { Module } from '@nestjs/common';
import { BattleStageAdminController } from './battle-stage.admin.controller';
import { BattleChildCategoryAdminController } from './battle-child-category.admin.controller';
import { BattleParentCategoryAdminController } from './battle-parent-category.admin.controller';
import { BattleAdminService } from './battle-admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Npc } from 'src/npc/entity/npc.entity';
import { BattleChildCategory } from './entity/battle-child-category.entity';
import { BattleParentCategory } from './entity/battle-parent-category.entity';
import { BattleReward } from './entity/battle-reward.entity';
import { BattleStage } from './entity/battle-stage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BattleParentCategory,
      BattleChildCategory,
      BattleStage,
      BattleReward,
      Npc,
    ]),
  ],
  controllers: [
    BattleStageAdminController,
    BattleChildCategoryAdminController,
    BattleParentCategoryAdminController,
  ],
  providers: [BattleAdminService],
  exports: [BattleAdminService]
})
export class BattleModule {}
