// src/user/user.controller.ts (重構後)

import { Controller, Get, NotFoundException, Param, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';

// --- Swagger 和響應 DTO 相關的 imports ---
import {
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QueryUserProfileResponse, UserProfileResponse } from './dto/user-profile.response.dto';
import { UserID } from 'src/common/decorators/user.decorator';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('profile')
  @ApiOkResponse({
    description: '成功獲取使用者個人資料',
    type: UserProfileResponse,
  })
  @ApiNotFoundResponse({ description: '找不到指定 ID 的用戶' })
  async getProfile(@UserID() id: string): Promise<UserProfileResponse> {
    const user = await this.userService.findByID(id);
    if (!user) {
      throw new UnauthorizedException('找不到用戶');
    }

    // 這一步處理登入刷新，返回的依然是完整的 User 實體
    const processedUser =
      await this.userService.processDailyLoginIfNeeded(user);

    return {
      message: '取得成功',
      data: processedUser,
    };
  }

  @Get(':name')
  @ApiOkResponse({
    description: '成功獲取使用者列表',
    type: QueryUserProfileResponse,
  })
  @ApiNotFoundResponse({ description: '找不到指定 ID 的用戶' })
  async queryUserProfileList(@Param('name') name: string): Promise<QueryUserProfileResponse> {
    const users = await this.userService.findListByNameOrID(name);
    if (!users) {
      throw new UnauthorizedException('找不到用戶');
    }

    return {
      message: '取得成功',
      data: users,
    };
  }
}
