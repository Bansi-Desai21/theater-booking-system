import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
  Put,
  Delete,
  Patch,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { SeatLayoutService } from "./seat-layout.service";
import {
  CreateSeatLayoutDto,
  UpdateSeatAvailabilityDto,
  UpdateSeatLayoutDto,
} from "../dtos/seat.dto";
import { Roles, Role } from "../utils/roles.enum";
import { RolesGuard } from "../middlewares/roles.guard";

@ApiTags("Seat Layout")
@ApiBearerAuth()
@Controller("seat-layout")
export class SeatLayoutController {
  constructor(private readonly seatLayoutService: SeatLayoutService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Post("create-seat-layout")
  @ApiOperation({ summary: "Create seat layout (Only SubAdmins can manage)" })
  @ApiResponse({
    status: 201,
    description: "Seat layout created successfully.",
  })
  @ApiResponse({ status: 400, description: "Bad Request. Validation failed." })
  @ApiResponse({
    status: 403,
    description: "Forbidden. Only SubAdmins can manage.",
  })
  @ApiResponse({ status: 404, description: "Screen not found." })
  async createSeatLayout(
    @Body() createSeatLayoutDto: CreateSeatLayoutDto,
    @Req() req
  ) {
    return this.seatLayoutService.createSeatLayout(
      createSeatLayoutDto,
      req.url
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin, Role.Customer)
  @Get(":screenId")
  @ApiOperation({ summary: "Get seat layout by screen ID" })
  @ApiResponse({
    status: 200,
    description: "Seat layout retrieved successfully.",
  })
  @ApiResponse({ status: 404, description: "Seat layout not found." })
  async getSeatLayout(@Param("screenId") screenId: string, @Req() req) {
    return this.seatLayoutService.getSeatLayoutByScreenId(screenId, req.url);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin, Role.SuperAdmin)
  @Put(":seatLayoutId")
  @ApiOperation({ summary: "Update seat layout" })
  @ApiResponse({
    status: 200,
    description: "Seat layout updated successfully.",
  })
  @ApiResponse({ status: 404, description: "Seat layout not found." })
  async updateSeatLayout(
    @Param("seatLayoutId") seatLayoutId: string,
    @Body() updateSeatLayoutDto: UpdateSeatLayoutDto,
    @Req() req
  ) {
    return this.seatLayoutService.updateSeatLayout(
      seatLayoutId,
      updateSeatLayoutDto,
      req.url
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Patch(":seatLayoutId/seats")
  @ApiOperation({ summary: "Update seat availability" })
  @ApiResponse({
    status: 200,
    description: "Seat availability updated successfully.",
  })
  @ApiResponse({ status: 404, description: "Seat layout not found." })
  async updateSeatAvailability(
    @Param("seatLayoutId") seatLayoutId: string,
    @Body() updateSeatAvailabilityDto: UpdateSeatAvailabilityDto,
    @Req() req
  ) {
    return this.seatLayoutService.updateSeatAvailability(
      seatLayoutId,
      updateSeatAvailabilityDto,
      req.url
    );
  }
}
