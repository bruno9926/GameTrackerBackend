import { customAlphabet } from 'nanoid';

const CODE_LENGTH = 6;
const CODE_TTL_MS = 15 * 60 * 1000;

const generateDigits = customAlphabet('0123456789', CODE_LENGTH);

export type EmailVerificationCode = {
    readonly code: string;
    readonly expiresAt: Date;
};

/** Generates a new 6-digit email verification code, valid for 15 minutes. */
export function generateVerificationCode(): EmailVerificationCode {
    return {
        code: generateDigits(),
        expiresAt: new Date(Date.now() + CODE_TTL_MS)
    };
}

/** Checks a submitted code against the stored one, rejecting mismatches and expired codes. */
export function isVerificationCodeValid(
    inputCode: string,
    stored: EmailVerificationCode | null | undefined
): boolean {
    if (!stored) {
        return false;
    }
    return inputCode === stored.code && stored.expiresAt.getTime() > Date.now();
}
