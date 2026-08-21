import { PasswordService } from "./password.service";

describe('PasswordService', () => {
    let service: PasswordService;

    const password = 'my_password';

    beforeEach(() => {
        service = new PasswordService();
    })

    it('never stores the password as plaintext', async () => {
        const hashedPassword = await service.hashPassword(password);

        expect(password).not.toEqual(hashedPassword);
    });

    it('resolves true when the password matches its hash', async () => {
        const hashedPassword = await service.hashPassword(password);

        await expect(service.comparePassword(password, hashedPassword)).resolves.toBeTruthy();
    });

    it('resolves false when the password does not match the hash', async () => {
        const hashedPassword = await service.hashPassword(password);

        await expect(service.comparePassword('other_password', hashedPassword)).resolves.toBeFalsy();
    })
})