// src/booking/booking.module.ts
import { Module } from "@nestjs/common";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";
import { BookingGateway } from "./booking.gateway";
import { MongooseModule } from "@nestjs/mongoose";
import { SeatLayout, SeatLayoutSchema } from "schemas/seat-layout.schema";
import { Booking, BookingSchema } from "schemas/booking.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeatLayout.name, schema: SeatLayoutSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingGateway],
})
export class BookingModule {}
