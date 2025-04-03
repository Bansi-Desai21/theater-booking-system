import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Req,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { ShowService } from "./show.service";
import {
  CreateShowDto,
  UpdateShowDto,
  UpdateShowStatusDto,
} from "../dtos/show.dto";
import { RolesGuard } from "../middlewares/roles.guard";
import { Roles, Role } from "../utils/roles.enum";
import { ShowStatusEnum } from "../../schemas/shows.schema";

@ApiTags("Shows")
@Controller("shows")
export class ShowController {
  constructor(private readonly showService: ShowService) {}

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Post("add-show")
  @ApiOperation({ summary: "Add a new show (Only SubAdmins can add shows)" })
  @ApiResponse({ status: 201, description: "Show added successfully." })
  @ApiResponse({ status: 400, description: "Bad Request. Validation failed." })
  @ApiResponse({
    status: 403,
    description: "Forbidden. Only SubAdmins can add shows.",
  })
  @ApiResponse({
    status: 409,
    description: "Conflict. A show already exists in this time slot.",
  })
  async addShow(@Body() createShowDto: CreateShowDto, @Req() req) {
    const ownerId = req.user.id;
    return this.showService.addShow(createShowDto, ownerId, req.url);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin, Role.SuperAdmin)
  @Get("list")
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
    const user = req.user;
    const isSubAdmin = user?.role === Role.SubAdmin;
    const ownerId = isSubAdmin ? user.id : null;

    return this.showService.listShows({
      ownerId,
      path: req.url,
      startDate,
      theaterId,
      screenId,
      movieId,
    });
  }

  @Get("details/:showId")
  @ApiOperation({ summary: "Get details of a specific show" })
  @ApiResponse({
    status: 200,
    description: "Show details retrieved successfully.",
  })
  @ApiResponse({ status: 404, description: "Show not found." })
  async getShowDetails(@Param("showId") showId: string, @Req() req) {
    return this.showService.getShowDetails(showId, req.url);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Put("update/:showId")
  @ApiOperation({ summary: "Update show details (Only SubAdmins)" })
  @ApiResponse({ status: 200, description: "Show updated successfully." })
  @ApiResponse({ status: 404, description: "Show not found." })
  async updateShow(
    @Param("showId") showId: string,
    @Body() updateShowDto: UpdateShowDto,
    @Req() req
  ) {
    return this.showService.updateShow(showId, updateShowDto, req.url);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Put("status/:showId")
  @ApiOperation({ summary: "Update show status (Only SubAdmins)" })
  @ApiResponse({
    status: 200,
    description: "Show status updated successfully.",
  })
  @ApiResponse({ status: 404, description: "Show not found." })
  @ApiBody({
    type: UpdateShowStatusDto,
  })
  async manageShowStatus(
    @Param("showId") showId: string,
    @Body("status") status: ShowStatusEnum,
    @Req() req
  ) {
    return this.showService.manageShowStatus(showId, status, req.url);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Delete("delete/:showId")
  @ApiOperation({ summary: "Soft delete a show (Only SubAdmins)" })
  @ApiResponse({ status: 200, description: "Show deleted successfully." })
  @ApiResponse({ status: 404, description: "Show not found." })
  async deleteShow(@Param("showId") showId: string, @Req() req) {
    return this.showService.deleteShow(showId, req.url);
  }
}
