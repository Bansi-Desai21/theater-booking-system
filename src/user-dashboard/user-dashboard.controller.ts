import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ShowService } from "../show/show.service";
import { UserDashboardService } from "./user-dashboard.service";
@ApiTags("User Dashboard")
@Controller("user-dashboard")
export class UserDashboardController {
  constructor(
    private readonly showService: ShowService,
    private readonly userDashboardService: UserDashboardService
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

  @Get("shows/by-movie")
  @ApiOperation({ summary: "Get theaters with active shows for a movie" })
  @ApiQuery({
    name: "movieId",
    type: String,
    required: true,
    description: "ID of the movie",
  })
  @ApiQuery({
    name: "page",
    type: Number,
    required: false,
    description: "Page number for pagination (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    type: Number,
    required: false,
    description: "Number of results per page (default: 10)",
  })
  @ApiResponse({
    status: 200,
    description: "List of theaters with active shows for the given movie.",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid movie ID or missing parameters.",
  })
  @ApiResponse({
    status: 404,
    description: "No theaters found with active shows for this movie.",
  })
  async getTheatersByMovie(
    @Query("movieId") movieId: string,
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Req() req
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return this.userDashboardService.getTheatersByMovie(
      movieId,
      pageNum,
      limitNum,
      req.url
    );
  }
}
