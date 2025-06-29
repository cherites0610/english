import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from 'src/user/dto/user-profile.dto';
import { FriendshipStatus } from '../entity/friend.ship.entity';

// 代表一個好友關係記錄的詳細資訊
export class FriendshipDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: '請求發送方' })
  requester: UserProfileDto;

  @ApiProperty({ description: '請求接收方' })
  addressee: UserProfileDto;

  @ApiProperty({ enum: FriendshipStatus, description: '好友關係狀態' })
  status: FriendshipStatus;

  @ApiProperty({ description: '是否被當前用戶屏蔽' })
  isBlocked: boolean;

  @ApiProperty({ description: '好友備註', nullable: true })
  note?: string;

  @ApiProperty()
  updatedAt: Date;
}

// 代表一個待處理的好友請求
export class PendingRequestDto {
  @ApiProperty({ description: '好友請求的唯一ID (用於後續操作)' })
  friendshipId: string;

  @ApiProperty({ description: '發送請求的使用者資訊' })
  requester: UserProfileDto;

  @ApiProperty({ description: '請求發送時間' })
  requestedAt: Date;
}

export class FriendDto extends UserProfileDto {
  note?: string;
}
