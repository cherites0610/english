import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { FriendshipDto, PendingRequestDto, FriendDto } from './friendship.dto';
import { UserProfileDto } from 'src/user/dto/user-profile.dto';

// 返回單個好友關係記錄的響應
export class FriendshipResponse extends ResponseDto<FriendshipDto> {
  @ApiProperty({ type: FriendshipDto })
  declare data: FriendshipDto;
}

// 返回好友列表的響應
export class FriendListResponse extends ResponseDto<FriendDto[]> {
  @ApiProperty({ type: [FriendDto] })
  declare data: FriendDto[];
}

// 返回待處理請求列表的響應
export class PendingRequestListResponse extends ResponseDto<
  PendingRequestDto[]
> {
  @ApiProperty({ type: [PendingRequestDto] })
  declare data: PendingRequestDto[];
}
