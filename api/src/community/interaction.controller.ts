import { Controller, Post, Body, Delete, Param, NotFoundException } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { CreateCommentDto, ToggleLikeDto } from './dto/interaction.dto';
import { UserID } from 'src/common/decorators/user.decorator';

// --- Swagger 和響應 DTO 相關的 imports ---
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiForbiddenResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { ToggleLikeResponse, CommentResponse } from './dto/interaction.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';

@ApiTags('Interactions (Likes & Comments)')
@ApiBearerAuth()
@Controller('interactions')
export class InteractionController {
    constructor(private readonly interactionService: InteractionService) { }

    @Post('comments')
    @ApiCreatedResponse({ description: '成功新增評論', type: CommentResponse })
    @ApiBadRequestResponse({ description: '未提供評論目標' })
    @ApiNotFoundResponse({ description: '評論目標不存在' })
    async addComment(
        @UserID() authorId: string,
        @Body() createCommentDto: CreateCommentDto,
    ): Promise<CommentResponse> {
        const comment = await this.interactionService.addComment(authorId, createCommentDto);
        if (!comment) {
            throw new NotFoundException('評論目標不存在');
        }
        return { message: '評論已發布', data: comment };
    }

    /**
     * 切換點讚狀態 (點讚或取消點讚)
     */
    @Post('like')
    @ApiOkResponse({ description: '成功切換點讚狀態', type: ToggleLikeResponse })
    @ApiBadRequestResponse({ description: '未提供點讚目標' })
    @ApiNotFoundResponse({ description: '點讚目標不存在' })
    async toggleLike(
        @UserID() userId: string,
        @Body() toggleLikeDto: ToggleLikeDto,
    ): Promise<ToggleLikeResponse> {
        const result = await this.interactionService.toggleLike(userId, toggleLikeDto);
        return { message: '操作成功', data: result };
    }

    @Delete('comments/:id')
    @ApiOkResponse({ description: '成功刪除評論', type: SuccessResponse })
    async deleteComment(
        @UserID() userId: string,
        @Param('id') commentId: string,
    ): Promise<SuccessResponse> {
        await this.interactionService.deleteComment(userId, commentId);
        return { message: '評論已刪除', data: null };
    }

}