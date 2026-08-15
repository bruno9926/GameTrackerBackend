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

    /** Issues a short-lived access token identifying this user. */
    generateAccessToken(user: User): Promise<string> {
        return this.jwtService.signAsync<JwtPayload>({ id: user.id });
    }

    /** Issues a long-lived refresh token identifying this user. */
    generateRefreshToken(user: User): Promise<string> {
        return this.jwtService.signAsync<JwtPayload>({ id: user.id }, {
            expiresIn: "7d",
            secret: this.configService.get<string>('JWT_REFRESH_SECRET')
        });
    }

    /** Validates a refresh token and returns the identity it carries. Rejects if invalid or expired. */
    verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET')
        });
    }

    /** Validates an access token and returns the identity it carries. Rejects if invalid or expired. */
    verifyAccessToken(accessToken: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync<JwtPayload>(accessToken);
    }
}
