import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities";
import { Repository } from "typeorm";
import { UpdateUserDto } from "./dtos";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
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
}

type GetUserOptions = {
    email: string;
    withPassword?: boolean;
}