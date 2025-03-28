import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  SeatLayout,
  SeatLayoutDocument,
} from "../../schemas/seat-layout.schema";
import { Screen, ScreenDocument } from "../../schemas/screen.schema";
import {
  CreateSeatLayoutDto,
  UpdateSeatAvailabilityDto,
  UpdateSeatLayoutDto,
} from "../dtos/seat.dto";
import { SeatType } from "../utils/seats.enum";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";

@Injectable()
export class SeatLayoutService {
  constructor(
    @InjectModel(SeatLayout.name)
    private seatLayoutModel: Model<SeatLayoutDocument>,
    @InjectModel(Screen.name) private screenModel: Model<ScreenDocument>
  ) {}

  async createSeatLayout(dto: CreateSeatLayoutDto, path: string) {
    try {
      const screen = await this.screenModel.findById(dto.screenId);
      if (!screen) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Screen not found.",
          path,
        });
      }

      const seats: {
        row: string;
        seatNumber: number;
        type: SeatType;
        price: number;
        isAvailable: boolean;
      }[] = [];
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const { rows, cols, defaultRegularPrice, seats: tiers = [] } = dto;

      // Sort seats from bottom: VIP -> Premium -> Regular
      const tierPriority = { vip: 3, premium: 2, regular: 1 };
      const sortedTiers = tiers.sort(
        (a, b) => (tierPriority[b.type] ?? 0) - (tierPriority[a.type] ?? 0)
      );

      const rowTypes: { type: SeatType; price: number }[] = Array(rows)
        .fill(null)
        .map(() => ({
          type: SeatType.REGULAR,
          price: defaultRegularPrice,
        }));

      let currentRow = rows;
      for (const { row: count, type, price } of sortedTiers) {
        for (let i = currentRow - count; i < currentRow; i++) {
          rowTypes[i] = { type, price };
        }
        currentRow -= count;
      }

      function getRowLabel(index: number): string {
        let label = "";
        while (index >= 0) {
          label = String.fromCharCode((index % 26) + 65) + label;
          index = Math.floor(index / 26) - 1;
        }
        return label;
      }

      for (let r = 0; r < rows; r++) {
        const rowLabel = getRowLabel(r);
        const { type, price } = rowTypes[r];

        for (let c = 1; c <= cols; c++) {
          seats.push({
            row: rowLabel,
            seatNumber: c,
            type,
            price,
            isAvailable: true,
          });
        }
      }

      const seatLayout = await this.seatLayoutModel.create({
        screenId: new Types.ObjectId(dto.screenId),
        theaterId: new Types.ObjectId(screen.theaterId),
        defaultRegularPrice,
        rows,
        cols,
        seats,
      });

      screen.seatLayoutId = seatLayout._id as unknown as string;
      screen.totalSeats = seatLayout.seats.length;
      screen.isComplete = true;
      await screen.save();

      return createResponse(
        201,
        true,
        "Seat Layout added successfully!",
        seatLayout
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

  async getSeatLayoutByScreenId(screenId: string, path: string) {
    try {
      const seatLayout = await this.seatLayoutModel.findOne({
        screenId: new Types.ObjectId(screenId),
      });

      if (!seatLayout) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Seat layout not found.",
          path,
        });
      }

      return createResponse(
        200,
        true,
        "Seat layout fetched successfully.",
        seatLayout
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

  async updateSeatLayout(
    seatLayoutId: string,
    dto: UpdateSeatLayoutDto,
    path: string
  ) {
    try {
      const seatLayout = await this.seatLayoutModel.findById(seatLayoutId);
      if (!seatLayout) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Seat layout not found.",
          path,
        });
      }

      // Update row and column counts
      if (dto.rows) seatLayout.rows = dto.rows;
      if (dto.cols) seatLayout.cols = dto.cols;

      // Create a seat map from the existing seats
      const seatMap = new Map();
      for (const seat of seatLayout.seats) {
        const key = `${seat.row}-${seat.seatNumber}`;
        seatMap.set(key, seat);
      }

      // Merge incoming updates into the seatMap
      for (const seat of dto.seats || []) {
        const key = `${seat.row}-${seat.seatNumber}`;
        seatMap.set(key, { ...seat });
      }

      // Regenerate the full seat layout
      const seats: {
        row: string;
        seatNumber: number;
        type: SeatType;
        price: number;
        isAvailable: boolean;
      }[] = [];

      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      for (let r = 0; r < seatLayout.rows; r++) {
        const rowLabel = alphabet[r];
        for (let c = 1; c <= seatLayout.cols; c++) {
          const key = `${rowLabel}-${c}`;
          if (seatMap.has(key)) {
            seats.push(seatMap.get(key));
          } else {
            seats.push({
              row: rowLabel,
              seatNumber: c,
              type: SeatType.REGULAR,
              price: dto.defaultRegularPrice || seatLayout.defaultRegularPrice,
              isAvailable: true,
            });
          }
        }
      }

      seatLayout.seats = seats;
      await seatLayout.save();

      return createResponse(
        200,
        true,
        "Seat layout updated successfully.",
        seatLayout
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

  async deleteSeatLayout(seatLayoutId: string, path: string) {
    try {
      const seatLayout = await this.seatLayoutModel.findById(seatLayoutId);
      if (!seatLayout) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Seat layout not found.",
          path,
        });
      }
      await this.screenModel.findOneAndUpdate(
        { _id: seatLayout.screenId },
        { $set: { seatLayoutId: null } },
        { new: true }
      );

      await this.seatLayoutModel.deleteOne({ _id: seatLayoutId });

      return createResponse(200, true, "Seat layout deleted successfully.");
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

  async updateSeatAvailability(
    seatLayoutId: string,
    dto: UpdateSeatAvailabilityDto,
    path: string
  ) {
    try {
      const seatLayout = await this.seatLayoutModel.findById(seatLayoutId);
      if (!seatLayout)
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Seat layout not found.",
          path,
        });

      const seatMap = new Map(
        seatLayout.seats.map((seat) => [`${seat.row}-${seat.seatNumber}`, seat])
      );

      for (const seatUpdate of dto.seats) {
        const key = `${seatUpdate.row}-${seatUpdate.seatNumber}`;
        if (seatMap.has(key)) {
          seatMap.get(key)!.isAvailable = seatUpdate.isAvailable;
        }
      }

      seatLayout.seats = Array.from(seatMap.values());
      await seatLayout.save();

      return createResponse(
        200,
        true,
        "Seat availability updated successfully!",
        seatLayout
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
}
