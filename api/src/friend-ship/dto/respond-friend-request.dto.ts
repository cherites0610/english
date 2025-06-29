import { IsUUID, IsEnum } from 'class-validator';
import { FriendshipStatus } from '../entity/friend.ship.entity';

export class RespondFriendRequestDto {
  @IsUUID()
  requesterID: string;

  @IsEnum(FriendshipStatus)
  status: FriendshipStatus; // 應該是 ACCEPTED 或 REJECTED
}
