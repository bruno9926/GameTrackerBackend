import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { GamesService } from './games.service';

import { CreateGameDto, UpdateGameDto } from './games-dto';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get()
  getAllGames() {
    return this.gamesService.getGames();
  }

  @Post()
  createGame(@Body() gameInput: CreateGameDto) {
    return this.gamesService.createGame(gameInput);
  }

  @Put()
  updateGame(@Body() gameInput: UpdateGameDto) {
    return this.gamesService.updateGame(gameInput);
  }

  @Delete(':id')
  deleteGame(@Param('id') id: string) {
    return this.gamesService.deleteGame(id);
  }
}
