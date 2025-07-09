import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { CommentDto } from './comment.dto';

// --- ToggleLike 的響應 DTO ---
class ToggleLikeDataDto {
  @ApiProperty({ description: '操作後是否為點讚狀態' })
  liked: boolean;

  @ApiProperty({ description: '操作後目標的總點讚數' })
  likeCount: number;
}

export class ToggleLikeResponse extends ResponseDto<ToggleLikeDataDto> {
  @ApiProperty({ type: ToggleLikeDataDto })
  declare data: ToggleLikeDataDto;
}

// --- AddComment 的響應 DTO ---
export class CommentResponse extends ResponseDto<CommentDto> {
  @ApiProperty({ type: CommentDto })
  declare data: CommentDto;
}
