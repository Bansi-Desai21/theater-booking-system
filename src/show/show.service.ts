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
import * as moment from "moment";
import { Movie, MovieDocument } from "../schemas/movies.schema";

@Injectable()
export class ShowService {
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

      const parsedShowDate = moment(showDate).utc().startOf("day").toDate();
      const parsedShowEndDate = moment(showEndDate).utc().endOf("day").toDate();

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

  async listShows(path: string, screenId?: string, theaterId?: string) {
    try {
      const filter: any = theaterId
        ? { theaterId: new Types.ObjectId(theaterId) }
        : { screenId: new Types.ObjectId(screenId) };

      const shows = await this.showModel
        .find(filter)
        .populate("movieId screenId theaterId")
        .populate("createdBy", "-password");
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
      const { showDate, startTime, ticketPrice } = updateShowDto;

      const existingShow = await this.showModel.findById(showId);
      if (!existingShow) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Show not found.",
          path,
        });
      }

      let parsedShowDate = existingShow.showDate;
      if (showDate) {
        parsedShowDate = moment.utc(showDate).startOf("day").toDate();
      }

      let parsedStartTime = existingShow.startTime;
      let parsedEndTime = existingShow.endTime;

      if (startTime) {
        const movie = await this.movieModel.findById(
          existingShow.movieId || existingShow.movieId
        );
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

        parsedStartTime = moment
          .utc(parsedShowDate)
          .set({
            hour: moment.utc(startTime).hour(),
            minute: moment.utc(startTime).minute(),
            second: 0,
            millisecond: 0,
          })
          .toDate();

        parsedEndTime = moment
          .utc(parsedStartTime)
          .add(movie.duration, "minutes")
          .toDate();
      }

      const overlappingShow = await this.showModel.findOne({
        screenId: existingShow.screenId,
        showDate: parsedShowDate,
        startTime: { $lt: parsedEndTime },
        endTime: { $gt: parsedStartTime },
        _id: { $ne: showId },
      });

      if (overlappingShow) {
        throw new ConflictException({
          statusCode: 409,
          success: false,
          message: "A show already exists in this time slot.",
          path,
        });
      }

      const updatedShow = await this.showModel.findByIdAndUpdate(
        showId,
        {
          ...(showDate && { showDate: parsedShowDate }),
          ...(startTime && {
            startTime: parsedStartTime,
            endTime: parsedEndTime,
          }),
          ...(ticketPrice !== undefined && { ticketPrice }),
        },
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
