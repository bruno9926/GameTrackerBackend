import { ConflictException, Injectable } from '@nestjs/common';
import Game from './entities/Game.entity';
import type CreateGameDto from './games-dto/create-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateGameDto } from './games-dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
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
      throw new ConflictException({
        message: 'Game already exists for this user',
        code: 'GAME_ALREADY_EXISTS',
      });
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
}
