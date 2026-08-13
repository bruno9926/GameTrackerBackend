import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { SecurityModule } from "src/security/security.module";
import { PassportModule } from "@nestjs/passport";
// services
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GoogleAuthExceptionFilter } from "./filters/google-auth-exception.filter";

@Module({
    imports: [
        UsersModule,
        SecurityModule,
        PassportModule
    ],
    controllers: [AuthController],
    providers: [AuthService, GoogleStrategy, GoogleAuthExceptionFilter],
})
export class AuthModule {}