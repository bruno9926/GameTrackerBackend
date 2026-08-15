import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { SessionService, JwtPayload } from "../services/session.service";

import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/is-public.decorator";

// extending the Request interfaces so we can add the user property to it
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly sessionService: SessionService,
        private readonly reflector: Reflector
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        if (this.isPublic(context)) {
            return true;
        }
        return this.isAuthenticated(context);
    }

    private isPublic(context: ExecutionContext): boolean {
        return !!this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [
                context.getHandler(), //method
                context.getClass() //class
            ]
        )
    }

    private async isAuthenticated(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest<Request>();

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new UnauthorizedException("Authorization header missing");
        }

        const [type, token] = authHeader?.split(" ") ?? [];
        if (type !== "Bearer" || !token) {
            throw new UnauthorizedException("Invalid authorization header");
        }
        try {
            const payload = await this.sessionService.verifyAccessToken(token);
            req.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException("Invalid or expired token");
        }
    }
}
