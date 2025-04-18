import {
  Injectable,
  ConflictException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateScreenDto, UpdateScreenDto } from "../dtos/screen.dto";
import { Screen, ScreenDocument } from "../../schemas/screen.schema";
import { Theater, TheaterDocument } from "../../schemas/theater.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import { Show, ShowDocument, ShowStatusEnum } from "../../schemas/shows.schema";
import {
  SeatLayout,
  SeatLayoutDocument,
} from "../../schemas/seat-layout.schema";

@Injectable()
export class ScreenService {
  constructor(
    @InjectModel(Screen.name) private screenModel: Model<ScreenDocument>,
    @InjectModel(Theater.name) private theaterModel: Model<TheaterDocument>,
    @InjectModel(Show.name) private showModel: Model<ShowDocument>,
    @InjectModel(SeatLayout.name)
    private seatLayoutModel: Model<SeatLayoutDocument>
  ) {}

  async addScreen(
    createScreenDto: CreateScreenDto,
    ownerId: string,
    path: string
  ) {
    try {
      const { name, totalSeats, theaterId } = createScreenDto;

      const theater = await this.theaterModel.findOne({
        _id: new Types.ObjectId(theaterId),
        ownerId: new Types.ObjectId(ownerId),
      });

      if (!theater) {
        throw new BadRequestException({
          statusCode: 400,
          success: false,
          message: "Theater not found or does not belong to you.",
          path: path,
        });
      }

      const normalizeName = (name: string) =>
        name
          .trim()
          .toLowerCase()
          .replace(/[-\s]+/g, "");

      const existingScreen = await this.screenModel.findOne({
        theaterId: new Types.ObjectId(theaterId),
        isRemoved: false,
        $expr: {
          $eq: [
            {
              $replaceAll: {
                input: { $toLower: "$name" },
                find: " ",
                replacement: "",
              },
            },
            normalizeName(name),
          ],
        },
      });

      if (existingScreen) {
        throw new ConflictException({
          statusCode: 409,
          success: false,
          message: "A screen with this name already exists in this theater.",
          path: path,
        });
      }

      const screen = await this.screenModel.create({
        name,
        totalSeats,
        theaterId: new Types.ObjectId(theaterId),
      });
      if (screen) {
        await this.theaterModel.findOneAndUpdate(
          { _id: new Types.ObjectId(theaterId) },
          { $inc: { no_of_screens: 1 } }
        );
      }
      return createResponse(201, true, "Screen added successfully!", screen);
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

  async getScreenDetails(screenId: string, path: string) {
    try {
      const screen = await this.screenModel.findById(screenId).populate({
        path: "theaterId",
        populate: {
          path: "ownerId",
          model: "User",
          select: "-password",
        },
      });

      if (!screen) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Screen not found.",
        });
      }
      return createResponse(
        200,
        true,
        "Screen details retrieved successfully!",
        screen
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

  async listScreens({
    theaterId,
    page,
    limit,
    isComplete,
    isActive,
    path,
  }: {
    theaterId: string;
    page: number;
    limit: number;
    isComplete?: Boolean;
    isActive?: Boolean;
    path: string;
  }) {
    try {
      const skip = (page - 1) * limit;
      let query = {
        theaterId: new Types.ObjectId(theaterId),
      };
      isActive = Boolean(isActive);
      isComplete = Boolean(isComplete);

      if (isComplete) query["isComplete"] = isComplete;
      if (isActive) query["isActive"] = isActive;

      const [screens, total] = await Promise.all([
        this.screenModel
          .find(query)
          .populate("seatLayoutId")
          .skip(skip)
          .limit(limit),
        this.screenModel.countDocuments(query),
      ]);
      const theaterData = await this.theaterModel
        .findById(theaterId)
        .populate("city")
        .populate("ownerId", "-password");
      return createResponse(200, true, "Screens retrieved successfully!", {
        screens,
        total,
        theaterData,
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

  async updateScreen(
    screenId: string,
    updateScreenDto: UpdateScreenDto,
    path: string
  ) {
    try {
      const screen = await this.screenModel.findById(screenId);
      if (!screen) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Screen not found.",
        });
      }

      const normalizeName = (name: string) =>
        name
          .trim()
          .toLowerCase()
          .replace(/[-\s]+/g, "");
      const existingScreen = await this.screenModel.findOne({
        _id: { $ne: new Types.ObjectId(screenId) },
        theaterId: new Types.ObjectId(screen.theaterId),
        isRemoved: false,
        $expr: {
          $eq: [
            {
              $replaceAll: {
                input: { $toLower: "$name" },
                find: " ",
                replacement: "",
              },
            },
            normalizeName(updateScreenDto.name || ""),
          ],
        },
      });

      if (existingScreen) {
        throw new ConflictException({
          statusCode: 409,
          success: false,
          message: "A Screen with this name already exists.",
          path: path,
        });
      }
      const updatedScreen = await this.screenModel.findByIdAndUpdate(
        screenId,
        updateScreenDto,
        { new: true }
      );
      return createResponse(
        200,
        true,
        "Screen updated successfully!",
        updatedScreen
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

  async deleteScreen(screenId: string, path: string) {
    try {
      const screen = await this.screenModel.findById(screenId);

      if (!screen) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Screen not found.",
          path: path,
        });
      }

      await this.screenModel.findByIdAndDelete({
        _id: new Types.ObjectId(screenId),
      });

      await this.seatLayoutModel.deleteMany({
        screenId: new Types.ObjectId(screenId),
      });

      await this.theaterModel.findOneAndUpdate(
        { _id: screen.theaterId },
        { $inc: { no_of_screens: -1 } }
      );

      return createResponse(200, true, "Screen deleted successfully!");
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

  async toggleScreenStatus({
    screenId,
    ownerId,
    path,
  }: {
    screenId: string;
    ownerId: string;
    path: string;
  }) {
    try {
      const screen = await this.screenModel.findById(screenId).populate({
        path: "theaterId",
        model: "Theater",
        select: "ownerId",
      });

      if (!screen) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "screen not found.",
        });
      }

      const theater = screen.theaterId as unknown as TheaterDocument;

      if (theater.ownerId.toString() !== ownerId) {
        throw new ForbiddenException({
          statusCode: 403,
          success: false,
          message: "You are not authorized to update this screen.",
        });
      }

      screen.isActive = !screen.isActive;
      await screen.save();
      if (!screen.isActive) {
        await this.showModel.updateMany(
          {
            screenId: new Types.ObjectId(screenId),
            status: { $ne: ShowStatusEnum.COMPLETED },
          },
          {
            $set: {
              status: ShowStatusEnum.CANCELLED,
            },
          }
        );
      }
      return createResponse(
        200,
        true,
        `Screen ${screen.isActive ? "activated" : "deactivated"} successfully.`,
        screen
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
