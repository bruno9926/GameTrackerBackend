import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class PasswordService {

    private readonly saltRounds = 10;

    /** Produces a hash of a plaintext password, safe to persist. */
    hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /** Checks whether a plaintext password matches a previously stored hash. */
    comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}