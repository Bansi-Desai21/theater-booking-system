import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
  Query,
} from "@nestjs/common";
import { TheaterService } from "./theater.service";
import { CreateTheaterDto } from "../dtos/createTheater.dto";
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
  @Roles(Role.SubAdmin)
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
  @ApiResponse({
    status: 200,
    description: "List of theaters retrieved successfully.",
  })
  async listTheaters(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Req() req
  ) {
    return this.theaterService.getAllTheaters(
      Number(page),
      Number(limit),
      req.user,
      req.url
    );
  }
}
