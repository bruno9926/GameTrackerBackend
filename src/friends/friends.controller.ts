import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { SendRequestDto } from './dtos';
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

  @Post('requests')
  sendRequest(@CurrentUser("id") userId, @Body() { receiverId }: SendRequestDto) {
    return this.friendsService.sendRequest(userId, receiverId);
  }

  @Get('requests')
  getRequests(@CurrentUser("id") userId) {
    return this.friendsService.getRequests(userId);
  }

  @Patch('requests/:id/accept')
  acceptRequest(@Param('id') id: string, @CurrentUser("id") userId) {
    return this.friendsService.acceptRequest(id, userId);
  }

  @Patch('requests/:id/reject')
  rejectRequest(@Param('id') id: string, @CurrentUser("id") userId) {
    return this.friendsService.rejectRequest(id, userId);
  }
}
