import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SeatLayout, SeatLayoutSchema } from "schemas/seat-layout.schema";
import { SeatLayoutController } from "./seat-layout.controller";
import { SeatLayoutService } from "./seat-layout.service";
import { Screen, ScreenSchema } from "../../schemas/screen.schema";
import { Show, ShowSchema } from "../../schemas/shows.schema";
import { Booking, BookingSchema } from "schemas/booking.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeatLayout.name, schema: SeatLayoutSchema },
      { name: Screen.name, schema: ScreenSchema },
      { name: Show.name, schema: ShowSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],

  providers: [SeatLayoutService],
  controllers: [SeatLayoutController],
  exports: [SeatLayoutService],
})
export class SeatLayoutModule {}
