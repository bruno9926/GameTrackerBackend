import { AuthCodeService, LoginResult } from './auth-code.service';

describe('AuthCodeService', () => {
    let service: AuthCodeService;

    const result: LoginResult = { token: 'access-token', refreshToken: 'refresh-token' };

    beforeEach(() => {
        service = new AuthCodeService();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns the login result for a code it issued', () => {
        const code = service.issueCode(result);
        expect(service.exchangeCode(code)).toEqual(result);
    });

    it('returns null for a code that was never emitted', () => {
        const exchangedResult = service.exchangeCode('invalid_code');
        expect(exchangedResult).toBeNull();
    })

    it('exchanges the code only the first time (single use)', () => {
        const code = service.issueCode(result);

        expect(service.exchangeCode(code)).toEqual(result);
        expect(service.exchangeCode(code)).toBeNull();
    })

    it('returns null once the code has expired', () => {
        jest.useFakeTimers();

        const code = service.issueCode(result);
        jest.advanceTimersByTime(60_001);

        expect(service.exchangeCode(code)).toBeNull();
    })
});
