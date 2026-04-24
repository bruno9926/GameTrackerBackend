import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
// services
import { AuthService, PasswordService } from "./services";
import { SecurityModule } from "src/security/security.module";

@Module({
    imports: [
        UsersModule,
        SecurityModule
    ],
    controllers: [AuthController],
    providers: [AuthService, PasswordService],
})
export class AuthModule {}