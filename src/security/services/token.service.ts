import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { User } from "../../users/entities";

export type JwtPayload = { id: string };

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    generateAccessToken(user: User): Promise<string> {
        return this.jwtService.signAsync<JwtPayload>({ id: user.id });
    }

    generateRefreshToken(user: User): Promise<string> {
        return this.jwtService.signAsync<JwtPayload>({ id: user.id }, {
            expiresIn: "7d",
            secret: this.configService.get<string>('JWT_REFRESH_SECRET')
        });
    }

    verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET')
        });
    }

    verifyAccessToken(accessToken: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync<JwtPayload>(accessToken);
    }
}
