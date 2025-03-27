import {
  Injectable,
  ConflictException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateTheaterDto, UpdateTheaterDto } from "../dtos/theater.dto";
import { Theater, TheaterDocument } from "../../schemas/theater.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import { AuthUserDto } from "../dtos/user.dto";
import { Role } from "../utils/roles.enum";
import { User, UserDocument } from "../../schemas/user.schema";
import { Screen, ScreenDocument } from "../../schemas/screen.schema";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { Show, ShowDocument, ShowStatusEnum } from "../../schemas/shows.schema";
@Injectable()
export class TheaterService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Theater.name) private theaterModel: Model<TheaterDocument>,
    @InjectModel(Screen.name) private screenModel: Model<ScreenDocument>,
    @InjectModel(Show.name) private showModel: Model<ShowDocument>,

    private readonly cloudinaryService: CloudinaryService
  ) {}

  async addTheater(
    createTheaterDto: CreateTheaterDto,
    ownerId: string,
    path: string
  ) {
    try {
      const { name, location, city, no_of_screens, image } = createTheaterDto;

      const existingTheater = await this.theaterModel.findOne({
        name: {
          $regex: new RegExp(`^${name?.replace(/[-\s]/g, "[-\\s]*")}$`, "i"),
        },
        location,
        ownerId: new Types.ObjectId(ownerId),
        isRemoved: false,
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
        city: new Types.ObjectId(city),
        no_of_screens,
        ownerId: new Types.ObjectId(ownerId),
        image,
      });
      if (theater) {
        for (let i = 1; i <= no_of_screens; i++) {
          await this.screenModel.create({
            name: `Screen ${i}`,
            totalSeats: 0,
            theaterId: theater._id,
          });
        }
      }
      return createResponse(
        HttpStatus.CREATED,
        true,
        "Theater added successfully with screens!",
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
        .populate("ownerId", "-password")
        .populate("city");

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
    user: AuthUserDto,
    path: string,
    ownerId?: string
  ) {
    try {
      const skip = (page - 1) * limit;
      const ownerObjectId = new Types.ObjectId(ownerId);
      let query = { ownerId: ownerObjectId, isRemoved: false };

      if (user.role === Role.SubAdmin) {
        query = {
          ownerId: new Types.ObjectId(user.id),
          isRemoved: false,
        };
      }

      const theaters = await this.theaterModel
        .find(query)
        .populate("ownerId", "-password")
        .populate("city")
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.theaterModel.countDocuments(query);
      let owner = null;
      if (ownerId) {
        owner = await this.userModel.findById(
          { _id: ownerId },
          { password: 0 }
        );
      }

      return createResponse(
        200,
        true,
        "List of theaters retrieved successfully.",
        {
          total,
          theaters,
          owner,
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

  async updateTheater(
    id: string,
    ownerId: string,
    updateTheaterDto: UpdateTheaterDto,
    path: string,
    file?: any
  ) {
    try {
      let { name, location, city, no_of_screens, image } = updateTheaterDto;

      const theater = await this.theaterModel.findById(id);

      if (!theater) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Theater not found.",
          path: path,
        });
      }

      if (theater.ownerId.toString() !== ownerId) {
        throw new ForbiddenException({
          statusCode: 403,
          success: false,
          message: "You are not authorized to update this theater.",
          path: path,
        });
      }

      if (name || location) {
        const existingTheater = await this.theaterModel.findOne({
          name: {
            $regex: new RegExp(
              `^${name || theater.name?.replace(/[-\s]/g, "[-\\s]*")}$`,
              "i"
            ),
          },
          location: location || theater.location,
          ownerId: new Types.ObjectId(ownerId),
          _id: { $ne: new Types.ObjectId(id) },
          isRemoved: false,
        });

        if (existingTheater) {
          throw new ConflictException({
            statusCode: 409,
            success: false,
            message: "A theater with this name and location already exists.",
            path: path,
          });
        }
      }

      if (file && theater.image && theater.image !== file) {
        const oldImageUrl = theater.image;

        if (oldImageUrl) {
          const urlParts = oldImageUrl.split("/");
          const filenameWithExt = urlParts.pop(); // Last part (e.g., "jvldnzrndsurb6njxmny.png")
          const publicId = filenameWithExt?.split(".")[0]; // Remove file extension

          if (publicId) {
            await this.cloudinaryService.deleteFile(publicId);
          }
        }
      }

      image = file ? file : theater.image;

      const updatedTheater = await this.theaterModel.findByIdAndUpdate(
        id,
        {
          name,
          location,
          city: new Types.ObjectId(city),
          no_of_screens,
          image,
        },
        { new: true }
      );

      return createResponse(
        200,
        true,
        "Theater updated successfully.",
        updatedTheater
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

  async updateTheaterStatus({
    user,
    theaterId,
    path,
  }: {
    user: AuthUserDto;
    theaterId: string;
    path: string;
  }) {
    try {
      const theater = await this.theaterModel.findById(theaterId);

      if (!theater) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Theater not found.",
        });
      }

      if (theater.ownerId.toString() !== user.id) {
        throw new ForbiddenException({
          statusCode: 403,
          success: false,
          message: "You are not authorized to update this theater.",
        });
      }

      theater.isActive = !theater.isActive;
      await theater.save();
      if (!theater.isActive) {
        await this.showModel.updateMany(
          {
            theaterId: new Types.ObjectId(theaterId),
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
        `Theater ${theater.isActive ? "activated" : "deactivated"} successfully.`,
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

  async deleteTheater(id: string, ownerId: string, path: string) {
    try {
      const theater = await this.theaterModel.findById(id);

      if (!theater) {
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Theater not found.",
          path: path,
        });
      }

      if (theater.ownerId.toString() !== ownerId) {
        throw new ForbiddenException({
          statusCode: 403,
          success: false,
          message: "You are not authorized to delete this theater.",
          path: path,
        });
      }

      theater.isRemoved = true;
      await theater.save();
      await this.screenModel.updateMany(
        { theaterId: new Types.ObjectId(id) },
        { $set: { isRemoved: true } }
      );
      return createResponse(200, true, "Theater deleted successfully.");
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
