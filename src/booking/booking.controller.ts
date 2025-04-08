import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { BookingService } from "./booking.service";
import { BookSeatsDto } from "../dtos/booking.dto";
import { RolesGuard } from "../middlewares/roles.guard";
import { Role, Roles } from "../utils/roles.enum";

@ApiTags("Booking")
@Controller("booking")
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post("book-seats")
  @ApiOperation({ summary: "Book seats (real seat booking)" })
  @ApiBody({ type: BookSeatsDto })
  @ApiResponse({ status: 200, description: "Seats booked successfully" })
  @ApiResponse({ status: 400, description: "Some seats are already booked" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async bookSeats(@Body() bookSeatDto: BookSeatsDto, @Req() req) {
    return this.bookingService.bookSeats(bookSeatDto, req["user"].id, req.url);
  }

  @Get("booking-summary/:bookingId")
  @ApiOperation({ summary: "Get Booking Summary" })
  @ApiResponse({
    status: 200,
    description: "Booking summary fetched successfully",
  })
  @ApiResponse({ status: 404, description: "Booking not found" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async getBookingSummary(@Param("bookingId") bookingId: string, @Req() req) {
    return this.bookingService.getBookingSummary(bookingId, req.url);
  }

  @Get("/booking-history")
  @ApiOperation({ summary: "Get User's Booking History" })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page Number",
    type: Number,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per Page",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Booking history fetched successfully",
  })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async getUserBookingHistory(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Req() req
  ) {
    return this.bookingService.getUserBookingHistory(
      req["user"].id,
      req.url,
      page,
      limit
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin, Role.SuperAdmin)
  @Get("/admin/booking-history")
  @ApiOperation({ summary: "Admin - List Bookings (Filter wise)" })
  @ApiQuery({ name: "theaterId", required: false })
  @ApiQuery({ name: "screenId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiResponse({
    status: 200,
    description: "Booking list fetched successfully",
  })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async getAllBookingsForAdmin(
    @Query("theaterId") theaterId: string,
    @Query("screenId") screenId: string,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Req() req
  ) {
    return this.bookingService.getAllBookingsForAdmin(req.url, {
      theaterId,
      screenId,
      page: Number(page),
      limit: Number(limit),
    });
  }
}
