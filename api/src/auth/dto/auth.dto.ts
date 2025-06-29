import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from 'src/user/dto/user-profile.dto'; // 引入我們之前定義的 UserProfileDto

// Google 登入成功後，data 欄位的內容
export class GoogleLoginDataDto {
  @ApiProperty({ description: '訪問令牌 (Access Token)' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌 (Refresh Token)' })
  refreshToken: string;

  @ApiProperty({ type: UserProfileDto, description: '使用者基本資料' })
  user: UserProfileDto;
}

// Line 登入成功後，data 欄位的內容
export class LineLoginDataDto {
  @ApiProperty({ description: '訪問令牌 (Access Token)' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌 (Refresh Token)' })
  refreshToken: string;

  @ApiProperty({ type: UserProfileDto, description: '使用者基本資料' })
  user: UserProfileDto;
}

// 刷新 Token 成功後，data 欄位的內容
export class RefreshTokenDataDto {
  @ApiProperty({ description: '新的訪問令牌 (Access Token)' })
  accessToken: string;
}

// 獲取登入 URL 時，data 欄位的內容
export class AuthUrlDataDto {
  @ApiProperty({ description: '用於重定向的 OAuth 登入網址' })
  url: string;
}
