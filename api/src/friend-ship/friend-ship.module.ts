import { Module } from '@nestjs/common';
import { FriendShipService } from './friend-ship.service';
import { FriendShipController } from './friend-ship.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entity/friend.ship.entity';
import { User } from 'src/user/entity/user.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, User]), UserModule],
  controllers: [FriendShipController],
  providers: [FriendShipService],
})
export class FriendShipModule {}
