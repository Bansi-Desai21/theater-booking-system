import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
  Query,
  Patch,
  Delete,
} from "@nestjs/common";
import { TheaterService } from "./theater.service";
import { CreateTheaterDto, UpdateTheaterDto } from "../dtos/theater.dto";
import { RolesGuard } from "../middlewares/roles.guard";
import { Role, Roles } from "../utils/roles.enum";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@ApiTags("Theaters")
@ApiBearerAuth()
@Controller("theaters")
export class TheaterController {
  constructor(private readonly theaterService: TheaterService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Post("add-theater")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Add a new theater (Only SubAdmins can add theaters)",
  })
  @ApiResponse({ status: 201, description: "Theater added successfully." })
  @ApiResponse({ status: 400, description: "Bad Request. Validation failed." })
  @ApiResponse({
    status: 403,
    description: "Forbidden. Only SubAdmins can add theaters.",
  })
  @ApiResponse({
    status: 409,
    description: "Conflict. Theater with this name already exists.",
  })
  async addTheater(@Body() createTheaterDto: CreateTheaterDto, @Req() req) {
    const ownerId = req.user.id;
    createTheaterDto.image = req.body.image;
    return this.theaterService.addTheater(createTheaterDto, ownerId, req.url);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin, Role.SuperAdmin)
  @Get("get-detail-of-theater/:id")
  @ApiOperation({ summary: "Get details of a theater by ID" })
  @ApiParam({
    name: "id",
    example: "65d4e6a1c7b3a12f4e56789a",
    description: "Theater ID",
  })
  @ApiResponse({
    status: 200,
    description: "Theater details retrieved successfully.",
  })
  @ApiResponse({ status: 404, description: "Theater not found." })
  async getTheaterDetails(@Param("id") id: string, @Req() req) {
    return this.theaterService.getTheaterById(id, req.url);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin, Role.SuperAdmin)
  @Get()
  @ApiOperation({ summary: "List all theaters with optional pagination" })
  @ApiQuery({
    name: "page",
    required: false,
    example: 1,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    example: 10,
    description: "Items per page (default: 10)",
  })
  @ApiQuery({
    name: "ownerId",
    type: String,
    example: "65cda43bfc13ae1d4f7f5b6c",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "List of theaters retrieved successfully.",
  })
  async listTheaters(
    @Query("ownerId") ownerId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Req() req
  ) {
    return this.theaterService.getAllTheaters(
      Number(page),
      Number(limit),
      req.user,
      req.url,
      ownerId
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @ApiConsumes("multipart/form-data")
  @Patch("update-theater/:id")
  @ApiOperation({
    summary:
      "Update theater details (Only SubAdmins can update their theaters)",
  })
  @ApiParam({
    name: "id",
    example: "65d4e6a1c7b3a12f4e56789a",
    description: "Theater ID",
  })
  @ApiResponse({ status: 200, description: "Theater updated successfully." })
  @ApiResponse({ status: 400, description: "Bad Request. Validation failed." })
  @ApiResponse({
    status: 403,
    description: "Forbidden. Only SubAdmins can update theaters.",
  })
  @ApiResponse({ status: 404, description: "Theater not found." })
  async updateTheater(
    @Param("id") id: string,
    @Body() updateTheaterDto: UpdateTheaterDto,
    @Req() req
  ) {
    const ownerId = req.user.id;
    return this.theaterService.updateTheater(
      id,
      ownerId,
      updateTheaterDto,
      req.url,
      req.body.image
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin, Role.SuperAdmin)
  @Patch("status/:theaterId")
  @ApiParam({
    name: "theaterId",
    example: "65d4e6a1c7b3a12f4e56789a",
    description: "Theater ID",
  })
  @ApiOperation({ summary: "Activate/Deactivate a theater" })
  @ApiResponse({
    status: 200,
    description: "Theater status updated successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Unauthorized: Only owner can update",
  })
  @ApiResponse({ status: 404, description: "Theater not found" })
  async updateTheaterStatus(@Param("theaterId") theaterId: string, @Req() req) {
    return this.theaterService.updateTheaterStatus(
      req["user"],
      theaterId,
      req.url
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SubAdmin)
  @Delete("delete-theater/:theaterId")
  @ApiParam({
    name: "theaterId",
    example: "65d4e6a1c7b3a12f4e56789a",
    description: "Theater ID",
  })
  @ApiOperation({ summary: "Soft delete a theater" })
  @ApiResponse({
    status: 200,
    description: "Theater deleted successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Unauthorized: Only the owner can delete",
  })
  @ApiResponse({ status: 404, description: "Theater not found" })
  async softDeleteTheater(@Param("theaterId") theaterId: string, @Req() req) {
    return this.theaterService.deleteTheater(
      theaterId,
      req["user"].id,
      req.url
    );
  }
}
