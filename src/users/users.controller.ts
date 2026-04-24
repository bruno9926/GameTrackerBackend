import {
  Body,
  Controller,
  Patch,
  Query,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { UsersService } from './users.service';
// guards
import { AuthGuard } from 'src/security/guards/auth.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService
  ) {}

  @Patch('me')
  async updateUserInfo() {
    return "hello";
  }
}
