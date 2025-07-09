// user-achievement.controller.ts (重構後)

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserAchievementService } from './user-achievement.service';
import { CreateUserAchievementDto } from './dto/create-user-achievement.dto';

// --- Swagger 和響應 DTO 相關的 imports ---
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  UserAchievementResponse,
  UserAchievementListResponse,
} from './dto/user-achievement.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';
import { UserID } from 'src/common/decorators/user.decorator';

@ApiTags('User Achievements') // 為 Swagger UI 加上標籤分組
@Controller('user-achievement')
export class UserAchievementController {
  constructor(private readonly service: UserAchievementService) {}

  /**
   * (管理員或系統用) 手動為使用者解鎖一項成就
   */
  @Post()
  @ApiCreatedResponse({
    description: '成功為使用者解鎖成就',
    type: UserAchievementResponse,
  })
  async create(
    @Body() dto: CreateUserAchievementDto,
  ): Promise<UserAchievementResponse> {
    const newUserAchievement = await this.service.create(dto);
    return {
      message: '成就解鎖成功',
      data: newUserAchievement,
    };
  }

  /**
   * 查詢使用者成就記錄 (可選用 userID 過濾)
   */
  @Get()
  @ApiOkResponse({
    description: '成功獲取使用者成就列表',
    type: UserAchievementListResponse,
  })
  async findAll(
    @UserID() userID: string,
  ): Promise<UserAchievementListResponse> {
    const achievements = await this.service.findAll(userID);
    return {
      message: '查詢成功',
      data: achievements,
    };
  }

  /**
   * 根據 ID 查詢單筆成就解鎖記錄
   */
  @Get(':id')
  @ApiOkResponse({
    description: '成功獲取單筆成就解鎖記錄',
    type: UserAchievementResponse,
  })
  async findOne(@Param('id') id: string): Promise<UserAchievementResponse> {
    const achievement = await this.service.findOne(id);
    return {
      message: '查詢成功',
      data: achievement,
    };
  }

  /**
   * (管理員用) 移除（撤銷）一筆成就解鎖記錄
   */
  @Delete(':id')
  @ApiOkResponse({
    description: '成功刪除使用者成就記錄',
    type: SuccessResponse,
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<SuccessResponse> {
    await this.service.remove(id);
    return {
      message: '成就記錄已成功刪除',
      data: null,
    };
  }
}
