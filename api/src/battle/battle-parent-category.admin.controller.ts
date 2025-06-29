import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { BattleAdminService } from './battle-admin.service';
import { CreateBattleParentCategoryDto, UpdateBattleParentCategoryDto } from './dto/admin/battle-parent-category.dto';
import { BattleParentCategoryResponse, BattleParentCategoryListResponse } from './dto/admin/battle-parent-category.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';

@ApiTags('Battle (Admin) - Parent Categories')
@ApiBearerAuth()
@Controller('admin/battle/parent-categories')
export class BattleParentCategoryAdminController {
    constructor(private readonly adminService: BattleAdminService) { }

    @Post()
    @ApiCreatedResponse({ description: '成功創建父分類', type: BattleParentCategoryResponse })
    async create(@Body() createDto: CreateBattleParentCategoryDto): Promise<BattleParentCategoryResponse> {
        const category = await this.adminService.createParentCategory(createDto);
        if (!category) {
            throw new NotFoundException('找不到指定的父分類');
        }
        return { message: '父分類創建成功', data: category };
    }

    @Get()
    @ApiOkResponse({ description: '成功獲取所有父分類', type: BattleParentCategoryListResponse })
    async findAll(): Promise<BattleParentCategoryListResponse> {
        const categories = await this.adminService.findAllParentCategories();
        return { message: '查詢成功', data: categories };
    }

    @Patch(':id')
    @ApiOkResponse({ description: '成功更新父分類', type: BattleParentCategoryResponse })
    @ApiNotFoundResponse({ description: '找不到指定的父分類' })
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateBattleParentCategoryDto): Promise<BattleParentCategoryResponse> {
        const category = await this.adminService.updateParentCategory(id, updateDto);
        if (!category) {
            throw new NotFoundException('找不到指定的父分類');
        }
        return { message: '更新成功', data: category };
    }

    @Delete(':id')
    @ApiOkResponse({ description: '成功刪除父分類', type: SuccessResponse })
    @ApiNotFoundResponse({ description: '找不到指定的父分類' })
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponse> {
        await this.adminService.removeParentCategory(id);
        return { message: '父分類已刪除', data: null };
    }
}