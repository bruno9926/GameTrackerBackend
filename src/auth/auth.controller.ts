import { Body, Post, Controller, Get, UseGuards } from "@nestjs/common";
import { AuthService } from "./services/auth.service";
//dtos
import { RegisterDto, LogInDto } from "./dtos";
import { CurrentUser } from "./decorators/current-user.decorator";
import { AuthGuard } from "./guards/auth.guard";

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() registerInput: RegisterDto) {
        return this.authService.registerUser(registerInput);
    }

    @Post('login')
    login(@Body() loginInput: LogInDto) {
        return this.authService.login(loginInput);
    }

    @Get('me')
    me(@CurrentUser("id") userId: string) {
        return this.authService.getUser(userId);
    }

    @Post('logout')
    logout() {
        return "logout";
    }
}