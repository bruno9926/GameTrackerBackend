import { Injectable } from '@nestjs/common';
import Game from './entities/Game.entity';
import type CreateGameDto from './games-dto/create-game.dto';
import { v4 as uuid } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateGameDto } from './games-dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  async getGames(userId: string): Promise<Game[]> {
    return await this.gameRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  async createGame(userId: string, gameInput: CreateGameDto): Promise<Game[]> {
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
