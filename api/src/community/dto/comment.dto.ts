import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from 'src/user/dto/user-profile.dto';

/**
 * 用於 API 響應的、單條評論的標準數據格式
 */
export class CommentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => UserProfileDto })
  author: UserProfileDto;

  @ApiProperty({ description: '此評論的回覆數量' })
  childrenCount: number;

  @ApiProperty({ description: '父評論的ID', nullable: true })
  parentId: string | null;
}
