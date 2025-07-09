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
import { FurnitureAdminService } from './furniture-admin.service';

import {
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { SuccessResponse } from 'src/common/dto/success.response.dto';
import { CreateFurnitureTemplateDto } from './dto/create-furniture-template.dto';
import {
  FurnitureTemplateResponse,
  FurnitureTemplateListResponse,
} from './dto/furniture-template.response.dto';
import { UpdateFurnitureTemplateDto } from './dto/update-furniture-template.dto';

@ApiTags('Furniture (Admin)')
@ApiBearerAuth()
@Controller('admin/furniture-templates')
export class FurnitureAdminController {
  constructor(private readonly adminService: FurnitureAdminService) {}

  @Post()
  @ApiCreatedResponse({
    description: '成功創建家具模板',
    type: FurnitureTemplateResponse,
  })
  async create(
    @Body() createDto: CreateFurnitureTemplateDto,
  ): Promise<FurnitureTemplateResponse> {
    const newTemplate = await this.adminService.create(createDto);
    return { message: '家具模板創建成功', data: newTemplate };
  }

  @Get()
  @ApiOkResponse({
    description: '成功獲取所有家具模板',
    type: FurnitureTemplateListResponse,
  })
  async findAll(): Promise<FurnitureTemplateListResponse> {
    const templates = await this.adminService.findAll();
    return { message: '查詢成功', data: templates };
  }

  @Get(':id')
  @ApiOkResponse({
    description: '成功獲取單個家具模板',
    type: FurnitureTemplateResponse,
  })
  @ApiNotFoundResponse({ description: '找不到指定的家具模板' })
  async findOne(@Param('id') id: string): Promise<FurnitureTemplateResponse> {
    const template = await this.adminService.findOne(id);
    return { message: '查詢成功', data: template };
  }

  @Patch(':id')
  @ApiOkResponse({
    description: '成功更新家具模板',
    type: FurnitureTemplateResponse,
  })
  @ApiNotFoundResponse({ description: '找不到指定的家具模板' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFurnitureTemplateDto,
  ): Promise<FurnitureTemplateResponse> {
    const updatedTemplate = await this.adminService.update(id, updateDto);
    return { message: '更新成功', data: updatedTemplate };
  }

  @Delete(':id')
  @ApiOkResponse({ description: '成功刪除家具模板', type: SuccessResponse })
  @ApiNotFoundResponse({ description: '找不到指定的家具模板' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<SuccessResponse> {
    await this.adminService.remove(id);
    return { message: '家具模板已刪除', data: null };
  }
}
