import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { SecurityModule } from 'src/security/security.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import Friendship from './entities/Friendship.entity';
import FriendRequest from './entities/FriendRequest.entity';
import { UsersModule } from 'src/users/users.module';
import { PresenceModule } from 'src/presence/presence.module';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, FriendRequest]), SecurityModule, UsersModule, PresenceModule],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
