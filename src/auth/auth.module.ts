import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities";

// services
import { AuthService, PasswordService } from "./services";
import { UsersService } from "src/users/users.service";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: "1d"
            }
        })
    ],
    controllers: [AuthController],
    providers: [AuthService, PasswordService, UsersService],
    exports: [JwtModule]
})
export class AuthModule {}