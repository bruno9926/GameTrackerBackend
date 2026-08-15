export interface CreateUserInput {
    name: string;
    username: string;
    email: string;
    password?: string;
    avatarUrl?: string;
    googleId?: string;
}
