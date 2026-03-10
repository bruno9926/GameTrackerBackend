import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
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
export default class AuthMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        try {
            const token = this.getTokenFromHeader(req, res);
            const payload = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;
            req.user = payload as UserPayload; // we are sure that the payload will have the id property since we are adding it when we sign the token
            next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
    }

    getTokenFromHeader(req: Request, res: Response): string {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new Error("Authorization header missing");
        }

        const [type, token] = authHeader.split(" ");
        if (type !== "Bearer" || !token) {
            throw new Error("Invalid authorization header");
        }
        return token;
    }
}

