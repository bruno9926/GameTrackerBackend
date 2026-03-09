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

  async getGames(): Promise<Game[]> {
    return await this.gameRepository.find({
      where: {
        user: {
          id: "f2cf4587-7e37-487c-b20c-5bee1b3de17a",
        },
      },
    });
  }

  async createGame(gameInput: CreateGameDto): Promise<Game[]> {
    const game = this.gameRepository.create({ id: uuid(), ...gameInput }); // i think putting the id here is not necessary since it is generated automatically, but i will leave it for now
    await this.gameRepository.save(game);
    return this.getGames();
  }

  async deleteGame(id: string): Promise<Game[]> {
    await this.gameRepository.delete(id);
    return this.getGames();
  }

  async updateGame(gameInput: UpdateGameDto): Promise<Game[]> {
    const { id, ...updateData } = gameInput;
    await this.gameRepository.update(gameInput.id, updateData);
    return this.getGames();
  }
}
