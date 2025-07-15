import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { EnglishProficiency } from 'src/user/entity/user.entity';
import { JwtService } from '@nestjs/jwt';
import { GoogleLoginResponseDto } from './dto/google-login-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) { }

  async loginWithLine(code: string) {
    try {
      const tokenResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.line.me/oauth2/v2.1/token',
          {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri:
              this.configService.get<string>('LINE_REDIRECT_URI') || '',
            client_id: this.configService.get<string>('LINE_CLIENT_ID') || '',
            client_secret:
              this.configService.get<string>('LINE_CLIENT_SECRET') || '',
          } ,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        ),
      );

      this.logger.debug(tokenResponse);

      const profileResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.line.me/oauth2/v2.1/verify',
          new URLSearchParams({
            id_token: tokenResponse.data.id_token,
            client_id: this.configService.get<string>('LINE_CLIENT_ID') || '',
          }),
        ),
      );

      const { sub, name, email } = profileResponse.data;

      if (!sub) throw new UnauthorizedException('無法取得 LINE 使用者資訊');

      let user = await this.userService.findByLineID(sub);

      if (!user) {
        user = await this.userService.create({
          name: name,
          lineID: sub,
          email: email ? email : `${sub}@line.fake`,
          password: '',
          userLevel: 1,
          money: 0,
          englishLevel: EnglishProficiency.NOVICE,
          lastLoginAt: new Date(),
        });
      }

      const payload = { sub: user.id, name: user.name };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRETIME'),
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRETIME'),
      });

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (err: any) {
      this.logger.debug(err);
      throw new BadGatewayException('服務器繁忙');
    }
  }

  async loginWithGoogle(code: string): Promise<GoogleLoginResponseDto> {
    // 1. 使用 code 換取 access_token
    const tokenRes = await this.httpService.axiosRef.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      },
    );

    // 2. 用 access_token 拿使用者資料
    const userRes = await this.httpService.axiosRef.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      },
    );

    const { id, email, name } = userRes.data;

    // 3. 依照 email 找 user，找不到就註冊
    let user = await this.userService.findByGoogleID(id);
    if (!user) {
      user = await this.userService.create({
        name: name,
        googleID: id,
        email: email,
        password: '',
        userLevel: 1,
        money: 0,
        englishLevel: EnglishProficiency.NOVICE,
        lastLoginAt: new Date(),
      });
    }

    const payload = { sub: user.id, name: user.name };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRETIME'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRETIME'),
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.userService.findByID(decoded.sub);
      if (!user) throw new UnauthorizedException();

      const newAccessToken = this.jwtService.sign(
        { sub: user.id, name: user.name },
        { expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRETIME') },
      );

      return newAccessToken;
    } catch {
      throw new UnauthorizedException('Refresh token 無效或過期');
    }
  }
}
