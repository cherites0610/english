import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { WallMessageDto } from './wall.dto';

// 返回單條留言板訊息的響應
export class WallMessageResponse extends ResponseDto<WallMessageDto> {
  @ApiProperty({ type: WallMessageDto })
  declare data: WallMessageDto;
}

// 返回留言板訊息列表的響應
export class WallMessageListResponse extends ResponseDto<WallMessageDto[]> {
  @ApiProperty({ type: [WallMessageDto] })
  declare data: WallMessageDto[];
}
