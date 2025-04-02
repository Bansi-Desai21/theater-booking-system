import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Theater } from "../../schemas/theater.schema";

import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";

@Injectable()
export class UserDashboardService {
  constructor(
    @InjectModel(Theater.name) private readonly theaterModel: Model<Theater>
  ) {}

  async getTheatersByMovie(
    movieId: string,
    date: Date,
    page: number,
    limit: number,
    path: string
  ) {
    try {
      const skip = (page - 1) * limit;

      const result = await this.theaterModel.aggregate([
        {
          $match: {
            isActive: true,
            isRemoved: false,
          },
        },
        {
          $lookup: {
            from: "shows",
            localField: "_id",
            foreignField: "theaterId",
            as: "shows",
            pipeline: [
              {
                $match: {
                  movieId: new Types.ObjectId(movieId),
                  status: "ACTIVE",
                  showDate: new Date(date),
                },
              },
              {
                $project: {
                  screenId: 1,
                  showDate: 1,
                  showEndDate: 1,
                  startTime: 1,
                  endTime: 1,
                  ticketPrice: 1,
                },
              },
            ],
          },
        },
        {
          $match: {
            shows: { $ne: [] },
          },
        },
        {
          $lookup: {
            from: "seatlayouts",
            localField: "_id",
            foreignField: "theaterId",
            as: "seatLayouts",
          },
        },
        {
          $addFields: {
            seatTypes: {
              $reduce: {
                input: "$seatLayouts",
                initialValue: [],
                in: {
                  $setUnion: ["$$value", "$$this.seats.type"],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            location: 1,
            seatTypes: 1,
            shows: 1,
          },
        },
        {
          $facet: {
            totalRecords: [{ $count: "count" }],
            theaters: [{ $skip: skip }, { $limit: limit }],
          },
        },
      ]);

      const totalRecords = result[0].totalRecords.length
        ? result[0].totalRecords[0].count
        : 0;

      return createResponse(200, true, "Theaters retrieved successfully!", {
        theaters: result[0].theaters,
        totalRecords,
      });
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
