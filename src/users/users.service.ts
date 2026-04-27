import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities";
import { Repository } from "typeorm";
import { UpdatePasswordDto, UpdateUserDto } from "./dtos";
import { PasswordService } from "src/security/services/password.service";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly passwordService: PasswordService
    ) { }

    async insertUser(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create(userData);
        return await this.userRepository.save(user);
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
}

type GetUserOptions = {
    email: string;
    withPassword?: boolean;
}