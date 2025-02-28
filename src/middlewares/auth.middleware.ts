import {
  Injectable,
  NestMiddleware,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { EnhancedHttpException } from "../utils/helper.response.function";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        success: false,
        message: "Token not provided.",
        path: req.path,
      });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as jwt.JwtPayload;

      req["user"] = {
        id: decoded.userId,
        role: decoded.role,
      };
      next();
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: "Invalid or expired token",
          path: req.path,
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}
