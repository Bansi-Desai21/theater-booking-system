import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

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
