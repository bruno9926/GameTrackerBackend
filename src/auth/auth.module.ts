import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { SecurityModule } from "src/security/security.module";
import { PassportModule } from "@nestjs/passport";
import { EmailModule } from "src/mailing/email.module";
// services
import { AuthService, AuthCodeService, GoogleAuthService, PasswordAuthService } from "./services";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GoogleAuthExceptionFilter } from "./filters/google-auth-exception.filter";

@Module({
    imports: [
        UsersModule,
        SecurityModule,
        PassportModule,
        EmailModule
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthCodeService, GoogleAuthService, PasswordAuthService, GoogleStrategy, GoogleAuthExceptionFilter],
})
export class AuthModule {}