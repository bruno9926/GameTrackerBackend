import { Body, Post, Controller, Get, UseGuards } from "@nestjs/common";
import { AuthService } from "./services/auth.service";
//decorators
import { CurrentUser } from "./decorators/current-user.decorator";
import { IsPublic } from "./decorators/is-public.decorator";
//guards
import { AuthGuard } from "./guards/auth.guard";
//dtos
import { RegisterDto, LogInDto } from "./dtos";
import RefreshDto from "./dtos/refresh.dto";

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @IsPublic()
    @Post('register')
    register(@Body() registerInput: RegisterDto) {
        return this.authService.registerUser(registerInput);
    }

    @IsPublic()
    @Post('login')
    login(@Body() loginInput: LogInDto) {
        return this.authService.login(loginInput);
    }

    @Get('me')
    me(@CurrentUser("id") userId: string) {
        return this.authService.getUser(userId);
    }

    @IsPublic()
    @Post('refresh')
    refresh(@Body() refreshInput: RefreshDto) {
        return this.authService.refreshToken(refreshInput.refreshToken);
    }

    @Post('logout')
    logout() {
        return "logout";
    }
}