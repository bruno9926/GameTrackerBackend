import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { FriendCodeService } from './friend-code.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities';
import { UsersController } from './users.controller';
import { SecurityModule } from 'src/security/security.module';
import { SupabaseStorageService } from './supabase.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        SecurityModule
    ],
    controllers: [UsersController],
    providers: [UsersService, SupabaseStorageService, FriendCodeService],
    exports: [UsersService, FriendCodeService]
})
export class UsersModule {}