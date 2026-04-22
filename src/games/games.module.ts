import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Game from './entities/Game.entity';
import { AuthModule } from 'src/auth/auth.module';
import { IGDBModule } from 'src/igdb/igdb.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    AuthModule,
    IGDBModule
  ],
  controllers: [GamesController],
  providers: [GamesService]
})
export class GamesModule { }
