import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Game from './entities/Game.entity';
// middlewares
import { AuthMiddleware } from 'src/middlewares';

@Module({
  imports: [TypeOrmModule.forFeature([Game])],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
      consumer.apply(AuthMiddleware).forRoutes(GamesController);
  }
}
