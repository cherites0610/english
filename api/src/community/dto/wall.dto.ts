import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { UserProfileDto } from 'src/user/dto/user-profile.dto';
import { CommentDto } from './comment.dto';

/**
 * 在留言板上創建新訊息時的請求體格式
 */
export class CreateWallMessageDto {
  @ApiProperty({ description: '留言板擁有者的 User ID' })
  @IsUUID()
  wallOwnerId: string;

  @ApiProperty({ description: '留言內容' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdateWallMessageDto {
  @ApiProperty({ description: '要更新的留言內容' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

/**
 * 用於 API 響應的、單條留言板訊息的數據格式
 */
export class WallMessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => UserProfileDto, description: '留言作者' })
  author: UserProfileDto;

  @ApiProperty({ type: () => UserProfileDto, description: '留言板主人' })
  wallOwner: UserProfileDto;

  @ApiProperty({ type: [() => CommentDto], description: '此留言下的評論列表' })
  comments: CommentDto[];
}
