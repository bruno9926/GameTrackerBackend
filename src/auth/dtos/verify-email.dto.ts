import { IsEmail, IsNotEmpty } from "class-validator";

export default class VerifyEmailDto {
    @IsNotEmpty({ message: 'Email must not be empty' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    email: string;

    @IsNotEmpty({ message: 'Code must not be empty' })
    code: string;
}