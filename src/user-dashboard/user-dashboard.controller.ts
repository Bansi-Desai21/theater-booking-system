import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ShowService } from "../show/show.service";

@ApiTags("User Dashboard")
@Controller("user-dashboard")
export class UserDashboardController {
  constructor(private readonly showService: ShowService) {}

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
}
