import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import {
  Controller,
  Post,
  Body,
  Req,
  HttpStatus,
  UseGuards,
  Get,
  Put,
  Param,
  Query,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  CreateUserDto,
  LoginDto,
  SetPasswordDto,
  SubAdminDto,
  UpdateUserDto,
} from "../dtos/user.dto";
import { RolesGuard } from "../middlewares/roles.guard";
import { Role, Roles } from "../utils/roles.enum";
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "User successfully registered",
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Bad request" })
  async register(@Body() signupDto: CreateUserDto, @Req() req) {
    return this.authService.register(signupDto, req.url);
  }

  @Post("login")
  @ApiOperation({ summary: "Login a user" })
  @ApiResponse({ status: HttpStatus.OK, description: "Login successful" })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid email or password",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Internal Server Error",
  })
  async login(@Body() loginDto: LoginDto, @Req() req) {
    return await this.authService.login(loginDto, req.url);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SuperAdmin)
  @Post("register-sub-admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "User successfully registered",
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Bad request" })
  async registerSubAdmin(@Body() subAdminDto: SubAdminDto, @Req() req) {
    return this.authService.register(subAdminDto, req.path, "sub_admin");
  }

  @Get("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user profile" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profile fetched successfully",
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async getProfile(@Req() req) {
    return this.authService.getProfile(req.user.id, req.url);
  }

  @Put("update-profile")
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user profile" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profile updated successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
  })
  async updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    updateUserDto.image = req.body.image;
    return this.authService.updateProfile(req.user.id, updateUserDto, req.url);
  }

  @Post("request-reset")
  @ApiOperation({ summary: "Request password reset link" })
  @ApiResponse({
    status: 200,
    description: "Password reset link sent successfully",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@example.com" },
      },
    },
  })
  async requestReset(@Req() req, @Body("email") email: string) {
    return this.authService.requestReset(email, req.url);
  }

  @Get("verify-reset-token/:token")
  @ApiOperation({ summary: "Verify if a password reset token is valid" })
  @ApiParam({
    name: "token",
    required: true,
    example: "random_token_123",
    description: "Password reset token",
  })
  @ApiResponse({ status: 200, description: "Token is valid" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async verifyResetToken(@Req() req, @Param("token") token: string) {
    return this.authService.verifyResetToken(token, req.url);
  }

  @Post("set-password")
  @ApiOperation({ summary: "Set new password using reset token" })
  @ApiResponse({ status: 200, description: "Password set successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  @ApiResponse({ status: 404, description: "User not found" })
  async setPassword(@Req() req, @Body() setPasswordDto: SetPasswordDto) {
    return this.authService.setPassword(setPasswordDto, req.url);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SuperAdmin)
  @Get("sub-admins")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a list of SubAdmins" })
  @ApiResponse({
    status: 200,
    description: "List of SubAdmins retrieved successfully",
  })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  @ApiQuery({
    name: "page",
    required: false,
    example: 1,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    example: 10,
    description: "Number of records per page (default: 10)",
  })
  async getAllSubAdmins(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Req() req
  ) {
    return this.authService.getAllSubAdmins(
      Number(page),
      Number(limit),
      req.url
    );
  }
}
