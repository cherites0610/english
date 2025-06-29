import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { UserProfileDto } from 'src/user/dto/user-profile.dto';
import { CommentDto } from './comment.dto';

/**
 * 創建新日誌時的請求體格式
 */
export class CreateJournalDto {
    @ApiProperty({ description: '日誌標題', example: '今天的心情' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: '日誌內容', example: '天氣很好，適合冒險！' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ description: '是否對外公開', example: true, default: true })
    @IsBoolean()
    isPublic: boolean;
}

/**
 * 更新日誌時的請求體格式
 * 使用 PartialType 將 CreateJournalDto 的所有屬性變為可選
 */
export class UpdateJournalDto extends PartialType(CreateJournalDto) { }


/**
 * 用於 API 響應的、單篇日誌的數據格式 (包含評論)
 */
export class JournalEntryDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    content: string;

    @ApiProperty()
    isPublic: boolean;

    @ApiProperty()
    likeCount: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ type: () => UserProfileDto })
    author: UserProfileDto;

    // 為了效能，通常只返回頂層評論
    @ApiProperty({ type: [() => CommentDto] })
    comments: CommentDto[];
}