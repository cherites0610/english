import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entity/comment.entity';
import { Like } from './entity/like.entity';
import { User } from 'src/user/entity/user.entity';
import { WallMessage } from './entity/wall-message.entity';
import { JournalEntry } from './entity/journal-entry.entity';
import { CreateCommentDto, ToggleLikeDto } from './dto/interaction.dto';
import { CommentDto } from './dto/comment.dto';
import { UserService } from 'src/user/user.service'; // 注入 UserService

@Injectable()
export class InteractionService {
  private readonly logger = new Logger(InteractionService.name);

  constructor(
    @InjectRepository(Like) private readonly likeRepo: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(WallMessage)
    private readonly wallMessageRepo: Repository<WallMessage>,
    @InjectRepository(JournalEntry)
    private readonly journalEntryRepo: Repository<JournalEntry>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  /**
   * 新增一條評論，並返回轉換後的 DTO
   */
  async addComment(
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDto | null> {
    const { content, wallMessageId, journalEntryId, parentCommentId } = dto;

    // 1. 驗證評論作者是否存在
    const author = await this.userRepo.findOneByOrFail({ id: authorId });
    const newCommentData: Partial<Comment> = { author, content };

    // 2. 判斷評論目標，並建立關聯
    if (parentCommentId) {
      // --- Case 1: 回覆另一條評論 ---
      const parentComment = await this.commentRepo.findOne({
        where: { id: parentCommentId },
        // 必須加載父評論的根關聯，以便繼承
        relations: ['rootWallMessage', 'rootJournalEntry'],
      });
      if (!parentComment) {
        throw new NotFoundException('要回覆的父評論不存在');
      }

      newCommentData.parent = parentComment;
      // 關鍵：新評論的「根」與其父評論的「根」保持一致
      newCommentData.rootWallMessage = parentComment.rootWallMessage;
      newCommentData.rootJournalEntry = parentComment.rootJournalEntry;
    } else if (wallMessageId) {
      // --- Case 2: 對留言板訊息發表頂層評論 ---
      const wallMessage = await this.wallMessageRepo.findOneByOrFail({
        id: wallMessageId,
      });
      newCommentData.rootWallMessage = wallMessage;
    } else if (journalEntryId) {
      // --- Case 3: 對日誌發表頂層評論 ---
      const journalEntry = await this.journalEntryRepo.findOneByOrFail({
        id: journalEntryId,
      });
      newCommentData.rootJournalEntry = journalEntry;
    } else {
      // --- Case 4: 未提供任何評論目標 ---
      throw new BadRequestException(
        '必須提供評論目標 (wallMessageId, journalEntryId, 或 parentCommentId)',
      );
    }

    // 3. 創建並儲存新的評論實體
    const commentEntity = this.commentRepo.create(newCommentData);
    const savedComment = await this.commentRepo.save(commentEntity);

    // 4. 再次查詢以獲取完整的關聯數據，用於轉換為 DTO
    const fullComment = await this.commentRepo.findOneOrFail({
      where: { id: savedComment.id },
      relations: ['author', 'parent'], // 載入作者和父評論(如果存在)
    });

    return this.mapCommentToDto(fullComment);
  }

  async toggleLike(
    userId: string,
    dto: ToggleLikeDto,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const { wallMessageId, journalEntryId, commentId } = dto;

    // 1. 根據 DTO 動態確定目標 Repository 和目標 ID
    let targetRepo: Repository<WallMessage | JournalEntry | Comment>;
    let targetId: string;
    let likeRelationName: 'wallMessage' | 'journalEntry' | 'comment';

    if (wallMessageId) {
      targetRepo = this.wallMessageRepo;
      targetId = wallMessageId;
      likeRelationName = 'wallMessage';
    } else if (journalEntryId) {
      targetRepo = this.journalEntryRepo;
      targetId = journalEntryId;
      likeRelationName = 'journalEntry';
    } else if (commentId) {
      targetRepo = this.commentRepo;
      targetId = commentId;
      likeRelationName = 'comment';
    } else {
      throw new BadRequestException('必須提供點讚目標');
    }

    // 2. 檢查目標實體是否存在
    const targetEntity = await targetRepo.findOneBy({ id: targetId });
    if (!targetEntity) throw new NotFoundException('點讚目標不存在');

    // 3. 檢查用戶是否已經點過讚
    const likeCriteria = {
      user: { id: userId },
      [likeRelationName]: { id: targetId },
    };
    const existingLike = await this.likeRepo.findOne({ where: likeCriteria });

    if (existingLike) {
      // 4a. 如果已點讚，則取消讚
      await this.likeRepo.remove(existingLike);
      // 使用原子操作 decrement，避免競爭條件
      await targetRepo.decrement({ id: targetId }, 'likeCount', 1);
      return { liked: false, likeCount: targetEntity.likeCount - 1 };
    } else {
      // 4b. 如果未點讚，則新增讚
      const newLike = this.likeRepo.create(likeCriteria);
      await this.likeRepo.save(newLike);
      // 使用原子操作 increment
      await targetRepo.increment({ id: targetId }, 'likeCount', 1);
      return { liked: true, likeCount: targetEntity.likeCount + 1 };
    }
  }

  /**
   * 刪除一條評論
   * @param deleterId 執行刪除操作的使用者 ID
   * @param commentId 要刪除的評論 ID
   */
  async deleteComment(deleterId: string, commentId: string): Promise<void> {
    // 1. 查找評論，並加載其作者資訊以進行權限驗證
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException(`找不到 ID 為 ${commentId} 的評論`);
    }

    // 2. 權限檢查：只有評論的作者本人可以刪除自己的評論
    //    在真實世界，可能還需要允許內容管理員或被評論對象的擁有者刪除
    if (comment.author.id !== deleterId) {
      throw new ForbiddenException('無權刪除此評論');
    }

    // 3. 執行刪除
    // 由於我們在 Comment 實體的 parent 和 Like 實體的 comment 關聯上
    // 設定了 onDelete: 'CASCADE'，TypeORM 會自動刪除所有
    // 引用了這條評論的子評論和點讚記錄，非常方便。
    await this.commentRepo.remove(comment);
  }

  /**
   * 私有輔助方法：將 Comment 實體映射到 DTO
   */
  private mapCommentToDto(comment: Comment | null): CommentDto | null {
    if (!comment) return null;
    return {
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      author: comment.author,
      childrenCount: comment.children?.length || 0,
      parentId: comment.parent?.id || null,
    };
  }
}
