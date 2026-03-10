import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities";
// services
import { AuthService, PasswordService } from "./services";
import { AuthMiddleware } from "src/middlewares";
import { UsersService } from "src/users/users.service";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [AuthController],
    providers: [AuthService, PasswordService, UsersService],
})
export class AuthModule implements NestModule{
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes('auth/me');
    }
}