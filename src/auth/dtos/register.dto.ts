import { IsEmail, IsNotEmpty } from "class-validator";

export default class RegisterDto {
    @IsNotEmpty({ message: 'Name must not be empty' })
    name: string;

    @IsNotEmpty({ message: 'Email must not be empty' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    email: string;

    @IsNotEmpty({ message: 'Password must not be empty' })
    password: string;
}