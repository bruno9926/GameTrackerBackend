import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Game from './entities/Game.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    AuthModule
  ],
  controllers: [GamesController],
  providers: [GamesService]
})
export class GamesModule { }
