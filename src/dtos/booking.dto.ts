import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsNotEmpty } from "class-validator";

export class BookSeatsDto {
  @ApiProperty({
    type: [String],
    description: "Array of seat IDs to book",
    example: ["67ebbcf96eab119dd00598c2", "67ebbcf96eab119dd00598c3"],
  })
  seatIds: string[];

  @ApiProperty({
    example: "65d4e8aabc13ae1d4f7f5b6c",
    description: "The ID of the show where the movie is shceduled.",
  })
  @IsMongoId()
  @IsNotEmpty()
  showId: string;
}
