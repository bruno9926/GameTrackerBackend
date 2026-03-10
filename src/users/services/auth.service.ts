import { Injectable } from "@nestjs/common";
import { LogInDto, RegisterDto } from "../dtos";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PasswordService } from "./password.service";
import * as jwt from "jsonwebtoken";

import { BadRequestException } from "@nestjs/common";
// entities
import { User } from "../entities";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly passwordService: PasswordService,
    ) { }

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

    async login(loginInput: LogInDto) {
        const { email, password: passwordInput } = loginInput;

        const user = await this.userRepository
            .createQueryBuilder("user")
            .addSelect("user.password")
            .where("user.email = :email", { email })
            .getOne();

        if (!user) {
            throw new BadRequestException("Invalid email or password");
        }

        const isPasswordValid = await this.passwordService.comparePassword(passwordInput, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException("Invalid email or password");
        }

        return {
            token: this.createToken(user),
        }
    }

    async getUser(id: string): Promise<User> {
        return this.userRepository.findOne({ where: { id } });
    }

    private createToken(user: User): string {
        return jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
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