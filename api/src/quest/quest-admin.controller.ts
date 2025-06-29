// src/quest/quest-admin.controller.ts (完整版)

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateQuestTemplateDto } from './dto/create-quest-template.dto';


// --- Swagger 和響應 DTO 相關的 imports ---
import { ApiTags, ApiCreatedResponse, ApiBearerAuth, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';

import { SuccessResponse } from 'src/common/dto/success.response.dto';
import { QuestAdminService } from './quest-admin.service';
import { QuestTemplateListResponse, QuestTemplateResponse } from './dto/quest-template-admin.response.dto';
import { UpdateQuestTemplateDto } from './dto/update-quest-template.dto';

@ApiTags('Quest (Admin)')
@ApiBearerAuth()
@Controller('admin/quest/templates')
export class QuestAdminController {
  constructor(
    // 注入 Service 而不是直接注入 Repository，是更好的分層實踐
    private readonly questAdminService: QuestAdminService,
  ) { }

  /**
   * 創建一個新的任務模板
   */
  @Post()
  @ApiCreatedResponse({ description: '成功創建任務模板', type: QuestTemplateResponse })
  async createTemplate(
    @Body() createDto: CreateQuestTemplateDto,
  ): Promise<QuestTemplateResponse> {
    const newTemplate = await this.questAdminService.create(createDto);
    return {
      message: '任務模板創建成功',
      data: newTemplate,
    };
  }

  /**
   * 查詢所有任務模板
   */
  @Get()
  @ApiOkResponse({ description: '成功獲取所有任務模板列表', type: QuestTemplateListResponse })
  async findAll(): Promise<QuestTemplateListResponse> {
    const templates = await this.questAdminService.findAll();
    return {
      message: '查詢成功',
      data: templates,
    };
  }

  /**
   * 根據 ID 查詢單個任務模板
   */
  @Get(':id')
  @ApiOkResponse({ description: '成功獲取單個任務模板詳情', type: QuestTemplateResponse })
  @ApiNotFoundResponse({ description: '找不到指定的任務模板' })
  async findOne(@Param('id') id: string): Promise<QuestTemplateResponse> {
    const template = await this.questAdminService.findOne(id);
    return {
      message: '查詢成功',
      data: template,
    };
  }

  /**
   * 根據 ID 更新一個任務模板
   */
  @Patch(':id')
  @ApiOkResponse({ description: '成功更新任務模板', type: QuestTemplateResponse })
  @ApiNotFoundResponse({ description: '找不到指定的任務模板' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuestTemplateDto,
  ): Promise<QuestTemplateResponse> {
    const updatedTemplate = await this.questAdminService.update(id, updateDto);
    return {
      message: '更新成功',
      data: updatedTemplate,
    };
  }

  /**
   * 根據 ID 刪除一個任務模板
   */
  @Delete(':id')
  @ApiOkResponse({ description: '成功刪除任務模板', type: SuccessResponse })
  @ApiNotFoundResponse({ description: '找不到指定的任務模板' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<SuccessResponse> {
    await this.questAdminService.remove(id);
    return {
      message: '任務模板已成功刪除',
      data: null,
    };
  }
}