import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { BattleAdminService } from './battle-admin.service';
import { CreateBattleChildCategoryDto, UpdateBattleChildCategoryDto } from './dto/admin/battle-child-category.dto';
import { BattleChildCategoryResponse, BattleChildCategoryListResponse } from './dto/admin/battle-child-category.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';

@ApiTags('Battle (Admin) - Child Categories')
@ApiBearerAuth()
@Controller('admin/battle/child-categories')
export class BattleChildCategoryAdminController {
    constructor(private readonly adminService: BattleAdminService) { }

    @Post()
    @ApiCreatedResponse({ description: '成功創建子分類', type: BattleChildCategoryResponse })
    async create(@Body() createDto: CreateBattleChildCategoryDto): Promise<BattleChildCategoryResponse> {
        const category = await this.adminService.createChildCategory(createDto);
        if (!category) {
            throw new NotFoundException('找不到指定的子分類');
        }
        return { message: '子分類創建成功', data: category };
    }

    @Get()
    @ApiOkResponse({ description: '成功獲取所有子分類', type: BattleChildCategoryListResponse })
    async findAll(): Promise<BattleChildCategoryListResponse> {
        const categories = await this.adminService.findAllChildCategories();
        return { message: '查詢成功', data: categories };
    }

    @Patch(':id')
    @ApiOkResponse({ description: '成功更新子分類', type: BattleChildCategoryResponse })
    @ApiNotFoundResponse({ description: '找不到指定的子分類' })
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateBattleChildCategoryDto): Promise<BattleChildCategoryResponse> {
        const category = await this.adminService.updateChildCategory(id, updateDto);
        return { message: '更新成功', data: category };
    }

    @Delete(':id')
    @ApiOkResponse({ description: '成功刪除子分類', type: SuccessResponse })
    @ApiNotFoundResponse({ description: '找不到指定的子分類' })
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponse> {
        await this.adminService.removeChildCategory(id);
        return { message: '子分類已刪除', data: null };
    }
}