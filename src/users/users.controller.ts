import {
  Body,
  Controller,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { UpdatePasswordDto, UpdateUserDto } from './dtos';
// guards
import { AuthGuard } from 'src/security/guards/auth.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService
  ) {}

  @Patch('me')
  async updateUserInfo(
    @CurrentUser("id") userId: string,
    @Body() userInfo: UpdateUserDto
  ) {
    return this.usersService.updateUserInfo(userId, userInfo);
  }

  @Patch('password')
  async updatePassword(
    @CurrentUser("id") userId: string,
    @Body() passwordChange: UpdatePasswordDto
  ) {
    return this.usersService.updatePassword(passwordChange, userId);
  }
}
