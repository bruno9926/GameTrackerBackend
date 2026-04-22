import { IGDBController } from './igdb.controller';
import { IGDBService } from './igdb.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [IGDBController,],
  providers: [IGDBService],
  exports: [IGDBService]
})
export class IGDBModule { }
