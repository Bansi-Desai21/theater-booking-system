import { Controller, Get, Post } from "@nestjs/common";
import { BookingService } from "./booking.service";

@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get("get_bookings")
  async getBookings() {
    return this.bookingService.getBookings();
  }

  @Post("create_booking")
  async createBooking(bookingData: any) {
    return this.bookingService.createBooking(bookingData);
  }
}
