import { Controller, Get, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CitiesService } from "./cities.service";

@ApiTags("Cities")
@Controller("cities")
export class CityController {
  constructor(private readonly cityService: CitiesService) {}

  @Get("list-cities")
  @ApiOperation({ summary: "Get list of cities" })
  @ApiResponse({
    status: 200,
    description: "List of cities retrieved successfully",
  })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async getAllCities(@Req() req) {
    return this.cityService.getAllCities(req.url);
  }
}
