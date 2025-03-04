import { IsString, IsNumber, IsNotEmpty } from "class-validator";
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
