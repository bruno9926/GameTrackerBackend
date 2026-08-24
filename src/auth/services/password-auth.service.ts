import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { LogInDto, RegisterDto } from "../dtos";
import { PasswordService } from "../../security/services/password.service";
import { SessionService } from "../../security/services/session.service";
import { UsersService } from "../../users/users.service";
import { User } from "../../users/entities";
import { PublicUserData } from "../../users/interfaces/public-user-data";
import { EmailVerificationCode, generateVerificationCode, isVerificationCodeValid } from "./email-verification-code.util";
import { AppErrors } from "../../errors/app-errors";

export type RegisterResult = {
    user: PublicUserData;
    verificationCode?: string;
};

@Injectable()
export class PasswordAuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly passwordService: PasswordService,
        private readonly sessionService: SessionService
    ) { }

    /** Creates a new account from email/password credentials. Rejects if the email is already taken. */
    async registerUser(registerInput: RegisterDto): Promise<RegisterResult> {
        const userExists = await this.usersService.userExists(registerInput.email);
        if (userExists) {
            throw new BadRequestException("User with this email already exists");
        }

        const userToRegister = await this.toUserFromRegister(registerInput);
        const savedUser = await this.usersService.insertUser(userToRegister);

        return {
            user: this.usersService.toPublicUserData(savedUser),
            verificationCode: userToRegister.emailVerificationCode ?? undefined
        };
    }

    /** Confirms a user owns the email they registered with. Rejects on an invalid or expired code. */
    async verifyEmail(code: string, email: string): Promise<void> {
        const user = await this.usersService.getUserByEmail({ email, withEmailVerification: true });
        // validate user exists
        if (!user) {
            throw new BadRequestException("Invalid email or verification code");
        }
        // already verified — nothing to do
        if (user.isEmailVerified) {
            return;
        }
        // validate verification code fields are not null
        if (!user.emailVerificationCode || !user.emailVerificationCodeExpiresAt) {
            throw new InternalServerErrorException("missing verification information")
        }
        const storedCode = {
            code: user.emailVerificationCode,
            expiresAt: user.emailVerificationCodeExpiresAt
        } as EmailVerificationCode;

        if (!isVerificationCodeValid(code, storedCode)) {
            throw new BadRequestException("Invalid email or verification code");
        }

        await this.usersService.markEmailAsVerified(user.id);
    }

    /** Issues a new verification code for an unverified account. Rejects if there's nothing to (re)verify. */
    async regenerateVerificationCode(email: string): Promise<string> {
        const user = await this.usersService.getUserByEmail({ email });
        if (!user || user.isEmailVerified) {
            throw new BadRequestException("Unable to resend verification code");
        }

        const { code, expiresAt } = generateVerificationCode();
        await this.usersService.setEmailVerificationCode(user.id, code, expiresAt);

        return code;
    }

    /** Authenticates a user by email/password and issues fresh tokens. Rejects on invalid credentials. */
    async loginWithPassword(loginInput: LogInDto) {
        const { email, password: passwordInput } = loginInput;
        const user = await this.usersService.getUserByEmail({ email, withPassword: true });

        // validate user exists
        if (!user || !user.password) {
            throw new BadRequestException("Invalid email or password");
        }
        // validate password is valid
        const isPasswordValid = await this.passwordService.comparePassword(passwordInput, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException("Invalid email or password");
        }
        // validate email has been verified
        if (!user.isEmailVerified) {
            throw new BadRequestException(AppErrors.EMAIL_NOT_VERIFIED);
        }

        const { token, refreshToken } = await this.sessionService.issueTokenPair(user);
        return { token, refreshToken, user: this.usersService.toPublicUserData(user) };
    }

    // mappers

    private toUserFromRegister(registerInput: RegisterDto): Promise<User> {
        const { code, expiresAt } = generateVerificationCode();
        return this.usersService.createUser({
            name: registerInput.name,
            username: registerInput.username,
            email: registerInput.email,
            password: registerInput.password,
            isEmailVerified: false,
            emailVerificationCode: code,
            emailVerificationCodeExpiresAt: expiresAt
        });
    }
}
