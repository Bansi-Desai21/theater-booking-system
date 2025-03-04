import {
  Injectable,
  ConflictException,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateTheaterDto } from "../dtos/createTheater.dto";
import { Theater } from "../schemas/theater.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import { AuthUserdDto } from "../dtos/user.dto";
import { Role } from "../utils/roles.enum";

@Injectable()
export class TheaterService {
  constructor(@InjectModel("Theater") private theaterModel: Model<Theater>) {}

  async addTheater(
    createTheaterDto: CreateTheaterDto,
    ownerId: string,
    path: string
  ) {
    try {
      const { name, location, city, no_of_screens, image } = createTheaterDto;

      const existingTheater = await this.theaterModel.findOne({
        name,
        location,
        ownerId: new Types.ObjectId(ownerId),
      });
      if (existingTheater) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          success: false,
          message: "A theater with this name already exists.",
          path: path,
        });
      }

      const theater = await this.theaterModel.create({
        name,
        location,
        city,
        no_of_screens,
        ownerId: new Types.ObjectId(ownerId),
        image,
      });

      return createResponse(
        HttpStatus.CREATED,
        true,
        "Theater added successfully!",
        theater
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

  async getTheaterById(id: string, path: string) {
    try {
      const theater = await this.theaterModel
        .findById(id)
        .populate("ownerId", "-password");
      if (!theater) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Theater not found.",
        });
      }
      return createResponse(
        200,
        true,
        "Theater details retrieved successfully.",
        theater
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

  async getAllTheaters(
    page: number,
    limit: number,
    user: AuthUserdDto,
    path: string
  ) {
    try {
      const skip = (page - 1) * limit;
      let query = {};

      if (user.role === Role.SubAdmin) {
        query = {
          ownerId: new Types.ObjectId(user.id),
        };
      }

      const theaters = await this.theaterModel
        .find(query)
        .populate("ownerId", "-password")
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.theaterModel.countDocuments(query);

      return createResponse(
        200,
        true,
        "List of theaters retrieved successfully.",
        {
          total,
          theaters,
        }
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
