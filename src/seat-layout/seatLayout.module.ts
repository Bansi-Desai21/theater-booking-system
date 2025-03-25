import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SeatLayout, SeatLayoutSchema } from "src/schemas/seatLayout.schema";
import { SeatLayoutController } from "./seatLayout.controller";
import { SeatLayoutService } from "./seatLayout.service";
import { Screen, ScreenSchema } from "../schemas/screen.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeatLayout.name, schema: SeatLayoutSchema },
      { name: Screen.name, schema: ScreenSchema },
    ]),
  ],

  providers: [SeatLayoutService],
  controllers: [SeatLayoutController],
})
export class SeatLayoutModule {}
