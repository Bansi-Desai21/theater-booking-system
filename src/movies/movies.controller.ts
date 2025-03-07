import { Controller, Post, UseGuards, Req, Get } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
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
    summary: "Get movies within the previous 60 days and the next 60 days",
  })
  @ApiResponse({ status: 200, description: "Movies retrieved successfully." })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async listMovies(@Req() req) {
    return this.movieService.listMovies(req.url);
  }
}
