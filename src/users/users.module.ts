import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities';
import { UsersController } from './users.controller';
import { SecurityModule } from 'src/security/security.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        SecurityModule
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService]
})
export class UsersModule {}