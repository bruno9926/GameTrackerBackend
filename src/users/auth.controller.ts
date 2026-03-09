import { Body, Post, Controller, Get } from "@nestjs/common";
import { AuthService } from "./services/auth.service";
//dtos
import { RegisterDto } from "./dtos";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() registerInput: RegisterDto) {
        return this.authService.registerUser(registerInput);
    }

    @Post('login')
    login(@Body() loginInput: {
        email: string;
        password: string;
    }) {
        return "login";
    }

    @Get('me')
    me() {
        return "me";
    }

    @Post('logout')
    logout() {
        return "logout";
    }
}