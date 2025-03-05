import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsNotEmpty, IsMongoId } from "class-validator";

export class CreateScreenDto {
  @ApiProperty({
    example: "Screen 1",
    description: "The name of the screen.",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 150,
    description: "Total number of seats available in the screen.",
  })
  @IsNumber()
  @IsNotEmpty()
  totalSeats: number;

  @ApiProperty({
    example: "65d4e8aabc13ae1d4f7f5b6c",
    description: "The ID of the theater where the screen is located.",
  })
  @IsMongoId()
  @IsNotEmpty()
  theaterId: string;
}

export class UpdateScreenDto {
  @ApiProperty({ example: "IMAX Screen", description: "Updated screen name" })
  @IsString()
  name?: string;

  @ApiProperty({ example: 180, description: "Updated total seats" })
  @IsNumber()
  totalSeats?: number;
}
