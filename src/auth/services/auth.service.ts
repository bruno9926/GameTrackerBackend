import { Injectable } from "@nestjs/common";
import { LogInDto, RegisterDto } from "../dtos";
import { PasswordService } from "./password.service";
import { UsersService } from "../../users/users.service";
import { JwtService } from "@nestjs/jwt";

import { BadRequestException } from "@nestjs/common";
// entities
import { User } from "../../users/entities";

@Injectable()
export class AuthService {
    constructor(
        private readonly passwordService: PasswordService,
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
    ) { }

    async registerUser(registerInput: RegisterDto): Promise<Partial<User>> {
        const userExists = await this.usersService.userExists(registerInput.email);
        if (userExists) {
            throw new BadRequestException("User with this email already exists");
        }

        const savedUser = await this.usersService.insertUser(
            await this.toUserEntity(registerInput)
        );
        return {
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
        };
    }

    async login(loginInput: LogInDto) {
        const { email, password: passwordInput } = loginInput;

        const user = await this.usersService.getUserByEmail({ email, withPassword: true });

        if (!user) {
            throw new BadRequestException("Invalid email or password");
        }

        const isPasswordValid = await this.passwordService.comparePassword(passwordInput, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException("Invalid email or password");
        }

        const { password, ...userPublicData } = user;
        return {
            token: await this.createToken(user),
            user: userPublicData
        }
    }

    async getUser(id: string): Promise<User> {
        return this.usersService.getUserById(id);
    }

    private async createToken(user: User): Promise<string> {
        return this.jwtService.signAsync({
            id: user.id
        })
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