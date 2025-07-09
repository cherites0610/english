import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.interface';

/**
 * 獲取當前登入使用者的完整 payload。
 * 用法: @User() user: JwtPayload
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    // 現在 request.user 是強型別的 JwtPayload
    return request.user;
  },
);

/**
 * 獲取當前登入使用者的 ID (sub 或 userId)。
 * 這是一個簡化的、更安全的版本。
 * 用法: @UserID() userId: string
 */
export const UserID = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 增加一個健壯性檢查，確保 user 和 userId 存在
    if (!user || !user.userId) {
      throw new InternalServerErrorException('無法從請求中獲取使用者 ID');
    }

    return user.userId;
  },
);
