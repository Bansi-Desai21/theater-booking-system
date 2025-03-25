import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsMongoId,
  IsDate,
  IsNumber,
  IsEnum,
  IsString,
} from "class-validator";
import { ShowStatusEnum } from "src/schemas/shows.schema";

export class CreateShowDto {
  @ApiProperty({
    example: "65d4e8aabc13ae1d4f7f5b6c",
    description: "The ID of the movie.",
  })
  @IsMongoId()
  @IsNotEmpty()
  movieId: string;

  @ApiProperty({
    example: "65d4e8aabc13ae1d4f7f5b6d",
    description: "The ID of the screen.",
  })
  @IsMongoId()
  @IsNotEmpty()
  screenId: string;

  @ApiProperty({
    example: "65d4e8aabc13ae1d4f7f5b6e",
    description: "The ID of the theater.",
  })
  @IsMongoId()
  @IsNotEmpty()
  theaterId: string;

  @ApiProperty({
    example: "2025-06-15T14:00:00.000Z",
    description: "Show start time.",
  })
  @IsDate()
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty({
    example: "2025-06-15T00:00:00.000Z",
    description: "Show date.",
  })
  @IsDate()
  @IsNotEmpty()
  showDate: Date;

  @ApiProperty({
    example: "2025-06-24T00:00:00.000Z",
    description: "Show end date.",
  })
  @IsDate()
  @IsNotEmpty()
  showEndDate: Date;

  @ApiProperty({ example: 250, description: "Ticket price for the show." })
  @IsNumber()
  @IsNotEmpty()
  ticketPrice: number;
}

export class UpdateShowDto {
  @ApiProperty({
    example: "ACTIVE",
    description: "Updated ticket price.",
  })
  @IsString()
  status?: string;

  @ApiProperty({ example: 300, description: "Updated ticket price." })
  @IsNumber()
  ticketPrice?: number;
}

export class UpdateShowStatusDto {
  @ApiProperty({
    example: "ACTIVE",
    description: "The status of the show.",
    enum: ShowStatusEnum,
  })
  @IsEnum(ShowStatusEnum)
  @IsNotEmpty()
  status: ShowStatusEnum;
}
