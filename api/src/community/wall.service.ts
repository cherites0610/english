import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WallMessage } from './entity/wall-message.entity';
import { User } from 'src/user/entity/user.entity';
import { CreateWallMessageDto, UpdateWallMessageDto } from './dto/wall.dto';
import { WallMessageDto } from './dto/wall.dto';
import { CommentDto } from './dto/comment.dto';
import { UserProfileDto } from 'src/user/dto/user-profile.dto';
import { Comment } from './entity/comment.entity';

@Injectable()
export class WallService {
    constructor(
        @InjectRepository(WallMessage)
        private readonly wallMessageRepo: Repository<WallMessage>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        // 不再需要注入 UserService
    ) { }

    /**
     * 在指定用戶的留言板上發布一條新訊息
     */
    async create(authorId: string, dto: CreateWallMessageDto): Promise<WallMessageDto> {
        const author = await this.userRepo.findOneByOrFail({ id: authorId });
        const wallOwner = await this.userRepo.findOneByOrFail({ id: dto.wallOwnerId });

        const message = this.wallMessageRepo.create({
            content: dto.content,
            author,
            wallOwner,
        });

        const savedMessage = await this.wallMessageRepo.save(message);
        // 呼叫 findOne 以獲取包含所有關聯的、已轉換為 DTO 的完整數據
        return this.findOne(savedMessage.id);
    }

    /**
     * 獲取某個用戶留言板上的所有訊息 (帶分頁)
     */
    async findByWallOwner(wallOwnerId: string): Promise<WallMessageDto[]> {
        const messages = await this.wallMessageRepo.find({
            where: { wallOwner: { id: wallOwnerId } },
            relations: [
                'author',
                'wallOwner',
                'comments',
                'comments.author',
                'comments.children',
                'comments.parent',
            ],
            order: { createdAt: 'DESC' },
            // 已移除 skip 和 take
        });

        return messages.map(message => this.mapWallMessageToDto(message));
    }

    /**
     * 獲取單條留言板訊息的完整資訊
     */
    async findOne(messageId: string): Promise<WallMessageDto> {
        const message = await this.wallMessageRepo.findOne({
            where: { id: messageId },
            relations: ['author', 'wallOwner', 'comments', 'comments.author', 'comments.children', 'comments.parent'],
        });
        if (!message) {
            throw new NotFoundException('找不到該留言');
        }
        return this.mapWallMessageToDto(message);
    }

    /**
     * 刪除一條留言板訊息
     */
    async remove(deleterId: string, messageId: string): Promise<void> {
        const message = await this.wallMessageRepo.findOne({
            where: { id: messageId },
            relations: ['author', 'wallOwner'],
        });

        if (!message) {
            throw new NotFoundException('訊息不存在');
        }

        if (message.author.id !== deleterId && message.wallOwner.id !== deleterId) {
            throw new ForbiddenException('無權刪除此訊息');
        }

        await this.wallMessageRepo.remove(message);
    }

    /**
     * 私有輔助方法：將 WallMessage 實體映射到 DTO
     */
    private mapWallMessageToDto(message: WallMessage): WallMessageDto {
        return {
            id: message.id,
            content: message.content,
            likeCount: message.likeCount,
            createdAt: message.createdAt,
            author: message.author,
            wallOwner: message.wallOwner,
            // 篩選出頂層評論 (parent 為 null)，並將其轉換為 CommentDto
            comments: message.comments
                ?.filter(comment => comment.parent === null)
                .map(comment => this.mapCommentToDto(comment)) || [],
        };
    }

    /**
   * 更新一條留言板訊息
   * @param updaterId 執行更新操作的使用者 ID
   * @param messageId 要更新的訊息 ID
   * @param dto 包含更新內容的 DTO
   */
    async update(updaterId: string, messageId: string, dto: UpdateWallMessageDto): Promise<WallMessageDto> {
        const message = await this.wallMessageRepo.findOne({
            where: { id: messageId },
            relations: ['author', 'wallOwner'],
        });

        if (!message) {
            throw new NotFoundException('訊息不存在');
        }

        // 權限檢查：只有訊息的原始作者可以修改
        if (message.author.id !== updaterId) {
            throw new ForbiddenException('無權修改此訊息');
        }

        // 更新內容並儲存
        message.content = dto.content;
        const updatedMessage = await this.wallMessageRepo.save(message);

        return this.mapWallMessageToDto(updatedMessage);
    }

    /**
     * 私有輔助方法：將 Comment 實體映射到 DTO
     */
    private mapCommentToDto(comment: Comment): CommentDto {
        return {
            id: comment.id,
            content: comment.content,
            likeCount: comment.likeCount,
            createdAt: comment.createdAt,
            author: comment.author,
            childrenCount: comment.children?.length || 0, // 計算子評論數量
            parentId: comment.parent?.id || null,
        };
    }
}