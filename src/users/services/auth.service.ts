import { Injectable } from "@nestjs/common";
import { RegisterDto } from "../dtos";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PasswordService } from "./password.service";

import { BadRequestException } from "@nestjs/common";
// entities
import {User} from "../entities";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly passwordService: PasswordService,
    ) {}

    async registerUser(registerInput: RegisterDto): Promise<User> {
        const existingUser = await this.userRepository.findOne({ where: { email: registerInput.email } });
        if (existingUser) {
            throw new BadRequestException("User with this email already exists");
        }

        const user = this.userRepository.create(
            await this.toUserEntity(registerInput)
        );
        return this.userRepository.save(user);
    }

    private async toUserEntity(registerInput: RegisterDto): Promise<User> {
        const hashedPassword = await this.passwordService.hashPassword(registerInput.password);

        const user = new User();
        user.name = registerInput.name;
        user.email = registerInput.email;
        user.password = hashedPassword;
        return user;
    }
} 