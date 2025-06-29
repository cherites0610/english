import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { WallService } from './wall.service';
import { CreateWallMessageDto, UpdateWallMessageDto } from './dto/wall.dto';
import { UserID } from 'src/common/decorators/user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

// --- Swagger 和響應 DTO 相關的 imports ---
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { WallMessageResponse, WallMessageListResponse } from './dto/wall.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';

@ApiTags('Wall (Message Board)')
@Controller('wall')
export class WallController {
    constructor(private readonly wallService: WallService) { }

    /**
     * 在指定用戶的留言板上發布一條新訊息
     */
    @Post()
    @ApiBearerAuth()
    @ApiCreatedResponse({ description: '成功發布留言', type: WallMessageResponse })
    async create(
        @UserID() authorId: string,
        @Body() createDto: CreateWallMessageDto,
    ): Promise<WallMessageResponse> {
        const message = await this.wallService.create(authorId, createDto);
        return { message: '留言已成功發布', data: message };
    }

    /**
   * 獲取某個用戶留言板上的所有訊息 (公開)
   */
    @Public()
    @Get('user/:userId')
    @ApiOkResponse({ description: '成功獲取用戶留言板列表', type: WallMessageListResponse })
    async findByWallOwner(
        @Param('userId') wallOwnerId: string,
        // 已移除 @Query 參數
    ): Promise<WallMessageListResponse> {
        const messages = await this.wallService.findByWallOwner(wallOwnerId); // <-- 呼叫已簡化的 Service 方法
        return { message: '查詢成功', data: messages };
    }

    /**
     * 獲取單條留言的完整資訊 (公開)
     */
    @Public()
    @Get('message/:id')
    @ApiOkResponse({ description: '成功獲取單條留言詳情', type: WallMessageResponse })
    @ApiNotFoundResponse({ description: '找不到指定的留言' })
    async findOne(@Param('id') id: string): Promise<WallMessageResponse> {
        const message = await this.wallService.findOne(id);
        return { message: '查詢成功', data: message };
    }

    /**
     * 更新一條留言板訊息 (僅作者可更新)
     */
    @Patch('message/:id')
    @ApiBearerAuth()
    @ApiOkResponse({ description: '成功更新留言', type: WallMessageResponse })
    @ApiNotFoundResponse({ description: '找不到指定的留言' })
    @ApiForbiddenResponse({ description: '無權修改該留言' })
    async update(
        @Param('id') messageId: string,
        @UserID() updaterId: string,
        @Body() updateDto: UpdateWallMessageDto,
    ): Promise<WallMessageResponse> {
        const updatedMessage = await this.wallService.update(updaterId, messageId, updateDto);
        return { message: '留言已更新', data: updatedMessage };
    }

    /**
     * 刪除一條留言板訊息 (作者或板主可刪除)
     */
    @Delete('message/:id')
    @ApiBearerAuth()
    @ApiOkResponse({ description: '成功刪除留言', type: SuccessResponse })
    @ApiNotFoundResponse({ description: '找不到指定的留言' })
    @ApiForbiddenResponse({ description: '無權刪除該留言' })
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') messageId: string, @UserID() deleterId: string): Promise<SuccessResponse> {
        await this.wallService.remove(deleterId, messageId);
        return { message: '留言已成功刪除', data: null };
    }
}