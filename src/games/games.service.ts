import { Injectable } from '@nestjs/common';
import type Game from './types/Game';
import type CreateGameDto from './games-dto/create-game.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class GamesService {
  games: Game[] = [
    { id: uuid(), name: 'Hollow Knight: Silksong', status: 'playing' },
    { id: uuid(), name: 'Final Fantasy 7 Rebirth', status: 'completed' },
    { id: uuid(), name: 'Yakuza 0', status: 'paused' },
    {
      id: uuid(),
      name: 'The Legend of Zelda: Echoes of Wisdom',
      status: 'paused',
    },
    {
      id: uuid(),
      name: 'Metal Gear Solid Delta: Snake Eater',
      status: 'playing',
    },
  ];

  async getGames(): Promise<Game[]> {
    return this.games;
  }

  async createGame(gameInput: CreateGameDto): Promise<Game[]> {
    this.games.push({ id: uuid(), ...gameInput });
    return this.getGames();
  }

  async deleteGame(id: string): Promise<Game[]> {
    this.games = this.games.filter((game) => game.id !== id);
    return this.getGames();
  }

  async updateGame(gameInput: CreateGameDto): Promise<Game[]> {
    this.games = this.games.map((game) =>
      game.id === gameInput.id ? { ...game, ...gameInput } : game,
    );
    return this.getGames();
  }
}
