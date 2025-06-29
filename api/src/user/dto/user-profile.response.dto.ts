import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { UserProfileDto } from './user-profile.dto';

export class UserProfileResponse extends ResponseDto<UserProfileDto> {
  @ApiProperty({ type: UserProfileDto })
  declare data: UserProfileDto;
}
