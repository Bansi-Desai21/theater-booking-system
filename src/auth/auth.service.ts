import {
  Injectable,
  ConflictException,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import * as _ from "lodash";
import { CreateUserDto, LoginDto, UpdateUserDto } from "../dtos/user.dto";
import { User, UserDocument } from "../schemas/user.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import * as jwt from "jsonwebtoken";

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async register(createUserDto: CreateUserDto, path: string, role?: string) {
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
        role,
      });

      const newUser = _.omit(user.toObject(), ["password"]);

      return createResponse(
        HttpStatus.CREATED,
        true,
        "Registration successful!",
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
        role: user.role,
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

  async getProfile(userId: string, path: string) {
    try {
      const user = await this.userModel.findById(userId).select("-password");
      if (!user) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: "User not found",
        });
      }
      return createResponse(
        HttpStatus.OK,
        true,
        "Profile fetched successfully",
        user
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

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
    path: string
  ) {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, updateUserDto, { new: true })
        .select("-password");

      if (!updatedUser) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: "User not found",
        });
      }

      return createResponse(
        HttpStatus.OK,
        true,
        "Profile updated successfully",
        updatedUser
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
