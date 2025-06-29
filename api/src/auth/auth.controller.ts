// src/auth/auth.controller.ts (重構後)

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';

// --- Swagger 和響應 DTO 相關的 imports ---
import { ApiTags, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import {
  GoogleLoginResponse,
  LineLoginResponse,
  RefreshTokenResponse,
  AuthUrlResponse,
} from './dto/auth.response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('/line/callback')
  @ApiOkResponse({
    description: 'Line 登入或註冊成功',
    type: LineLoginResponse,
  })
  async handleLineLogin(
    @Query('code') code: string,
  ): Promise<LineLoginResponse> {
    // 假設 authService.loginWithLine 返回 { accessToken, refreshToken, user: User }
    const result = await this.authService.loginWithLine(code);

    return {
      message: 'Line 登入成功',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user, // 轉換為安全的 DTO
      },
    };
  }

  @Public()
  @Get('/google/callback')
  @ApiOkResponse({
    description: 'Google 登入或註冊成功',
    type: GoogleLoginResponse,
  })
  async handleGoogleLogin(
    @Query('code') code: string,
  ): Promise<GoogleLoginResponse> {
    const result = await this.authService.loginWithGoogle(code);

    return {
      message: 'Google 登入成功',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    };
  }

  @Public()
  @Post('/refresh')
  @ApiOkResponse({
    description: '成功刷新 Access Token',
    type: RefreshTokenResponse,
  })
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } } } })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<RefreshTokenResponse> {
    const newAccessToken =
      await this.authService.refreshAccessToken(refreshToken);
    return {
      message: '刷新成功',
      data: {
        accessToken: newAccessToken,
      },
    };
  }

  /**
   * 獲取 Google 登入的重定向網址
   */
  @Public()
  @Get('/google')
  @ApiOkResponse({
    description: '成功獲取 Google 登入網址',
    type: AuthUrlResponse,
  })
  getGoogleLoginUrl(): AuthUrlResponse {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.configService.get<string>('GOOGLE_CLIENT_ID')}&redirect_uri=${this.configService.get<string>('GOOGLE_REDIRECT_URI')}&response_type=code&scope=openid%20email%20profile&access_type=offline`;

    return {
      message: '獲取成功',
      data: { url },
    };
  }

  /**
   * 獲取 Line 登入的重定向網址
   */
  @Public()
  @Get('/line')
  @ApiOkResponse({
    description: '成功獲取 Line 登入網址',
    type: AuthUrlResponse,
  })
  getLineUrl(): AuthUrlResponse {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let state = '';
    for (let i = 0; i < 9; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      state += chars[idx];
    }
    const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${this.configService.get<string>('LINE_CLIENT_ID')}&redirect_uri=${this.configService.get<string>('LINE_REDIRECT_URI')}&state=${state}&scope=profile%20openid%20email`;

    return {
      message: '獲取成功',
      data: { url },
    };
  }
}
