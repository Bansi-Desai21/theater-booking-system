import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../../schemas/user.schema";
import {
  PasswordReset,
  PasswordResetSchema,
} from "../../schemas/paaword-reset.schema";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { Show, ShowSchema } from "../../schemas/shows.schema";
import { Screen, ScreenSchema } from "../../schemas/screen.schema";
import { SeatLayout, SeatLayoutSchema } from "../../schemas/seat-layout.schema";
import { Theater, TheaterSchema } from "../../schemas/theater.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
      { name: Show.name, schema: ShowSchema },
      { name: Screen.name, schema: ScreenSchema },
      { name: SeatLayout.name, schema: SeatLayoutSchema },
      { name: Theater.name, schema: TheaterSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, ConfigService],
})
export class AuthModule {}
