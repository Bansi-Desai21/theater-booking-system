import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  HttpStatus,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Show, ShowDocument, ShowStatusEnum } from "../schemas/shows.schema";
import { CreateShowDto, UpdateShowDto } from "../dtos/show.dto";
import { Theater, TheaterDocument } from "../schemas/theater.schema";
import {
  EnhancedHttpException,
  createResponse,
} from "../utils/helper.response.function";

@Injectable()
export class ShowService {
  constructor(
    @InjectModel(Show.name) private readonly showModel: Model<ShowDocument>,
    @InjectModel(Theater.name)
    private readonly theaterModel: Model<TheaterDocument>
  ) {}

  async addShow(createShowDto: CreateShowDto, ownerId: string, path: string) {
    try {
      const { movieId, screenId, theaterId, startTime, endTime, ticketPrice } =
        createShowDto;

      const theater = await this.theaterModel.findOne({
        _id: new Types.ObjectId(theaterId),
        ownerId: new Types.ObjectId(ownerId),
      });
      if (!theater) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: "Theater not found or does not belong to you.",
          path,
        });
      }

      const overlappingShow = await this.showModel.findOne({
        screenId: new Types.ObjectId(screenId),
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      });

      if (overlappingShow) {
        throw new ConflictException({
          statusCode: 409,
          success: false,
          message: "A show already exists in this time slot.",
          path,
        });
      }

      const show = await this.showModel.create({
        movieId: new Types.ObjectId(movieId),
        screenId: new Types.ObjectId(screenId),
        theaterId: new Types.ObjectId(theaterId),
        startTime,
        endTime,
        ticketPrice,
        status: ShowStatusEnum.ACTIVE,
      });
      return createResponse(201, true, "Show added successfully!", show);
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async listShows(theaterId: string, path: string) {
    try {
      const shows = await this.showModel
        .find({ theaterId: new Types.ObjectId(theaterId) })
        .populate("movieId screenId theaterId");
      return createResponse(200, true, "Shows retrieved successfully!", shows);
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getShowDetails(showId: string, path: string) {
    try {
      const show = await this.showModel
        .findById(new Types.ObjectId(showId))
        .populate("movieId screenId theaterId");
      if (!show) {
        throw new NotFoundException("Show not found");
      }
      return createResponse(
        200,
        true,
        "Show details retrieved successfully!",
        show
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateShow(showId: string, updateShowDto: UpdateShowDto, path: string) {
    try {
      const updatedShow = await this.showModel.findByIdAndUpdate(
        new Types.ObjectId(showId),
        updateShowDto,
        { new: true }
      );
      if (!updatedShow) {
        throw new NotFoundException("Show not found");
      }
      return createResponse(
        200,
        true,
        "Show updated successfully!",
        updatedShow
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async manageShowStatus(showId: string, status: ShowStatusEnum, path: string) {
    try {
      const updatedShow = await this.showModel.findByIdAndUpdate(
        new Types.ObjectId(showId),
        { status },
        { new: true }
      );
      if (!updatedShow) {
        throw new NotFoundException("Show not found");
      }
      return createResponse(
        200,
        true,
        "Show status updated successfully!",
        updatedShow
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteShow(showId: string, path: string) {
    const show = await this.showModel.findById(showId);
    if (!show) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: "Show not found.",
        path: path,
      });
    }
    show.isRemoved = true;
    await show.save();
    return {
      statusCode: 200,
      success: true,
      message: "Show deleted successfully.",
    };
  }
}
