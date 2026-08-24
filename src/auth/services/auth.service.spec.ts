import { AuthService } from "./auth.service";
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { SessionService } from "src/security/services/session.service";
import { GoogleAuthService } from "./google-auth.service";
import { PasswordAuthService } from "./password-auth.service";
import { EmailService } from "src/mailing/email.service";
import { User } from "src/users/entities";

describe('AuthService', () => {
    let service: AuthService;
    let usersServiceMock: Partial<jest.Mocked<UsersService>>;
    let sessionServiceMock: Partial<jest.Mocked<SessionService>>;

    beforeEach(async () => {
        // fresh mocks every test, so a mockResolvedValue/mockReturnValue set
        // in one test can never leak into the next
        usersServiceMock = {
            getUserById: jest.fn(),
            userExists: jest.fn(),
            createUser: jest.fn(),
            insertUser: jest.fn()
        };
        sessionServiceMock = {
            issueTokenPair: jest.fn(),
            verifyRefreshToken: jest.fn()
        }
        const UsersServiceMock = { provide: UsersService, useValue: usersServiceMock };
        const SessionServiceMock = { provide: SessionService, useValue: sessionServiceMock };
        const GoogleAuthServiceMock = { provide: GoogleAuthService, useValue: {} };
        const PasswordAuthServiceMock = { provide: PasswordAuthService, useValue: {} };
        const EmailServiceMock = { provide: EmailService, useValue: { sendVerificationCode: jest.fn() } };

        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthService, UsersServiceMock, SessionServiceMock, GoogleAuthServiceMock, PasswordAuthServiceMock, EmailServiceMock]
        }).compile();

        service = module.get<AuthService>(AuthService);
    })

    const existingUser = {
        id: 'user-id',
        email: 'jane@example.com',
        name: 'Jane Doe'
    } as User;

    it('refreshes tokens for an existing user', async () => {
        // GIVEN
        // a user previously created
        usersServiceMock.getUserById.mockResolvedValue(existingUser);
        // token verification
        sessionServiceMock.verifyRefreshToken.mockResolvedValue({ id: 'user-id' })
        // new token generation
        sessionServiceMock.issueTokenPair.mockResolvedValue({
            token: 'new_token',
            refreshToken: 'new_refresh_token'
        })

        const newTokens = await service.refreshToken('refresh_token');
        expect(newTokens.token).toBe('new_token');
        expect(newTokens.refreshToken).toBe('new_refresh_token');
    })

    it('rejects when the refresh token is invalid or expired', async () => {
        // GIVEN
        // a refresh token that fails verification
        sessionServiceMock.verifyRefreshToken.mockRejectedValue(new Error('jwt expired'));

        await expect(service.refreshToken('refresh_token')).rejects.toThrow(BadRequestException);
        expect(sessionServiceMock.issueTokenPair).not.toHaveBeenCalled();
    })

    it('rejects when the token payload no longer matches an existing user', async () => {
        // GIVEN
        // a validly-signed token whose user was since deleted
        sessionServiceMock.verifyRefreshToken.mockResolvedValue({ id: 'user-id' });
        usersServiceMock.getUserById.mockResolvedValue(null);

        await expect(service.refreshToken('refresh_token')).rejects.toThrow(BadRequestException);
        expect(sessionServiceMock.issueTokenPair).not.toHaveBeenCalled();
    })
})