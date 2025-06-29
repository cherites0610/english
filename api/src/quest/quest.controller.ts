// src/quest/quest.controller.ts (重構後)

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { QuestService } from './quest.service';
import { GameEventDto } from './dto/game-event.dto';
import { UserID } from 'src/common/decorators/user.decorator';
import { QuestLogViewType } from './enums/quest-log-view-type.enum';

// --- Swagger 和響應 DTO 相關的 imports ---
import {
  ApiTags,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserProfileResponse } from 'src/user/dto/user-profile.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';
import { GetQuestLogResponse } from './dto/quest-log-response.dto';

@ApiTags('Quest')
@ApiBearerAuth() // 這整組 API 都需要用戶登入
@Controller('quest')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  /**
   * 獲取當前使用者的任務日誌
   */
  @Get()
  @ApiOkResponse({
    description: '成功獲取玩家任務日誌',
    type: GetQuestLogResponse,
  })
  // --- 在這裡添加 ApiQuery 裝飾器 ---
  @ApiQuery({
    name: 'viewType',
    required: true,
    enum: QuestLogViewType,
    description:
      '要查詢的任務日誌類型：REGULAR (常規任務) 或 ACHIEVEMENT (成就)',
  })
  async getMyQuestLog(
    @UserID() userID: string,
    @Query('viewType', new ParseEnumPipe(QuestLogViewType))
    viewType: QuestLogViewType,
  ): Promise<GetQuestLogResponse> {
    const logs = await this.questService.getPlayerQuestLog(userID, viewType);
    return {
      message: '成功獲取任務日誌',
      data: logs,
    };
  }

  /**
   * 回報遊戲事件以更新任務進度
   */
  @Post('event')
  @ApiOkResponse({ description: '事件已成功處理', type: SuccessResponse })
  async reportGameEvent(
    @UserID() userID: string,
    @Body() gameEventDto: GameEventDto,
  ): Promise<SuccessResponse> {
    await this.questService.handleGameEvent(userID, gameEventDto);
    return {
      message: '事件已成功處理',
      data: null,
    };
  }

  /**
   * 領取已完成任務的獎勵
   */
  @Post(':logID/claim') // 參數名從 questID 改為 logID 更準確
  @ApiOkResponse({
    description: '成功領取任務獎勵，返回更新後的使用者資訊',
    type: UserProfileResponse,
  })
  async claimReward(
    @UserID() userID: string,
    @Param('logID') logID: string,
  ): Promise<UserProfileResponse> {
    const updatedUserEntity = await this.questService.claimReward(
      userID,
      logID,
    );

    return {
      message: '獎勵領取成功',
      data: updatedUserEntity,
    };
  }
}
