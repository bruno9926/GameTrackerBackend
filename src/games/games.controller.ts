import { Body, Controller, Get, Post, ValidationPipe } from "@nestjs/common";
import { GamesService } from "./games.service";

import { CreateGameDto } from "./games-dto";

@Controller('games')
export class GamesController {
    constructor(private gamesService: GamesService) { }

    @Get()
    getAllGames() {
        return this.gamesService.getGames();
    }

    @Post()
    createGame(@Body() gameInput: CreateGameDto) {
        console.log(gameInput);
        return this.gamesService.createGame(gameInput);
    }
}