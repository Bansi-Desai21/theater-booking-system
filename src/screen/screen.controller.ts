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
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RolesGuard } from "../middlewares/roles.guard";
import { Roles } from "../utils/roles.enum";
import { Role } from "../utils/roles.enum";
import { ScreenService } from "./screen.service";
import { CreateScreenDto, UpdateScreenDto } from "../dtos/screen.dto";

@ApiTags("Screens")
@ApiBearerAuth()
@Controller("screens")
export class ScreenController {
  constructor(private readonly screenService: ScreenService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Post("add-screen")
  @ApiOperation({
    summary: "Add a new screen (Only SubAdmins can add screens)",
  })
  @ApiResponse({ status: 201, description: "Screen added successfully." })
  @ApiResponse({ status: 400, description: "Bad Request. Validation failed." })
  @ApiResponse({
    status: 403,
    description: "Forbidden. Only SubAdmins can add screens.",
  })
  @ApiResponse({
    status: 409,
    description: "Conflict. Screen with this name already exists.",
  })
  async addScreen(@Body() createScreenDto: CreateScreenDto, @Req() req) {
    const ownerId = req.user.id;
    return this.screenService.addScreen(createScreenDto, ownerId, req.url);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin, Role.SuperAdmin)
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

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin, Role.SuperAdmin)
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

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Put("update-screen/:id")
  @ApiOperation({ summary: "Update screen details" })
  @ApiResponse({ status: 200, description: "Screen updated successfully." })
  @ApiResponse({ status: 404, description: "Screen not found." })
  async updateScreen(
    @Param("id") screenId: string,
    @Body() updateScreenDto: UpdateScreenDto,
    @Req() req
  ) {
    return this.screenService.updateScreen(screenId, updateScreenDto, req.url);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Delete("delete-screen/:id")
  @ApiOperation({ summary: "Delete a screen" })
  @ApiResponse({ status: 200, description: "Screen deleted successfully." })
  @ApiResponse({ status: 404, description: "Screen not found." })
  async deleteScreen(@Param("id") screenId: string, @Req() req) {
    return this.screenService.deleteScreen(screenId, req.url);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Patch("screen-status/:id")
  @ApiOperation({ summary: "Activate or Deactivate a screen" })
  @ApiResponse({
    status: 200,
    description: "Screen status updated successfully.",
  })
  @ApiResponse({ status: 404, description: "Screen not found." })
  async toggleScreenStatus(@Param("id") screenId: string, @Req() req) {
    return this.screenService.toggleScreenStatus({
      screenId: screenId,
      ownerId: req["user"].id,
      path: req.url,
    });
  }
}
