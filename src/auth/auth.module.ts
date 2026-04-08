import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";

// services
import { AuthService, PasswordService } from "./services";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [
        UsersModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: "1d"
                }
            })
        })
    ],
    controllers: [AuthController],
    providers: [AuthService, PasswordService],
    exports: [JwtModule]
})
export class AuthModule {}