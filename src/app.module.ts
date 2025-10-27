import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { GamesModule } from './games/games.module';
// typeOrm
import { TypeOrmModule } from '@nestjs/typeorm';
import Game from './games/entities/Game.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: 'localhost',
      port: 5432,
      username: 'tu_usuario',
      password: 'tu_contraseña',
      database: 'tu_base_de_datos',
      entities: [Game],
      synchronize: true,
    }),
    GamesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
