import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { MulterFile } from "multer";

export class CreateUserDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "John", description: "First name of the user" })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "9988778899",
    description: "Mobile number of the user",
  })
  @IsNotEmpty()
  mobile: number;

  @ApiProperty({
    example: "securePassword123",
    description: "User password",
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User password",
    example: "securePassword123",
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class UpdateUserDto {
  @ApiProperty({
    example: "John Doe",
    description: "Updated name of the user",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: "9988778899",
    description: "Updated mobile number",
    required: false,
  })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ type: "string", format: "binary", required: false })
  image?: MulterFile;
}
