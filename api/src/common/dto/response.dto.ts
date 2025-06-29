import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty({ description: '回傳訊息' })
  message: string;

  @ApiProperty({ description: '回傳資料' })
  data: T;
}
