import { Injectable } from '@nestjs/common';

@Injectable()
export class BookingService {
  async getBookings() {
    return { message: 'List of bookings' };
  }

  async createBooking(bookingData: any) {
    return { message: 'Booking created', bookingData };
  }
}
