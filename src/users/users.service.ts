import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities";
import { Repository } from "typeorm";
import { UpdatePasswordDto, UpdateUserDto } from "./dtos";
import { PasswordService } from "src/security/services/password.service";
import { SupabaseStorageService } from "./supabase.service";
import { generateFriendCode } from "src/utils/friend-code.util";
import { CreateUserInput } from "./interfaces/create-user.input";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly passwordService: PasswordService,
        private readonly storageService: SupabaseStorageService,
    ) { }

    /**
     * Factory for building a new User ready to be persisted, regardless of the signup source.
     * Applies the defaults every account must have: a normalized username, a unique friend
     * code, and a hashed password when one is supplied.
     */
    async createUser(userData: CreateUserInput): Promise<User> {
        const hashedPassword = userData.password
            ? await this.passwordService.hashPassword(userData.password)
            : undefined;

        return Object.assign(new User(), userData, {
            username: userData.username.toLowerCase(),
            friendCode: generateFriendCode(),
            password: hashedPassword
        });
    }

    /** Persists a new user. */
    async insertUser(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create(userData);
        return await this.userRepository.save(user);
    }

    /** Looks up a user by friend code. */
    async getUserByFriendCode(friendCode: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { friendCode } });
    }

    /** Reports whether an account is already registered under this email. */
    async userExists(email: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { email } });
        return !!user;
    }

    /** Looks up a user by their linked Google account id. */
    async getUserByGoogleId(googleId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { googleId } });
    }

    /** Looks up a user by email, optionally including the password hash. */
    async getUserByEmail({ email, withPassword = false }: GetUserOptions): Promise<User | null> {
        const queryBuilder = this.userRepository
            .createQueryBuilder("user")
            .where("user.email = :email", { email });

        if (withPassword) {
            queryBuilder.addSelect("user.password");
        }

        return await queryBuilder.getOne();
    }

    /** Looks up a user by id. Throws if no such user exists. */
    async getUserById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    /** Applies a partial update to a user's profile info. Throws if the user doesn't exist. */
    async updateUserInfo(id: string, userInfo: UpdateUserDto): Promise<User> {
        const user = await this.userRepository.preload({
            id,
            ...userInfo,
        });
        if (!user) {
            throw new NotFoundException({
                message: 'User not found'
            });
        }
        return this.userRepository.save(user);
    }

    /** Changes a user's password after verifying their current one. */
    async updatePassword(updatePassword: UpdatePasswordDto, userId: string) {
        const { currentPassword, newPassword } = updatePassword;
        if (currentPassword === newPassword) {
            throw new BadRequestException({
                message: "New password must be different"
            });
        }

        const queryBuilder = this.userRepository
            .createQueryBuilder("user")
            .where("user.id = :userId", { userId })
            .addSelect("user.password");

        const user = await queryBuilder.getOne();
        if (!user) {
            throw new BadRequestException({
                message: "Invalid user"
            });
        }

        if (!user.password) {
            // accounts created via an OAuth provider (e.g. Google) have no password to change yet
            throw new BadRequestException({
                message: "This account does not have a password set"
            });
        }

        const isPasswordValid = await this.passwordService.comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException({
                message: "Invalid credentials"
            });
        }

        const newPasswordHashed = await this.passwordService.hashPassword(newPassword);
        await this.userRepository.update(userId, {
            password: newPasswordHashed
        })

        return { success: true }
    }

    /** Replaces a user's avatar image. */
    async updateAvatar(file: Express.Multer.File, userId: string) {
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Invalid file type');
        }

        const publicUrl = await this.storageService.uploadAvatar(file, userId);
        return this.updateUserInfo(userId, { avatarUrl: publicUrl });
    }
}

type GetUserOptions = {
    email: string;
    withPassword?: boolean;
}