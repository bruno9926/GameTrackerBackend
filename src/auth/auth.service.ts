import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LogInDto, RegisterDto, RefreshDto } from "./dtos";
import { PasswordService } from "../security/services/password.service";
import { SessionService } from "../security/services/session.service";
import { UsersService } from "../users/users.service";
import { AuthCodeService, LoginResult } from "./auth-code.service";

// entities
import { User } from "../users/entities";
import { GoogleUserInfo } from "./interfaces/google-user-info";

@Injectable()
export class AuthService {
    constructor(
        private readonly passwordService: PasswordService,
        private readonly usersService: UsersService,
        private readonly sessionService: SessionService,
        private readonly configService: ConfigService,
        private readonly authCodeService: AuthCodeService
    ) { }

    /** Creates a new account from email/password credentials. Rejects if the email is already taken. */
    async registerUser(registerInput: RegisterDto): Promise<Partial<User>> {
        const userExists = await this.usersService.userExists(registerInput.email);
        if (userExists) {
            throw new BadRequestException("User with this email already exists");
        }

        const savedUser = await this.usersService.insertUser(
            await this.toUserFromRegister(registerInput)
        );
        return {
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
        };
    }

    /** Authenticates a user by email/password and issues fresh tokens. Rejects on invalid credentials. */
    async loginWithPassword(loginInput: LogInDto) {
        const { email, password: passwordInput } = loginInput;

        const user = await this.usersService.getUserByEmail({ email, withPassword: true });

        if (!user || !user.password) {
            throw new BadRequestException("Invalid email or password");
        }

        const isPasswordValid = await this.passwordService.comparePassword(passwordInput, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException("Invalid email or password");
        }

        return await this.issueSession(user);
    }

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

        const { token, refreshToken } = await this.issueSession(user);
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

    /** Retrieves a user's profile by id. */
    async getUser(id: string): Promise<User> {
        return this.usersService.getUserById(id);
    }

    /** Builds the frontend URL a Google sign-in should redirect to, carrying the exchange code. */
    buildGoogleRedirectUrl(code: string): string {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        if (!frontendUrl) {
            throw new InternalServerErrorException('FRONTEND_URL is not configured');
        }
        return `${frontendUrl}/auth/callback?code=${code}`;
    }

    /** Issues a fresh pair of tokens from a valid refresh token. Rejects if it's invalid or expired. */
    async refreshToken(refreshToken: string) {
        try {
            const payload = await this.sessionService.verifyRefreshToken(refreshToken);

            const user = await this.usersService.getUserById(payload.id);
            if (!user) {
                throw new BadRequestException("Invalid refresh token")
            }
            return {
                token: await this.sessionService.generateAccessToken(user),
                refreshToken: await this.sessionService.generateRefreshToken(user)
            }
        } catch {
            throw new BadRequestException("Invalid or expired refresh token");
        }
    }

    // utility methods

    private async issueSession(user: User) {
        const { password, ...userPublicData } = user;
        return {
            token: await this.sessionService.generateAccessToken(user),
            refreshToken: await this.sessionService.generateRefreshToken(user),
            user: userPublicData
        }
    }

    // mappers
    
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

    private toUserFromRegister(registerInput: RegisterDto): Promise<User> {
        return this.usersService.createUser({
            name: registerInput.name,
            username: registerInput.username,
            email: registerInput.email,
            password: registerInput.password
        });
    }
} 