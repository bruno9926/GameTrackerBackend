import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities";
// services
import { AuthService, PasswordService } from "./services";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [AuthController],
    providers: [AuthService, PasswordService],
})
export class AuthModule {}