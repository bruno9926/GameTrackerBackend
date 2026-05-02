import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { SecurityModule } from 'src/security/security.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import Friendship from './entities/Friendship.entity';
import { User } from 'src/users/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship]), SecurityModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
