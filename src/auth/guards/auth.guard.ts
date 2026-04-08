import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { User } from "src/users/entities";

import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/is-public.decorator";

type UserPayload = Pick<User, "id">; // we only want to add the id
// extending the Request interfaces so we can add the user property to it
declare global {
    namespace Express {
        interface Request {
            user?: UserPayload
        }
    }
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
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
            const payload = await this.jwtService.verifyAsync<UserPayload>(token);
            req.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException("Invalid or expired token");
        }
    }
}
