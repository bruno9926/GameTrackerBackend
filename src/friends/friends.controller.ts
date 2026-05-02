import { Controller, Get, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AuthGuard } from 'src/security/guards/auth.guard';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';

@Controller('friends')
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Get()
  getFriends(@CurrentUser("id") userId) {
    return this.friendsService.getFriends(userId);
  }
}
