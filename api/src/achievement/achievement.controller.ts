// src/achievements/achievement.controller.ts (重構後)

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';

// --- Swagger 和響應 DTO 相關的 imports ---
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import {
  AchievementResponse,
  AchievementListResponse,
} from './dto/achievement.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';

@ApiTags('Achievements (Admin)') // 建議加上 (Admin) 以區分管理員操作
@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  /**
   * 創建一個新的成就模板
   */
  @Post()
  @ApiCreatedResponse({
    description: '成功創建成就模板',
    type: AchievementResponse,
  })
  async create(
    @Body() createAchievementDto: CreateAchievementDto,
  ): Promise<AchievementResponse> {
    // 假設 service.create 返回的是 Achievement 實體或 DTO
    const newAchievement =
      await this.achievementService.create(createAchievementDto);
    return {
      message: '成就模板創建成功',
      data: newAchievement,
    };
  }

  /**
   * 查詢所有成就模板
   */
  @Get()
  @ApiOkResponse({
    description: '成功獲取所有成就模板列表',
    type: AchievementListResponse,
  })
  async findAll(): Promise<AchievementListResponse> {
    const achievements = await this.achievementService.findAll();
    return {
      message: '查詢成功',
      data: achievements,
    };
  }

  /**
   * 根據 ID 查詢單個成就模板
   */
  @Get(':id')
  @ApiOkResponse({
    description: '成功獲取單個成就模板詳情',
    type: AchievementResponse,
  })
  async findOne(@Param('id') id: string): Promise<AchievementResponse> {
    const achievement = await this.achievementService.findOne(id);
    return {
      message: '查詢成功',
      data: achievement,
    };
  }

  /**
   * 根據 ID 更新一個成就模板
   */
  @Patch(':id')
  @ApiOkResponse({ description: '成功更新成就模板', type: AchievementResponse })
  async update(
    @Param('id') id: string,
    @Body() updateAchievementDto: UpdateAchievementDto,
  ): Promise<AchievementResponse> {
    const updatedAchievement = await this.achievementService.update(
      id,
      updateAchievementDto,
    );
    return {
      message: '更新成功',
      data: updatedAchievement,
    };
  }

  /**
   * 根據 ID 刪除一個成就模板
   */
  @Delete(':id')
  @ApiOkResponse({ description: '成功刪除成就模板', type: SuccessResponse })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<SuccessResponse> {
    await this.achievementService.remove(id);
    return {
      message: '成就模板已成功刪除',
      data: null,
    };
  }
}
