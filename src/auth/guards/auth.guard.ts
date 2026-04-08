import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { User } from "src/users/entities";

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
    constructor(private readonly jwtService: JwtService){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req: Request = context.switchToHttp().getRequest();

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new UnauthorizedException("Authorization header missing");
        }

        const [type, token] = authHeader.split(" ");
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
