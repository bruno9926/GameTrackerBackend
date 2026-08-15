import { Injectable } from "@nestjs/common";
import { nanoid } from "nanoid";

const CODE_TTL_MS = 60_000;
const CODE_LENGTH = 32;

export type LoginResult = {
    token: string;
    refreshToken: string;
};

type PendingResult = {
    result: LoginResult;
    expiresAt: number;
};

/**
 * Single-use, short-lived handoff for login tokens that can't travel safely in a
 * redirect URL (e.g. after an OAuth callback). Issue a code, hand it to the client
 * via redirect, then exchange it once for the real tokens.
 */
@Injectable()
export class AuthCodeService {
    private readonly pendingResults = new Map<string, PendingResult>();

    /** Registers a login result under a new one-time code and returns that code. */
    issueCode(result: LoginResult): string {
        const code = nanoid(CODE_LENGTH);
        this.pendingResults.set(code, {
            result,
            expiresAt: Date.now() + CODE_TTL_MS
        });
        return code;
    }

    /**
     * Redeems a previously issued code for its login result. The code is consumed
     * on this call regardless of outcome. Returns null if the code is unknown or expired.
     */
    exchangeCode(code: string): LoginResult | null {
        const pending = this.pendingResults.get(code);
        this.pendingResults.delete(code);

        if (!pending || pending.expiresAt < Date.now()) {
            return null;
        }
        return pending.result;
    }
}
