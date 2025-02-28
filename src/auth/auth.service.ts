import {
  Injectable,
  ConflictException,
  BadRequestException,
  HttpStatus,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import * as _ from "lodash";
import { CreateUserDto, LoginDto } from "../dtos/user.dto";
import { User, UserDocument } from "../schemas/user.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService
  ) {}

  async register(createUserDto: CreateUserDto, path: string) {
    try {
      const { name, email, password, mobile } = createUserDto;

      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new ConflictException({
          statusCode: HttpStatus.FORBIDDEN,
          success: false,
          message: "Email is already taken.",
          path: path,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.userModel.create({
        name,
        email,
        password: hashedPassword,
        mobile,
      });

      const newUser = _.omit(user.toObject(), ["password"]);

      return createResponse(
        HttpStatus.CREATED,
        true,
        "Registration successful! Welcome aboard!",
        newUser
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path: path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async login(loginDto: LoginDto, path: string) {
    try {
      const { email, password } = loginDto;

      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new BadRequestException({
          statusCode: HttpStatus.FORBIDDEN,
          success: false,
          message: "User does not exist.",
          path: path,
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException({
          statusCode: HttpStatus.FORBIDDEN,
          success: false,
          message: "Email address or password you entered is incorrect.",
          path: path,
        });
      }

      const payload = {
        userId: user._id,
        email: user.email,
      };

      const token = await jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
      });

      const userObject = {
        userId: user._id,
        email: user.email,

        token: token,
      };

      return createResponse(
        HttpStatus.OK,
        true,
        "You’ve successfully logged in! Welcome back!",
        userObject
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path: path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
