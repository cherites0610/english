import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from './response.dto';

export class SuccessResponse extends ResponseDto<null> {
  // 當沒有返回資料時，data 永遠是 null
  @ApiProperty({ type: 'null', default: null })
  declare data: null;
}
