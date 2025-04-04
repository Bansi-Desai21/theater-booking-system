import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Show, ShowDocument, ShowStatusEnum } from "../../schemas/shows.schema";
import { CreateShowDto, UpdateShowDto } from "../dtos/show.dto";
import { Theater, TheaterDocument } from "../../schemas/theater.schema";
import {
  EnhancedHttpException,
  createResponse,
} from "../utils/helper.response.function";
import * as moment from "moment";
import { Movie, MovieDocument } from "../../schemas/movies.schema";

@Injectable()
export class ShowService {
  private readonly logger = new Logger(ShowService.name);

  constructor(
    @InjectModel(Show.name) private readonly showModel: Model<ShowDocument>,
    @InjectModel(Theater.name)
    private readonly theaterModel: Model<TheaterDocument>,
    @InjectModel(Movie.name) private readonly movieModel: Model<MovieDocument>
  ) {}

  async addShow(createShowDto: CreateShowDto, ownerId: string, path: string) {
    try {
      const {
        movieId,
        screenId,
        theaterId,
        showDate,
        startTime,
        ticketPrice,
        showEndDate,
      } = createShowDto;

      const parsedShowDate = moment(showDate).startOf("day").utc().toDate();
      const parsedShowEndDate = moment(showEndDate).endOf("day").utc().toDate();

      const parsedStartTime = moment(parsedShowDate)
        .set({
          hour: moment(startTime).hour(),
          minute: moment(startTime).minute(),
          second: 0,
          millisecond: 0,
        })
        .toDate();

      const movie = await this.movieModel.findById(movieId);
      if (!movie) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Movie not found.",
          path,
        });
      }

      if (!movie.duration) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: "Movie duration is missing.",
          path,
        });
      }

      if (new Date(showDate) < new Date(movie.releaseDate)) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: "Show date cannot be before the movie release date.",
          path,
        });
      }

      const parsedEndTime = moment(parsedStartTime)
        .add(movie.duration, "minutes")
        .toDate();

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

      if (!theater.isActive) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message:
            "Only active theaters can have new shows scheduled. Please reactivate the theater to proceed.",
          path,
        });
      }

      const overlappingShow = await this.showModel.findOne({
        screenId: new Types.ObjectId(screenId),
        showDate: { $lte: parsedShowEndDate },
        showEndDate: { $gte: parsedShowDate },
        startTime: { $lt: parsedEndTime },
        endTime: { $gt: parsedStartTime },
      });

      if (overlappingShow) {
        throw new ConflictException({
          statusCode: 409,
          success: false,
          message:
            "A show already exists in this time slot for the selected screen.",
          path,
        });
      }

      const showInstances: {
        movieId: Types.ObjectId;
        screenId: Types.ObjectId;
        theaterId: Types.ObjectId;
        showDate: Date;
        showEndDate: Date;
        startTime: Date;
        endTime: Date;
        ticketPrice: number;
        status: ShowStatusEnum;
        createdBy: Types.ObjectId;
      }[] = [];
      let currentDate = moment(parsedShowDate);

      while (currentDate.isSameOrBefore(parsedShowEndDate, "day")) {
        const dailyStartTime = moment(currentDate)
          .set({
            hour: moment(startTime).hour(),
            minute: moment(startTime).minute(),
            second: 0,
            millisecond: 0,
          })
          .toDate();

        const dailyEndTime = moment(dailyStartTime)
          .add(movie.duration, "minutes")
          .toDate();

        showInstances.push({
          movieId: new Types.ObjectId(movieId),
          screenId: new Types.ObjectId(screenId),
          theaterId: new Types.ObjectId(theaterId),
          showDate: currentDate.toDate(),
          showEndDate: parsedShowEndDate,
          startTime: dailyStartTime,
          endTime: dailyEndTime,
          ticketPrice,
          status: ShowStatusEnum.ACTIVE,
          createdBy: new Types.ObjectId(ownerId),
        });

        currentDate.add(1, "day");
      }

      const savedShows = await this.showModel.insertMany(showInstances);

      return createResponse(201, true, "Show added successfully!", savedShows);
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

  async listShows({
    ownerId,
    path,
    startDate,
    movieId,
    theaterId,
    screenId,
    isPublic,
  }: {
    ownerId?: string;
    path: string;
    startDate: Date;
    movieId?: string;
    theaterId?: string;
    screenId?: string;
    isPublic?: Boolean;
  }) {
    try {
      const filter: any = { showDate: startDate };

      if (theaterId) filter["theaterId"] = new Types.ObjectId(theaterId);
      if (screenId) filter["screenId"] = new Types.ObjectId(screenId);
      if (movieId) filter["movieId"] = new Types.ObjectId(movieId);

      if (isPublic) {
        filter["status"] = ShowStatusEnum.ACTIVE;
      } else if (ownerId) {
        filter["createdBy"] = new Types.ObjectId(ownerId);
      }

      const shows = await this.showModel
        .find(filter)
        .populate("movieId screenId theaterId")
        .populate("createdBy", "-password")
        .sort({ showDate: 1, startTime: 1 });

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
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Show not found.",
          path: path,
        });
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
      const { ticketPrice, status } = updateShowDto;

      const existingShow = await this.showModel.findById(showId);
      if (!existingShow) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Show not found.",
          path,
        });
      }

      const updateFields: any = {};

      if (ticketPrice !== undefined) {
        updateFields.ticketPrice = ticketPrice;
      }
      if (status) {
        updateFields.status = status;
      }
      if (Object.keys(updateFields).length === 0) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: "No valid fields to update.",
          path,
        });
      }

      const updatedShow = await this.showModel.findByIdAndUpdate(
        showId,
        updateFields,
        { new: true }
      );

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
      const findShow = await this.showModel.findById({
        _id: new Types.ObjectId(showId),
      });

      const CheckTheaterStatus = await this.theaterModel.findById({
        _id: new Types.ObjectId(findShow?.theaterId),
      });
      if (!CheckTheaterStatus?.isActive && status == ShowStatusEnum.ACTIVE) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message:
            "You cannot activate this show because the theater it belongs to is inactive.",
          path: path,
        });
      }
      const updatedShow = await this.showModel.findByIdAndUpdate(
        new Types.ObjectId(showId),
        { status },
        { new: true }
      );

      if (!updatedShow) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Show not found.",
          path: path,
        });
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
    await this.showModel.findByIdAndDelete(showId);
    return {
      statusCode: 200,
      success: true,
      message: "Show deleted successfully.",
    };
  }

  //Cron-job function
  async deleteOldShows() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deleteResult = await this.showModel.deleteMany({
      showDate: { $lt: today },
    });

    this.logger.log(`${deleteResult.deletedCount} old shows deleted.`);

    return {
      message: "Old shows deleted successfully.",
      deletedCount: deleteResult.deletedCount,
    };
  }

  async markShowsAsCompleted() {
    const now = new Date();

    const updateResult = await this.showModel.updateMany(
      { endTime: { $lt: now }, status: "ACTIVE" },
      { $set: { status: "COMPLETED" } }
    );

    this.logger.log(`${updateResult.modifiedCount} shows marked as COMPLETED.`);

    return {
      message: "Old shows marked as COMPLETED successfully.",
      modifiedCount: updateResult.modifiedCount,
    };
  }
}
