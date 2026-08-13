import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LogInDto, RegisterDto, RefreshDto } from "./dtos";
import { PasswordService } from "../security/services/password.service";
import { TokenService } from "../security/services/token.service";
import { UsersService } from "../users/users.service";

// entities
import { User } from "../users/entities";
import { GoogleUserInfo } from "./interfaces/google-user-info";

type LoginResult = {
    token: string;
    refreshToken: string;
};

@Injectable()
export class AuthService {
    constructor(
        private readonly passwordService: PasswordService,
        private readonly usersService: UsersService,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService
    ) { }

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

    async login(loginInput: LogInDto) {
        const { email, password: passwordInput } = loginInput;

        const user = await this.usersService.getUserByEmail({ email, withPassword: true });

        if (!user || !user.password) {
            throw new BadRequestException("Invalid email or password");
        }

        const isPasswordValid = await this.passwordService.comparePassword(passwordInput, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException("Invalid email or password");
        }

        return await this.loginUser(user);
    }

    async googleLogin(googleUser: GoogleUserInfo) {
        const email = googleUser.email;
        let user = await this.usersService.getUserByEmail({ email });

        if (!user) {
            user = await this.usersService.insertUser(
                await this.toUserFromGoogle(googleUser)
            );
        }
        return await this.loginUser(user)
    }

    async getUser(id: string): Promise<User> {
        return this.usersService.getUserById(id);
    }

    buildGoogleRedirectUrl({ token, refreshToken }: LoginResult): string {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        if (!frontendUrl) {
            throw new InternalServerErrorException('FRONTEND_URL is not configured');
        }
        return `${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`;
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = await this.tokenService.verifyRefreshToken(refreshToken);

            const user = await this.usersService.getUserById(payload.id);
            if (!user) {
                throw new BadRequestException("Invalid refresh token")
            }
            return {
                token: await this.tokenService.generateAccessToken(user),
                refreshToken: await this.tokenService.generateRefreshToken(user)
            }
        } catch {
            throw new BadRequestException("Invalid or expired refresh token");
        }
    }

    // utility methods

    private async loginUser(user: User) {
        const { password, ...userPublicData } = user;
        return {
            token: await this.tokenService.generateAccessToken(user),
            refreshToken: await this.tokenService.generateRefreshToken(user),
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
            username: googleUser.email
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