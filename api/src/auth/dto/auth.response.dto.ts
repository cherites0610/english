import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import {
  GoogleLoginDataDto,
  LineLoginDataDto,
  RefreshTokenDataDto,
  AuthUrlDataDto,
} from './auth.dto';

// Google 登入的完整響應
export class GoogleLoginResponse extends ResponseDto<GoogleLoginDataDto> {
  @ApiProperty({ type: GoogleLoginDataDto })
  declare data: GoogleLoginDataDto;
}

// Line 登入的完整響應
export class LineLoginResponse extends ResponseDto<LineLoginDataDto> {
  @ApiProperty({ type: LineLoginDataDto })
  declare data: LineLoginDataDto;
}

// 刷新 Token 的完整響應
export class RefreshTokenResponse extends ResponseDto<RefreshTokenDataDto> {
  @ApiProperty({ type: RefreshTokenDataDto })
  declare data: RefreshTokenDataDto;
}

// 獲取登入 URL 的完整響應
export class AuthUrlResponse extends ResponseDto<AuthUrlDataDto> {
  @ApiProperty({ type: AuthUrlDataDto })
  declare data: AuthUrlDataDto;
}
