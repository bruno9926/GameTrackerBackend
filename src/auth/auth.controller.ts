import { Body, Post, Controller, Get, UseGuards, UseFilters, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { GoogleUserInfo } from "./interfaces/google-user-info";
import { GoogleAuthExceptionFilter } from "./filters/google-auth-exception.filter";
import { Response } from "express";
//decorators
import { CurrentUser } from "../security/decorators/current-user.decorator";
import { IsPublic } from "../security/decorators/is-public.decorator";
//guards
import { AuthGuard } from "../security/guards/auth.guard";
import { AuthGuard as PassportGuard } from "@nestjs/passport";
//dtos
import { RegisterDto, LogInDto, ExchangeCodeDto } from "./dtos";
import RefreshDto from "./dtos/refresh.dto";


@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @IsPublic()
    @Post('register')
    register(@Body() registerInput: RegisterDto) {
        return this.authService.registerUser(registerInput);
    }

    @IsPublic()
    @Post('login')
    login(@Body() loginInput: LogInDto) {
        return this.authService.loginWithPassword(loginInput);
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

    // providers authentication
    @IsPublic()
    @UseGuards(PassportGuard('google'))
    @Get('/google')
    googleAuth() { }

    @IsPublic()
    @UseGuards(PassportGuard('google'))
    @UseFilters(GoogleAuthExceptionFilter)
    @Get('/google/callback')
    async googleCallback(
        @CurrentUser() googleUser: GoogleUserInfo,
        @Res() res: Response
    ) {
        const code = await this.authService.loginWithGoogle(googleUser);
        return res.redirect(this.authService.buildGoogleRedirectUrl(code));
    }

    @IsPublic()
    @Post('google/exchange')
    exchangeGoogleCode(@Body() body: ExchangeCodeDto) {
        return this.authService.exchangeGoogleCode(body.code);
    }
}