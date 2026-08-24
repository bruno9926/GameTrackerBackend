import { User } from "../entities";

type RequiredCreateUserFields = "name" | "username" | "email";
type OptionalCreateUserFields =
    | "password"
    | "avatarUrl"
    | "googleId"
    | "isEmailVerified"
    | "emailVerificationCode"
    | "emailVerificationCodeExpiresAt";

// id, friendCode and games are generated inside createUser, never supplied by a caller
export type CreateUserInput =
    Pick<User, RequiredCreateUserFields>
    & Partial<Pick<User, OptionalCreateUserFields>>;
