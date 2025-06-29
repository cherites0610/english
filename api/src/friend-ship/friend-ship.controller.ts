// src/friendship/friend-ship.controller.ts (重構後)

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { FriendShipService } from './friend-ship.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { SetFriendNoteDto } from './dto/set-friend-note.dto';

// --- Swagger 和響應 DTO 相關的 imports ---
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  FriendshipResponse,
  FriendListResponse,
  PendingRequestListResponse,
} from './dto/friendship.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';
import { UserID } from 'src/common/decorators/user.decorator';

@ApiTags('Friendship')
@ApiBearerAuth()
@Controller('friend-ship')
export class FriendShipController {
  constructor(private readonly friendshipService: FriendShipService) {}

  @Post('request')
  @ApiCreatedResponse({
    description: '成功發送好友請求',
    type: FriendshipResponse,
  })
  async sendFriendRequest(
    @Body() dto: SendFriendRequestDto,
    @UserID() userID: string,
  ): Promise<FriendshipResponse> {
    const friendship = await this.friendshipService.sendRequest(
      userID,
      dto.addresseeID,
    );
    return { message: '好友請求已發送', data: friendship };
  }

  @Patch('respond')
  @ApiOkResponse({ description: '成功回應好友請求', type: FriendshipResponse })
  async respondToRequest(
    @Body() dto: RespondFriendRequestDto,
    @UserID() userID: string,
  ): Promise<FriendshipResponse> {
    const friendship =
      dto.status === 'accepted'
        ? await this.friendshipService.acceptRequest(dto.requesterID, userID)
        : await this.friendshipService.rejectRequest(dto.requesterID, userID);

    return { message: '請求已處理', data: friendship };
  }

  @Patch('block/:friendId')
  @ApiOkResponse({ description: '成功屏蔽好友', type: FriendshipResponse })
  async blockFriend(
    @Param('friendId') friendId: string,
    @UserID() userID: string,
  ): Promise<FriendshipResponse> {
    const friendship = await this.friendshipService.blockFriend(
      userID,
      friendId,
    );
    return { message: '已屏蔽該好友', data: friendship };
  }

  @Patch('unblock/:friendId')
  @ApiOkResponse({ description: '成功解除屏蔽好友', type: FriendshipResponse })
  async unblockFriend(
    @Param('friendId') friendId: string,
    @UserID() userID: string,
  ): Promise<FriendshipResponse> {
    const friendship = await this.friendshipService.unblockFriend(
      userID,
      friendId,
    );
    return { message: '已解除屏蔽', data: friendship };
  }

  @Patch('note')
  @ApiOkResponse({ description: '成功設定好友備註', type: FriendshipResponse })
  async setFriendNote(
    @Body() dto: SetFriendNoteDto,
    @UserID() userID: string,
  ): Promise<FriendshipResponse> {
    const friendship = await this.friendshipService.setFriendNote(
      userID,
      dto.friendID,
      dto.note,
    );
    return { message: '備註已更新', data: friendship };
  }

  @Get()
  @ApiOkResponse({ description: '成功獲取好友列表', type: FriendListResponse })
  async getFriends(@UserID() userID: string): Promise<FriendListResponse> {
    const friends = await this.friendshipService.getFriends(userID);
    return { message: '獲取成功', data: friends };
  }

  @Get('pending')
  @ApiOkResponse({
    description: '成功獲取待處理的好友請求列表',
    type: PendingRequestListResponse,
  })
  async getPendingRequests(
    @UserID() userID: string,
  ): Promise<PendingRequestListResponse> {
    const requests = await this.friendshipService.getPendingRequests(userID);
    return { message: '獲取成功', data: requests };
  }

  @Delete('friend/:friendId')
  @ApiOkResponse({ description: '成功解除好友關係', type: SuccessResponse })
  @HttpCode(HttpStatus.OK)
  async removeFriend(
    @Param('friendId') friendId: string,
    @UserID() userID: string,
  ): Promise<SuccessResponse> {
    await this.friendshipService.removeFriend(userID, friendId);
    return { message: '已解除好友關係', data: null };
  }
}
