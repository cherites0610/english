import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

// 創建評論時的輸入格式
export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    // --- 目標對象，三者擇一 ---
    @IsOptional()
    @IsUUID()
    wallMessageId?: string;

    @IsOptional()
    @IsUUID()
    journalEntryId?: string;

    @IsOptional()
    @IsUUID()
    parentCommentId?: string;
}

// 點讚時的輸入格式
export class ToggleLikeDto {
    // --- 目標對象，三者擇一 ---
    @IsOptional()
    @IsUUID()
    wallMessageId?: string;

    @IsOptional()
    @IsUUID()
    journalEntryId?: string;

    @IsOptional()
    @IsUUID()
    commentId?: string;
}