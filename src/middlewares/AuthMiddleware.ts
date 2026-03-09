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
export default class AuthMiddleware implements NestMiddleware{
    use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1]; // Assuming the token is in the format "Bearer <token>"

        try {
            const payload = jwt.verify(token, "SUPER_SECRET");
            req.user = payload as UserPayload; // we are sure that the payload will have the id property since we are adding it when we sign the token
            next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
    }
}

