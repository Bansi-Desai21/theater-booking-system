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
import {
  CreateUserDto,
  LoginDto,
  UpdateUserDto,
  SetPasswordDto,
  SubAdminDto,
} from "../dtos/user.dto";
import { User, UserDocument } from "../schemas/user.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { sendEmail } from "../utils/email.service";
import { PasswordReset } from "../schemas/paawordReset.schema";
import { Role } from "../utils/roles.enum";
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PasswordReset.name)
    private passwordResetModel: Model<PasswordReset>
  ) {}

  async register(
    createUserDto: CreateUserDto | SubAdminDto,
    path: string,
    role?: string
  ) {
    try {
      const { name, email, mobile } = createUserDto;
      const password =
        "password" in createUserDto ? createUserDto.password : undefined;
      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          success: false,
          message: "Email is already taken.",
          path: path,
        });
      }

      let hashedPassword: string | null = null;
      let passwordResetToken: string | null = null;

      if (role !== "sub_admin" && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      } else {
        passwordResetToken = crypto.randomBytes(32).toString("hex");
      }

      const user = await this.userModel.create({
        name,
        email,
        password: hashedPassword,
        mobile,
        role,
        passwordResetToken,
      });

      if (role === "sub_admin") {
        const passwordResetToken = crypto.randomBytes(32).toString("hex");
        await this.passwordResetModel.create({
          email,
          token: passwordResetToken,
          expiresAt: new Date(Date.now() + 3600000),
        });
        await this.userModel.findByIdAndUpdate(
          { _id: user.id },
          { $set: { isComplete: false } }
        );
        const setPasswordLink = `${process.env.FRONTEND_URL}?token=${passwordResetToken}&email=${user.email}`;

        await sendEmail(email, "Set Your Password", "set-password", {
          name: name,
          setPasswordLink,
        });
      }

      const newUser = { ...user.toObject(), password: undefined };
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
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
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
        name: user.name,
        role: user.role,
        isComplete: user.isComplete,
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
          message: "User does not exist.",
          path: path,
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
          message: "User does not exist.",
          path: path,
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

  async verifyResetToken(token: string, path: string) {
    try {
      const resetEntry = await this.passwordResetModel.findOne({ token });
      if (!resetEntry) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: "Invalid or expired token.",
          path: path,
        });
      }

      return createResponse(
        HttpStatus.OK,
        true,
        "Token is valid",
        resetEntry.email
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

  async setPassword(setPasswordDto: SetPasswordDto, path: string) {
    try {
      const { token, newPassword } = setPasswordDto;
      const resetEntry = await this.passwordResetModel.findOne({ token });
      if (!resetEntry) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: "Invalid or expired token.",
          path: path,
        });
      }

      const user = await this.userModel.findOne({ email: resetEntry.email });
      if (!user) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: "User does not exist.",
          path: path,
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      await this.passwordResetModel.deleteOne({ token });
      return createResponse(
        HttpStatus.OK,
        true,
        "Password set successfully!",
        {}
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

  async requestReset(email: string, path: string) {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: "User does not exist.",
          path: path,
        });
      }
      const tokenExists = await this.passwordResetModel.findOne({ email });
      let newToken = tokenExists
        ? tokenExists.token
        : crypto.randomBytes(32).toString("hex");
      if (!tokenExists) {
        await this.passwordResetModel.create({
          email,
          token: newToken,
          expiresAt: new Date(Date.now() + 3600000),
        });
      }

      const setPasswordLink = `${process.env.FRONTEND_URL}?token=${newToken}&email=${user.email}`;

      await sendEmail(email, "Set Your Password", "set-password", {
        name: user.name,
        setPasswordLink,
      });

      return createResponse(
        HttpStatus.OK,
        true,
        "Password reset link sent. Please check your email.",
        {}
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

  async getAllSubAdmins(page: number, limit: number, path: string) {
    try {
      const skip = (page - 1) * limit;

      const query = { role: Role.SubAdmin };

      const subAdmins = await this.userModel
        .find(query, "-password")
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.userModel.countDocuments(query);

      return createResponse(
        200,
        true,
        "List of SubAdmins retrieved successfully.",
        {
          total,
          subAdmins,
        }
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
