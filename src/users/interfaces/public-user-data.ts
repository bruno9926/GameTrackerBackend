import { User } from "../entities";

export type PublicUserData = Pick<User, "id" | "name" | "username" | "email" | "avatarUrl" | "friendCode">;
