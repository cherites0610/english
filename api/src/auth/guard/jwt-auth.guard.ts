import {
  Injectable,
  Logger,
  CanActivate,
  ExecutionContext,
  UnauthorizedException, // 建議使用 UnauthorizedException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator'; // 請確認您的 IS_PUBLIC_KEY 路徑

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    console.log(1);
    
    // 檢查是否為公開路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string;
    console.log(authHeader);
    
    // 1. 優先檢查 Header 是否存在
    if (!authHeader) {
      throw new UnauthorizedException('未提供授權標頭 (Authorization header)');
    }

    const parts = authHeader.split(' ');
    // 2. 檢查 Header 格式是否正確 (應為 'Bearer <token>')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        '授權標頭格式錯誤，應為 "Bearer <token>"',
      );
    }

    const token = parts[1];
    console.log(token);
    
    // 3. 安全地檢查後門 token
    if (
      this.configService.get<string>('NODE_ENV') === 'development' &&
      token === this.configService.get<string>('TEST_BYPASS_TOKEN')
    ) {
      this.logger.debug('後門 token 已被使用');

      // 模擬一個 user 物件附加到 request 上
      request.user = {
        userId: this.configService.get<string>('TEST_USER_ID'),
        username: 'TEST_USER',
      };

      return true;
    }

    // 4. 若非後門 token，則交給 Passport-jwt 策略進行標準驗證
    return super.canActivate(context);
  }
}
