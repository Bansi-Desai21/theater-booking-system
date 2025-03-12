import {
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Query,
  Param,
} from "@nestjs/common";
import {
  ApiBearerAuth,
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

  @UseGuards(RolesGuard)
  @Roles(Role.SuperAdmin, Role.SubAdmin)
  @Get("list")
  @ApiOperation({
    summary:
      "Get movies based on filters (Now Showing, Popular, Top Rated, Upcoming) with pagination",
  })
  @ApiQuery({
    name: "category",
    required: false,
    type: String,
    enum: ["Now Showing", "Upcoming"],
  })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: "Movies retrieved successfully." })
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
}
