import { Module } from "@nestjs/common";

// services
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from "./guards/auth.guard";
import { PasswordService } from "./services/password.service";
import { TokenService } from "./services/token.service";

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_ACCESS_SECRET'),
                signOptions: {
                    expiresIn: "15m"
                }
            })
        })
    ],
    providers: [AuthGuard, PasswordService, TokenService],
    exports: [JwtModule, AuthGuard, PasswordService, TokenService]
})
export class SecurityModule {}