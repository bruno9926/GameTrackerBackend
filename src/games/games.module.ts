import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Game from './entities/Game.entity';
import { IGDBModule } from 'src/igdb/igdb.module';
import { SecurityModule } from 'src/security/security.module';
import { FriendsModule } from 'src/friends/friends.module';
import { GameQueueService, GamesService } from './services';
import GameQueueEntry from './entities/GameQueueEntry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, GameQueueEntry]),
    SecurityModule,
    IGDBModule,
    FriendsModule,
  ],
  controllers: [GamesController],
  providers: [GamesService, GameQueueService]
})
export class GamesModule { }
