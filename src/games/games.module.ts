import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Game from './entities/Game.entity';
import { IGDBModule } from 'src/igdb/igdb.module';
import { SecurityModule } from 'src/security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    SecurityModule,
    IGDBModule
  ],
  controllers: [GamesController],
  providers: [GamesService]
})
export class GamesModule { }
