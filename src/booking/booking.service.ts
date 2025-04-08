import { HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, startSession, Types, PipelineStage } from "mongoose";
import {
  SeatLayout,
  SeatLayoutDocument,
} from "../../schemas/seat-layout.schema";
import { BookingGateway } from "./booking.gateway";
import { Booking, BookingDocument } from "../../schemas/booking.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import { BookSeatsDto } from "src/dtos/booking.dto";

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(SeatLayout.name)
    private seatLayoutModel: Model<SeatLayoutDocument>,
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,
    private readonly bookingGateway: BookingGateway
  ) {}

  async bookSeats(dto: BookSeatsDto, userId: string, path: string) {
    try {
      const { seatIds, showId } = dto;
      const seatLayout = await this.seatLayoutModel.findOne({
        "seats._id": { $in: seatIds.map((id) => new Types.ObjectId(id)) },
      });

      if (!seatLayout) {
        return { success: false, message: "Seat layout not found" };
      }

      const selectedSeats = seatLayout.seats.filter(
        (seat: any) =>
          seatIds.includes(seat._id.toString()) &&
          seat.isAvailable &&
          !seat.isBooked
      );

      if (selectedSeats.length !== seatIds.length) {
        return { success: false, message: "Some seats are already booked" };
      }

      seatLayout.seats = seatLayout.seats.map((seat) => {
        if (seatIds.includes((seat as any)._id.toString())) {
          seat.isBooked = true;
        }
        return seat;
      });

      await seatLayout.save();

      const totalAmount = selectedSeats.reduce(
        (sum, seat) => sum + seat.price,
        0
      );

      const booking = await this.bookingModel.create({
        userId: new Types.ObjectId(userId),
        seatIds,
        screenId: seatLayout.screenId,
        theaterId: seatLayout.theaterId,
        seatLayoutId: seatLayout._id,
        showId: new Types.ObjectId(showId),
        totalAmount,
      });
      const bookingDeatils = await this.bookingModel
        .findOne({ _id: new Types.ObjectId(booking._id as string) })
        .populate("userId", "-password")
        .populate("screenId")
        .populate("theaterId");
      // seatIds.forEach((id) => {
      //   this.bookingGateway.emitSeatBooked(id);
      // });
      const seatDetails = await this.seatLayoutModel.find({
        "seats._id": { $in: seatIds.map((id) => new Types.ObjectId(id)) },
      });

      return createResponse(
        200,
        true,
        "Seats booked successfully. Enjoy your show!.",
        {
          success: true,
          bookingDeatils,
          seatDetails: seatDetails.map((seatDoc) => {
            seatDoc.seats = seatDoc.seats
              .filter((seat) => seatIds.includes((seat as any)._id.toString()))
              .map((seat) => {
                seat.isBooked = true;
                return seat;
              });
            return seatDoc;
          }),
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

  async getBookingSummary(bookingId: string, path: string) {
    try {
      const booking = await this.bookingModel
        .findOne({ _id: new Types.ObjectId(bookingId) })
        .populate("userId", "-password")
        .populate("screenId")
        .populate("theaterId");

      if (!booking) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Booking not found.",
          path: path,
        });
      }

      const seatDetails = await this.seatLayoutModel.find({
        "seats._id": {
          $in: booking.seatIds.map((id) => new Types.ObjectId(id)),
        },
      });

      return createResponse(
        200,
        true,
        "Booking summary fetched successfully.",
        {
          success: true,
          booking,
          seatDetails: seatDetails.map((seatDoc) => {
            seatDoc.seats = seatDoc.seats.filter((seat) =>
              booking.seatIds.includes((seat as any)._id.toString())
            );
            return seatDoc;
          }),
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

  async getUserBookingHistory(
    userId: string,
    path: string,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const skip = (page - 1) * limit;

      const pipeline: PipelineStage[] = [
        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $match: {
                  userId: new Types.ObjectId(userId),
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  pipeline: [{ $project: { password: 0 } }],
                  as: "user",
                },
              },
              { $unwind: "$user" },
              {
                $lookup: {
                  from: "theaters",
                  localField: "theaterId",
                  foreignField: "_id",
                  as: "theater",
                },
              },
              { $unwind: "$theater" },
              {
                $lookup: {
                  from: "screens",
                  localField: "screenId",
                  foreignField: "_id",
                  as: "screen",
                },
              },
              { $unwind: "$screen" },
              {
                $lookup: {
                  from: "seatlayouts",
                  let: {
                    seatLayoutId: "$seatLayoutId",
                    seatIds: {
                      $map: {
                        input: "$seatIds",
                        as: "id",
                        in: { $toObjectId: "$$id" },
                      },
                    },
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$_id", "$$seatLayoutId"] },
                      },
                    },
                    {
                      $project: {
                        _id: 1,
                        seats: {
                          $filter: {
                            input: "$seats",
                            as: "seat",
                            cond: { $in: ["$$seat._id", "$$seatIds"] },
                          },
                        },
                      },
                    },
                  ],
                  as: "seatDetails",
                },
              },
              {
                $unwind: {
                  path: "$seatDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
        {
          $project: {
            bookings: "$data",
            totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
          },
        },
      ];

      const bookings = await this.bookingModel.aggregate(pipeline);
      return createResponse(
        200,
        true,
        "Booking history fetched successfully.",
        bookings
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

  async getAllBookingsForAdmin(
    path: string,
    query: {
      theaterId?: string;
      screenId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const { theaterId, screenId, page = 1, limit = 10 } = query;

      const filter: any = {};

      if (theaterId) filter.theaterId = new Types.ObjectId(theaterId);
      if (screenId) filter.screenId = new Types.ObjectId(screenId);

      const skip = (page - 1) * limit;

      const pipeline: PipelineStage[] = [
        { $match: filter },

        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },

              {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  pipeline: [{ $project: { password: 0 } }],
                  as: "user",
                },
              },
              { $unwind: "$user" },

              {
                $lookup: {
                  from: "theaters",
                  localField: "theaterId",
                  foreignField: "_id",
                  as: "theater",
                },
              },
              { $unwind: "$theater" },

              {
                $lookup: {
                  from: "screens",
                  localField: "screenId",
                  foreignField: "_id",
                  as: "screen",
                },
              },
              { $unwind: "$screen" },

              {
                $lookup: {
                  from: "seatlayouts",
                  let: {
                    seatLayoutId: "$seatLayoutId",
                    seatIds: {
                      $map: {
                        input: "$seatIds",
                        as: "id",
                        in: { $toObjectId: "$$id" },
                      },
                    },
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$_id", "$$seatLayoutId"] },
                      },
                    },
                    {
                      $project: {
                        _id: 1,
                        seats: {
                          $filter: {
                            input: "$seats",
                            as: "seat",
                            cond: { $in: ["$$seat._id", "$$seatIds"] },
                          },
                        },
                      },
                    },
                  ],
                  as: "seatDetails",
                },
              },
              {
                $unwind: {
                  path: "$seatDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],

            totalCount: [{ $match: filter }, { $count: "count" }],
          },
        },
        {
          $project: {
            bookings: "$data",
            totalCount: {
              $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
            },
          },
        },
      ];

      const bookings = await this.bookingModel.aggregate(pipeline);

      return createResponse(
        200,
        true,
        "Booking list fetched successfully.",
        bookings
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
