import {
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Query,
  Param,
  Put,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { MovieService } from "./movies.service";
import { Roles, Role } from "../utils/roles.enum";
import { RolesGuard } from "../middlewares/roles.guard";

@ApiTags("Movies")
@ApiBearerAuth()
@Controller("movies")
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SuperAdmin)
  @Post("sync-movies")
  @ApiOperation({
    summary: "Sync movies from TMDb (Only SuperAdmins can sync)",
  })
  @ApiResponse({ status: 200, description: "Movies synced successfully." })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async syncMovies(@Req() req) {
    return this.movieService.syncMovies(req.url);
  }

  @Get("list")
  @ApiOperation({
    summary: "Get movies based on filters (Category, Language) with pagination",
  })
  @ApiQuery({
    name: "category",
    required: false,
    type: String,
    enum: ["Now Showing", "Upcoming"],
    description: "Filter movies by category",
  })
  @ApiQuery({
    name: "language",
    required: false,
    type: String,
    enum: ["en", "hi", "gu"],
    description: "Filter movies by language",
  })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: "Movies retrieved successfully." })
  @ApiResponse({ status: 400, description: "Invalid query parameters" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async listMovies(@Req() req, @Query() query) {
    return this.movieService.listMovies(req.url, query);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SuperAdmin, Role.SubAdmin)
  @Get(":id")
  @ApiOperation({ summary: "Get a single movie by ID" })
  @ApiParam({
    name: "id",
    required: true,
    type: String,
    example: "65fabc1234abcd5678efgh90",
  })
  @ApiResponse({ status: 200, description: "Movie retrieved successfully." })
  @ApiResponse({ status: 404, description: "Movie not found." })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async getMovieById(@Req() req, @Param("id") movieId: string) {
    return this.movieService.getMovieById(req.url, movieId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SuperAdmin, Role.SubAdmin)
  @Put("update-movie/:id")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOperation({ summary: "Update movie details manually (including poster)" })
  @ApiResponse({
    status: 400,
    description: "You can't update the original poster from TMDb.",
  })
  @ApiResponse({ status: 200, description: "Movie updated successfully." })
  @ApiResponse({ status: 404, description: "Movie not found." })
  @ApiResponse({ status: 500, description: "Internal Server Error." })
  async updateMovie(@Param("id") movieId: string, @Req() req) {
    return this.movieService.updateMovie(movieId, req.body.image, req.url);
  }
}
