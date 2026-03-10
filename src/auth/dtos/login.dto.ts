import { IsEmail, IsNotEmpty, isNotEmpty } from "class-validator";

export default class LogInDto {
    @IsNotEmpty()
    @IsEmail({}, { message: 'Email must be a valid email address' })
    email: string;
    
    @IsNotEmpty()
    password: string;
}