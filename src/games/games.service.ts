import { ConflictException, Injectable } from '@nestjs/common';
import Game from './entities/Game.entity';
import { GameOfTheWeek } from './entities';
import type CreateGameDto from './games-dto/create-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateGameDto } from './games-dto';
import { FriendsService } from 'src/friends/friends.service';
import { IGDBService } from 'src/igdb/igdb.service';
import { AppErrors } from 'src/errors/app-errors';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    private readonly friendsService: FriendsService,
    private readonly igdbService: IGDBService,
  ) { }

  async getGames(userId: string): Promise<Game[]> {
    return await this.gameRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  private async gameAlreadyCreated(userId: string, gameTitleId: string): Promise<boolean> {
    const game = await this.gameRepository.findOne({
      where: {
        user: { id: userId },
        gameTitleId
      }
    })
    return !!game;
  }

  async createGame(userId: string, gameInput: CreateGameDto): Promise<Game[]> {
    const alreadyCreated = await this.gameAlreadyCreated(userId, gameInput.gameTitleId);
    if (alreadyCreated) {
      throw new ConflictException(AppErrors.GAME_ALREADY_EXISTS);
    }
    const game = this.gameRepository.create({ ...gameInput, user: { id: userId } });
    await this.gameRepository.save(game);
    return this.getGames(userId);
  }

  async deleteGame(userId: string, gameId: string): Promise<Game[]> {
    await this.gameRepository.delete({ id: gameId, user: { id: userId } });
    return this.getGames(userId);
  }

  async updateGame(userId: string, gameInput: UpdateGameDto): Promise<Game[]> {
    const { id, ...updateData } = gameInput;
    await this.gameRepository.update({ id, user: { id: userId } }, updateData);
    return this.getGames(userId);
  }

  async getGameOfTheWeek(userId: string): Promise<GameOfTheWeek | null> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const topGame = await this.gameRepository
      .createQueryBuilder('game')
      .select('game.gameTitleId', 'gameTitleId')
      .addSelect('game.name', 'name')
      .addSelect('COUNT(*)', 'addings')
      .where('game.createdAt >= :weekAgo', { weekAgo })
      .groupBy('game.gameTitleId')
      .addGroupBy('game.name')
      .orderBy('addings', 'DESC')
      .limit(1)
      .getRawOne();

    if (!topGame) return null;

    const usersPlaying = await this.gameRepository.count({
      where: { gameTitleId: topGame.gameTitleId }
    });

    const friendsPlaying = await this.friendsService.countFriendsPlayingGameTitle(userId, topGame.gameTitleId);
    const coverUrl = await this.fetchCoverUrl(topGame.gameTitleId);

    return {
      gameTitleId: topGame.gameTitleId,
      name: topGame.name,
      coverUrl,
      usersPlaying,
      friendsPlaying,
    };
  }

  private async fetchCoverUrl(gameTitleId: string | null): Promise<string | null> {
    if (!gameTitleId) return null;
    // fetch both in parallel and pick randomly for variety
    const [artwork, screenshot] = await Promise.all([
      this.igdbService.getArtworkUrl(gameTitleId),
      this.igdbService.getScreenshotUrl(gameTitleId),
    ]);
    const options = [artwork, screenshot].filter(Boolean);
    if (!options.length) return null;
    return options[Math.floor(Math.random() * options.length)];
  }
}
