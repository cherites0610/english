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
  ParseUUIDPipe,
} from '@nestjs/common';
import { NpcService } from './npc.service';
import { CreateNpcDto, UpdateNpcDto } from './dto/npc.dto';

// --- Swagger 和響應 DTO 相關的 imports ---
import {
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { NpcResponse, NpcListResponse } from './dto/npc.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';

@ApiTags('NPCs (Admin)')
@ApiBearerAuth() // 假設管理員操作需要認證
@Controller('admin/npcs') // 將 API 路徑放在 admin 下
export class NpcController {
  constructor(private readonly npcService: NpcService) {}

  @Post()
  @ApiCreatedResponse({ description: '成功創建 NPC', type: NpcResponse })
  async create(@Body() createNpcDto: CreateNpcDto): Promise<NpcResponse> {
    const npc = await this.npcService.create(createNpcDto);
    return { message: 'NPC 創建成功', data: npc };
  }

  @Get()
  @ApiOkResponse({
    description: '成功獲取所有 NPC 列表',
    type: NpcListResponse,
  })
  async findAll(): Promise<NpcListResponse> {
    const npcs = await this.npcService.findAll();
    return { message: '查詢成功', data: npcs };
  }

  @Get(':id')
  @ApiOkResponse({ description: '成功獲取單個 NPC 詳情', type: NpcResponse })
  @ApiNotFoundResponse({ description: '找不到指定的 NPC' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<NpcResponse> {
    const npc = await this.npcService.findOne(id);
    return { message: '查詢成功', data: npc };
  }

  @Patch(':id')
  @ApiOkResponse({ description: '成功更新 NPC', type: NpcResponse })
  @ApiNotFoundResponse({ description: '找不到指定的 NPC' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNpcDto: UpdateNpcDto,
  ): Promise<NpcResponse> {
    const updatedNpc = await this.npcService.update(id, updateNpcDto);
    return { message: '更新成功', data: updatedNpc };
  }

  @Delete(':id')
  @ApiOkResponse({ description: '成功刪除 NPC', type: SuccessResponse })
  @ApiNotFoundResponse({ description: '找不到指定的 NPC' })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    await this.npcService.remove(id);
    return { message: 'NPC 已成功刪除', data: null };
  }
}
