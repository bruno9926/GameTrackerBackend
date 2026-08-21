import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import { User } from '../../users/entities';

describe('SessionService', () => {
    let service: SessionService;

    const user = { id: 'user-id' } as User;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtModule.register({ secret: 'test-access-secret' })],
            providers: [
                SessionService,
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn().mockReturnValue('test-refresh-secret') }
                }
            ]
        }).compile();

        service = module.get<SessionService>(SessionService);
    });

    it('produces an access token whose payload verifies back to the same user', async () => {
        const token = await service.generateAccessToken(user); 
        const payload = await service.verifyAccessToken(token);

        expect(payload.id).toBe(user.id);
    });

    it('produces a refresh token whose payload verifies back to the same user', async () => {
        const refreshToken = await service.generateRefreshToken(user);
        const payload = await service.verifyRefreshToken(refreshToken);

        expect(payload.id).toBe(user.id);
    });

    it('produces both access and refresh tokens in one call', async () => {
        const tokens = await service.issueTokenPair(user);
        const accessTokenPayload = await service.verifyAccessToken(tokens.token);
        const refreshTokenPayload = await service.verifyRefreshToken(tokens.refreshToken);

        expect(accessTokenPayload.id).toBe(user.id);
        expect(refreshTokenPayload.id).toBe(user.id);
    })

    it('rejects when verifying an access token as a refresh token', async () => {
        const token = await service.generateAccessToken(user);
        await expect(service.verifyRefreshToken(token)).rejects.toThrow();
    });

    it('rejects when verifying a refresh token as an access token', async () => {
        const refreshToken = await service.generateRefreshToken(user);
        await expect(service.verifyAccessToken(refreshToken)).rejects.toThrow();
    })
});
