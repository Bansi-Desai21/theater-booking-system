import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { City } from "../schemas/cities.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "src/utils/helper.response.function";

@Injectable()
export class CitiesService {
  constructor(@InjectModel(City.name) private cityModel: Model<City>) {}

  async getAllCities(path: string) {
    try {
      const cities = await this.cityModel.find().exec();
      return createResponse(
        200,
        true,
        "List of cities retrieved successfully.",
        cities
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path: path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
