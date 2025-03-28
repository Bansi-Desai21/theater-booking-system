import { SeatType } from "../utils/seats.enum";
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsString,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSeatDto {
  @ApiProperty({ example: 1, description: "Row number of the seat." })
  @IsNumber()
  row: number;

  @ApiProperty({ example: 2, description: "Seat number in the row." })
  @IsNumber()
  seatNumber: number;

  @ApiProperty({
    example: SeatType.VIP,
    enum: SeatType,
    description: "Type of seat (Regular, Premium, VIP).",
  })
  @IsEnum(SeatType)
  type: SeatType;

  @ApiProperty({ example: 300, description: "Price of the seat." })
  @IsNumber()
  price: number;
}

export class CreateSeatLayoutDto {
  @ApiProperty({
    example: "65f9bfe0c7a4a527b8c7d5f1",
    description: "Screen ID to associate the seat layout.",
  })
  @IsMongoId()
  screenId: string;

  @ApiProperty({
    example: "65f9bfe0c7a4a527b8c7d5f2",
    description: "Theater ID to associate with the seat layout.",
  })
  @IsMongoId()
  theaterId: string;

  @ApiProperty({
    example: 5,
    description: "Total number of rows in the screen.",
  })
  @IsNumber()
  @Min(1)
  rows: number;

  @ApiProperty({
    example: 10,
    description: "Total number of seats per row.",
  })
  @IsNumber()
  @Min(1)
  cols: number;

  @ApiProperty({
    example: 120,
    description: "Default price for regular seats.",
  })
  @IsNumber()
  @Min(1)
  defaultRegularPrice: number;

  @ApiProperty({
    example: [
      { row: 2, type: "vip", price: 300 },
      {
        row: 3,
        type: "premium",
        price: 200,
      },
    ],
    description: "List of seats with custom types and prices.",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSeatDto)
  seats: CreateSeatDto[];
}

export class UpdateSeatLayoutDto {
  @ApiProperty({
    example: "65f9bfe0c7a4a527b8c7d5f1",
    description: "Seat Layout ID",
  })
  @IsMongoId()
  seatLayoutId: string;

  @ApiProperty({
    example: 5,
    description: "Updated total number of rows (optional).",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rows?: number;

  @ApiProperty({
    example: 10,
    description: "Updated total number of seats per row (optional).",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cols?: number;

  @ApiProperty({
    example: 120,
    description: "Updated default price for regular seats (optional).",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultRegularPrice?: number;

  @ApiProperty({
    example: [
      { row: 1, type: "vip", price: 300 },
      {
        row: 2,
        type: "premium",
        price: 200,
      },
    ],
    description: "Updated list of seats.",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSeatDto)
  seats?: CreateSeatDto[];
}

export class UpdateSeatAvailabilityDto {
  @ApiProperty({
    example: [
      { row: "A", seatNumber: 1, isAvailable: false },
      { row: "B", seatNumber: 2, isAvailable: true },
    ],
    description: "List of seat availability updates.",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatAvailabilityDto)
  seats: SeatAvailabilityDto[];
}

export class SeatAvailabilityDto {
  @ApiProperty({ example: "A", description: "Row letter." })
  @IsString()
  row: string;

  @ApiProperty({ example: 1, description: "Seat number." })
  @IsNumber()
  seatNumber: number;

  @ApiProperty({
    example: false,
    description: "Availability status of the seat.",
  })
  @IsBoolean()
  isAvailable: boolean;
}
