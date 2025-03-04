import { IsString, IsNumber, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { MulterFile } from "multer";

export class CreateTheaterDto {
  @ApiProperty({
    example: "PVR Cinemas",
    description: "The name of the theater.",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "MG Road, Mumbai",
    description: "The full address/location of the theater.",
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    example: "Mumbai",
    description: "The city where the theater is located.",
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 5,
    description: "The total number of screens available in the theater.",
  })
  @IsNumber()
  @IsNotEmpty()
  no_of_screens: number;

  @ApiProperty({ type: "string", format: "binary", required: false })
  image?: MulterFile;
}

export class UpdateTheaterDto {
  @ApiProperty({
    example: "PVR Cinemas",
    description: "Updated name of the theater.",
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: "MG Road, Mumbai",
    description: "Updated location of the theater.",
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    example: "Mumbai",
    description: "Updated city of the theater.",
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 6,
    description: "Updated number of screens.",
    required: false,
  })
  @IsNumber()
  @IsOptional()
  no_of_screens?: number;

  @ApiProperty({ type: "string", format: "binary", required: false })
  image?: MulterFile;
}
