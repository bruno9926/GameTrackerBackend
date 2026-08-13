import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";

@Injectable()
@Catch()
export class GoogleAuthExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly configService: ConfigService
    ) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse<Response>();
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');

        const message = exception instanceof HttpException
            ? exception.message
            : 'Google authentication failed';

        response.redirect(
            `${frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`
        );
    }
}
