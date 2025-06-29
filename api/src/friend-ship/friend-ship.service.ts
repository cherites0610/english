import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Friendship, FriendshipStatus } from './entity/friend.ship.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { FriendDto, PendingRequestDto } from './dto/friendship.dto';
import { UserProfileDto } from 'src/user/dto/user-profile.dto';

@Injectable()
export class FriendShipService {
  private readonly logger = new Logger(FriendShipService.name);

  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    private readonly userService: UserService,
  ) {}

  async sendRequest(requesterID: string, addresseeID: string) {
    if (requesterID === addresseeID) {
      throw new BadRequestException('不能對自己發送好友邀請');
    }

    const [requester, addressee] = await Promise.all([
      this.userService.findByID(requesterID),
      this.userService.findByID(addresseeID),
    ]);

    if (!requester || !addressee) throw new NotFoundException('用戶不存在');

    const existing = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: requesterID }, addressee: { id: addresseeID } },
        { requester: { id: addresseeID }, addressee: { id: requesterID } },
      ],
    });

    if (existing) {
      if (existing.status === FriendshipStatus.PENDING) {
        throw new BadRequestException('已有好友邀請');
      }
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('已是好友');
      }
    }

    const friendShip = this.friendshipRepository.create({
      requester,
      addressee,
      status: FriendshipStatus.PENDING,
      isBlocked: false,
    });

    return this.friendshipRepository.save(friendShip);
  }

  async acceptRequest(requesterId: string, addresseeId: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        requester: { id: requesterId },
        addressee: { id: addresseeId },
        status: FriendshipStatus.PENDING,
      },
      relations: ['requester', 'addressee'],
    });
    if (!friendship) throw new NotFoundException('好友請求不存在');

    friendship.status = FriendshipStatus.ACCEPTED;
    friendship.isBlocked = false;

    return this.friendshipRepository.save(friendship);
  }

  async rejectRequest(requesterId: string, addresseeId: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        requester: { id: requesterId },
        addressee: { id: addresseeId },
        status: FriendshipStatus.PENDING,
      },
    });
    if (!friendship) throw new NotFoundException('好友請求不存在');

    friendship.status = FriendshipStatus.REJECTED;
    return this.friendshipRepository.save(friendship);
  }

  async blockFriend(requesterId: string, addresseeId: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        requester: { id: requesterId },
        addressee: { id: addresseeId },
        status: FriendshipStatus.ACCEPTED,
      },
    });
    if (!friendship) throw new NotFoundException('好友關係不存在');

    friendship.isBlocked = true;
    return this.friendshipRepository.save(friendship);
  }

  async unblockFriend(requesterId: string, addresseeId: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        requester: { id: requesterId },
        addressee: { id: addresseeId },
        status: FriendshipStatus.ACCEPTED,
      },
    });
    if (!friendship) throw new NotFoundException('好友關係不存在');

    friendship.isBlocked = false;
    return this.friendshipRepository.save(friendship);
  }

  async setFriendNote(requesterId: string, addresseeId: string, note: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        requester: { id: requesterId },
        addressee: { id: addresseeId },
        status: FriendshipStatus.ACCEPTED,
      },
    });
    if (!friendship) throw new NotFoundException('好友關係不存在');

    friendship.note = note;
    return this.friendshipRepository.save(friendship);
  }

  // 取得好友列表（過濾 requester 封鎖的）
  async getFriends(userID: string): Promise<FriendDto[]> {
    // 1. 查詢所有 status 為 ACCEPTED 的好友關係
    const friendships = await this.friendshipRepository.find({
      where: [
        { requester: { id: userID }, status: FriendshipStatus.ACCEPTED },
        { addressee: { id: userID }, status: FriendshipStatus.ACCEPTED },
      ],
      // 同時載入關係中的兩方使用者資料
      relations: ['requester', 'addressee'],
    });

    // 2. 將 Friendship[] 實體陣列轉換為前端需要的 FriendDto[]
    const friends: FriendDto[] = friendships.map((friendship) => {
      // a. 判斷在這段關係中，對方是誰
      const friendEntity =
        friendship.requester.id === userID
          ? friendship.addressee
          : friendship.requester;

      // b. 取得我為對方設定的備註。只有當我是請求方時，備註才由我設定。
      const note = friendship.requester.id === userID ? friendship.note : null;

      // d. 組合成最終的 FriendDto，包含個人資料和備註
      const friendWithNote: FriendDto = {
        ...friendEntity,
        note: note || '',
      };

      return friendWithNote;
    });

    return friends;
  }

  async getPendingRequests(userID: string): Promise<PendingRequestDto[]> {
    // 1. 查詢所有發給我（我是 addressee）且狀態為 PENDING 的請求
    const pendingFriendships = await this.friendshipRepository.find({
      where: {
        addressee: { id: userID },
        status: FriendshipStatus.PENDING,
      },
      // 只需要載入請求者 (requester) 的資訊
      relations: ['requester'],
    });

    // 2. 將 Friendship[] 實體陣列轉換為前端需要的 PendingRequestDto[]
    const requests: PendingRequestDto[] = pendingFriendships.map(
      (friendship) => {
        return {
          friendshipId: friendship.id, // 帶上請求本身的 ID，方便前端後續同意或拒絕操作
          requester: friendship.requester,
          requestedAt: friendship.createdAt,
        };
      },
    );

    return requests;
  }

  async removeFriend(userID: string, friendID: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          requester: { id: userID },
          addressee: { id: friendID },
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requester: { id: friendID },
          addressee: { id: userID },
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });

    if (!friendship) throw new NotFoundException('好友關係不存在');

    await this.friendshipRepository.remove(friendship);
    return { message: '好友關係已解除' };
  }
}
