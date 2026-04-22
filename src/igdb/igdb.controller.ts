import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { IGDBService } from './igdb.service';

@Controller('igdb')
export class IGDBController {
  constructor(private readonly igdbService: IGDBService) {}

  @Get('/access_token')
  testAuth() {
    return this.igdbService.getAccessToken();
  }
}
