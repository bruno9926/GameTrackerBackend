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
// decorators
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
// guards
import { AuthGuard } from 'src/security/guards/auth.guard';
import { CreateGameDto, UpdateGameDto, QueueMovementDto } from './games-dto';
import { IGDBService } from 'src/igdb/igdb.service';
import { GameQueueService, GamesService } from './services';

@Controller('games')
@UseGuards(AuthGuard)
export class GamesController {
  constructor(
    private gamesService: GamesService,
    private gameQueueService: GameQueueService,
    private igdbService: IGDBService
  ) { }

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

  @Delete('/queue')
  removeGameFromQueue(
    @Body('gameId') gameId: string,
    @CurrentUser("id") userId: string
  ) {
    return this.gameQueueService.removeFromQueue(userId, gameId);
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

  @Get('/gotw')
  getGameOfTheWeek(@CurrentUser("id") userId: string) {
    return this.gamesService.getGameOfTheWeek(userId);
  }

  @Get('/queue')
  getGamesInQueue(
    @CurrentUser("id") userId: string
  ) {
    return this.gameQueueService.getGamesInQueue(userId);
  }

  @Put('/queue')
  moveGameInQueue(
    @Body() queueMovementDto: QueueMovementDto,
    @CurrentUser("id") userId: string
  ) {
    return this.gameQueueService.moveGameInQueue(userId, queueMovementDto);
  }

  @Get(':gameTitleId')
  getGameDetails(
    @Param('gameTitleId') gameTitleId: string,
    @CurrentUser("id") userId: string
  ) {
    return this.gamesService.getGameDetails(userId, gameTitleId);
  }
}
