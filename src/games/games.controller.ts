import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { GamesService } from './games.service';
// decorators
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
// guards
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateGameDto, UpdateGameDto } from './games-dto';


@Controller('games')
@UseGuards(AuthGuard)
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
}
