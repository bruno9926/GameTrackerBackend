import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException
} from '@nestjs/common';
import { GamesService } from './games.service';

import { CreateGameDto, UpdateGameDto } from './games-dto';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  private getUserIdFromRequest(req): string {
    const userId: string = req.user.id;
    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }
    return userId;
  }

  @Get()
  getAllGames(@Req() req) {
    const userId = this.getUserIdFromRequest(req);
    return this.gamesService.getGames(userId);
  }

  @Post()
  createGame(@Body() gameInput: CreateGameDto, @Req() req) {
    const userId = this.getUserIdFromRequest(req);
    return this.gamesService.createGame(userId, gameInput);
  }

  @Put()
  updateGame(@Body() gameInput: UpdateGameDto, @Req() req) {
    const userId = this.getUserIdFromRequest(req);
    return this.gamesService.updateGame(userId, gameInput);
  }

  @Delete(':id')
  deleteGame(@Param('id') id: string, @Req() req) {
    const userId = this.getUserIdFromRequest(req);
    return this.gamesService.deleteGame(userId, id);
  }
}
