import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PasswordAuthService } from './password-auth.service';
import { UsersService } from '../../users/users.service';
import { PasswordService } from '../../security/services/password.service';
import { SessionService } from '../../security/services/session.service';
import LogInDto from '../dtos/login.dto';
import RegisterDto from '../dtos/register.dto';
import { User } from '../../users/entities';

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
            insertUser: jest.fn()
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
            const builtUser = { name: registerInput.name, email: registerInput.email } as User;
            usersServiceMock.createUser!.mockResolvedValue(builtUser);
            const savedUser = { id: 'user-id', ...builtUser } as User;
            usersServiceMock.insertUser!.mockResolvedValue(savedUser);

            await expect(service.registerUser(registerInput)).resolves.toEqual({
                id: savedUser.id,
                name: registerInput.name,
                email: registerInput.email,
            });
            expect(usersServiceMock.insertUser).toHaveBeenCalledWith(builtUser);
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

        it('issues tokens for valid credentials', async () => {
            // GIVEN
            // a matching account with the correct password
            const existingUser = { id: 'user-id', email: loginInput.email, password: 'hashed-password' } as User;
            usersServiceMock.getUserByEmail!.mockResolvedValue(existingUser);
            
            passwordServiceMock.comparePassword!.mockResolvedValue(true);
            sessionServiceMock.issueTokenPair!.mockResolvedValue({
                token: 'access-token',
                refreshToken: 'refresh-token'
            });

            await expect(service.loginWithPassword(loginInput)).resolves.toEqual({
                token: 'access-token',
                refreshToken: 'refresh-token',
                user: { id: 'user-id', email: loginInput.email }
            });
        });
    });
});
