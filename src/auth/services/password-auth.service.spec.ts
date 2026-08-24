import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PasswordAuthService } from './password-auth.service';
import { UsersService } from '../../users/users.service';
import { PasswordService } from '../../security/services/password.service';
import { SessionService } from '../../security/services/session.service';
import LogInDto from '../dtos/login.dto';
import RegisterDto from '../dtos/register.dto';
import { User } from '../../users/entities';
import { generateVerificationCode } from './email-verification-code.util';

describe('PasswordAuthService', () => {
    let service: PasswordAuthService;
    let usersServiceMock: Partial<jest.Mocked<UsersService>>;
    let passwordServiceMock: Partial<jest.Mocked<PasswordService>>;
    let sessionServiceMock: Partial<jest.Mocked<SessionService>>;

    beforeEach(async () => {
        // fresh mocks every test, so a mockResolvedValue/mockReturnValue set
        // in one test can never leak into the next
        usersServiceMock = {
            userExists: jest.fn(),
            getUserByEmail: jest.fn(),
            createUser: jest.fn(),
            insertUser: jest.fn(),
            toPublicUserData: jest.fn(),
            markEmailAsVerified: jest.fn(),
            setEmailVerificationCode: jest.fn()
        };
        passwordServiceMock = {
            hashPassword: jest.fn(),
            comparePassword: jest.fn()
        };
        sessionServiceMock = {
            issueTokenPair: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PasswordAuthService,
                { provide: UsersService, useValue: usersServiceMock },
                { provide: PasswordService, useValue: passwordServiceMock },
                { provide: SessionService, useValue: sessionServiceMock }
            ]
        }).compile();

        service = module.get<PasswordAuthService>(PasswordAuthService);
    });

    describe('registerUser', () => {
        const registerInput: RegisterDto = {
            name: 'Jane Doe',
            username: 'janedoe',
            email: 'jane@example.com',
            password: 'my_password'
        };

        it('throws when the user already exists', async () => {
            // GIVEN
            // an account already exists with this email
            usersServiceMock.userExists!.mockResolvedValue(true);

            await expect(service.registerUser(registerInput)).rejects.toThrow(BadRequestException);
            expect(usersServiceMock.insertUser).not.toHaveBeenCalled();
        });

        it('creates new user upon registration', async () => {
            // GIVEN
            // no previous user with this email
            usersServiceMock.userExists!.mockResolvedValue(false);

            // factory and repository behaviour
            // emailVerificationCode is select:false, so a real save() wouldn't return it —
            // savedUser deliberately omits it to mirror that
            const builtUser = { name: registerInput.name, email: registerInput.email, emailVerificationCode: '123456' } as User;
            usersServiceMock.createUser!.mockResolvedValue(builtUser);
            const savedUser = { id: 'user-id', name: builtUser.name, email: builtUser.email } as User;
            usersServiceMock.insertUser!.mockResolvedValue(savedUser);

            const publicUser = { id: savedUser.id, name: registerInput.name, email: registerInput.email } as User;
            usersServiceMock.toPublicUserData!.mockReturnValue(publicUser);

            await expect(service.registerUser(registerInput)).resolves.toEqual({
                user: publicUser,
                verificationCode: builtUser.emailVerificationCode
            });
            expect(usersServiceMock.insertUser).toHaveBeenCalledWith(builtUser);
        });

        it('requires the new account to verify its email before use', async () => {
            // GIVEN
            // no previous user with this email
            usersServiceMock.userExists!.mockResolvedValue(false);
            usersServiceMock.createUser!.mockResolvedValue({} as User);
            usersServiceMock.insertUser!.mockResolvedValue({} as User);

            await service.registerUser(registerInput);

            expect(usersServiceMock.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    isEmailVerified: false,
                    emailVerificationCode: expect.stringMatching(/^\d{6}$/),
                    emailVerificationCodeExpiresAt: expect.any(Date)
                })
            );
        });
    });

    describe('verifyEmail', () => {

        afterEach(() => {
            jest.useRealTimers();
        })

        it('throws when trying to verify a non existent user', async () => {
            // GIVEN
            // no account registered under this email
            usersServiceMock.getUserByEmail!.mockResolvedValue(null);

            await expect(service.verifyEmail('000000', 'some@email.com')).rejects.toThrow(BadRequestException);
        });

        it('throws when verification code has expired', async () => {
            // GIVEN
            // a verification code
            const verificationCode = generateVerificationCode();

            // a user with an unverified email
            const existingUser = {
                id: 'user-id',
                email: 'jane@example.com',
                password: 'hashed-password',
                isEmailVerified: false,
                emailVerificationCode: verificationCode.code,
                emailVerificationCodeExpiresAt: verificationCode.expiresAt
            } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);

            // and an expired token (we expect 15 minutes TTL)
            jest.useFakeTimers();
            jest.advanceTimersByTime(15 * 60_000 + 1);

            await expect(service.verifyEmail(verificationCode.code, existingUser.email)).rejects.toThrow(BadRequestException);
        });

        it('throws when the submitted code does not match the stored one', async () => {
            // GIVEN
            // a user with an unverified email and a valid, unexpired code
            const verificationCode = generateVerificationCode();
            const existingUser = {
                id: 'user-id',
                email: 'jane@example.com',
                password: 'hashed-password',
                isEmailVerified: false,
                emailVerificationCode: verificationCode.code,
                emailVerificationCodeExpiresAt: verificationCode.expiresAt
            } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);

            // and a submitted code guaranteed to differ from the stored one
            const wrongCode = String((Number(verificationCode.code) + 1) % 1_000_000).padStart(6, '0');

            await expect(service.verifyEmail(wrongCode, existingUser.email)).rejects.toThrow(BadRequestException);
            expect(usersServiceMock.markEmailAsVerified).not.toHaveBeenCalled();
        });

        it('successfully verify an email', async () => {
            // GIVEN
             // a verification code
            const verificationCode = generateVerificationCode();

            // a user with an unverified email
            const existingUser = {
                id: 'user-id',
                email: 'jane@example.com',
                password: 'hashed-password',
                isEmailVerified: false,
                emailVerificationCode: verificationCode.code,
                emailVerificationCodeExpiresAt: verificationCode.expiresAt
            } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);

            await expect(service.verifyEmail(verificationCode.code, existingUser.email)).resolves.toBeUndefined();
            expect(usersServiceMock.markEmailAsVerified).toHaveBeenCalledWith(existingUser.id);
        });

        it('does nothing when the email is already verified', async () => {
            // GIVEN
            // an account that's already verified
            const existingUser = {
                id: 'user-id',
                email: 'jane@example.com',
                isEmailVerified: true
            } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);

            await expect(service.verifyEmail('000000', existingUser.email)).resolves.toBeUndefined();
            expect(usersServiceMock.markEmailAsVerified).not.toHaveBeenCalled();
        });

        it('throws when an unverified account is missing its verification code', async () => {
            // GIVEN
            // an inconsistent account: not verified, but with no code stored
            // (shouldn't happen in practice, but nothing at the DB level forbids it)
            const existingUser = {
                id: 'user-id',
                email: 'jane@example.com',
                isEmailVerified: false,
                emailVerificationCode: null,
                emailVerificationCodeExpiresAt: null
            } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);

            await expect(service.verifyEmail('000000', existingUser.email)).rejects.toThrow(InternalServerErrorException);
        });
    })

    describe('regenerateVerificationCode', () => {
        it('throws when trying to resend a code to a non existent user', async () => {
            // GIVEN
            // no account registered under this email
            usersServiceMock.getUserByEmail!.mockResolvedValue(null);

            await expect(service.regenerateVerificationCode('some@email.com')).rejects.toThrow(BadRequestException);
            expect(usersServiceMock.setEmailVerificationCode).not.toHaveBeenCalled();
        });

        it('throws when the account is already verified', async () => {
            // GIVEN
            // an account that's already verified
            const existingUser = {
                id: 'user-id',
                email: 'jane@example.com',
                isEmailVerified: true
            } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);

            await expect(service.regenerateVerificationCode(existingUser.email)).rejects.toThrow(BadRequestException);
            expect(usersServiceMock.setEmailVerificationCode).not.toHaveBeenCalled();
        });

        it('issues and persists a fresh code for an unverified account', async () => {
            // GIVEN
            // an unverified account, with a stale code from registration
            const existingUser = {
                id: 'user-id',
                email: 'jane@example.com',
                isEmailVerified: false,
                emailVerificationCode: '111111'
            } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);

            const newCode = await service.regenerateVerificationCode(existingUser.email);

            expect(newCode).toMatch(/^\d{6}$/);
            expect(usersServiceMock.setEmailVerificationCode).toHaveBeenCalledWith(
                existingUser.id,
                newCode,
                expect.any(Date)
            );
        });
    });

    describe('loginWithPassword', () => {
        const loginInput: LogInDto = {
            email: 'jane@example.com',
            password: 'my_password'
        };

        it('throws on invalid email or password', async () => {
            // GIVEN
            // no account registered under this email
            usersServiceMock.getUserByEmail!.mockResolvedValue(null);

            await expect(service.loginWithPassword(loginInput)).rejects.toThrow(BadRequestException);
        });

        it('throws on unverified email', async () => {
            // GIVEN
            // a user with an unverified email, but the correct password
            const existingUser = {
                id: 'user-id',
                email: loginInput.email,
                password: 'hashed-password',
                isEmailVerified: false
            } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);
            passwordServiceMock.comparePassword!.mockResolvedValue(true);

            await expect(service.loginWithPassword(loginInput)).rejects.toMatchObject({
                response: { code: 'EMAIL_NOT_VERIFIED' }
            });
        });

        it('issues tokens for valid credentials', async () => {
            // GIVEN
            // a matching account with the correct password
            const existingUser = {
                id: 'user-id',
                email: loginInput.email,
                password: 'hashed-password',
                isEmailVerified: true
            } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);

            passwordServiceMock.comparePassword!.mockResolvedValue(true);
            sessionServiceMock.issueTokenPair!.mockResolvedValue({
                token: 'access-token',
                refreshToken: 'refresh-token'
            });
            // id and email are the public fields this test cares about; how toPublicUserData
            // builds that shape is its own concern, not this test's
            usersServiceMock.toPublicUserData!.mockReturnValue({ id: 'user-id', email: loginInput.email } as any);

            await expect(service.loginWithPassword(loginInput)).resolves.toEqual({
                token: 'access-token',
                refreshToken: 'refresh-token',
                user: { id: 'user-id', email: loginInput.email }
            });
        });
    });
});
