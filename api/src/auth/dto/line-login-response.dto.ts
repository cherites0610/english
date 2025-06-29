import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/entity/user.entity';

export class LineLoginResponseDto {
  @ApiProperty()
  user: User;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
