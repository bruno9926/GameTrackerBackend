import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { UsersService } from '../../users/users.service';
import { SessionService } from '../../security/services/session.service';
import { AuthCodeService, LoginResult } from './auth-code.service';
import { GoogleUserInfo } from '../interfaces/google-user-info';
import { User } from '../../users/entities';

describe('GoogleAuthService', () => {
    let service: GoogleAuthService;
    let usersServiceMock: Partial<jest.Mocked<UsersService>>;
    let sessionServiceMock: Partial<jest.Mocked<SessionService>>;
    let configServiceMock: Partial<jest.Mocked<ConfigService>>;
    // real, not mocked — cheap (no deps, in-memory) and its own contract is
    // already covered by auth-code.service.spec.ts, so we let it run for real
    // and observe actual round-trip behavior instead of mocking its shape
    let authCodeService: AuthCodeService;

    beforeEach(async () => {
        // fresh mocks every test, so a mockResolvedValue/mockReturnValue set
        // in one test can never leak into the next
        usersServiceMock = {
            getUserByGoogleId: jest.fn(),
            getUserByEmail: jest.fn(),
            createUser: jest.fn(),
            insertUser: jest.fn()
        };
        sessionServiceMock = {
            issueTokenPair: jest.fn()
        };
        configServiceMock = {
            get: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GoogleAuthService,
                AuthCodeService,
                { provide: UsersService, useValue: usersServiceMock },
                { provide: SessionService, useValue: sessionServiceMock },
                { provide: ConfigService, useValue: configServiceMock }
            ]
        }).compile();

        service = module.get<GoogleAuthService>(GoogleAuthService);
        authCodeService = module.get<AuthCodeService>(AuthCodeService);
    });

    describe('loginWithGoogle', () => {
        const googleUser: GoogleUserInfo = {
            email: 'jane@example.com',
            name: 'Jane Doe',
            googleId: 'google-id'
        };

        // sets up the token-issuance happy path (session tokens),
        // so individual tests only need to override what's relevant to their case
        function mockSuccessfulTokenIssuance() {
            sessionServiceMock.issueTokenPair!.mockResolvedValue({
                token: 'access-token',
                refreshToken: 'refresh-token'
            });
        }

        it('logs in an existing Google-linked user without creating a new account', async () => {
            // GIVEN
            // Existing Google-linked user
            const existingUser = { id: 'user-id', ...googleUser } as User;
            usersServiceMock.getUserByGoogleId!.mockResolvedValue(existingUser);
            mockSuccessfulTokenIssuance();

            const code = await service.loginWithGoogle(googleUser);

            expect(usersServiceMock.insertUser).not.toHaveBeenCalled();
            // session got stored and ready to redeem
            expect(authCodeService.exchangeCode(code)).toEqual({
                token: 'access-token',
                refreshToken: 'refresh-token'
            });
        });

        it('creates a new account on first Google sign-in', async () => {
            // GIVEN
            // no previous user created
            usersServiceMock.getUserByGoogleId!.mockResolvedValue(null);
            usersServiceMock.getUserByEmail!.mockResolvedValue(null);

            // factory and repository behaviour
            const builtUser = { ...googleUser } as User;
            usersServiceMock.createUser!.mockResolvedValue(builtUser);
            const savedUser = { id: 'user-id', ...builtUser } as User;
            usersServiceMock.insertUser!.mockResolvedValue(savedUser);

            mockSuccessfulTokenIssuance();

            await expect(service.loginWithGoogle(googleUser)).resolves.toEqual(expect.any(String));
            expect(usersServiceMock.insertUser).toHaveBeenCalledWith(builtUser);
        });

        it('rejects when the email already belongs to a non-Google account', async () => {
            // GIVEN
            // an account already exists with this email, but isn't linked to Google
            const existingUser = { id: 'user-id', email: googleUser.email } as User;
            usersServiceMock.getUserByGoogleId!.mockResolvedValue(null);
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);

            await expect(service.loginWithGoogle(googleUser)).rejects.toThrow(BadRequestException);
            expect(usersServiceMock.insertUser).not.toHaveBeenCalled();
        });
    });

    describe('exchangeGoogleCode', () => {
        it('returns the tokens for a valid code', () => {
            // GIVEN
            // a code that was issued and hasn't been redeemed yet
            const result: LoginResult = { token: 'access-token', refreshToken: 'refresh-token' };
            const code = authCodeService.issueCode(result);

            expect(service.exchangeGoogleCode(code)).toEqual(result);
        });

        it('rejects an invalid or expired code', () => {
            // GIVEN
            // a code that was never issued
            expect(() => service.exchangeGoogleCode('unknown-code')).toThrow(BadRequestException);
        });
    });

    describe('buildGoogleRedirectUrl', () => {
        it('builds the frontend callback url with the code', () => {
            // GIVEN
            // a configured frontend origin
            const frontendUrl = 'https://frontend.com';
            configServiceMock.get!.mockReturnValue(frontendUrl);

            const redirectUrl = service.buildGoogleRedirectUrl('login-code');

            expect(redirectUrl).toBe(`${frontendUrl}/auth/callback?code=login-code`);
        });
    });
});
