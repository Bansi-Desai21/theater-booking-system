import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ShowService } from "../show/show.service";
import { UserDashboardService } from "./user-dashboard.service";
import { ScreenService } from "../screen/screen.service";
import { SeatLayoutService } from "../seat-layout/seat-layout.service";
@ApiTags("User Dashboard")
@Controller("user-dashboard")
export class UserDashboardController {
  constructor(
    private readonly showService: ShowService,
    private readonly userDashboardService: UserDashboardService,
    private readonly screenService: ScreenService,
    private readonly seatLayoutService: SeatLayoutService
  ) {}

  @Get("list-shows")
  @ApiOperation({ summary: "List all shows for a theater or by owner" })
  @ApiResponse({ status: 200, description: "Shows retrieved successfully." })
  @ApiQuery({
    name: "theaterId",
    required: false,
    type: String,
    description: "Filter shows by theater ID",
  })
  @ApiQuery({
    name: "screenId",
    required: false,
    type: String,
    description: "Filter shows by screen ID",
  })
  @ApiQuery({
    name: "movieId",
    required: false,
    type: String,
    description: "Filter shows by movie ID",
  })
  @ApiQuery({
    name: "startDate",
    required: true,
    type: Date,
    description: "Filter start by start date",
    example: "2025-06-17",
  })
  async listShows(
    @Query("theaterId") theaterId: string,
    @Query("screenId") screenId: string,
    @Query("movieId") movieId: string,
    @Query("startDate") startDate: Date,
    @Req() req
  ) {
    return await this.showService.listShows({
      path: req.url,
      startDate,
      theaterId,
      screenId,
      movieId,
      isPublic: !req.user,
    });
  }

  @Get("get-screen-details/:id")
  @ApiOperation({ summary: "Get screen details by ID" })
  @ApiResponse({
    status: 200,
    description: "Screen details retrieved successfully.",
  })
  @ApiResponse({ status: 404, description: "Screen not found." })
  async getScreenDetails(@Param("id") screenId: string, @Req() req) {
    return this.screenService.getScreenDetails(screenId, req.url);
  }

  @Get("list/:theaterId")
  @ApiOperation({ summary: "List all screens of a theater with pagination" })
  @ApiQuery({
    name: "isComplete",
    type: Boolean,
    required: false,
    example: true,
    description: "Screen status",
  })
  @ApiQuery({
    name: "isActive",
    type: Boolean,
    required: false,
    example: true,
    description: "Screen activation status",
  })
  @ApiQuery({
    name: "page",
    required: false,
    example: 1,
    description: "Page number",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    example: 10,
    description: "Number of records per page",
  })
  @ApiResponse({ status: 200, description: "Screens retrieved successfully." })
  async listScreens(
    @Param("theaterId") theaterId: string,
    @Query("isComplete") isComplete: Boolean,
    @Query("isActive") isActive: Boolean,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Req() req
  ) {
    return this.screenService.listScreens({
      theaterId,
      page: Number(page),
      limit: Number(limit),
      path: req.url,
      isComplete,
      isActive,
    });
  }

  @Get("seat-layout/:screenId")
  @ApiOperation({ summary: "Get seat layout by screen ID" })
  @ApiResponse({
    status: 200,
    description: "Seat layout retrieved successfully.",
  })
  @ApiResponse({ status: 404, description: "Seat layout not found." })
  async getSeatLayout(@Param("screenId") screenId: string, @Req() req) {
    return this.seatLayoutService.getSeatLayoutByScreenId(screenId, req.url);
  }
}
