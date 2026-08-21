import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";
import { SessionService } from "../../security/services/session.service";
import { AuthCodeService, LoginResult } from "./auth-code.service";
import { GoogleUserInfo } from "../interfaces/google-user-info";
import { User } from "src/users/entities";

@Injectable()
export class GoogleAuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly sessionService: SessionService,
        private readonly configService: ConfigService,
        private readonly authCodeService: AuthCodeService
    ) { }

    /**
     * Authenticates a user via their Google identity, creating the account on first
     * sign-in. Rejects if that email already belongs to a non-Google account.
     */
    async loginWithGoogle(googleUser: GoogleUserInfo): Promise<string> {
        const { email, googleId } = googleUser;
        let user = await this.usersService.getUserByGoogleId(googleId);

        if (!user) {
            const existingUser = await this.usersService.getUserByEmail({ email });
            if (existingUser) {
                throw new BadRequestException("An account with this email already exists. Please log in with your password instead.");
            }

            user = await this.usersService.insertUser(
                await this.toUserFromGoogle(googleUser)
            );
        }

        const { token, refreshToken } = await this.sessionService.issueTokenPair(user);
        return this.authCodeService.issueCode({ token, refreshToken });
    }

    /** Redeems a Google sign-in code for the resulting access/refresh tokens. */
    exchangeGoogleCode(code: string): LoginResult {
        const result = this.authCodeService.exchangeCode(code);
        if (!result) {
            throw new BadRequestException("Invalid or expired code");
        }
        return result;
    }

    /** Builds the frontend URL a Google sign-in should redirect to, carrying the exchange code. */
    buildGoogleRedirectUrl(code: string): string {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        if (!frontendUrl) {
            throw new InternalServerErrorException('FRONTEND_URL is not configured');
        }
        return `${frontendUrl}/auth/callback?code=${code}`;
    }

    private toUserFromGoogle(googleUser: GoogleUserInfo): Promise<User> {
        return this.usersService.createUser({
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.avatarUrl,
            // the display name isn't guaranteed unique; the email already is
            username: googleUser.email,
            googleId: googleUser.googleId
        });
    }

}
