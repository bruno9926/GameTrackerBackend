import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from "@nestjs/config";
import { GoogleUserInfo } from "../interfaces/google-user-info";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile']
        })
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile
    ): Promise<GoogleUserInfo> {
        const email = profile.emails[0]?.value;
        if (!email) {
            throw new UnauthorizedException('Google account has no email available');
        }

        return {
            email,
            name: profile.displayName,
            avatarUrl: profile.photos[0]?.value,
            googleId: profile.id
        }
    }
}
