import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { GamesService } from './games.service';
// decorators
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
// guards
import { AuthGuard } from 'src/security/guards/auth.guard';
import { CreateGameDto, UpdateGameDto } from './games-dto';
import { IGDBService } from 'src/igdb/igdb.service';

@Controller('games')
@UseGuards(AuthGuard)
export class GamesController {
  constructor(
    private gamesService: GamesService,
    private igdbService: IGDBService
  ) {}

  @Get()
  getAllGames(@CurrentUser("id") userId: string) {
    return this.gamesService.getGames(userId);
  }

  @Post()
  createGame(
    @Body() gameInput: CreateGameDto,
    @CurrentUser("id") userId: string
  ) {
    return this.gamesService.createGame(userId, gameInput);
  }

  @Put()
  updateGame(
    @Body() gameInput: UpdateGameDto,
    @CurrentUser("id") userId: string
  ) {
    return this.gamesService.updateGame(userId, gameInput);
  }

  @Delete(':id')
  deleteGame(
    @Param('id') id: string,
    @CurrentUser("id") userId: string
  ) {
    return this.gamesService.deleteGame(userId, id);
  }

  @Get('/search')
  searchTitle(@Query('q') searchString: string) {
    return this.igdbService.search(searchString);
  }
}
