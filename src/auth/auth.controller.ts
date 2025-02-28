import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiProperty,
} from "@nestjs/swagger";
import { Controller, Post, Body, Req, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto, LoginDto } from "../dtos/user.dto";

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
}
