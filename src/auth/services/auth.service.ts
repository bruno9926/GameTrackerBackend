import { Injectable, BadRequestException } from "@nestjs/common";
import { LogInDto, RegisterDto, RefreshDto } from "../dtos";
import { SessionService } from "../../security/services/session.service";
import { UsersService } from "../../users/users.service";
import { LoginResult } from "./auth-code.service";
import { GoogleAuthService } from "./google-auth.service";
import { PasswordAuthService } from "./password-auth.service";

// entities
import { User } from "../../users/entities";
import { GoogleUserInfo } from "../interfaces/google-user-info";

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly sessionService: SessionService,
        private readonly googleAuthService: GoogleAuthService,
        private readonly passwordAuthService: PasswordAuthService
    ) { }

    /** Retrieves a user's profile by id. */
    async getUser(id: string): Promise<User> {
        return this.usersService.getUserById(id);
    }

    // password auth

    /** Creates a new account from email/password credentials. Rejects if the email is already taken. */
    async registerUser(registerInput: RegisterDto): Promise<Partial<User>> {
        return this.passwordAuthService.registerUser(registerInput);
    }

    /** Authenticates a user by email/password and issues fresh tokens. Rejects on invalid credentials. */
    async loginWithPassword(loginInput: LogInDto) {
        return this.passwordAuthService.loginWithPassword(loginInput);
    }

    // google auth

    /**
     * Authenticates a user via their Google identity, creating the account on first
     * sign-in. Rejects if that email already belongs to a non-Google account.
     */
    async loginWithGoogle(googleUser: GoogleUserInfo): Promise<string> {
        return this.googleAuthService.loginWithGoogle(googleUser);
    }

    /** Redeems a Google sign-in code for the resulting access/refresh tokens. */
    exchangeGoogleCode(code: string): LoginResult {
        return this.googleAuthService.exchangeGoogleCode(code);
    }

    /** Builds the frontend URL a Google sign-in should redirect to, carrying the exchange code. */
    buildGoogleRedirectUrl(code: string): string {
        return this.googleAuthService.buildGoogleRedirectUrl(code);
    }

    // session lifecycle

    /** Issues a fresh pair of tokens from a valid refresh token. Rejects if it's invalid or expired. */
    async refreshToken(refreshToken: string) {
        try {
            const payload = await this.sessionService.verifyRefreshToken(refreshToken);

            const user = await this.usersService.getUserById(payload.id);
            if (!user) {
                throw new BadRequestException("Invalid refresh token")
            }
            return await this.sessionService.issueTokenPair(user);
        } catch {
            throw new BadRequestException("Invalid or expired refresh token");
        }
    }
}