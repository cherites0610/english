import { User } from 'src/user/entity/user.entity';

export class GoogleLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: User;
}
