import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import {
  GoogleLoginResponse,
  LineLoginResponse,
  RefreshTokenResponse,
  AuthUrlResponse,
} from './dto/auth.response.dto';
import { Response } from 'express';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('/google/callback')
  @ApiOkResponse({
    description: 'Google 登入或註冊成功後，重定向回 App',
  })
  async handleGoogleLogin(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.loginWithGoogle(code);
    const redirectUrl = `mou-english://auth?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
    res.redirect(redirectUrl);
  }

  @Public()
  @Get('/line/callback')
  @ApiOkResponse({
    description: 'Line 登入或註冊成功後，重定向回 App',
  })
  async handleLineLogin(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.loginWithLine(code);
    const redirectUrl = `mou-english://auth?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
    res.redirect(redirectUrl);
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
