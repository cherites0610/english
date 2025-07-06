import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJournalDto, UpdateJournalDto, JournalEntryDto } from './dto/journal.dto';
import { CommentDto } from './dto/comment.dto';
import { User } from 'src/user/entity/user.entity';
import { JournalEntry } from './entity/journal-entry.entity';


@Injectable()
export class JournalService {
    constructor(
        @InjectRepository(JournalEntry) private readonly journalRepo: Repository<JournalEntry>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) { }

    async create(authorId: string, dto: CreateJournalDto): Promise<JournalEntryDto> {
        const author = await this.userRepo.findOneByOrFail({ id: authorId });
        const entry = this.journalRepo.create({ ...dto, author });
        const savedEntry = await this.journalRepo.save(entry);
        return this.findOne(savedEntry.id, authorId); // 返回轉換為 DTO 後的完整數據
    }

    async findByUser(ownerId: string, viewerId?: string): Promise<JournalEntryDto[]> {
        const isOwner = ownerId === viewerId;
        const whereClause: any = { author: { id: ownerId } };

        if (!isOwner) {
            whereClause.isPublic = true;
        }

        const entries = await this.journalRepo.find({
            where: whereClause,
            order: { createdAt: 'DESC' },
            relations: ['author', 'comments'],
        });
        // 將每個實體都轉換為 DTO
        return entries.map(entry => this.mapJournalToDto(entry));
    }

    async findOne(entryId: string, viewerId?: string): Promise<JournalEntryDto> {
        const entry = await this.journalRepo.findOne({
            where: { id: entryId },
            // 載入所有需要的關聯，以便轉換為 DTO
            relations: ['author', 'comments', 'comments.author', 'comments.parent'],
        });
        if (!entry) throw new NotFoundException('日誌不存在');
        if (!entry.isPublic && entry.author.id !== viewerId) {
            throw new ForbiddenException('無權查看此日誌');
        }
        return this.mapJournalToDto(entry, true); // 傳入 true 來加載子評論數量
    }

    async update(authorId: string, entryId: string, dto: UpdateJournalDto): Promise<JournalEntryDto> {
        const entry = await this.journalRepo.findOneByOrFail({ id: entryId, author: { id: authorId } });
        this.journalRepo.merge(entry, dto);
        await this.journalRepo.save(entry);
        return this.findOne(entryId, authorId);
    }

    async remove(authorId: string, entryId: string): Promise<void> {
        const result = await this.journalRepo.delete({ id: entryId, author: { id: authorId } });
        if (result.affected === 0) {
            throw new NotFoundException('日誌不存在或無權刪除');
        }
    }

    /**
     * 私有輔助方法：將 JournalEntry 實體映射到 DTO
     */
    private mapJournalToDto(entry: JournalEntry, includeChildrenCount = false): JournalEntryDto {
        return {
            id: entry.id,
            title: entry.title,
            content: entry.content,
            isPublic: entry.isPublic,
            likeCount: entry.likeCount,
            createdAt: entry.createdAt,
            author: entry.author,
            // 將評論也轉換為 DTO
            comments: entry.comments?.map(comment => this.mapCommentToDto(comment, includeChildrenCount)) || [],
        };
    }

    /**
     * 私有輔助方法：將 Comment 實體映射到 DTO
     */
    private mapCommentToDto(comment: any, includeChildrenCount = false): CommentDto {
        return {
            id: comment.id,
            content: comment.content,
            likeCount: comment.likeCount,
            createdAt: comment.createdAt,
            author: comment.author,
            // 如果需要，可以計算子評論的數量
            childrenCount: includeChildrenCount ? (comment.children?.length || 0) : 0,
            parentId: comment.parent?.id || null,
        }
    }
}