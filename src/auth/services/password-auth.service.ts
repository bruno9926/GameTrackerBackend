import { Injectable, BadRequestException } from "@nestjs/common";
import { LogInDto, RegisterDto } from "../dtos";
import { PasswordService } from "../../security/services/password.service";
import { SessionService } from "../../security/services/session.service";
import { UsersService } from "../../users/users.service";
import { User } from "../../users/entities";

@Injectable()
export class PasswordAuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly passwordService: PasswordService,
        private readonly sessionService: SessionService
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

        const { password, ...userPublicData } = user;
        const { token, refreshToken } = await this.sessionService.issueTokenPair(user);
        return { token, refreshToken, user: userPublicData };
    }

    // mappers

    private toUserFromRegister(registerInput: RegisterDto): Promise<User> {
        return this.usersService.createUser({
            name: registerInput.name,
            username: registerInput.username,
            email: registerInput.email,
            password: registerInput.password
        });
    }
}
