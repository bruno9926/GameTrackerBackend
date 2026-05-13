import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities";
import { Repository } from "typeorm";
import { UpdatePasswordDto, UpdateUserDto } from "./dtos";
import { PasswordService } from "src/security/services/password.service";
import { SupabaseStorageService } from "./supabase.service";
import { generateFriendCode } from "src/utils/friend-code.util";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly passwordService: PasswordService,
        private readonly storageService: SupabaseStorageService,
    ) { }

    async insertUser(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create({
            ...userData,
            friendCode: generateFriendCode(),
        });
        return await this.userRepository.save(user);
    }

    async getUserByFriendCode(friendCode: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { friendCode } });
    }

    async userExists(email: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { email } });
        return !!user;
    }

    async getUserByEmail({ email, withPassword = false }: GetUserOptions): Promise<User> {
        const queryBuilder = this.userRepository
            .createQueryBuilder("user")
            .where("user.email = :email", { email });

        if (withPassword) {
            queryBuilder.addSelect("user.password");
        }

        const user = await queryBuilder.getOne();
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async getUserById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

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