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
}
