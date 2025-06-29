import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { BattleAdminService } from './battle-admin.service';
import { CreateBattleStageDto, UpdateBattleStageDto } from './dto/admin/battle-stage.dto';
import { BattleStageResponse, BattleStageListResponse } from './dto/admin/battle-stage.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';

@ApiTags('Battle (Admin) - Stages')
@ApiBearerAuth()
@Controller('admin/battle/stages')
export class BattleStageAdminController {
    constructor(private readonly adminService: BattleAdminService) { }

    @Post()
    @ApiCreatedResponse({ description: '成功創建對戰關卡', type: BattleStageResponse })
    async create(@Body() createDto: CreateBattleStageDto): Promise<BattleStageResponse> {
        const stage = await this.adminService.createStage(createDto);
        return { message: '對戰關卡創建成功', data: stage };
    }

    @Get()
    @ApiOkResponse({ description: '成功獲取所有對戰關卡', type: BattleStageListResponse })
    async findAll(): Promise<BattleStageListResponse> {
        const stages = await this.adminService.findAllStages();
        return { message: '查詢成功', data: stages };
    }

    @Get(':id')
    @ApiOkResponse({ description: '成功獲取單個對戰關卡詳情', type: BattleStageResponse })
    @ApiNotFoundResponse({ description: '找不到指定的對戰關卡' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BattleStageResponse> {
        const stage = await this.adminService.findStageById(id);
        return { message: '查詢成功', data: stage };
    }

    @Patch(':id')
    @ApiOkResponse({ description: '成功更新對戰關卡', type: BattleStageResponse })
    @ApiNotFoundResponse({ description: '找不到指定的對戰關卡' })
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateBattleStageDto): Promise<BattleStageResponse> {
        const stage = await this.adminService.updateStage(id, updateDto);
        return { message: '更新成功', data: stage };
    }

    @Delete(':id')
    @ApiOkResponse({ description: '成功刪除對戰關卡', type: SuccessResponse })
    @ApiNotFoundResponse({ description: '找不到指定的對戰關卡' })
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponse> {
        await this.adminService.removeStage(id);
        return { message: '對戰關卡已刪除', data: null };
    }
}